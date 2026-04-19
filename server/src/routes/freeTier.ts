import { Router, Response } from "express";
import mongoose from "mongoose";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  Listing,
  Purchase,
  Subscription,
  Profile,
} from "../models/index.js";

// Max apps claimable per paid plan. Mirrors SERVER_TIERS in
// src/lib/tiers.ts (added by the Stripe PR); kept local here so this
// PR can ship independently. -1 = unlimited.
const PLAN_APP_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  team: -1,
  enterprise: -1,
  // Legacy plans from pre-migration rows.
  growth: 20,
  pro: -1,
  unlimited: -1,
};

export const freeTierRouter = Router();

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

/**
 * Accept either a Mongo ObjectId (new rows) or the legacy Supabase UUID
 * (rows migrated from Postgres), since `listing_id` in the DB is a
 * free-form string.
 */
function isValidListingId(v: unknown): v is string {
  if (typeof v !== "string" || !v) return false;
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return OBJECT_ID_REGEX.test(v) || UUID_V4.test(v);
}

/**
 * Look up a listing by its canonical id. Tries ObjectId first, then the
 * legacy string id field used during the Supabase→Mongo migration.
 */
async function findListing(listingId: string) {
  if (OBJECT_ID_REGEX.test(listingId)) {
    const byObjId = await Listing.findById(listingId);
    if (byObjId) return byObjId;
  }
  return Listing.findOne({ _id: listingId } as mongoose.FilterQuery<unknown>);
}

/**
 * Map a plan id to the max apps a user on that plan can claim.
 * -1 from SERVER_TIERS means unlimited; we represent that as Infinity
 * here so the comparison in the limit check is uniform.
 */
function appLimitForPlan(plan: string | null | undefined): number {
  if (!plan) return 1;
  const limit = PLAN_APP_LIMITS[plan];
  if (limit === undefined) return 1;
  return limit === -1 ? Infinity : limit;
}

// ── POST /api/functions/claim-free-listing ──
// Authenticated user claims a listing without a Stripe checkout, either:
//   1. the listing's price is 0, OR
//   2. the user has never claimed before (freemium free-first-app), OR
//   3. the user has an active subscription and is under their app limit.
freeTierRouter.post(
  "/claim-free-listing",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { listingId } = req.body as { listingId?: string };
      if (!isValidListingId(listingId)) {
        res.status(400).json({ error: "listingId is required" });
        return;
      }

      const listing = await findListing(listingId);
      if (!listing) {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      if (listing.status !== "live") {
        res.status(400).json({ error: "Listing is not available" });
        return;
      }
      if (listing.seller_id === req.userId) {
        res.status(400).json({ error: "You cannot claim your own listing" });
        return;
      }

      const listingIdStr = String(listing._id);

      const existing = await Purchase.findOne({
        listing_id: listingIdStr,
        buyer_id: req.userId,
      });
      if (existing) {
        res.status(400).json({ error: "You already own this project" });
        return;
      }

      if (listing.price !== 0) {
        const [sub, purchaseCount] = await Promise.all([
          Subscription.findOne({ user_id: req.userId, status: "active" }),
          Purchase.countDocuments({ buyer_id: req.userId }),
        ]);

        if (!sub && purchaseCount >= 1) {
          res.status(402).json({
            error:
              "You've used your free app. Subscribe to claim more apps.",
          });
          return;
        }

        if (sub) {
          const limit = appLimitForPlan(sub.get("plan") as string | null);
          if (purchaseCount >= limit) {
            res.status(402).json({
              error:
                "You've reached your plan's app limit. Upgrade to claim more.",
            });
            return;
          }
        }
      }

      // Insert the purchase record (free claim → all amounts zero).
      // The (listing_id, buyer_id) unique index closes the TOCTOU gap
      // between the findOne check above and this insert.
      try {
        await Purchase.create({
          listing_id: listingIdStr,
          buyer_id: req.userId,
          seller_id: listing.seller_id,
          amount_paid: 0,
          platform_fee: 0,
          seller_amount: 0,
          payout_transferred: true,
        });
      } catch (insertErr) {
        if (
          insertErr &&
          typeof insertErr === "object" &&
          "code" in insertErr &&
          (insertErr as { code?: number }).code === 11000
        ) {
          res.status(400).json({ error: "You already own this project" });
          return;
        }
        throw insertErr;
      }

      // Bump counters. Non-critical — if either update fails we still
      // return success; the purchase is what matters for entitlement.
      try {
        await Promise.all([
          Listing.updateOne({ _id: listing._id }, { $inc: { sales_count: 1 } }),
          Profile.updateOne(
            { user_id: listing.seller_id },
            { $inc: { total_sales: 1 } }
          ),
        ]);
      } catch (counterErr) {
        console.error("Non-critical counter update failed:", counterErr);
      }

      res.json({ success: true, listingId: listingIdStr });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to claim listing";
      res.status(500).json({ error: message });
    }
  }
);

// ── POST /api/functions/get-download-url ──
// Returns a download URL for a listing the caller owns (as buyer or
// seller). In the Supabase era this generated a 60s signed URL from
// the `listing-files` private bucket; that bucket has not yet been
// migrated off Supabase, so we return githubUrl-only until R2/S3 is
// wired. Entitlement is still enforced here.
freeTierRouter.post(
  "/get-download-url",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { listingId } = req.body as { listingId?: string };
      if (!isValidListingId(listingId)) {
        res.status(400).json({ error: "listingId is required" });
        return;
      }

      const listing = await findListing(listingId);
      if (!listing) {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      const listingIdStr = String(listing._id);

      const isSeller = listing.seller_id === req.userId;
      const purchase = isSeller
        ? null
        : await Purchase.findOne({
            listing_id: listingIdStr,
            buyer_id: req.userId,
          });
      const isBuyer = !!purchase;

      if (!isSeller && !isBuyer) {
        res
          .status(403)
          .json({ error: "You must purchase this project to download it." });
        return;
      }

      // Storage-bucket signing is not yet wired in the Mongo backend;
      // fall back to the seller-provided GitHub URL. Clients already
      // degrade to githubUrl when signedUrl is null.
      res.json({
        signedUrl: null,
        githubUrl: listing.github_url,
        title: listing.title,
        hasFile: !!listing.file_path,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get download URL";
      res.status(500).json({ error: message });
    }
  }
);
