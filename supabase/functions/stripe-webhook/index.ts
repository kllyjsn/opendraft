import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase vars not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) throw new Error("Missing stripe-signature header");
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // No webhook secret — parse raw (dev/testing only)
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { listing_id, buyer_id, seller_id, price } = session.metadata ?? {};

      if (!listing_id || !buyer_id || !seller_id || !price) {
        throw new Error("Missing metadata in session");
      }

      const amount = parseInt(price, 10);
      const platformFee = Math.round(amount * 0.2);
      const sellerAmount = amount - platformFee;

      // Insert purchase
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/purchases`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          listing_id,
          buyer_id,
          seller_id,
          amount_paid: amount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string | null,
        }),
      });

      if (!insertRes.ok) {
        const err = await insertRes.text();
        throw new Error(`Failed to insert purchase: ${err}`);
      }

      // Increment sales_count on listing
      await fetch(
        `${supabaseUrl}/rest/v1/rpc/increment_sales_count`,
        {
          method: "POST",
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ listing_id_param: listing_id }),
        }
      );

      // Increment total_sales on seller profile
      await fetch(
        `${supabaseUrl}/rest/v1/rpc/increment_seller_sales`,
        {
          method: "POST",
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ seller_id_param: seller_id }),
        }
      );
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
