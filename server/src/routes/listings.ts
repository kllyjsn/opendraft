import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Listing, Profile, Review, Purchase, RemixChain } from "../models/index.js";

const router = Router();

// GET /api/listings — List/search listings
router.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, status, search, staff_pick, seller_id, limit = "20", offset = "0", sort } = req.query;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = "live";
    if (staff_pick === "true") filter.staff_pick = true;
    if (seller_id) filter.seller_id = seller_id;

    let query = Listing.find(filter);

    if (search) {
      query = Listing.find({ ...filter, $text: { $search: search as string } });
    }

    if (sort === "newest") query = query.sort({ created_at: -1 });
    else if (sort === "popular") query = query.sort({ sales_count: -1 });
    else if (sort === "price_low") query = query.sort({ price: 1 });
    else if (sort === "price_high") query = query.sort({ price: -1 });
    else query = query.sort({ created_at: -1 });

    const data = await query.skip(Number(offset)).limit(Number(limit));
    const total = await Listing.countDocuments(filter);

    res.json({ data, total });
  } catch (err) {
    console.error("List listings error:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /api/listings/:id — Get single listing
router.get("/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    // Increment view count
    await Listing.updateOne({ _id: listing._id }, { $inc: { view_count: 1 } });

    // Get seller profile
    const sellerProfile = await Profile.findOne({ user_id: listing.seller_id });

    // Get reviews
    const reviews = await Review.find({ listing_id: listing._id.toString() }).sort({ created_at: -1 });

    // Check if user purchased
    let hasPurchased = false;
    if (req.userId) {
      const purchase = await Purchase.findOne({ listing_id: listing._id.toString(), buyer_id: req.userId });
      hasPurchased = !!purchase;
    }

    res.json({ data: listing, seller: sellerProfile, reviews, hasPurchased });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// POST /api/listings — Create listing
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listing = await Listing.create({ ...req.body, seller_id: req.userId });
    res.status(201).json({ data: listing });
  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// PATCH /api/listings/:id — Update listing
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.seller_id !== req.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updated });
  } catch (err) {
    console.error("Update listing error:", err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// DELETE /api/listings/:id — Delete listing
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (listing.seller_id !== req.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete listing error:", err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// POST /api/listings/search — Full text search (RPC replacement)
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { query, category, min_price, max_price, limit = 20 } = req.body;
    const filter: Record<string, unknown> = { status: "live" };
    if (category) filter.category = category;
    if (min_price !== undefined || max_price !== undefined) {
      filter.price = {};
      if (min_price !== undefined) (filter.price as Record<string, unknown>).$gte = min_price;
      if (max_price !== undefined) (filter.price as Record<string, unknown>).$lte = max_price;
    }

    let results;
    if (query) {
      results = await Listing.find({ ...filter, $text: { $search: query } })
        .sort({ score: { $meta: "textScore" } })
        .limit(Number(limit));
    } else {
      results = await Listing.find(filter).sort({ created_at: -1 }).limit(Number(limit));
    }

    res.json({ data: results });
  } catch (err) {
    console.error("Search listings error:", err);
    res.status(500).json({ error: "Failed to search listings" });
  }
});

// GET /api/listings/:id/remix-chain — Get remix chain
router.get("/:id/remix-chain", async (req: Request, res: Response) => {
  try {
    const chains = await RemixChain.find({ parent_listing_id: req.params.id });
    res.json({ data: chains });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch remix chain" });
  }
});

export default router;
