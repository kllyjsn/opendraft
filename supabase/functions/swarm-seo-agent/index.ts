import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await requireAdmin(req);
  if (authError) return authError;

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

    // Create task record
    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "seo_content",
      action,
      status: "running",
      input: body,
      triggered_by: body.triggered_by || "cron",
    }).select().single();

    const taskId = task?.id;

    try {
      // Step 1: Analyze current listings for SEO gaps
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, description, category, tech_stack")
        .eq("status", "live")
        .limit(50);

      // Step 2: Get demand signals for content ideas
      const { data: signals } = await supabase
        .from("agent_demand_signals")
        .select("query, category, tech_stack")
        .order("created_at", { ascending: false })
        .limit(20);

      const signalSummary = (signals || []).map(s => s.query).join(", ");
      const listingSummary = (listings || []).map(l => `${l.title} (${l.category})`).join("; ");

      // Step 3: Generate SEO content strategy with AI
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
              content: `You are an autonomous SEO & Content agent for OpenDraft, the #1 app store for AI agents. Your job is to generate actionable SEO improvements and content ideas that drive organic traffic and conversions. 

Current marketplace listings: ${listingSummary}
Recent unmet demand signals from agents: ${signalSummary}

Respond with a JSON object containing:
1. "blog_posts": Array of 3 blog post ideas with {title, slug, meta_description, outline, target_keywords[]}
2. "meta_improvements": Array of listing SEO fixes with {listing_title, issue, recommendation}
3. "content_gaps": Array of high-value pages we should create with {page_title, url_path, reason, estimated_traffic}
4. "keyword_opportunities": Array of {keyword, search_intent, difficulty, action}

Focus on keywords related to: AI marketplace, MCP servers, AI agents, app store for AI, buy AI apps, sell AI apps, vibe coding marketplace.`
            },
            {
              role: "user",
              content: action === "blog_ideas" 
                ? "Generate 5 blog post ideas optimized for SEO that will drive traffic to the marketplace."
                : action === "meta_audit"
                ? "Audit the current listings and suggest meta tag improvements."
                : "Run a full SEO cycle: blog ideas, meta audit, content gap analysis, and keyword opportunities."
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "seo_strategy",
              description: "Return structured SEO strategy",
              parameters: {
                type: "object",
                properties: {
                  blog_posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        slug: { type: "string" },
                        meta_description: { type: "string" },
                        outline: { type: "string" },
                        target_keywords: { type: "array", items: { type: "string" } }
                      },
                      required: ["title", "slug", "meta_description", "outline", "target_keywords"]
                    }
                  },
                  meta_improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        listing_title: { type: "string" },
                        issue: { type: "string" },
                        recommendation: { type: "string" }
                      },
                      required: ["listing_title", "issue", "recommendation"]
                    }
                  },
                  content_gaps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        page_title: { type: "string" },
                        url_path: { type: "string" },
                        reason: { type: "string" },
                        estimated_traffic: { type: "string" }
                      },
                      required: ["page_title", "url_path", "reason"]
                    }
                  },
                  keyword_opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword: { type: "string" },
                        search_intent: { type: "string" },
                        difficulty: { type: "string" },
                        action: { type: "string" }
                      },
                      required: ["keyword", "action"]
                    }
                  }
                },
                required: ["blog_posts", "meta_improvements", "content_gaps", "keyword_opportunities"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "seo_strategy" } }
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : { error: "No structured output" };

      // Update task as completed
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
    console.error("SEO agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
