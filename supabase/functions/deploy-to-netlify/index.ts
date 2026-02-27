import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

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

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const { data: { user } } = await supabaseAnon.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { listingId, netlifyToken } = await req.json();
    if (!listingId || !netlifyToken) {
      return new Response(JSON.stringify({ error: "Missing listingId or netlifyToken" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: listing } = await supabase
      .from("listings")
      .select("id, title, description, file_path, seller_id, github_url")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: must be seller or buyer
    const isSeller = listing.seller_id === user.id;
    if (!isSeller) {
      const { data: purchase } = await supabase
        .from("purchases").select("id")
        .eq("listing_id", listingId).eq("buyer_id", user.id).maybeSingle();
      if (!purchase) {
        return new Response(JSON.stringify({ error: "You must purchase this listing before deploying" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // GitHub redirect shortcut
    if (!listing.file_path) {
      if (listing.github_url) {
        return new Response(JSON.stringify({
          success: true,
          deployUrl: `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(listing.github_url)}`,
          method: "github_redirect",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "No deployable file available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Netlify token
    const tokenCheckRes = await fetch("https://api.netlify.com/api/v1/user", {
      headers: { Authorization: `Bearer ${netlifyToken}` },
    });
    if (!tokenCheckRes.ok) {
      await tokenCheckRes.text();
      return new Response(JSON.stringify({ error: "Invalid Netlify token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await tokenCheckRes.text(); // consume body

    // Download and extract ZIP
    const { data: fileData } = await supabase.storage
      .from("listing-files")
      .download(listing.file_path);

    if (!fileData) {
      return new Response(JSON.stringify({ error: "Failed to download source file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
    const entries = Object.keys(zip.files);

    // Detect common root directory prefix
    let prefix = "";
    if (entries.length > 0) {
      const first = entries[0];
      if (first.includes("/")) {
        const candidate = first.split("/")[0] + "/";
        if (entries.every(e => e.startsWith(candidate) || e === candidate)) {
          prefix = candidate;
        }
      }
    }

    // Re-pack ZIP without the root folder prefix (clean structure)
    const cleanZip = new JSZip();
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const relativePath = prefix ? path.replace(prefix, "") : path;
      if (!relativePath) continue;
      const content = await entry.async("uint8array");
      cleanZip.file(relativePath, content);
    }
    // Add Netlify SPA redirect
    cleanZip.file("_redirects", "/*    /index.html   200\n");
    // Add netlify.toml for build settings
    cleanZip.file("netlify.toml", `[build]
  command = "npm install && npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`);

    const cleanZipBlob = await cleanZip.generateAsync({ type: "uint8array" });

    // Create Netlify site with build settings
    const siteName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createSiteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: { Authorization: `Bearer ${netlifyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: siteName,
        processing_settings: { html: { pretty_urls: true } },
      }),
    });

    if (!createSiteRes.ok) {
      const errText = await createSiteRes.text();
      console.error("Netlify create site error:", createSiteRes.status, errText);
      if (createSiteRes.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Netlify token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to create Netlify site" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteData = await createSiteRes.json();
    const siteId = siteData.id;
    const siteUrl = siteData.ssl_url || siteData.url;

    // Deploy the source ZIP — Netlify will use netlify.toml to build
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: "POST",
      headers: { Authorization: `Bearer ${netlifyToken}`, "Content-Type": "application/zip" },
      body: cleanZipBlob,
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error("Netlify deploy error:", deployRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to deploy to Netlify" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deployData = await deployRes.json();

    await supabase.from("activity_log").insert({
      event_type: "netlify_deploy",
      user_id: user.id,
      event_data: { listing_id: listingId, site_url: siteUrl, site_id: siteId, deploy_id: deployData.id },
    });

    return new Response(JSON.stringify({
      success: true, siteUrl, siteId, deployId: deployData.id,
      adminUrl: `https://app.netlify.com/sites/${siteData.name}`,
      method: "source_deploy",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deploy-to-netlify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
