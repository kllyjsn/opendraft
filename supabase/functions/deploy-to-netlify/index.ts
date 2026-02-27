import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const { data: { user } } = await supabaseAnon.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { listingId, netlifyToken } = body;

    if (!listingId || !netlifyToken) {
      return new Response(JSON.stringify({ error: "Missing listingId or netlifyToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user purchased this listing (or is the seller)
    const { data: listing } = await supabase
      .from("listings")
      .select("id, title, file_path, seller_id, github_url")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSeller = listing.seller_id === user.id;
    let isBuyer = false;
    if (!isSeller) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      isBuyer = !!purchase;
    }

    if (!isSeller && !isBuyer) {
      return new Response(JSON.stringify({ error: "You must purchase this listing before deploying" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!listing.file_path) {
      // If no ZIP but has github_url, return a Netlify deploy link
      if (listing.github_url) {
        const deployUrl = `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(listing.github_url)}`;
        return new Response(JSON.stringify({ success: true, deployUrl, method: "github_redirect" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "No deployable file available for this listing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the ZIP from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("listing-files")
      .download(listing.file_path);

    if (downloadErr || !fileData) {
      console.error("Storage download error:", downloadErr);
      return new Response(JSON.stringify({ error: "Failed to download project files" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deploy to Netlify via their API
    // Create a new site first
    const siteName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createSiteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: siteName,
      }),
    });

    if (!createSiteRes.ok) {
      const errText = await createSiteRes.text();
      console.error("Netlify create site error:", createSiteRes.status, errText);
      if (createSiteRes.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Netlify token. Please check your Personal Access Token." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to create Netlify site" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteData = await createSiteRes.json();
    const siteId = siteData.id;
    const siteUrl = siteData.ssl_url || siteData.url;

    // Deploy the ZIP to the site
    const zipBuffer = await fileData.arrayBuffer();

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        "Content-Type": "application/zip",
      },
      body: zipBuffer,
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error("Netlify deploy error:", deployRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to deploy to Netlify" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deployData = await deployRes.json();

    // Log the deployment
    await supabase.from("activity_log").insert({
      event_type: "netlify_deploy",
      user_id: user.id,
      event_data: {
        listing_id: listingId,
        site_url: siteUrl,
        site_id: siteId,
        deploy_id: deployData.id,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      siteUrl,
      siteId,
      deployId: deployData.id,
      adminUrl: `https://app.netlify.com/sites/${siteData.name}`,
      method: "zip_deploy",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("deploy-to-netlify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
