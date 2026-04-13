import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const VERCEL_PLATFORM_TOKEN = Deno.env.get("VERCEL_PLATFORM_TOKEN");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { cycle_id, listing_id, user_id, mode = "preview" } = await req.json();

    if (!cycle_id || !listing_id) {
      return new Response(JSON.stringify({ error: "cycle_id and listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MODE: PROMOTE — take already-patched ZIP and deploy to production ──
    if (mode === "promote") {
      return await handlePromote(supabase, cycle_id, listing_id, user_id, VERCEL_PLATFORM_TOKEN);
    }

    // ── MODE: PREVIEW (default) — patch code, upload ZIP, deploy to staging ──
    return await handlePreview(supabase, cycle_id, listing_id, user_id, LOVABLE_API_KEY, VERCEL_PLATFORM_TOKEN);

  } catch (e) {
    console.error("Apply fixes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ════════════════════════════════════════
// PREVIEW: Patch code → upload ZIP → deploy to staging project
// ════════════════════════════════════════
async function handlePreview(
  supabase: any, cycleId: string, listingId: string, userId: string,
  lovableKey: string, vercelToken: string | undefined
) {
  const { data: cycle } = await supabase
    .from("improvement_cycles").select("*").eq("id", cycleId).single();
  if (!cycle) return errorResp(404, "Cycle not found");

  const { data: approvedChanges } = await supabase
    .from("improvement_changes").select("*").eq("cycle_id", cycleId).eq("approved", true);
  if (!approvedChanges?.length) return errorResp(400, "No approved changes to apply");

  const { data: listing } = await supabase
    .from("listings").select("*").eq("id", listingId).single();
  if (!listing) return errorResp(404, "Listing not found");

  await supabase.from("improvement_cycles").update({ status: "applying" }).eq("id", cycleId);

  // ── Load source code ──
  const sourceFiles = await loadSourceCode(supabase, listing);
  if (!Object.keys(sourceFiles).length) {
    await supabase.from("improvement_cycles").update({ status: "failed" }).eq("id", cycleId);
    return errorResp(400, "No source code available. Upload a ZIP or connect a GitHub repo.");
  }

  // ── AI patch ──
  const { summary, modifiedFiles } = await aiPatchFiles(sourceFiles, approvedChanges, lovableKey);

  // ── Merge & package ──
  const mergedFiles = { ...sourceFiles };
  for (const file of modifiedFiles) mergedFiles[file.path] = file.content;

  const zip = new JSZip();
  for (const [path, content] of Object.entries(mergedFiles)) zip.file(path, content);
  const zipBlob = await zip.generateAsync({ type: "uint8array" });

  const sellerId = userId || listing.seller_id;
  const zipPath = `${sellerId}/preview-${listingId}-${Date.now()}.zip`;
  const { error: uploadErr } = await supabase.storage
    .from("listing-files").upload(zipPath, zipBlob, { contentType: "application/zip", upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  // Mark changes as patched (not yet promoted)
  for (const change of approvedChanges) {
    await supabase.from("improvement_changes").update({ applied_at: new Date().toISOString() }).eq("id", change.id);
  }

  // ── Deploy to a PREVIEW Vercel project ──
  let previewUrl: string | null = null;
  if (vercelToken) {
    previewUrl = await deployToPreviewProject(mergedFiles, listingId, cycleId, vercelToken);
  }

  // Store preview info in the cycle
  await supabase.from("improvement_cycles").update({
    status: "preview",
    analysis: {
      ...cycle.analysis,
      apply_summary: summary,
      preview_zip_path: zipPath,
      preview_url: previewUrl,
    },
  }).eq("id", cycleId);

  // Notify
  await supabase.from("notifications").insert({
    user_id: sellerId, type: "preview_ready",
    title: "Preview ready! 👀",
    message: `${modifiedFiles.length} files patched for "${listing.title}". Review the preview before promoting to production.`,
    link: "/dashboard?tab=improvements",
  });

  await supabase.from("swarm_tasks").insert({
    agent_type: "apply_fixes", action: "preview_deploy", status: "completed",
    input: { cycle_id: cycleId, listing_id: listingId, approved_count: approvedChanges.length },
    output: { modified_files: modifiedFiles.length, summary, preview_url: previewUrl },
    triggered_by: "user", completed_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({
    success: true, modified_files: modifiedFiles.length, summary,
    preview_url: previewUrl, zip_path: zipPath,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ════════════════════════════════════════
// PROMOTE: Take patched ZIP and deploy to PRODUCTION project
// ════════════════════════════════════════
async function handlePromote(
  supabase: any, cycleId: string, listingId: string, userId: string,
  vercelToken: string | undefined
) {
  const { data: cycle } = await supabase
    .from("improvement_cycles").select("*").eq("id", cycleId).single();
  if (!cycle) return errorResp(404, "Cycle not found");
  if (cycle.status !== "preview") return errorResp(400, "Cycle must be in preview status to promote");

  const previewZipPath = cycle.analysis?.preview_zip_path;
  if (!previewZipPath) return errorResp(400, "No preview ZIP found for this cycle");

  const { data: listing } = await supabase
    .from("listings").select("*").eq("id", listingId).single();
  if (!listing) return errorResp(404, "Listing not found");

  // Download the preview ZIP
  const { data: fileData } = await supabase.storage.from("listing-files").download(previewZipPath);
  if (!fileData) return errorResp(400, "Preview ZIP not found in storage");

  const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
  const mergedFiles: Record<string, string> = {};
  for (const [path, file] of Object.entries(zip.files) as any) {
    if (file.dir) continue;
    try { mergedFiles[path] = await file.async("string"); } catch { /* skip binary */ }
  }

  // Update listing's file_path to the patched version
  await supabase.from("listings")
    .update({ file_path: previewZipPath, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  // Deploy to PRODUCTION Vercel project
  let deployResult = null;
  if (vercelToken) {
    const { data: deployedSite } = await supabase.from("deployed_sites").select("*")
      .eq("listing_id", listingId)
      .in("status", ["healthy", "degraded", "building"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (deployedSite) {
      deployResult = await deployToVercelProject(mergedFiles, deployedSite.site_id, vercelToken);
      if (deployResult) {
        const newUrl = `https://${deployResult.url}`;
        await supabase.from("deployed_sites").update({
          deploy_id: deployResult.id, site_url: newUrl,
          status: "building", updated_at: new Date().toISOString(),
        }).eq("id", deployedSite.id);
        await supabase.from("listings").update({ demo_url: newUrl }).eq("id", listingId);
      }
    }
  }

  // Update cycle to applied
  await supabase.from("improvement_cycles").update({ status: "applied" }).eq("id", cycleId);

  const sellerId = userId || listing.seller_id;
  await supabase.from("notifications").insert({
    user_id: sellerId, type: "fixes_promoted",
    title: "Fixes promoted to production! 🚀",
    message: `Changes for "${listing.title}" are now live.`,
    link: "/dashboard?tab=improvements",
  });

  return new Response(JSON.stringify({
    success: true, deployed: !!deployResult, promoted: true,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

function errorResp(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function loadSourceCode(supabase: any, listing: any): Promise<Record<string, string>> {
  const sourceFiles: Record<string, string> = {};

  // Try ZIP first
  if (listing.file_path) {
    try {
      const { data: fileData } = await supabase.storage.from("listing-files").download(listing.file_path);
      if (fileData) {
        const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
        const entries = Object.entries(zip.files);
        let rootPrefix = "";
        const dirs = entries.filter(([, f]: any) => f.dir).map(([n]: any) => n);
        if (dirs.length > 0) {
          const firstDir = dirs[0];
          if (entries.every(([n]) => n.startsWith(firstDir))) rootPrefix = firstDir;
        }
        for (const [path, file] of entries) {
          if ((file as any).dir) continue;
          const cleanPath = rootPrefix ? path.replace(rootPrefix, "") : path;
          if (!cleanPath) continue;
          if (/\.(tsx?|jsx?|css|html|json|md|yaml|toml|svg)$/i.test(cleanPath)) {
            try { sourceFiles[cleanPath] = await (file as any).async("string"); } catch { /* skip */ }
          }
        }
        console.log("Loaded", Object.keys(sourceFiles).length, "files from ZIP");
      }
    } catch (e) { console.error("Failed to load ZIP:", e); }
  }

  // Fall back to GitHub
  if (!Object.keys(sourceFiles).length && listing.github_url) {
    try {
      const ghMatch = listing.github_url.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
      if (ghMatch) {
        const [, owner, repo] = ghMatch;
        const repoName = repo.replace(/\.git$/, "");
        const treeResp = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
          { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "OpenDraft-Fixer" } }
        );
        if (treeResp.ok) {
          const treeData = await treeResp.json();
          const srcFiles = (treeData.tree || [])
            .filter((f: any) => f.type === "blob" && /\.(tsx?|jsx?|css|html|json)$/i.test(f.path))
            .filter((f: any) => !f.path.includes("node_modules") && !f.path.includes(".lock"))
            .slice(0, 40);
          const results = await Promise.allSettled(
            srcFiles.map(async (f: any) => {
              const resp = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/contents/${f.path}`,
                { headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "OpenDraft-Fixer" } }
              );
              return resp.ok ? { path: f.path, content: await resp.text() } : null;
            })
          );
          for (const r of results) {
            if (r.status === "fulfilled" && r.value) sourceFiles[r.value.path] = r.value.content;
          }
          console.log("Loaded", Object.keys(sourceFiles).length, "files from GitHub");
        }
      }
    } catch (e) { console.error("Failed to load GitHub:", e); }
  }

  return sourceFiles;
}

async function aiPatchFiles(
  sourceFiles: Record<string, string>, approvedChanges: any[], lovableKey: string
): Promise<{ summary: string; modifiedFiles: { path: string; content: string }[] }> {
  const sortedFiles = Object.entries(sourceFiles).sort(([a], [b]) => {
    const p = (s: string) => {
      if (s.includes("App.tsx") || s.includes("App.jsx")) return 0;
      if (s.includes("main.tsx")) return 1;
      if (s.includes("index.css")) return 2;
      if (s.includes("package.json")) return 3;
      if (s.endsWith(".tsx") || s.endsWith(".jsx")) return 4;
      return 5;
    };
    return p(a) - p(b);
  });

  const sourceContext = sortedFiles.slice(0, 35)
    .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 4000)}`)
    .join("\n\n");

  const fixInstructions = approvedChanges
    .map((c, i) => `${i + 1}. [${c.file_path}] ${c.description}\n   Implementation: ${c.code}`)
    .join("\n\n");

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert React/TypeScript developer. Apply the following approved fixes to the source code.
Return ONLY the files that need to change, with their COMPLETE updated content (not diffs).
Keep all existing functionality intact. Only modify what's needed for the fixes.

APPROVED FIXES TO APPLY:
${fixInstructions}

Rules:
- Return the complete file content for each modified file
- Do NOT change files that aren't affected by the fixes
- Maintain existing code style and patterns
- Ensure the app still builds after changes
- If a fix requires a new file, create it`
        },
        { role: "user", content: `Here is the current source code:\n\n${sourceContext}\n\nApply all ${approvedChanges.length} approved fixes and return the modified files.` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "apply_fixes",
          description: "Return the modified files with fixes applied",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Summary of all changes made" },
              files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string" },
                    content: { type: "string" },
                    change_description: { type: "string" }
                  },
                  required: ["path", "content"]
                }
              }
            },
            required: ["summary", "files"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "apply_fixes" } },
    }),
  });

  if (!aiResponse.ok) throw new Error(`AI error ${aiResponse.status}: ${await aiResponse.text()}`);
  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No structured output from AI");

  const result = JSON.parse(toolCall.function.arguments);
  console.log("AI generated", result.files.length, "modified files. Summary:", result.summary);
  return { summary: result.summary, modifiedFiles: result.files };
}

async function deployToPreviewProject(
  files: Record<string, string>, listingId: string, cycleId: string, vercelToken: string
): Promise<string | null> {
  try {
    const fileRefs = await uploadFilesToVercel(files, vercelToken);
    if (!fileRefs.length) return null;

    // Deploy to a unique preview project name (separate from production)
    const previewName = `od-preview-${listingId.slice(0, 8)}-${cycleId.slice(0, 6)}`;
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: previewName,
        files: fileRefs,
        projectSettings: {
          framework: "vite",
          installCommand: "npm install",
          buildCommand: "vite build",
          outputDirectory: "dist",
        },
      }),
    });

    if (deployRes.ok) {
      const data = await deployRes.json();
      const url = `https://${data.url}`;
      console.log("Preview deployed:", url);
      return url;
    } else {
      console.error("Preview deploy failed:", deployRes.status, await deployRes.text());
      return null;
    }
  } catch (e) {
    console.error("Preview deploy error:", e);
    return null;
  }
}

async function deployToVercelProject(
  files: Record<string, string>, projectId: string, vercelToken: string
): Promise<any | null> {
  try {
    const fileRefs = await uploadFilesToVercel(files, vercelToken);
    if (!fileRefs.length) return null;

    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectId,
        project: projectId,
        files: fileRefs,
        projectSettings: {
          framework: "vite",
          installCommand: "npm install",
          buildCommand: "vite build",
          outputDirectory: "dist",
        },
      }),
    });

    if (deployRes.ok) {
      const data = await deployRes.json();
      console.log("Production deploy:", `https://${data.url}`);
      return data;
    } else {
      console.error("Production deploy failed:", deployRes.status, await deployRes.text());
      return null;
    }
  } catch (e) {
    console.error("Production deploy error:", e);
    return null;
  }
}

async function uploadFilesToVercel(
  files: Record<string, string>, vercelToken: string
): Promise<Array<{ file: string; sha: string; size: number }>> {
  const fileRefs: Array<{ file: string; sha: string; size: number }> = [];

  for (const [path, content] of Object.entries(files)) {
    const encoded = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoded);
    const sha = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const uploadRes = await fetch("https://api.vercel.com/v2/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/octet-stream",
        "x-vercel-digest": sha,
        "Content-Length": String(encoded.byteLength),
      },
      body: encoded,
    });

    if (!uploadRes.ok && uploadRes.status !== 409) {
      await uploadRes.text();
      console.warn(`File upload failed for ${path}: ${uploadRes.status}`);
      continue;
    } else {
      await uploadRes.text();
    }

    fileRefs.push({ file: path, sha, size: encoded.byteLength });
  }

  return fileRefs;
}
