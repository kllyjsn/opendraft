import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Security constants ──
const MAX_ZIP_SIZE_MB = 200;
const MAX_FILE_COUNT = 5000;
const DEPLOY_COOLDOWN_MS = 30_000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GithubRepo = { owner: string; repo: string };

function parseGithubRepo(githubUrl: string): GithubRepo | null {
  try {
    const parsed = new URL(githubUrl);
    if (parsed.hostname !== "github.com") return null;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, "");
    if (!owner || !repo) return null;

    return { owner, repo };
  } catch {
    return null;
  }
}

async function downloadGithubRepoZip(githubUrl: string): Promise<ArrayBuffer> {
  const parsedRepo = parseGithubRepo(githubUrl);
  if (!parsedRepo) {
    throw new Error("Invalid GitHub repository URL");
  }

  const repoInfoRes = await fetch(`https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "opendraft-deployer",
    },
  });

  if (!repoInfoRes.ok) {
    if (repoInfoRes.status === 404) {
      throw new Error("GitHub repository not found or private. Upload a ZIP file to deploy this project.");
    }
    throw new Error("Failed to read GitHub repository metadata");
  }

  const repoInfo = await repoInfoRes.json();
  const defaultBranch = repoInfo.default_branch || "main";

  const zipRes = await fetch(
    `https://codeload.github.com/${parsedRepo.owner}/${parsedRepo.repo}/zip/refs/heads/${encodeURIComponent(defaultBranch)}`,
    { headers: { "User-Agent": "opendraft-deployer" } }
  );

  if (!zipRes.ok) {
    throw new Error("Failed to download GitHub repository archive");
  }

  return await zipRes.arrayBuffer();
}

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

    // ── Input validation ──
    if (!UUID_REGEX.test(listingId)) {
      return new Response(JSON.stringify({ error: "Invalid listingId format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof netlifyToken !== "string" || netlifyToken.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deploy rate limiting ──
    const { data: recentDeploy } = await supabase
      .from("deployed_sites")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDeploy) {
      const elapsed = Date.now() - new Date(recentDeploy.created_at).getTime();
      if (elapsed < DEPLOY_COOLDOWN_MS) {
        const waitSec = Math.ceil((DEPLOY_COOLDOWN_MS - elapsed) / 1000);
        return new Response(JSON.stringify({ error: `Please wait ${waitSec}s before deploying again` }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Require either uploaded file or GitHub repository source
    if (!listing.file_path && !listing.github_url) {
      return new Response(JSON.stringify({ error: "No deployable source available" }), {
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

    // ---- Strategy A: GitHub repo → create Netlify site linked to repo (Netlify runs build) ----
    if (listing.github_url) {
      const parsedRepo = parseGithubRepo(listing.github_url);
      if (!parsedRepo) {
        return new Response(JSON.stringify({ error: "Invalid GitHub URL format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const siteName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

      // Create site linked to GitHub repo with build settings
      const createSiteRes = await fetch("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: { Authorization: `Bearer ${netlifyToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName,
          repo: {
            provider: "github",
            repo: `${parsedRepo.owner}/${parsedRepo.repo}`,
            private: false,
            branch: "main",
            cmd: "npm install && npm run build",
            dir: "dist",
          },
          processing_settings: { html: { pretty_urls: true } },
        }),
      });

      if (!createSiteRes.ok) {
        const errText = await createSiteRes.text();
        console.error("Netlify create site (repo-linked) error:", createSiteRes.status, errText);

        // If repo linking fails (permissions, private repo), fall back to ZIP deploy
        console.log("Repo linking failed, falling back to ZIP deploy...");
        return await zipDeploy(supabase, listing, netlifyToken, user.id, listingId);
      }

      const siteData = await createSiteRes.json();
      const siteId = siteData.id;
      const siteUrl = siteData.ssl_url || siteData.url;
      const deployId = siteData.deploy_id || siteData.id;

      await Promise.all([
        supabase.from("activity_log").insert({
          event_type: "netlify_deploy",
          user_id: user.id,
          event_data: { listing_id: listingId, site_url: siteUrl, site_id: siteId, deploy_id: deployId, method: "github_linked" },
        }),
        supabase.from("deployed_sites").upsert({
          listing_id: listingId,
          user_id: user.id,
          provider: "netlify",
          site_id: siteId,
          site_url: siteUrl,
          deploy_id: deployId,
          netlify_token_hash: "set",
          status: "healthy",
        }, { onConflict: "site_id" }),
      ]);

      return new Response(JSON.stringify({
        success: true, siteUrl, siteId, deployId,
        adminUrl: `https://app.netlify.com/sites/${siteData.name}`,
        method: "github_linked",
        deployState: "building",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Strategy B: ZIP file → download, build-inject, deploy ----
    return await zipDeploy(supabase, listing, netlifyToken, user.id, listingId);
  } catch (e) {
    console.error("deploy-to-netlify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ZIP deploy: downloads file from storage, injects build configs, uploads to Netlify
// Note: This is a static file deploy. For source-code ZIPs (not pre-built), the user
// should use the GitHub-linked approach or build locally first.
async function zipDeploy(
  supabase: ReturnType<typeof createClient>,
  listing: { id: string; title: string; file_path: string | null; github_url: string | null; seller_id: string },
  netlifyToken: string,
  userId: string,
  listingId: string,
) {
  let sourceZipBuffer: ArrayBuffer;

  if (listing.file_path) {
    const { data: fileData } = await supabase.storage
      .from("listing-files")
      .download(listing.file_path);

    if (!fileData) {
      return new Response(JSON.stringify({ error: "Failed to download source file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    sourceZipBuffer = await fileData.arrayBuffer();
  } else if (listing.github_url) {
    sourceZipBuffer = await downloadGithubRepoZip(listing.github_url);
  } else {
    return new Response(JSON.stringify({ error: "No deployable source" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const zip = await JSZip.loadAsync(sourceZipBuffer);
  const entries = Object.keys(zip.files);

  // ── ZIP bomb protection ──
  const zipSizeMB = sourceZipBuffer.byteLength / 1024 / 1024;
  if (zipSizeMB > MAX_ZIP_SIZE_MB) {
    return new Response(JSON.stringify({ error: `ZIP file too large (${zipSizeMB.toFixed(0)}MB). Maximum is ${MAX_ZIP_SIZE_MB}MB.` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (entries.length > MAX_FILE_COUNT) {
    return new Response(JSON.stringify({ error: `ZIP contains too many files (${entries.length}). Maximum is ${MAX_FILE_COUNT}.` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (entries.length > 0) {
    const first = entries[0];
    if (first.includes("/")) {
      const candidate = first.split("/")[0] + "/";
      if (entries.every(e => e.startsWith(candidate) || e === candidate)) {
        prefix = candidate;
      }
    }
  }

  // Check if this ZIP is already built (contains index.html at root or dist/)
  const hasIndexHtml = entries.some(e => {
    const rel = prefix ? e.replace(prefix, "") : e;
    return rel === "index.html" || rel === "dist/index.html";
  });
  const hasDistFolder = entries.some(e => {
    const rel = prefix ? e.replace(prefix, "") : e;
    return rel.startsWith("dist/");
  });

  // If there's a dist/ folder, deploy only that
  if (hasDistFolder) {
    const distZip = new JSZip();
    const distPrefix = prefix + "dist/";
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      if (!path.startsWith(distPrefix)) continue;
      const relativePath = path.replace(distPrefix, "");
      if (!relativePath) continue;
      const content = await entry.async("uint8array");
      distZip.file(relativePath, content);
    }
    // Add SPA redirects
    const spaRedirect = "/*    /index.html   200\n";
    distZip.file("_redirects", spaRedirect);

    const distZipBlob = await distZip.generateAsync({ type: "uint8array" });
    return await createAndDeploySite(supabase, listing, netlifyToken, distZipBlob, userId, listingId);
  }

  // If it has index.html at root, deploy as-is (already built)
  if (hasIndexHtml) {
    const cleanZip = new JSZip();
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const relativePath = prefix ? path.replace(prefix, "") : path;
      if (!relativePath) continue;
      const content = await entry.async("uint8array");
      cleanZip.file(relativePath, content);
    }
    const spaRedirect = "/*    /index.html   200\n";
    cleanZip.file("_redirects", spaRedirect);

    const cleanZipBlob = await cleanZip.generateAsync({ type: "uint8array" });
    return await createAndDeploySite(supabase, listing, netlifyToken, cleanZipBlob, userId, listingId);
  }

  // Source code ZIP without dist/ — this won't work as a static deploy
  // Return an error telling the user to use the GitHub-linked approach
  return new Response(JSON.stringify({
    error: "This ZIP contains source code that needs to be built. Please link the GitHub repository instead, or upload a pre-built ZIP containing the dist/ folder.",
  }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createAndDeploySite(
  supabase: ReturnType<typeof createClient>,
  listing: { id: string; title: string },
  netlifyToken: string,
  zipBlob: Uint8Array,
  userId: string,
  listingId: string,
) {
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

  // Deploy the pre-built ZIP
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${netlifyToken}`,
      "Content-Type": "application/zip",
    },
    body: zipBlob,
  });

  if (!deployRes.ok) {
    const errText = await deployRes.text();
    console.error("Netlify deploy error:", deployRes.status, errText);
    return new Response(JSON.stringify({ error: "Failed to deploy to Netlify" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const deployData = await deployRes.json();
  const deployId = deployData.deploy_id || deployData.id;

  if (!deployId) {
    return new Response(JSON.stringify({ error: "Netlify deploy started but no deploy ID was returned" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await Promise.all([
    supabase.from("activity_log").insert({
      event_type: "netlify_deploy",
      user_id: userId,
      event_data: { listing_id: listingId, site_url: siteUrl, site_id: siteId, deploy_id: deployId, method: "zip_deploy" },
    }),
    supabase.from("deployed_sites").upsert({
      listing_id: listingId,
      user_id: userId,
      provider: "netlify",
      site_id: siteId,
      site_url: siteUrl,
      deploy_id: deployId,
      netlify_token_hash: "set",
      status: "healthy",
    }, { onConflict: "site_id" }),
  ]);

  return new Response(JSON.stringify({
    success: true, siteUrl, siteId, deployId,
    adminUrl: `https://app.netlify.com/sites/${siteData.name}`,
    method: "zip_deploy",
    deployState: "processing",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
