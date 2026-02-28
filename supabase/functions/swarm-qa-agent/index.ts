import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full_cycle";

    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "qa_testing",
      action,
      status: "running",
      input: body,
      triggered_by: body.triggered_by || "manual",
    }).select().single();

    const taskId = task?.id;

    try {
      const checks: Record<string, any> = {};

      // 1. Listing integrity checks
      if (action === "full_cycle" || action === "listing_integrity") {
        const { data: allListings } = await supabase
          .from("listings")
          .select("id, title, file_path, screenshots, description, status, seller_id")
          .eq("status", "live")
          .limit(100);

        const integrityIssues: any[] = [];
        for (const listing of (allListings || [])) {
          const issues: string[] = [];
          if (!listing.file_path) issues.push("missing_file");
          if (!listing.screenshots || listing.screenshots.length === 0) issues.push("no_screenshots");
          if (!listing.description || listing.description.length < 20) issues.push("weak_description");
          if (!listing.seller_id) issues.push("orphan_listing");

          // Check if file actually exists in storage
          if (listing.file_path) {
            const { data: fileCheck } = await supabase.storage
              .from("listing-files")
              .list(listing.file_path.split("/").slice(0, -1).join("/"), {
                limit: 1,
                search: listing.file_path.split("/").pop(),
              });
            if (!fileCheck || fileCheck.length === 0) {
              issues.push("file_not_found_in_storage");
            }
          }

          if (issues.length > 0) {
            integrityIssues.push({
              listing_id: listing.id,
              listing_title: listing.title,
              issues,
              status: listing.status,
            });
          }
        }
        checks.listing_integrity = {
          total_checked: allListings?.length || 0,
          issues_found: integrityIssues.length,
          issues: integrityIssues,
        };
      }

      // 2. Edge function health checks
      if (action === "full_cycle" || action === "edge_function_health") {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

        const functions = [
          "get-products",
          "sitemap",
          "og-image",
          "match-listings",
          "api",
        ];

        const healthResults: any[] = [];
        for (const fn of functions) {
          const start = Date.now();
          try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
              method: fn === "get-products" || fn === "match-listings" ? "POST" : "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: fn === "get-products" ? JSON.stringify({}) : fn === "match-listings" ? JSON.stringify({ query: "test" }) : undefined,
            });
            const latency = Date.now() - start;
            healthResults.push({
              function: fn,
              status: res.status,
              healthy: res.status < 500,
              latency_ms: latency,
            });
          } catch (e) {
            healthResults.push({
              function: fn,
              status: 0,
              healthy: false,
              latency_ms: Date.now() - start,
              error: e instanceof Error ? e.message : "Unknown",
            });
          }
        }
        checks.edge_function_health = {
          total_checked: functions.length,
          healthy: healthResults.filter(r => r.healthy).length,
          unhealthy: healthResults.filter(r => !r.healthy).length,
          results: healthResults,
        };
      }

      // 3. Deploy pipeline checks
      if (action === "full_cycle" || action === "deploy_pipelines") {
        // Check recent deploy activity
        const { data: recentDeploys } = await supabase
          .from("activity_log")
          .select("event_data, created_at")
          .eq("event_type", "netlify_deploy")
          .order("created_at", { ascending: false })
          .limit(10);

        const { data: recentVercelDeploys } = await supabase
          .from("activity_log")
          .select("event_data, created_at")
          .eq("event_type", "vercel_deploy")
          .order("created_at", { ascending: false })
          .limit(10);

        // Check listings with files that could be deployed
        const { data: deployableListings } = await supabase
          .from("listings")
          .select("id, title, file_path")
          .eq("status", "live")
          .not("file_path", "is", null)
          .limit(20);

        checks.deploy_pipelines = {
          recent_netlify_deploys: (recentDeploys || []).length,
          recent_vercel_deploys: (recentVercelDeploys || []).length,
          deployable_listings: (deployableListings || []).length,
          last_netlify: recentDeploys?.[0]?.created_at || null,
          last_vercel: recentVercelDeploys?.[0]?.created_at || null,
          deploys: (recentDeploys || []).map(d => ({
            date: d.created_at,
            state: (d.event_data as any)?.deploy_state || "unknown",
            listing_id: (d.event_data as any)?.listing_id,
          })),
        };
      }

      // 4. Auth & permissions checks
      if (action === "full_cycle" || action === "auth_permissions") {
        // Check for profiles without matching auth (orphans)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, created_at")
          .limit(100);

        // Check for admin roles
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("role", "admin");

        checks.auth_permissions = {
          total_profiles: (profiles || []).length,
          admin_count: (adminRoles || []).length,
          admin_user_ids: (adminRoles || []).map(r => r.user_id),
        };
      }

      // Now use AI to analyze findings and produce recommendations
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a QA Testing agent for OpenDraft. Analyze these automated test results and produce actionable findings with severity levels and implementation fixes.

Test results:
${JSON.stringify(checks, null, 2)}`
            },
            { role: "user", content: "Analyze these QA results. Identify critical issues, rank by severity, and provide specific implementation fixes (code changes, SQL updates, or config changes) for each." }
          ],
          tools: [{
            type: "function",
            function: {
              name: "qa_report",
              description: "Return structured QA findings",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "object",
                    properties: {
                      health_score: { type: "number", description: "0-100 overall health score" },
                      critical_count: { type: "integer" },
                      warning_count: { type: "integer" },
                      passed_count: { type: "integer" }
                    },
                    required: ["health_score", "critical_count", "warning_count", "passed_count"]
                  },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["listing_integrity", "edge_functions", "deploy_pipelines", "auth_permissions"] },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low", "pass"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        affected_items: { type: "string" },
                        implementation: { type: "string" }
                      },
                      required: ["category", "severity", "title", "description", "implementation"]
                    }
                  }
                },
                required: ["summary", "findings"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "qa_report" } }
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : { error: "No structured output" };

      // Merge raw checks into result
      result.raw_checks = checks;

      await supabase.from("swarm_tasks").update({
        status: "completed",
        output: result,
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);

      return new Response(JSON.stringify({ success: true, task_id: taskId, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (agentError) {
      await supabase.from("swarm_tasks").update({
        status: "failed",
        error: agentError instanceof Error ? agentError.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);
      throw agentError;
    }

  } catch (e) {
    console.error("QA agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
