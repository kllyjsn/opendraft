import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full_cycle";

    // Create task record
    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "outreach_growth",
      action,
      status: "running",
      input: body,
      triggered_by: body.triggered_by || "cron",
    }).select().single();

    const taskId = task?.id;

    try {
      // Step 1: Discover directories and registries using Firecrawl
      let discoveredDirectories: any[] = [];
      
      if (FIRECRAWL_API_KEY) {
        const searchQueries = [
          "AI agent marketplace directory submit",
          "MCP server registry list",
          "AI tools directory submission",
          "developer tools marketplace listing",
          "SaaS directory submit your product",
        ];

        // Search for directories (pick 2 random queries to stay within rate limits)
        const selectedQueries = searchQueries.sort(() => Math.random() - 0.5).slice(0, 2);
        
        for (const query of selectedQueries) {
          try {
            const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ query, limit: 5 }),
            });

            if (searchResp.ok) {
              const searchData = await searchResp.json();
              if (searchData.data) {
                discoveredDirectories.push(...searchData.data.map((d: any) => ({
                  url: d.url,
                  title: d.title,
                  description: d.description,
                  source_query: query,
                })));
              }
            }
          } catch (e) {
            console.warn(`Firecrawl search failed for "${query}":`, e);
          }
        }
      }

      // Step 2: Get current marketplace stats for outreach context
      const { count: listingCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "live");

      const { count: builderCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: agentViewCount } = await supabase
        .from("agent_listing_views")
        .select("*", { count: "exact", head: true });

      // Step 3: AI generates outreach strategy
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
              content: `You are an autonomous Outreach & Growth agent for OpenDraft (opendraft.co), the #1 app store for AI agents. 

Platform stats: ${listingCount || 0} live listings, ${builderCount || 0} builders, ${agentViewCount || 0} agent interactions.

OpenDraft has:
- 26-tool MCP server at https://api.opendraft.co/mcp
- REST API at https://api.opendraft.co/v1
- OpenClaw skill at https://opendraft.co/.well-known/skill.yaml
- Smithery listing at https://opendraft.co/.well-known/smithery.yaml

Discovered directories from web search:
${JSON.stringify(discoveredDirectories.slice(0, 10), null, 2)}

Generate a structured outreach plan.`
            },
            {
              role: "user",
              content: action === "find_directories"
                ? "Find and evaluate new directories and registries to submit OpenDraft to."
                : action === "craft_submissions"
                ? "Draft submission copy for the top 5 most impactful directories."
                : "Run full outreach cycle: discover directories, prioritize by impact, draft submissions, and suggest partnerships."
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "outreach_plan",
              description: "Return structured outreach strategy",
              parameters: {
                type: "object",
                properties: {
                  directories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        url: { type: "string" },
                        category: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        submission_type: { type: "string" },
                        estimated_impact: { type: "string" },
                        status: { type: "string", enum: ["discovered", "ready_to_submit", "submitted", "listed"] }
                      },
                      required: ["name", "url", "priority", "status"]
                    }
                  },
                  submissions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        directory_name: { type: "string" },
                        title: { type: "string" },
                        tagline: { type: "string" },
                        description: { type: "string" },
                        categories: { type: "array", items: { type: "string" } }
                      },
                      required: ["directory_name", "title", "description"]
                    }
                  },
                  partnerships: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        partner_name: { type: "string" },
                        partner_type: { type: "string" },
                        opportunity: { type: "string" },
                        action_item: { type: "string" }
                      },
                      required: ["partner_name", "opportunity", "action_item"]
                    }
                  },
                  growth_tactics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tactic: { type: "string" },
                        channel: { type: "string" },
                        effort: { type: "string", enum: ["low", "medium", "high"] },
                        expected_result: { type: "string" }
                      },
                      required: ["tactic", "channel", "expected_result"]
                    }
                  }
                },
                required: ["directories", "submissions", "partnerships", "growth_tactics"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "outreach_plan" } }
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : { error: "No structured output" };

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
    console.error("Outreach agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
