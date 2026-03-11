import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GithubRepo = { owner: string; repo: string };

function parseGithubRepo(githubUrl: string): GithubRepo | null {
  try {
    const parsed = new URL(githubUrl);
    if (parsed.hostname !== "github.com") return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    return { owner: segments[0], repo: segments[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function downloadGithubRepoZip(githubUrl: string): Promise<ArrayBuffer> {
  const parsedRepo = parseGithubRepo(githubUrl);
  if (!parsedRepo) throw new Error("Invalid GitHub repository URL");

  const repoInfoRes = await fetch(
    `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}`,
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "opendraft-deployer" } }
  );

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

  if (!zipRes.ok) throw new Error("Failed to download GitHub repository archive");
  return await zipRes.arrayBuffer();
}

/** Upload a single file to Vercel's File API and return its SHA */
async function uploadFileToVercel(
  content: Uint8Array,
  vercelToken: string
): Promise<string> {
  // Compute SHA1 digest for the file
  const hashBuffer = await crypto.subtle.digest("SHA-1", content);
  const sha = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Upload file content to Vercel
  const uploadRes = await fetch("https://api.vercel.com/v2/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": sha,
      "Content-Length": String(content.byteLength),
    },
    body: content,
  });

  // 409 = file already exists, which is fine
  if (!uploadRes.ok && uploadRes.status !== 409) {
    const errText = await uploadRes.text();
    console.error(`File upload failed (${uploadRes.status}):`, errText);
    throw new Error(`Failed to upload file to Vercel: ${uploadRes.status}`);
  }

  return sha;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const { data: { user } } = await supabaseAnon.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { listingId, vercelToken } = await req.json();
    if (!listingId || !vercelToken) {
      return new Response(JSON.stringify({ error: "Missing listingId or vercelToken" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch listing
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

    // Must be seller or buyer
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

    if (!listing.file_path && !listing.github_url) {
      return new Response(JSON.stringify({ error: "No deployable source available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Vercel token
    const meRes = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });
    if (!meRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid Vercel token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download source ZIP
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
    } else {
      sourceZipBuffer = await downloadGithubRepoZip(listing.github_url!);
    }

    console.log(`ZIP downloaded: ${(sourceZipBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    const zip = await JSZip.loadAsync(sourceZipBuffer);
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

    // Upload files individually to Vercel's File API, then reference by SHA
    const fileRefs: Array<{ file: string; sha: string; size: number }> = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const relativePath = prefix ? path.replace(prefix, "") : path;
      if (!relativePath) continue;

      // Skip very large files (>50MB) — Vercel won't accept them
      const content = await entry.async("uint8array");
      if (content.byteLength > 50 * 1024 * 1024) {
        console.warn(`Skipping oversized file: ${relativePath} (${(content.byteLength / 1024 / 1024).toFixed(1)} MB)`);
        skippedCount++;
        continue;
      }

      try {
        const sha = await uploadFileToVercel(content, vercelToken);
        fileRefs.push({ file: relativePath, sha, size: content.byteLength });
        uploadedCount++;
      } catch (err) {
        console.error(`Failed to upload ${relativePath}:`, err);
        // Continue with remaining files rather than failing entirely
        skippedCount++;
      }
    }

    console.log(`Uploaded ${uploadedCount} files, skipped ${skippedCount}`);

    if (fileRefs.length === 0) {
      return new Response(JSON.stringify({ error: "ZIP file is empty or all files failed to upload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Vercel project
    const projectName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createProjectRes = await fetch("https://api.vercel.com/v13/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        framework: "vite",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm install",
      }),
    });

    if (!createProjectRes.ok) {
      const errText = await createProjectRes.text();
      console.error("Vercel create project error:", createProjectRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to create Vercel project", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectData = await createProjectRes.json();

    // Deploy using file references (SHA-based) instead of inline content
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        project: projectData.id,
        files: fileRefs,
        projectSettings: {
          framework: "vite",
          installCommand: "npm install",
          buildCommand: "npm run build",
          outputDirectory: "dist",
        },
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error("Vercel deploy error:", deployRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to deploy to Vercel", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deployData = await deployRes.json();
    const siteUrl = `https://${deployData.url}`;

    await supabase.from("activity_log").insert({
      event_type: "vercel_deploy",
      user_id: user.id,
      event_data: { listing_id: listingId, site_url: siteUrl, project_id: projectData.id, deploy_id: deployData.id },
    });

    return new Response(JSON.stringify({
      success: true, siteUrl, projectId: projectData.id, deployId: deployData.id,
      adminUrl: `https://vercel.com/${projectData.accountId}/${projectName}`,
      method: "source_deploy",
      filesUploaded: uploadedCount,
      filesSkipped: skippedCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deploy-to-vercel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
