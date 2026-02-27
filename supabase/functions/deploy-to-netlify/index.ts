import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Build a minimal standalone HTML page for a listing.
 * This is deployed to Netlify so the site is immediately functional
 * (source code ZIPs can't be deployed directly — they need `npm run build`).
 */
function buildLandingHtml(title: string, description: string, sourceDownloadUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);color:#f1f5f9;padding:2rem}
    .card{max-width:560px;width:100%;background:rgba(30,41,59,.7);border:1px solid rgba(148,163,184,.15);border-radius:1.5rem;padding:3rem;backdrop-filter:blur(20px);box-shadow:0 25px 50px -12px rgba(0,0,0,.5)}
    .badge{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:.25rem .75rem;border-radius:9999px;font-size:.75rem;font-weight:600;margin-bottom:1.5rem;letter-spacing:.025em}
    h1{font-size:2rem;font-weight:800;letter-spacing:-.025em;margin-bottom:.75rem;background:linear-gradient(to right,#f1f5f9,#94a3b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    p{color:#94a3b8;line-height:1.7;margin-bottom:2rem;font-size:.95rem}
    .actions{display:flex;flex-direction:column;gap:.75rem}
    a.btn{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.875rem 1.5rem;border-radius:.75rem;font-weight:600;font-size:.9rem;text-decoration:none;transition:all .2s}
    .btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 14px rgba(99,102,241,.4)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(99,102,241,.5)}
    .btn-secondary{background:rgba(148,163,184,.1);color:#cbd5e1;border:1px solid rgba(148,163,184,.2)}
    .btn-secondary:hover{background:rgba(148,163,184,.15);color:#f1f5f9}
    .powered{text-align:center;margin-top:2rem;font-size:.75rem;color:#475569}
    .powered a{color:#818cf8;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🚀 Deployed on OpenDraft</span>
    <h1>${title}</h1>
    <p>${description.length > 300 ? description.slice(0, 297) + "..." : description}</p>
    <div class="actions">
      ${sourceDownloadUrl ? `<a class="btn btn-primary" href="${sourceDownloadUrl}" download>⬇ Download Source Code</a>` : ""}
      <a class="btn btn-secondary" href="https://opendraft.lovable.app">Browse more apps on OpenDraft →</a>
    </div>
    <div class="powered">Deployed with <a href="https://opendraft.lovable.app">OpenDraft</a></div>
  </div>
</body>
</html>`;
}

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
      .select("id, title, description, file_path, seller_id, github_url")
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

    // Create a signed download URL for the source code (valid 1 hour)
    const { data: signedData } = await supabase.storage
      .from("listing-files")
      .createSignedUrl(listing.file_path, 3600);

    const sourceDownloadUrl = signedData?.signedUrl || undefined;

    // Build a deployable landing page ZIP
    const deployZip = new JSZip();
    deployZip.file("index.html", buildLandingHtml(listing.title, listing.description, sourceDownloadUrl));
    // Netlify SPA redirect
    deployZip.file("_redirects", "/*    /index.html   200\n");

    const deployZipBlob = await deployZip.generateAsync({ type: "uint8array" });

    // Deploy to Netlify
    const siteName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createSiteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: siteName }),
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

    // Deploy the landing page ZIP to the site
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        "Content-Type": "application/zip",
      },
      body: deployZipBlob,
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
      sourceDownloadUrl,
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
