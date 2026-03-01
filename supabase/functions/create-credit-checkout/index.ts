import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_AMOUNTS = [1000, 2500, 5000, 10000]; // one-time cents

// Subscription tiers: price per month (cents) → credits per month (cents)
const SUBSCRIPTION_TIERS: Record<number, number> = {
  1500: 2000,   // $15/mo → $20 credits
  3000: 5000,   // $30/mo → $50 credits
  5000: 10000,  // $50/mo → $100 credits
};

Deno.serve(async (req) => {
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

    const { amount, mode } = await req.json();
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.get("origin") || "https://opendraft.lovable.app";

    if (mode === "subscription") {
      // Subscription checkout
      const creditAmount = SUBSCRIPTION_TIERS[amount];
      if (!creditAmount) throw new Error("Invalid subscription tier");

      const priceDollars = (amount / 100).toFixed(0);
      const creditDollars = (creditAmount / 100).toFixed(0);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval: "month" },
            product_data: {
              name: `OpenDraft ${creditDollars} Credits/mo`,
              description: `$${creditDollars} in credits added monthly for $${priceDollars}/mo`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          type: "credit_subscription",
          user_id: user.id,
          credit_amount: String(creditAmount),
        },
        subscription_data: {
          metadata: {
            type: "credit_subscription",
            user_id: user.id,
            credit_amount: String(creditAmount),
          },
        },
        success_url: `${origin}/credits?subscribed=${creditDollars}`,
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
