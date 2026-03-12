/**
 * claim-free-listing Edge Function
 * ----------------------------------
 * Allows authenticated users to claim a listing by creating a purchase record.
 * Supports two modes:
 *   1. Free listings (price = 0) — anyone authenticated can claim
 *   2. Freemium claim — first-time user claiming any listing (enforces 1 free app limit)
 *   3. Subscriber claim — active subscribers can claim any listing
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const body = await req.json();
    const listingId = body?.listingId;
    if (!listingId || typeof listingId !== "string") throw new Error("listingId is required");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(listingId)) throw new Error("Invalid listingId format");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch listing and verify it's live
    const { data: listing, error: listingError } = await adminClient
      .from("listings")
      .select("id, price, seller_id, title, status")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) throw new Error("Listing not found");
    if (listing.status !== "live") throw new Error("Listing is not available");
    if (listing.seller_id === user.id) throw new Error("You cannot claim your own listing");

    // Check for duplicate claim
    const { data: existing } = await adminClient
      .from("purchases")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) throw new Error("You already own this project");

    // Determine if user is allowed to claim
    if (listing.price !== 0) {
      // Not a free listing — check subscription or freemium eligibility
      const [subResult, countResult] = await Promise.all([
        adminClient
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
        adminClient
          .from("purchases")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", user.id),
      ]);

      const isSubscribed = !!subResult.data;
      const purchaseCount = countResult.count ?? 0;

      if (!isSubscribed && purchaseCount >= 1) {
        throw new Error("You've used your free app. Subscribe to claim more apps.");
      }

      // If subscribed, check app limit
      if (isSubscribed) {
        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("plan")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();
        
        const plan = sub?.plan;
        const limit = plan === "unlimited" ? Infinity : plan === "growth" ? 20 : plan === "starter" ? 5 : 1;
        if (purchaseCount >= limit) {
          throw new Error("You've reached your plan's app limit. Upgrade to claim more.");
        }
      }
    }

    // Insert the purchase record (amount_paid = 0)
    const { error: insertError } = await adminClient.from("purchases").insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount_paid: 0,
      platform_fee: 0,
      seller_amount: 0,
      payout_transferred: true,
    });

    if (insertError) throw new Error(insertError.message);

    // Increment sales count
    await Promise.all([
      adminClient.rpc("increment_sales_count", { listing_id_param: listingId }),
      adminClient.rpc("increment_seller_sales", { seller_id_param: listing.seller_id }),
    ]);

    console.log(`Claim: listing=${listingId}, buyer=${user.id}, price=${listing.price}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("claim-free-listing error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
