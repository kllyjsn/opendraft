import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Takes approved improvement suggestions for a listing,
 * fetches the source code, uses AI to apply fixes,
 * packages updated code, uploads, and triggers redeploy.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { cycle_id, listing_id, user_id } = await req.json();

    if (!cycle_id || !listing_id) {
      return new Response(JSON.stringify({ error: "cycle_id and listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load cycle with approved suggestions
    const { data: cycle } = await supabase
      .from("improvement_cycles")
      .select("*")
      .eq("id", cycle_id)
      .single();

    if (!cycle) {
      return new Response(JSON.stringify({ error: "Cycle not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load approved changes
    const { data: approvedChanges } = await supabase
      .from("improvement_changes")
      .select("*")
      .eq("cycle_id", cycle_id)
      .eq("approved", true);

    if (!approvedChanges?.length) {
      return new Response(JSON.stringify({ error: "No approved changes to apply" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update cycle status
    await supabase.from("improvement_cycles")
      .update({ status: "applying" })
      .eq("id", cycle_id);

    // ── STEP 1: Load source code ──
    let sourceFiles: Record<string, string> = {};
    let hasSource = false;

    // Try ZIP from storage first
    if (listing.file_path) {
      try {
        const { data: fileData } = await supabase.storage
          .from("listing-files")
          .download(listing.file_path);

        if (fileData) {
          const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
          const entries = Object.entries(zip.files);

          let rootPrefix = "";
          const dirs = entries.filter(([, f]) => f.dir).map(([n]) => n);
          if (dirs.length > 0) {
            const firstDir = dirs[0];
            if (entries.every(([n]) => n.startsWith(firstDir))) rootPrefix = firstDir;
          }

          for (const [path, file] of entries) {
            if (file.dir) continue;
            const cleanPath = rootPrefix ? path.replace(rootPrefix, "") : path;
            if (!cleanPath) continue;
            if (/\.(tsx?|jsx?|css|html|json|md|yaml|toml|svg)$/i.test(cleanPath)) {
              try {
                sourceFiles[cleanPath] = await file.async("string");
              } catch { /* skip binary */ }
            }
          }
          hasSource = Object.keys(sourceFiles).length > 0;
          console.log("Loaded", Object.keys(sourceFiles).length, "files from ZIP");
        }
      } catch (e) {
        console.error("Failed to load ZIP source:", e);
      }
    }

    // Fall back to GitHub
    if (!hasSource && listing.github_url) {
      try {
        const ghMatch = listing.github_url.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
        if (ghMatch) {
          const [, owner, repo] = ghMatch;
          const repoName = repo.replace(/\.git$/, "");

          // Fetch file tree
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

            const fileResults = await Promise.allSettled(
              srcFiles.map(async (f: any) => {
                const resp = await fetch(
                  `https://api.github.com/repos/${owner}/${repoName}/contents/${f.path}`,
                  { headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "OpenDraft-Fixer" } }
                );
                if (resp.ok) return { path: f.path, content: await resp.text() };
                return null;
              })
            );

            for (const r of fileResults) {
              if (r.status === "fulfilled" && r.value) {
                sourceFiles[r.value.path] = r.value.content;
              }
            }
            hasSource = Object.keys(sourceFiles).length > 0;
            console.log("Loaded", Object.keys(sourceFiles).length, "files from GitHub");
          }
        }
      } catch (e) {
        console.error("Failed to load GitHub source:", e);
      }
    }

    if (!hasSource) {
      await supabase.from("improvement_cycles")
        .update({ status: "failed" })
        .eq("id", cycle_id);

      return new Response(JSON.stringify({ error: "No source code available. Upload a ZIP or connect a GitHub repo to enable auto-fixes." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 2: Build source context for AI ──
    const sortedFiles = Object.entries(sourceFiles)
      .sort(([a], [b]) => {
        const priority = (p: string) => {
          if (p.includes("App.tsx") || p.includes("App.jsx")) return 0;
          if (p.includes("main.tsx")) return 1;
          if (p.includes("index.css")) return 2;
          if (p.includes("package.json")) return 3;
          if (p.endsWith(".tsx") || p.endsWith(".jsx")) return 4;
          return 5;
        };
        return priority(a) - priority(b);
      });

    const sourceContext = sortedFiles
      .slice(0, 35)
      .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 4000)}`)
      .join("\n\n");

    // Build fix instructions from approved changes
    const fixInstructions = approvedChanges
      .map((c, i) => `${i + 1}. [${c.file_path}] ${c.description}\n   Implementation: ${c.code}`)
      .join("\n\n");

    // ── STEP 3: AI generates patched files ──
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
          {
            role: "user",
            content: `Here is the current source code:\n\n${sourceContext}\n\nApply all ${approvedChanges.length} approved fixes and return the modified files.`
          }
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output from AI");

    const result = JSON.parse(toolCall.function.arguments);
    const { summary, files: modifiedFiles } = result;

    console.log("AI generated", modifiedFiles.length, "modified files. Summary:", summary);

    // ── STEP 4: Merge changes into full project and package ──
    const mergedFiles = { ...sourceFiles };
    for (const file of modifiedFiles) {
      mergedFiles[file.path] = file.content;
    }

    const zip = new JSZip();
    for (const [path, content] of Object.entries(mergedFiles)) {
      zip.file(path, content);
    }
    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    // Upload new ZIP
    const sellerId = user_id || listing.seller_id;
    const zipPath = `${sellerId}/healed-${listing_id}-${Date.now()}.zip`;
    const { error: uploadErr } = await supabase.storage
      .from("listing-files")
      .upload(zipPath, zipBlob, { contentType: "application/zip", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    // Update listing with new file path
    await supabase.from("listings")
      .update({ file_path: zipPath, updated_at: new Date().toISOString() })
      .eq("id", listing_id);

    // Mark changes as applied
    for (const change of approvedChanges) {
      await supabase.from("improvement_changes")
        .update({ applied_at: new Date().toISOString() })
        .eq("id", change.id);
    }

    // Update cycle status
    await supabase.from("improvement_cycles")
      .update({ status: "applied", analysis: { ...cycle.analysis, apply_summary: summary } })
      .eq("id", cycle_id);

    // ── STEP 5: Trigger redeploy ──
    let deployResult = null;
    const { data: deployedSite } = await supabase
      .from("deployed_sites")
      .select("*")
      .eq("listing_id", listing_id)
      .in("status", ["healthy", "degraded"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (deployedSite) {
      try {
        const deployResp = await fetch(`${SUPABASE_URL}/functions/v1/deploy-to-opendraft`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ listing_id, user_id: sellerId }),
        });

        if (deployResp.ok) {
          deployResult = await deployResp.json();
          console.log("Redeploy triggered:", deployResult);
        } else {
          console.error("Redeploy failed:", await deployResp.text());
        }
      } catch (e) {
        console.error("Redeploy error:", e);
      }
    }

    // Notify user
    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "fixes_applied",
      title: `Fixes applied & deployed! 🔧✅`,
      message: `${modifiedFiles.length} files updated for "${listing.title}": ${summary.slice(0, 100)}`,
      link: `/dashboard?tab=improvements`,
    });

    // Log to swarm_tasks
    await supabase.from("swarm_tasks").insert({
      agent_type: "apply_fixes",
      action: "apply_and_deploy",
      status: "completed",
      input: { cycle_id, listing_id, approved_count: approvedChanges.length },
      output: { modified_files: modifiedFiles.length, summary, deployed: !!deployResult },
      triggered_by: "user",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      modified_files: modifiedFiles.length,
      summary,
      deployed: !!deployResult,
      zip_path: zipPath,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Apply fixes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
