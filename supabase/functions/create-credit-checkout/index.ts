import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const VALID_AMOUNTS = [1000, 2500, 5000, 10000]; // one-time cents

// Subscription tiers: price → { tierId, appLimit }
const SUBSCRIPTION_TIERS: Record<number, { tierId: string; appLimit: number }> = {
  2000: { tierId: "starter", appLimit: 5 },
  3000: { tierId: "growth", appLimit: 20 },
  5000: { tierId: "unlimited", appLimit: -1 }, // -1 = unlimited
};

const TIER_NAMES: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  unlimited: "Unlimited",
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    stripeKey = sanitizeStripeKey(stripeKey);

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { amount, mode, tierId } = await req.json();
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.get("origin") || "https://opendraft.co";

    if (mode === "subscription") {
      const tierInfo = SUBSCRIPTION_TIERS[amount];
      if (!tierInfo) throw new Error("Invalid subscription tier");

      const resolvedTierId = tierId || tierInfo.tierId;
      const tierName = TIER_NAMES[resolvedTierId] || resolvedTierId;
      const priceDollars = (amount / 100).toFixed(0);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval: "month" },
            product_data: {
              name: `OpenDraft ${tierName} Plan`,
              description: `${tierName} plan — $${priceDollars}/mo`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          type: "credit_subscription",
          user_id: user.id,
          tier_id: resolvedTierId,
          app_limit: String(tierInfo.appLimit),
        },
        subscription_data: {
          metadata: {
            type: "credit_subscription",
            user_id: user.id,
            tier_id: resolvedTierId,
            app_limit: String(tierInfo.appLimit),
          },
        },
        success_url: `${origin}/credits?subscribed=${resolvedTierId}`,
        cancel_url: `${origin}/credits`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // One-time pack checkout
    if (!VALID_AMOUNTS.includes(amount)) throw new Error("Invalid amount");

    const dollars = (amount / 100).toFixed(0);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: `$${dollars} OpenDraft Credits`,
            description: `Add $${dollars} in credits to your OpenDraft account`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: "credit_top_up",
        user_id: user.id,
        credit_amount: String(amount),
      },
      success_url: `${origin}/credits?topped_up=${dollars}`,
      cancel_url: `${origin}/credits`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
