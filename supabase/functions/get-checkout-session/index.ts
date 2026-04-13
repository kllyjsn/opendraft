/**
 * get-checkout-session Edge Function
 * ------------------------------------
 * Retrieves a completed Stripe Checkout Session by its session_id.
 * Used by the /success page to show confirmed purchase details.
 *
 * We expand line_items to show what was purchased.
 * This is a read-only call — safe to expose (session IDs are unguessable).
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Cloud secrets.
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeKey = sanitizeStripeKey(stripeKey);

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    // ------------------------------------------------------------------
    // Initialize Stripe Client and retrieve the session
    // Expand line_items so we can show the product name on the success page
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });

    // Extract the first line item for display
    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product as Stripe.Product | null;

    return new Response(
      JSON.stringify({
        status: session.status,               // "complete", "open", or "expired"
        paymentStatus: session.payment_status, // "paid", "unpaid", "no_payment_required"
        amountTotal: session.amount_total,     // Total in cents
        currency: session.currency,
        productName: product?.name ?? lineItem?.description ?? null,
        productImage: product?.images?.[0] ?? null,
        metadata: session.metadata,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("get-checkout-session error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
