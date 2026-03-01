import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_AMOUNTS = [1000, 2500, 5000, 10000]; // cents

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

    const { amount } = await req.json();
    if (!VALID_AMOUNTS.includes(amount)) throw new Error("Invalid amount");

    const stripe = new Stripe(stripeKey);
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
      success_url: `${req.headers.get("origin")}/credits?topped_up=${dollars}`,
      cancel_url: `${req.headers.get("origin")}/credits`,
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
