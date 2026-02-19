/**
 * get-download-url Edge Function
 * ------------------------------------
 * Generates a short-lived signed URL for downloading a purchased project's ZIP file.
 *
 * Security model:
 *  - Requires a valid authenticated user (JWT)
 *  - Verifies the user has a purchase record for the requested listing
 *  - Only then generates a signed URL (valid for 60 seconds) from the private bucket
 *
 * This prevents anyone from downloading a ZIP without having paid,
 * even if they somehow know the file path.
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

    // ------------------------------------------------------------------
    // Step 1: Authenticate the buyer
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Step 2: Parse request
    // ------------------------------------------------------------------
    const { listingId } = await req.json();
    if (!listingId) throw new Error("listingId is required");

    // ------------------------------------------------------------------
    // Step 3: Verify purchase — buyer must own this listing
    // ------------------------------------------------------------------
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: purchase, error: purchaseError } = await adminClient
      .from("purchases")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    // Also allow the seller to download their own listing's file
    const { data: listing, error: listingError } = await adminClient
      .from("listings")
      .select("file_path, github_url, title, seller_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    const isBuyer = !!purchase;
    const isSeller = listing.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return new Response(JSON.stringify({ error: "You must purchase this project to download it." }), {
        status: 403, headers: corsHeaders,
      });
    }

    // ------------------------------------------------------------------
    // Step 4: Generate a signed URL if a ZIP file exists
    // ------------------------------------------------------------------
    let signedUrl: string | null = null;

    if (listing.file_path) {
      const { data: signedData, error: signError } = await adminClient
        .storage
        .from("listing-files")
        .createSignedUrl(listing.file_path, 60); // 60-second expiry

      if (signError) throw new Error(`Failed to generate download URL: ${signError.message}`);
      signedUrl = signedData.signedUrl;
    }

    console.log(`Download URL generated for listing=${listingId}, user=${user.id}, isBuyer=${isBuyer}, isSeller=${isSeller}`);

    return new Response(
      JSON.stringify({
        signedUrl,          // null if no ZIP — use githubUrl instead
        githubUrl: listing.github_url,
        title: listing.title,
        hasFile: !!listing.file_path,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("get-download-url error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
