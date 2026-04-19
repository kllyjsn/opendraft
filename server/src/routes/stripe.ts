import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import type Stripe from "stripe";
import { requireStripe, STRIPE_WEBHOOK_SECRET } from "../lib/stripe.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { User, Subscription, CreditBalance, CreditTransaction, WebhookEvent } from "../models/index.js";
import { verifySubscriptionAmount, VALID_CREDIT_AMOUNTS, SERVER_TIERS } from "../lib/tiers.js";

export const stripeRouter = Router();

// ── POST /api/functions/create-credit-checkout ──
// Starts a Stripe Checkout Session for either a plan subscription
// (Starter/Team/Enterprise) or a one-time credit top-up.
stripeRouter.post(
  "/create-credit-checkout",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stripe = requireStripe();
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { amount, mode, tierId, billing } = req.body as {
        amount?: number;
        mode?: "subscription" | "payment";
        tierId?: string;
        billing?: "monthly" | "annual";
      };

      const origin =
        (req.headers.origin as string | undefined) || "https://opendraft.co";

      if (mode === "subscription") {
        const tier = verifySubscriptionAmount(tierId, billing, amount ?? 0);
        if (!tier) {
          res.status(400).json({
            error: "Invalid subscription tier or amount — price must match current plan.",
          });
          return;
        }

        const isAnnual = billing === "annual";
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: amount!,
                recurring: { interval: isAnnual ? "year" : "month" },
                product_data: {
                  name: `OpenDraft ${tier.name} Plan`,
                  description: `${tier.name} plan — $${(amount! / 100).toFixed(0)}/${isAnnual ? "yr" : "mo"}`,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            type: "credit_subscription",
            user_id: String(user._id),
            tier_id: tier.id,
            app_limit: String(tier.appLimit),
            billing: billing || "monthly",
          },
          subscription_data: {
            metadata: {
              type: "credit_subscription",
              user_id: String(user._id),
              tier_id: tier.id,
              app_limit: String(tier.appLimit),
              billing: billing || "monthly",
            },
          },
          success_url: `${origin}/credits?subscribed=${tier.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing`,
        });

        res.json({ url: session.url });
        return;
      }

      // One-time credit top-up
      if (!VALID_CREDIT_AMOUNTS.has(amount ?? 0)) {
        res.status(400).json({ error: "Invalid credit top-up amount" });
        return;
      }
      const dollars = (amount! / 100).toFixed(0);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount!,
              product_data: {
                name: `$${dollars} OpenDraft Credits`,
                description: `Add $${dollars} in credits to your OpenDraft account`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "credit_top_up",
          user_id: String(user._id),
          credit_amount: String(amount!),
        },
        success_url: `${origin}/credits?topped_up=${dollars}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/credits`,
      });

      res.json({ url: session.url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      res.status(400).json({ error: message });
    }
  }
);

// ── POST /api/functions/get-checkout-session ──
// Retrieves a completed checkout session (used by the /success page).
stripeRouter.post(
  "/get-checkout-session",
  async (req: Request, res: Response) => {
    try {
      const stripe = requireStripe();
      const { sessionId } = req.body as { sessionId?: string };
      if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "line_items.data.price.product"],
      });
      const lineItem = session.line_items?.data?.[0];
      const product = lineItem?.price?.product as Stripe.Product | null;
      res.json({
        data: {
          sessionId: session.id,
          status: session.status,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          mode: session.mode,
          customerEmail: session.customer_details?.email || session.customer_email,
          productName: product?.name || lineItem?.description || null,
          metadata: session.metadata || {},
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retrieve session";
      res.status(400).json({ error: message });
    }
  }
);

// ── GET /api/functions/get-products ──
// Returns subscription plans (mirrors frontend pricing-tiers.ts) so the
// client can render a live storefront. Kept read-only + unauthenticated.
stripeRouter.get("/get-products", async (_req: Request, res: Response) => {
  res.json({
    data: Object.values(SERVER_TIERS).map((t) => ({
      id: t.id,
      name: `OpenDraft ${t.name}`,
      monthlyPriceCents: t.price,
      annualPriceCents: t.annualPrice || null,
      appLimit: t.appLimit,
    })),
  });
});

// ── POST /api/functions/stripe-webhook ──
// Receives Stripe events. Must be mounted with raw-body parsing (see index.ts)
// so the signature header can be verified against the exact payload bytes.
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const stripe = requireStripe();
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    if (!STRIPE_WEBHOOK_SECRET) {
      res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET not configured" });
      return;
    }

    // req.body here is a Buffer (express.raw() was applied upstream).
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      res.status(400).json({ error: `Webhook signature failed: ${message}` });
      return;
    }

    // Idempotency: only skip events we've already FULLY processed. Events
    // previously stuck in `processing` or `failed` must be retryable.
    const existing = await WebhookEvent.findOne({ stripe_event_id: event.id });
    if (existing?.processing_status === "processed") {
      res.json({ received: true, duplicate: true });
      return;
    }
    await WebhookEvent.updateOne(
      { stripe_event_id: event.id },
      {
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data.object,
        processing_status: "processing",
        error_message: null,
      },
      { upsert: true }
    );

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(sub);
          break;
        }
        default:
          // No-op; we ack unhandled events so Stripe doesn't retry forever.
          break;
      }
    } catch (handlerErr) {
      const message = handlerErr instanceof Error ? handlerErr.message : "Handler failed";
      await WebhookEvent.updateOne(
        { stripe_event_id: event.id },
        { processing_status: "failed", error_message: message }
      );
      // 500 → Stripe will retry with exponential backoff.
      res.status(500).json({ error: message });
      return;
    }

    await WebhookEvent.updateOne(
      { stripe_event_id: event.id },
      { processing_status: "processed", processed_at: new Date(), error_message: null }
    );

    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    res.status(500).json({ error: message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const type = meta.type;
  const userId = meta.user_id;
  if (!userId) return;
  // Delayed payment methods (ACH, bank debits, etc.) fire
  // checkout.session.completed BEFORE payment clears. Only provision access
  // once payment_status is paid (or no_payment_required for promo flows).
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  if (type === "credit_subscription") {
    const tierId = meta.tier_id || "starter";
    // Expand subscription for period dates if present
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    let stripeSubId: string | null = null;
    if (session.subscription) {
      stripeSubId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
    }
    if (stripeSubId) {
      const stripe = requireStripe();
      const sub = await stripe.subscriptions.retrieve(stripeSubId);
      const item = sub.items?.data?.[0];
      if (item?.current_period_start) periodStart = new Date(item.current_period_start * 1000);
      if (item?.current_period_end) periodEnd = new Date(item.current_period_end * 1000);
    }

    await Subscription.findOneAndUpdate(
      { user_id: userId },
      {
        user_id: userId,
        plan: tierId,
        status: "active",
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : session.customer?.id || null,
        stripe_subscription_id: stripeSubId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      },
      { upsert: true, new: true }
    );
    return;
  }

  if (type === "credit_top_up") {
    const creditAmount = Number(meta.credit_amount || 0);
    if (!creditAmount) return;
    await applyCreditTopUp({ userId, creditAmount, sessionId: session.id });
  }
}

// Idempotent credit top-up: ledger insert + balance $inc are atomic.
// - Fully-processed retries (fulfilled=true) short-circuit.
// - Retries of a half-applied attempt (fulfilled=false) redo the $inc
//   inside the same transaction that flips fulfilled -> true.
// - A concurrent retry racing the first delivery will hit the
//   unique stripe_session_id index and abort its own transaction.
// Requires a MongoDB replica set / Atlas cluster (transactions).
async function applyCreditTopUp(args: {
  userId: string;
  creditAmount: number;
  sessionId: string;
}): Promise<void> {
  const { userId, creditAmount, sessionId } = args;
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      const existing = await CreditTransaction.findOne(
        { stripe_session_id: sessionId },
        null,
        { session: mongoSession }
      );
      if (existing && existing.get("fulfilled") === true) {
        return; // already credited
      }
      if (!existing) {
        await CreditTransaction.create(
          [
            {
              user_id: userId,
              amount: creditAmount,
              type: "top_up",
              description: `Top-up via Stripe (${sessionId})`,
              stripe_session_id: sessionId,
              fulfilled: false,
            },
          ],
          { session: mongoSession }
        );
      }
      await CreditBalance.findOneAndUpdate(
        { user_id: userId },
        { $inc: { balance: creditAmount } },
        { upsert: true, session: mongoSession }
      );
      await CreditTransaction.updateOne(
        { stripe_session_id: sessionId },
        { fulfilled: true },
        { session: mongoSession }
      );
    });
  } finally {
    await mongoSession.endSession();
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : null;
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;
  const update: Record<string, unknown> = {
    status: sub.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    stripe_subscription_id: sub.id,
  };
  await Subscription.findOneAndUpdate({ user_id: userId }, update, { upsert: false });
}
