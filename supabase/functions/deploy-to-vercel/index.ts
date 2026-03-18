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
  const hashBuffer = await crypto.subtle.digest("SHA-1", content);
  const sha = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

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
  } else {
    // Consume body to prevent resource leak
    await uploadRes.text();
  }

  return sha;
}

/** Detect framework and build settings from package.json */
function detectFramework(packageJson: any): {
  framework: string | null;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
} {
  const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
  const scripts = packageJson?.scripts || {};

  // Check for Next.js
  if (deps["next"]) {
    return {
      framework: "nextjs",
      buildCommand: scripts.build || "next build",
      outputDirectory: ".next",
      installCommand: "npm install",
    };
  }

  // Check for Nuxt
  if (deps["nuxt"]) {
    return {
      framework: "nuxtjs",
      buildCommand: scripts.build || "nuxt build",
      outputDirectory: ".output",
      installCommand: "npm install",
    };
  }

  // Check for SvelteKit
  if (deps["@sveltejs/kit"]) {
    return {
      framework: "sveltekit",
      buildCommand: scripts.build || "vite build",
      outputDirectory: "build",
      installCommand: "npm install",
    };
  }

  // Check for Astro
  if (deps["astro"]) {
    return {
      framework: "astro",
      buildCommand: scripts.build || "astro build",
      outputDirectory: "dist",
      installCommand: "npm install",
    };
  }

  // Check for Vite (React, Vue, etc.)
  if (deps["vite"]) {
    return {
      framework: "vite",
      buildCommand: scripts.build || "vite build",
      outputDirectory: "dist",
      installCommand: "npm install",
    };
  }

  // Check for Create React App
  if (deps["react-scripts"]) {
    return {
      framework: "create-react-app",
      buildCommand: scripts.build || "react-scripts build",
      outputDirectory: "build",
      installCommand: "npm install",
    };
  }

  // Fallback
  return {
    framework: null,
    buildCommand: scripts.build || "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install",
  };
}

/** Generate a vercel.json config for SPA routing if one doesn't exist */
function generateVercelConfig(framework: string | null): string {
  // Next.js, Nuxt, SvelteKit, Astro handle their own routing
  if (framework && ["nextjs", "nuxtjs", "sveltekit", "astro"].includes(framework)) {
    return JSON.stringify({});
  }

  // For SPAs (Vite, CRA, etc.), add catch-all rewrite for client-side routing
  return JSON.stringify({
    rewrites: [{ source: "/(.*)", destination: "/index.html" }],
  }, null, 2);
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
      await meRes.text();
      return new Response(JSON.stringify({ error: "Invalid Vercel token. Generate a new one at vercel.com/account/tokens" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await meRes.text();

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

    // ── Detect framework from package.json ──
    let frameworkInfo = detectFramework({});
    const pkgJsonPath = prefix ? `${prefix}package.json` : "package.json";
    const pkgJsonEntry = zip.files[pkgJsonPath];
    if (pkgJsonEntry && !pkgJsonEntry.dir) {
      try {
        const pkgContent = await pkgJsonEntry.async("string");
        const pkgJson = JSON.parse(pkgContent);
        frameworkInfo = detectFramework(pkgJson);
        console.log(`Detected framework: ${frameworkInfo.framework || "unknown"}`);
      } catch (e) {
        console.warn("Failed to parse package.json:", e);
      }
    }

    // ── Inject vercel.json for SPA routing if missing ──
    const vercelJsonPath = prefix ? `${prefix}vercel.json` : "vercel.json";
    const hasVercelJson = !!zip.files[vercelJsonPath];
    let injectedVercelJson = false;
    if (!hasVercelJson) {
      const config = generateVercelConfig(frameworkInfo.framework);
      if (config !== "{}") {
        zip.file(vercelJsonPath, config);
        injectedVercelJson = true;
        console.log("Injected vercel.json with SPA rewrites");
      }
    }

    // Upload files individually to Vercel's File API
    const fileRefs: Array<{ file: string; sha: string; size: number }> = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    const allEntries = Object.entries(zip.files);
    // Process in batches of 10 for better throughput
    const BATCH_SIZE = 10;

    for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
      const batch = allEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async ([path, entry]) => {
          if (entry.dir) return null;
          const relativePath = prefix ? path.replace(prefix, "") : path;
          if (!relativePath) return null;

          const content = await entry.async("uint8array");
          // Skip very large files (>50MB)
          if (content.byteLength > 50 * 1024 * 1024) {
            console.warn(`Skipping oversized file: ${relativePath} (${(content.byteLength / 1024 / 1024).toFixed(1)} MB)`);
            return { skipped: true };
          }

          const sha = await uploadFileToVercel(content, vercelToken);
          return { file: relativePath, sha, size: content.byteLength };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          if ("skipped" in result.value) {
            skippedCount++;
          } else {
            fileRefs.push(result.value);
            uploadedCount++;
          }
        } else if (result.status === "rejected") {
          console.error("File upload failed:", result.reason);
          skippedCount++;
        }
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
        framework: frameworkInfo.framework,
        buildCommand: frameworkInfo.buildCommand,
        outputDirectory: frameworkInfo.outputDirectory,
        installCommand: frameworkInfo.installCommand,
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

    // ── Disable Vercel Deployment Protection to prevent 401s ──
    try {
      const patchRes = await fetch(`https://api.vercel.com/v9/projects/${projectData.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ssoProtection: null, passwordProtection: null }),
      });
      if (patchRes.ok) {
        console.log("Disabled deployment protection for project");
      } else {
        const patchErr = await patchRes.text();
        console.warn(`Failed to disable deployment protection (${patchRes.status}):`, patchErr);
      }
    } catch (e) {
      console.warn("Failed to disable deployment protection:", e);
    }

    // Deploy using file references (SHA-based)
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        project: projectData.id,
        files: fileRefs,
        projectSettings: {
          framework: frameworkInfo.framework,
          installCommand: frameworkInfo.installCommand,
          buildCommand: frameworkInfo.buildCommand,
          outputDirectory: frameworkInfo.outputDirectory,
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
    const adminUrl = `https://vercel.com/${projectData.accountId || projectData.id}/${projectName}`;

    // ── Track deployment in deployed_sites table ──
    try {
      await supabase.from("deployed_sites").insert({
        listing_id: listingId,
        user_id: user.id,
        provider: "vercel",
        site_id: projectData.id,
        site_url: siteUrl,
        deploy_id: deployData.id,
        status: "building",
      });
    } catch (e) {
      console.warn("Failed to track deployment:", e);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      event_type: "vercel_deploy",
      user_id: user.id,
      event_data: {
        listing_id: listingId,
        site_url: siteUrl,
        project_id: projectData.id,
        deploy_id: deployData.id,
        framework: frameworkInfo.framework,
        injected_vercel_json: injectedVercelJson,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      siteUrl,
      projectId: projectData.id,
      deployId: deployData.id,
      adminUrl,
      method: "source_deploy",
      framework: frameworkInfo.framework,
      filesUploaded: uploadedCount,
      filesSkipped: skippedCount,
      injectedVercelJson,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deploy-to-vercel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
