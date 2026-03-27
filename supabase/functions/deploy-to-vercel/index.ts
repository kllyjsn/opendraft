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
const MAX_SINGLE_FILE_MB = 50;
const DEPLOY_COOLDOWN_MS = 30_000; // 30s between deploys per user
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Upload a single file to Vercel's File API with retry logic */
async function uploadFileToVercel(
  content: Uint8Array,
  vercelToken: string,
  retries = 3
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-1", content);
  const sha = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
        if (attempt < retries - 1 && (uploadRes.status >= 500 || uploadRes.status === 429)) {
          console.warn(`File upload attempt ${attempt + 1} failed (${uploadRes.status}), retrying...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        console.error(`File upload failed (${uploadRes.status}):`, errText);
        throw new Error(`Failed to upload file to Vercel: ${uploadRes.status}`);
      } else {
        await uploadRes.text();
      }
      return sha;
    } catch (e) {
      if (attempt < retries - 1 && (e as Error).message?.includes("fetch")) {
        console.warn(`File upload network error attempt ${attempt + 1}, retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
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

  if (deps["next"]) return { framework: "nextjs", buildCommand: scripts.build || "next build", outputDirectory: ".next", installCommand: "npm install" };
  if (deps["nuxt"]) return { framework: "nuxtjs", buildCommand: scripts.build || "nuxt build", outputDirectory: ".output", installCommand: "npm install" };
  if (deps["@sveltejs/kit"]) return { framework: "sveltekit", buildCommand: scripts.build || "vite build", outputDirectory: "build", installCommand: "npm install" };
  if (deps["astro"]) return { framework: "astro", buildCommand: scripts.build || "astro build", outputDirectory: "dist", installCommand: "npm install" };
  if (deps["vite"]) return { framework: "vite", buildCommand: scripts.build || "vite build", outputDirectory: "dist", installCommand: "npm install" };
  if (deps["react-scripts"]) return { framework: "create-react-app", buildCommand: scripts.build || "react-scripts build", outputDirectory: "build", installCommand: "npm install" };
  return { framework: null, buildCommand: scripts.build || "npm run build", outputDirectory: "dist", installCommand: "npm install" };
}

/** Auto-inject commonly missing dependencies into package.json */
const AUTO_DEPENDENCY_VERSIONS: Record<string, string> = {
  "react-router-dom": "^6.30.1",
  "lucide-react": "^0.462.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.1",
  "framer-motion": "^12.0.0",
  "sonner": "^1.7.0",
  "date-fns": "^3.6.0",
  "zod": "^3.25.0",
  "react-hook-form": "^7.61.0",
  "@hookform/resolvers": "^3.10.0",
  "recharts": "^2.15.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-tooltip": "^1.2.0",
  "@radix-ui/react-slot": "^1.2.0",
  "@radix-ui/react-select": "^2.2.0",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-checkbox": "^1.3.0",
  "@radix-ui/react-switch": "^1.2.0",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-popover": "^1.1.0",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-scroll-area": "^1.2.0",
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-progress": "^1.1.0",
  "@radix-ui/react-toast": "^1.2.0",
  "@radix-ui/react-toggle": "^1.1.0",
  "@radix-ui/react-toggle-group": "^1.1.0",
  "@tanstack/react-query": "^5.83.0",
  "cmdk": "^1.1.0",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.0",
  "vaul": "^0.9.0",
  "next-themes": "^0.3.0",
  "react-day-picker": "^8.10.0",
  "react-resizable-panels": "^2.1.0",
  "@supabase/supabase-js": "^2.97.0",
  "axios": "^1.7.0",
};

function extractPackageName(specifier: string): string | null {
  if (!specifier) return null;
  const clean = specifier.split("?")[0];
  if (clean.startsWith(".") || clean.startsWith("/") || clean.startsWith("http") || clean.startsWith("node:") || clean.startsWith("@/") || clean.startsWith("~/")) return null;
  if (clean.startsWith("@")) {
    const parts = clean.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }
  return clean.split("/")[0] || null;
}

function collectImportedPackages(content: string): Set<string> {
  const found = new Set<string>();
  const patterns = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const pkgName = extractPackageName(match[1]);
      if (pkgName) found.add(pkgName);
    }
  }
  return found;
}

/** Auto-patch missing npm dependencies in the ZIP's package.json */
async function autoPatchDependencies(zip: JSZip, prefix: string): Promise<{ autoAdded: string[] }> {
  const pkgJsonPath = prefix ? `${prefix}package.json` : "package.json";
  const pkgJsonEntry = zip.files[pkgJsonPath];
  if (!pkgJsonEntry || pkgJsonEntry.dir) return { autoAdded: [] };

  try {
    const pkgContent = await pkgJsonEntry.async("string");
    const packageJson = JSON.parse(pkgContent);
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    const hasReact = Boolean(deps["react"]);
    if (!hasReact) return { autoAdded: [] };

    // Scan source files for imports
    const importedPackages = new Set<string>();
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const rel = prefix ? path.replace(prefix, "") : path;
      if (!rel || !/\.(tsx?|jsx?)$/i.test(rel)) continue;
      try {
        const content = await entry.async("string");
        for (const pkg of collectImportedPackages(content)) importedPackages.add(pkg);
      } catch { /* skip */ }
    }

    const autoAdded: string[] = [];
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    for (const [dep, version] of Object.entries(AUTO_DEPENDENCY_VERSIONS)) {
      if (importedPackages.has(dep) && !dependencies[dep] && !devDependencies[dep]) {
        dependencies[dep] = version;
        autoAdded.push(dep);
      }
    }

    if (autoAdded.length > 0) {
      packageJson.dependencies = dependencies;
      zip.file(pkgJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`Auto-added missing dependencies: ${autoAdded.join(", ")}`);
    }

    return { autoAdded };
  } catch (e) {
    console.warn("Failed to auto-patch dependencies:", e);
    return { autoAdded: [] };
  }
}

/** Generate a vercel.json config for SPA routing if one doesn't exist */
function generateVercelConfig(framework: string | null): string {
  if (framework && ["nextjs", "nuxtjs", "sveltekit", "astro"].includes(framework)) {
    return JSON.stringify({});
  }
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

    // ── Input validation ──
    if (!listingId || !vercelToken) {
      return new Response(JSON.stringify({ error: "Missing listingId or vercelToken" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!UUID_REGEX.test(listingId)) {
      return new Response(JSON.stringify({ error: "Invalid listingId format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof vercelToken !== "string" || vercelToken.length > 500) {
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

    // ── ZIP bomb protection ──
    const zipSizeMB = sourceZipBuffer.byteLength / 1024 / 1024;
    console.log(`ZIP downloaded: ${zipSizeMB.toFixed(2)} MB`);
    if (zipSizeMB > MAX_ZIP_SIZE_MB) {
      return new Response(JSON.stringify({ error: `ZIP file too large (${zipSizeMB.toFixed(0)}MB). Maximum is ${MAX_ZIP_SIZE_MB}MB.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zip = await JSZip.loadAsync(sourceZipBuffer);
    const entries = Object.keys(zip.files);

    // ── File count protection ──
    if (entries.length > MAX_FILE_COUNT) {
      return new Response(JSON.stringify({ error: `ZIP contains too many files (${entries.length}). Maximum is ${MAX_FILE_COUNT}.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // ── Auto-patch missing dependencies ──
    const { autoAdded } = await autoPatchDependencies(zip, prefix);

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

    // Upload files individually to Vercel's File API (with retries)
    const fileRefs: Array<{ file: string; sha: string; size: number }> = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    const allEntries = Object.entries(zip.files);
    const BATCH_SIZE = 10;

    for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
      const batch = allEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async ([path, entry]) => {
          if (entry.dir) return null;
          const relativePath = prefix ? path.replace(prefix, "") : path;
          if (!relativePath) return null;

          const content = await entry.async("uint8array");
          if (content.byteLength > MAX_SINGLE_FILE_MB * 1024 * 1024) {
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

    // Track deployment + auto-set demo_url on listing
    try {
      await Promise.all([
        supabase.from("deployed_sites").insert({
          listing_id: listingId,
          user_id: user.id,
          provider: "vercel",
          site_id: projectData.id,
          site_url: siteUrl,
          deploy_id: deployData.id,
          status: "building",
        }),
        supabase.from("listings").update({ demo_url: siteUrl }).eq("id", listingId),
      ]);
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
        auto_added_dependencies: autoAdded,
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
      autoAddedDependencies: autoAdded,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deploy-to-vercel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
