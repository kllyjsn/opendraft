/**
 * verify-listing Edge Function
 * ----------------------------
 * Verifies ownership of a listing's demo URL via meta tag or GitHub file.
 *
 * Methods:
 *  - meta_tag: Scrapes the URL with Firecrawl looking for
 *    <meta name="opendraft-verify" content="TOKEN">
 *  - github_file: Checks for a .opendraft-verify file in the repo root
 *  - admin: Manual admin override (sets verified immediately)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { listingId, method } = await req.json();

    if (!listingId || typeof listingId !== "string") {
      return new Response(JSON.stringify({ error: "listingId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, demo_url, github_url")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin override
    if (method === "admin") {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Directly verify
      await supabase.from("listing_verifications").upsert({
        listing_id: listingId,
        method: "admin",
        status: "verified",
        verified_at: new Date().toISOString(),
      }, { onConflict: "listing_id,method" });

      await supabase.from("listings").update({ domain_verified: true }).eq("id", listingId);

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the seller can verify their own listing
    if (listing.seller_id !== user.id) {
      return new Response(JSON.stringify({ error: "You can only verify your own listings" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create the verification token
    let { data: verification } = await supabase
      .from("listing_verifications")
      .select("*")
      .eq("listing_id", listingId)
      .eq("method", method || "meta_tag")
      .single();

    if (!verification) {
      const { data: newVerification, error: insertError } = await supabase
        .from("listing_verifications")
        .insert({ listing_id: listingId, method: method || "meta_tag" })
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: "Failed to create verification token" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      verification = newVerification;
    }

    // If just requesting the token (no check yet), return it
    const checkNow = (await req.clone().json()).checkNow;
    if (!checkNow) {
      return new Response(JSON.stringify({
        success: true,
        token: verification.token,
        method: verification.method,
        status: verification.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Actually verify ---
    const verifyMethod = method || "meta_tag";
    let verified = false;

    if (verifyMethod === "meta_tag") {
      const demoUrl = listing.demo_url;
      if (!demoUrl) {
        return new Response(JSON.stringify({ error: "Listing has no demo URL to verify" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Scraping service not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Scrape the page and look for the meta tag in raw HTML
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: demoUrl,
          formats: ["rawHtml"],
          waitFor: 3000,
        }),
      });

      const scrapeData = await scrapeRes.json();
      const html = scrapeData?.data?.rawHtml || scrapeData?.rawHtml || "";

      // Look for <meta name="opendraft-verify" content="TOKEN">
      const metaRegex = new RegExp(
        `<meta[^>]+name=["']opendraft-verify["'][^>]+content=["']${verification.token}["'][^>]*/?>`,
        "i"
      );
      // Also check reversed attribute order
      const metaRegex2 = new RegExp(
        `<meta[^>]+content=["']${verification.token}["'][^>]+name=["']opendraft-verify["'][^>]*/?>`,
        "i"
      );

      verified = metaRegex.test(html) || metaRegex2.test(html);
    } else if (verifyMethod === "github_file") {
      const githubUrl = listing.github_url;
      if (!githubUrl) {
        return new Response(JSON.stringify({ error: "Listing has no GitHub URL to verify" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse owner/repo from GitHub URL
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return new Response(JSON.stringify({ error: "Invalid GitHub URL format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");

      // Check for .opendraft-verify file in repo root
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/contents/.opendraft-verify`,
          { headers: { "User-Agent": "OpenDraft-Verify/1.0" } }
        );

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          // Decode base64 content
          const content = atob(ghData.content.replace(/\n/g, "")).trim();
          verified = content === verification.token;
        }
      } catch {
        // GitHub API error — not verified
      }
    }

    // Update verification status
    const newStatus = verified ? "verified" : "failed";
    await supabase.from("listing_verifications").update({
      status: newStatus,
      verified_at: verified ? new Date().toISOString() : null,
    }).eq("id", verification.id);

    if (verified) {
      await supabase.from("listings").update({ domain_verified: true }).eq("id", listingId);
    }

    return new Response(JSON.stringify({ success: true, verified, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-listing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
