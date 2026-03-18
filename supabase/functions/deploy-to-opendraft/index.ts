import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseGithubRepo(githubUrl: string) {
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
    if (repoInfoRes.status === 404) throw new Error("GitHub repository not found or private.");
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

async function uploadFileToVercel(content: Uint8Array, vercelToken: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-1", content);
  const sha = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  if (!uploadRes.ok && uploadRes.status !== 409) {
    const errText = await uploadRes.text();
    console.error(`File upload failed (${uploadRes.status}):`, errText);
    throw new Error(`Failed to upload file to Vercel: ${uploadRes.status}`);
  } else {
    await uploadRes.text();
  }
  return sha;
}

function detectFramework(packageJson: any) {
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

const AUTO_DEPENDENCY_VERSIONS: Record<string, string> = {
  "react-router-dom": "^6.30.1",
};

function extractPackageName(specifier: string): string | null {
  if (!specifier) return null;
  const cleanSpecifier = specifier.split("?")[0];
  if (
    cleanSpecifier.startsWith(".") ||
    cleanSpecifier.startsWith("/") ||
    cleanSpecifier.startsWith("http://") ||
    cleanSpecifier.startsWith("https://") ||
    cleanSpecifier.startsWith("node:") ||
    cleanSpecifier.startsWith("@/") ||
    cleanSpecifier.startsWith("~/")
  ) {
    return null;
  }

  if (cleanSpecifier.startsWith("@")) {
    const parts = cleanSpecifier.split("/");
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  }

  return cleanSpecifier.split("/")[0] || null;
}

function collectImportedPackages(content: string): Set<string> {
  const found = new Set<string>();
  const importPatterns = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of importPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const pkgName = extractPackageName(match[1]);
      if (pkgName) found.add(pkgName);
    }
  }

  return found;
}

async function autoPatchMissingDependencies(
  zip: JSZip,
  prefix: string
): Promise<{ packageJson: any | null; autoAddedDependencies: string[]; autoAddedFiles: string[] }> {
  const pkgJsonPath = prefix ? `${prefix}package.json` : "package.json";
  const pkgJsonEntry = zip.files[pkgJsonPath];
  if (!pkgJsonEntry || pkgJsonEntry.dir) {
    return { packageJson: null, autoAddedDependencies: [], autoAddedFiles: [] };
  }

  try {
    const pkgContent = await pkgJsonEntry.async("string");
    const packageJson = JSON.parse(pkgContent);

    const hasReact = Boolean(
      packageJson?.dependencies?.react || packageJson?.devDependencies?.react
    );

    const isValidIdentifier = (value: string) => /^[A-Za-z_$][\w$]*$/.test(value);
    const toSafeIdentifier = (value: string, fallback: string) =>
      isValidIdentifier(value) ? value : fallback;

    const normalizePath = (value: string) => {
      const parts = value.replace(/\\/g, "/").split("/");
      const stack: string[] = [];
      for (const part of parts) {
        if (!part || part === ".") continue;
        if (part === "..") {
          stack.pop();
        } else {
          stack.push(part);
        }
      }
      return stack.join("/");
    };

    const hasZipFile = (relativePath: string) => {
      const fullPath = prefix ? `${prefix}${relativePath}` : relativePath;
      const entry = zip.files[fullPath];
      return Boolean(entry && !entry.dir);
    };

    const parseImportClause = (rawClause: string) => {
      const clause = rawClause.trim();
      const result: {
        defaultImport: string | null;
        namedImports: string[];
        namespaceImport: string | null;
      } = {
        defaultImport: null,
        namedImports: [],
        namespaceImport: null,
      };

      if (!clause) return result;

      let rest = clause;
      const defaultAndRestMatch = clause.match(/^([A-Za-z_$][\w$]*)\s*,\s*(.+)$/s);
      if (defaultAndRestMatch) {
        result.defaultImport = defaultAndRestMatch[1];
        rest = defaultAndRestMatch[2].trim();
      }

      if (rest.startsWith("* as ")) {
        result.namespaceImport = rest.replace(/^\*\s+as\s+/, "").trim();
        return result;
      }

      if (rest.startsWith("{")) {
        const namedBlockMatch = rest.match(/^\{([\s\S]*)\}$/);
        const namedBlock = namedBlockMatch ? namedBlockMatch[1] : "";
        const names = namedBlock
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean)
          .map((token) => token.replace(/^type\s+/, "").trim())
          .map((token) => {
            const aliasMatch = token.match(/^(.+?)\s+as\s+(.+)$/);
            return aliasMatch ? aliasMatch[2].trim() : token;
          })
          .filter((name) => isValidIdentifier(name));

        result.namedImports = names;
        return result;
      }

      if (!result.defaultImport && isValidIdentifier(rest)) {
        result.defaultImport = rest;
      }

      return result;
    };

    const codeExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
    const styleExtensions = [".css", ".scss", ".sass", ".less"];
    const assetExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".avif"];

    const resolveRelativeImport = (
      importerPath: string,
      specifier: string,
      sideEffect: boolean
    ): { exists: boolean; targetPath: string } => {
      const cleanSpecifier = specifier.split("?")[0].split("#")[0];
      const importerSegments = importerPath.split("/");
      importerSegments.pop();
      const importerDir = importerSegments.join("/");
      const unresolvedPath = normalizePath(importerDir ? `${importerDir}/${cleanSpecifier}` : cleanSpecifier);
      const hasExplicitExtension = /\.[a-z0-9]+$/i.test(unresolvedPath);

      const candidates: string[] = [];
      if (hasExplicitExtension) {
        candidates.push(unresolvedPath);
      } else {
        if (sideEffect) {
          candidates.push(...styleExtensions.map((ext) => `${unresolvedPath}${ext}`));
        }
        candidates.push(...codeExtensions.map((ext) => `${unresolvedPath}${ext}`));
        candidates.push(...codeExtensions.map((ext) => `${unresolvedPath}/index${ext}`));
      }

      for (const candidate of candidates) {
        if (hasZipFile(candidate)) {
          return { exists: true, targetPath: candidate };
        }
      }

      if (hasExplicitExtension) {
        return { exists: false, targetPath: unresolvedPath };
      }

      if (sideEffect) {
        return { exists: false, targetPath: `${unresolvedPath}.css` };
      }

      return { exists: false, targetPath: `${unresolvedPath}.tsx` };
    };

    const toPascalCase = (value: string) =>
      value
        .replace(/\.[^/.]+$/, "")
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("") || "AutoGeneratedComponent";

    const createPlaceholderContent = (targetPath: string, record: {
      importerPath: string;
      specifier: string;
      sideEffect: boolean;
      defaultImport: string | null;
      namedImports: Set<string>;
      namespaceImport: string | null;
    }) => {
      const extension = targetPath.slice(targetPath.lastIndexOf(".")).toLowerCase();
      const header = `/* Auto-generated missing module for ${record.specifier} imported by ${record.importerPath} */`;

      if (styleExtensions.includes(extension)) {
        return `${header}\n`;
      }

      if (extension === ".svg") {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"></svg>`;
      }

      if (assetExtensions.includes(extension)) {
        return "";
      }

      const lines: string[] = [header];
      const fileBase = targetPath.split("/").pop() || "auto-generated";
      const fallbackComponent = toSafeIdentifier(toPascalCase(fileBase), "AutoGeneratedComponent");

      if (record.defaultImport) {
        const defaultName = toSafeIdentifier(record.defaultImport, fallbackComponent);
        lines.push(`export default function ${defaultName}() { return null; }`);
      } else if (!record.namespaceImport) {
        lines.push(`export default function ${fallbackComponent}() { return null; }`);
      }

      for (const namedImport of record.namedImports) {
        const safeName = toSafeIdentifier(namedImport, "AutoGeneratedExport");
        if (safeName === "default") continue;
        lines.push(`export const ${safeName} = () => null;`);
      }

      if (record.namespaceImport && record.namedImports.size === 0 && !record.defaultImport) {
        lines.push("export const placeholder = null;");
      }

      return `${lines.join("\n")}\n`;
    };

    const sourceFiles: Array<{ path: string; content: string }> = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const relativePath = prefix ? path.replace(prefix, "") : path;
      if (!relativePath || !/\.(tsx?|jsx?)$/i.test(relativePath)) continue;

      try {
        const content = await entry.async("string");
        sourceFiles.push({ path: relativePath, content });
      } catch {
        // Ignore unreadable files
      }
    }

    const importedPackages = new Set<string>();
    const missingModules = new Map<string, {
      importerPath: string;
      specifier: string;
      sideEffect: boolean;
      defaultImport: string | null;
      namedImports: Set<string>;
      namespaceImport: string | null;
    }>();

    for (const sourceFile of sourceFiles) {
      const imports = collectImportedPackages(sourceFile.content);
      for (const dep of imports) importedPackages.add(dep);

      const importFromRegex = /import\s+(type\s+)?([^"']+?)\s+from\s+["']([^"']+)["']/g;
      let fromMatch: RegExpExecArray | null;
      while ((fromMatch = importFromRegex.exec(sourceFile.content)) !== null) {
        const isTypeOnly = Boolean(fromMatch[1]);
        const importClause = fromMatch[2].trim();
        const specifier = fromMatch[3].trim();
        if (isTypeOnly || !specifier.startsWith(".")) continue;

        const resolved = resolveRelativeImport(sourceFile.path, specifier, false);
        if (resolved.exists) continue;

        const parsed = parseImportClause(importClause);
        const existingRecord = missingModules.get(resolved.targetPath);
        if (existingRecord) {
          if (!existingRecord.defaultImport && parsed.defaultImport) {
            existingRecord.defaultImport = parsed.defaultImport;
          }
          if (!existingRecord.namespaceImport && parsed.namespaceImport) {
            existingRecord.namespaceImport = parsed.namespaceImport;
          }
          for (const name of parsed.namedImports) existingRecord.namedImports.add(name);
        } else {
          missingModules.set(resolved.targetPath, {
            importerPath: sourceFile.path,
            specifier,
            sideEffect: false,
            defaultImport: parsed.defaultImport,
            namedImports: new Set(parsed.namedImports),
            namespaceImport: parsed.namespaceImport,
          });
        }
      }

      const sideEffectRegex = /import\s+["']([^"']+)["']/g;
      let sideEffectMatch: RegExpExecArray | null;
      while ((sideEffectMatch = sideEffectRegex.exec(sourceFile.content)) !== null) {
        const specifier = sideEffectMatch[1].trim();
        if (!specifier.startsWith(".")) continue;

        const resolved = resolveRelativeImport(sourceFile.path, specifier, true);
        if (resolved.exists) continue;

        if (!missingModules.has(resolved.targetPath)) {
          missingModules.set(resolved.targetPath, {
            importerPath: sourceFile.path,
            specifier,
            sideEffect: true,
            defaultImport: null,
            namedImports: new Set<string>(),
            namespaceImport: null,
          });
        }
      }
    }

    const autoAddedFiles: string[] = [];
    for (const [targetPath, record] of missingModules.entries()) {
      if (hasZipFile(targetPath)) continue;
      const targetZipPath = prefix ? `${prefix}${targetPath}` : targetPath;
      zip.file(targetZipPath, createPlaceholderContent(targetPath, record));
      autoAddedFiles.push(targetPath);
    }

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const autoAddedDependencies: string[] = [];

    if (hasReact) {
      for (const [dep, version] of Object.entries(AUTO_DEPENDENCY_VERSIONS)) {
        const isUsed = importedPackages.has(dep);
        const alreadyInstalled = Boolean(dependencies[dep] || devDependencies[dep]);

        if (isUsed && !alreadyInstalled) {
          dependencies[dep] = version;
          autoAddedDependencies.push(dep);
        }
      }
    }

    if (autoAddedDependencies.length > 0) {
      packageJson.dependencies = dependencies;
      zip.file(pkgJsonPath, JSON.stringify(packageJson, null, 2));
    }

    if (autoAddedFiles.length > 0) {
      console.log(`Auto-generated missing local files: ${autoAddedFiles.join(", ")}`);
    }

    return { packageJson, autoAddedDependencies, autoAddedFiles };
  } catch (e) {
    console.warn("Failed to auto-patch dependencies:", e);
    return { packageJson: null, autoAddedDependencies: [], autoAddedFiles: [] };
  }
}

function generateVercelConfig(framework: string | null): string {
  if (framework && ["nextjs", "nuxtjs", "sveltekit", "astro"].includes(framework)) return JSON.stringify({});
  return JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VERCEL_PLATFORM_TOKEN = Deno.env.get("VERCEL_PLATFORM_TOKEN");

    if (!VERCEL_PLATFORM_TOKEN) {
      return new Response(JSON.stringify({ error: "Platform deployment not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { listingId } = await req.json();
    if (!listingId) {
      return new Response(JSON.stringify({ error: "Missing listingId" }), {
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
        return new Response(JSON.stringify({ error: "You must own this listing to deploy" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!listing.file_path && !listing.github_url) {
      return new Response(JSON.stringify({ error: "No deployable source available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download source ZIP
    let sourceZipBuffer: ArrayBuffer;
    if (listing.file_path) {
      const { data: fileData } = await supabase.storage.from("listing-files").download(listing.file_path);
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

    // Auto-fix common missing dependencies and detect framework
    let frameworkInfo = detectFramework({});
    const { packageJson, autoAddedDependencies } = await autoPatchMissingDependencies(zip, prefix);

    if (packageJson) {
      frameworkInfo = detectFramework(packageJson);
      console.log(`Detected framework: ${frameworkInfo.framework || "unknown"}`);
    } else {
      const pkgJsonPath = prefix ? `${prefix}package.json` : "package.json";
      const pkgJsonEntry = zip.files[pkgJsonPath];
      if (pkgJsonEntry && !pkgJsonEntry.dir) {
        try {
          const pkgContent = await pkgJsonEntry.async("string");
          frameworkInfo = detectFramework(JSON.parse(pkgContent));
          console.log(`Detected framework: ${frameworkInfo.framework || "unknown"}`);
        } catch (e) {
          console.warn("Failed to parse package.json:", e);
        }
      }
    }

    if (autoAddedDependencies.length > 0) {
      console.log(`Auto-added missing dependencies: ${autoAddedDependencies.join(", ")}`);
    }

    // Inject vercel.json for SPA routing
    const vercelJsonPath = prefix ? `${prefix}vercel.json` : "vercel.json";
    let injectedVercelJson = false;
    if (!zip.files[vercelJsonPath]) {
      const config = generateVercelConfig(frameworkInfo.framework);
      if (config !== "{}") {
        zip.file(vercelJsonPath, config);
        injectedVercelJson = true;
      }
    }

    // Upload files to Vercel
    const fileRefs: Array<{ file: string; sha: string; size: number }> = [];
    let uploadedCount = 0;
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
          if (content.byteLength > 50 * 1024 * 1024) return null;
          const sha = await uploadFileToVercel(content, VERCEL_PLATFORM_TOKEN);
          return { file: relativePath, sha, size: content.byteLength };
        })
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value && !("skipped" in result.value)) {
          fileRefs.push(result.value);
          uploadedCount++;
        }
      }
    }

    if (fileRefs.length === 0) {
      return new Response(JSON.stringify({ error: "No files to deploy" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create project under the platform account
    const projectName = `od-${listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;

    const createProjectRes = await fetch("https://api.vercel.com/v13/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${VERCEL_PLATFORM_TOKEN}`, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ error: "Failed to create project", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectData = await createProjectRes.json();

    // Deploy
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: { Authorization: `Bearer ${VERCEL_PLATFORM_TOKEN}`, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ error: "Failed to deploy", details: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deployData = await deployRes.json();
    const siteUrl = `https://${deployData.url}`;
    const adminUrl = `https://vercel.com/${projectData.accountId || projectData.id}/${projectName}`;

    // Track deployment
    try {
      await supabase.from("deployed_sites").insert({
        listing_id: listingId,
        user_id: user.id,
        provider: "opendraft",
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
      event_type: "opendraft_deploy",
      user_id: user.id,
      event_data: {
        listing_id: listingId,
        site_url: siteUrl,
        project_id: projectData.id,
        deploy_id: deployData.id,
        framework: frameworkInfo.framework,
        auto_added_dependencies: autoAddedDependencies,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      siteUrl,
      projectId: projectData.id,
      deployId: deployData.id,
      adminUrl,
      method: "opendraft_cloud",
      framework: frameworkInfo.framework,
      filesUploaded: uploadedCount,
      injectedVercelJson,
      autoAddedDependencies,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("deploy-to-opendraft error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
