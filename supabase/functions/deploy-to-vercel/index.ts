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
    const { listingId, vercelToken } = body;

    if (!listingId || !vercelToken) {
      return new Response(JSON.stringify({ error: "Missing listingId or vercelToken" }), {
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
      if (listing.github_url) {
        const deployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(listing.github_url)}`;
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

    // Validate Vercel token first
    const meRes = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });

    if (!meRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid Vercel token. Please check your Access Token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create project
    const projectName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createProjectRes = await fetch("https://api.vercel.com/v13/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        framework: "vite",
      }),
    });

    if (!createProjectRes.ok) {
      const errText = await createProjectRes.text();
      console.error("Vercel create project error:", createProjectRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to create Vercel project" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectData = await createProjectRes.json();

    // Deploy the ZIP using Vercel's file upload API
    // We need to convert the ZIP to base64 for the deployment
    const zipBuffer = await fileData.arrayBuffer();
    const zipBase64 = btoa(String.fromCharCode(...new Uint8Array(zipBuffer)));

    // Use the v13 deployments endpoint with a file-based deploy
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        project: projectData.id,
        files: [
          {
            file: "project.zip",
            data: zipBase64,
            encoding: "base64",
          },
        ],
        projectSettings: {
          framework: "vite",
          buildCommand: "cd project && npm install && npm run build",
          outputDirectory: "project/dist",
        },
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error("Vercel deploy error:", deployRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to deploy to Vercel" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deployData = await deployRes.json();
    const siteUrl = `https://${deployData.url}`;

    // Log the deployment
    await supabase.from("activity_log").insert({
      event_type: "vercel_deploy",
      user_id: user.id,
      event_data: {
        listing_id: listingId,
        site_url: siteUrl,
        project_id: projectData.id,
        deploy_id: deployData.id,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      siteUrl,
      projectId: projectData.id,
      deployId: deployData.id,
      adminUrl: `https://vercel.com/${projectData.accountId}/${projectName}`,
      method: "zip_deploy",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("deploy-to-vercel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
