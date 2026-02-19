import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_PERCENT = 0.2; // 20%

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase env vars not configured");

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseServiceKey },
    });
    const userData = await userRes.json();
    if (!userData?.id) throw new Error("Invalid user session");
    const buyerId = userData.id;

    const { listingId } = await req.json();
    if (!listingId) throw new Error("Missing listingId");

    // Fetch listing
    const listingRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=*`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    const listings = await listingRes.json();
    const listing = listings?.[0];
    if (!listing) throw new Error("Listing not found");

    // Check not already purchased
    const purchaseRes = await fetch(
      `${supabaseUrl}/rest/v1/purchases?listing_id=eq.${listingId}&buyer_id=eq.${buyerId}&select=id`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    const existing = await purchaseRes.json();
    if (existing?.length > 0) throw new Error("You already own this project");

    // Fetch seller's Stripe Connect account
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${listing.seller_id}&select=stripe_account_id,stripe_onboarded`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    const profiles = await profileRes.json();
    const sellerProfile = profiles?.[0];

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const origin = req.headers.get("origin") || "https://opendraft.lovable.app";
    const platformFee = Math.round(listing.price * PLATFORM_FEE_PERCENT);

    // Build session params — use Connect if seller is onboarded
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: listing.description?.slice(0, 200) || undefined,
              images: listing.screenshots?.[0] ? [listing.screenshots[0]] : undefined,
            },
            unit_amount: listing.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/listing/${listingId}`,
      metadata: {
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        price: String(listing.price),
      },
    };

    // Add Connect transfer if seller has an onboarded Stripe account
    if (sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: sellerProfile.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
