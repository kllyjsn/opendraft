import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * swarm-zip-auditor — Autonomous ZIP quality analyzer
 *
 * For each listing with a file_path:
 *  1. Downloads the ZIP from storage
 *  2. Extracts file tree + package.json
 *  3. Uses AI to generate a README and quality audit
 *  4. Stores results in improvement_cycles
 *
 * Input: { listing_id, file_path, seller_id }
 * Output: { readme, audit_report }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { listing_id, file_path, seller_id, title, description } = body;

    if (!listing_id || !file_path) {
      return new Response(JSON.stringify({ error: "listing_id and file_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Download ZIP from storage ──
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("listing-files")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("Failed to download ZIP:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download ZIP file" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Parse ZIP contents ──
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    const fileTree: string[] = [];
    let packageJson: any = null;
    let existingReadme = "";
    let securityMd = "";
    const sourceSnippets: { path: string; content: string }[] = [];

    for (const [path, file] of Object.entries(zip.files)) {
      if ((file as any).dir) continue;
      fileTree.push(path);

      const lowerPath = path.toLowerCase();

      // Extract key files
      if (lowerPath.endsWith("package.json") && !lowerPath.includes("node_modules")) {
        try {
          const content = await (file as any).async("string");
          packageJson = JSON.parse(content);
        } catch { /* skip malformed */ }
      }

      if (lowerPath.endsWith("readme.md") || lowerPath.endsWith("readme.txt")) {
        try {
          existingReadme = await (file as any).async("string");
        } catch { /* skip */ }
      }

      if (lowerPath.endsWith("security.md")) {
        try {
          securityMd = await (file as any).async("string");
        } catch { /* skip */ }
      }

      // Grab a few source files for context (max 5, max 2KB each)
      if (
        sourceSnippets.length < 5 &&
        (lowerPath.endsWith(".tsx") || lowerPath.endsWith(".ts") || lowerPath.endsWith(".jsx")) &&
        !lowerPath.includes("node_modules") &&
        !lowerPath.includes(".test.")
      ) {
        try {
          const content = await (file as any).async("string");
          sourceSnippets.push({ path, content: content.substring(0, 2000) });
        } catch { /* skip */ }
      }
    }

    // ── 3. Analyze dependencies ──
    const deps = packageJson
      ? { ...packageJson.dependencies, ...packageJson.devDependencies }
      : {};
    const depList = Object.entries(deps)
      .map(([name, version]) => `${name}@${version}`)
      .slice(0, 50);

    // ── 4. AI-powered README generation + quality audit ──
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a senior developer auditing an app template for a marketplace called OpenDraft. Your job is to:
1. Generate a professional README.md for the project
2. Audit the project for quality, security, and best practices

Be specific and actionable. Focus on real issues, not generic advice.`,
          },
          {
            role: "user",
            content: `Analyze this project and return a README + audit report.

**Listing:** ${title || "Unknown"}
**Description:** ${description || "No description"}
**File count:** ${fileTree.length}
**File tree (first 80):**
${fileTree.slice(0, 80).join("\n")}

**Dependencies (${depList.length}):**
${depList.join("\n")}

**Existing README:** ${existingReadme ? existingReadme.substring(0, 500) : "None"}
**Security.md:** ${securityMd ? "Present" : "Missing"}

**Source samples:**
${sourceSnippets.map((s) => `--- ${s.path} ---\n${s.content}`).join("\n\n")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_audit",
              description: "Submit the README and audit results",
              parameters: {
                type: "object",
                properties: {
                  readme_md: {
                    type: "string",
                    description: "Full generated README.md content in markdown",
                  },
                  quality_score: {
                    type: "number",
                    description: "Overall quality score 0-100",
                  },
                  audit_findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: {
                          type: "string",
                          enum: [
                            "security",
                            "dependencies",
                            "accessibility",
                            "performance",
                            "documentation",
                            "code_quality",
                          ],
                        },
                        severity: {
                          type: "string",
                          enum: ["info", "warning", "critical"],
                        },
                        finding: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["category", "severity", "finding", "recommendation"],
                    },
                  },
                  outdated_deps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        current: { type: "string" },
                        issue: { type: "string" },
                      },
                      required: ["name", "current", "issue"],
                    },
                  },
                  tech_stack_detected: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "readme_md",
                  "quality_score",
                  "audit_findings",
                  "outdated_deps",
                  "tech_stack_detected",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_audit" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI returned no audit data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audit = JSON.parse(toolCall.function.arguments);

    // ── 5. Store README in the ZIP (re-upload) ──
    if (audit.readme_md && audit.readme_md.length > 100) {
      try {
        zip.file("README.md", audit.readme_md);
        const updatedZip = await zip.generateAsync({ type: "uint8array" });
        await supabase.storage
          .from("listing-files")
          .upload(file_path, updatedZip, { contentType: "application/zip", upsert: true });
        console.log(`README injected into ZIP for listing ${listing_id}`);
      } catch (e) {
        console.error("Failed to inject README:", e);
      }
    }

    // ── 6. Update listing tech_stack if better data found ──
    if (audit.tech_stack_detected?.length > 0) {
      await supabase
        .from("listings")
        .update({
          tech_stack: audit.tech_stack_detected,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);
    }

    // ── 7. Store audit as improvement cycle ──
    await supabase.from("improvement_cycles").insert({
      listing_id,
      user_id: seller_id,
      trigger: "zip_audit",
      status: "completed",
      analysis: {
        quality_score: audit.quality_score,
        file_count: fileTree.length,
        dep_count: depList.length,
        has_readme: !!existingReadme || !!audit.readme_md,
        has_security_md: !!securityMd,
        outdated_deps: audit.outdated_deps,
      },
      suggestions: audit.audit_findings,
    });

    // ── 8. Notify seller ──
    const criticalCount = (audit.audit_findings || []).filter(
      (f: any) => f.severity === "critical"
    ).length;

    await supabase.from("notifications").insert({
      user_id: seller_id,
      type: "zip_audit",
      title: criticalCount > 0
        ? `⚠️ ${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} found in "${title}"`
        : `✅ Quality audit complete for "${title}"`,
      message: `Score: ${audit.quality_score}/100. ${audit.audit_findings?.length || 0} findings across security, deps, and code quality.${audit.readme_md ? " README auto-generated." : ""}`,
      link: `/listing/${listing_id}`,
    });

    // ── 9. Log swarm task ──
    await supabase.from("swarm_tasks").insert({
      agent_type: "zip_auditor",
      action: "audit_zip",
      status: "completed",
      input: { listing_id, file_count: fileTree.length, dep_count: depList.length },
      output: {
        quality_score: audit.quality_score,
        findings_count: audit.audit_findings?.length || 0,
        critical_count: criticalCount,
        readme_generated: !!audit.readme_md,
        tech_stack: audit.tech_stack_detected,
      },
      triggered_by: body.triggered_by || "auto_enrich",
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        quality_score: audit.quality_score,
        findings_count: audit.audit_findings?.length || 0,
        critical_count: criticalCount,
        readme_generated: !!audit.readme_md,
        tech_stack: audit.tech_stack_detected,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ZIP auditor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
