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

    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "product_improvement",
      action,
      status: "running",
      input: body,
      triggered_by: body.triggered_by || "manual",
    }).select().single();

    const taskId = task?.id;

    try {
      // Gather platform data
      const [listingsRes, signalsRes, purchasesRes, viewsRes] = await Promise.all([
        supabase.from("listings").select("id, title, description, category, tech_stack, screenshots, demo_url, price, pricing_type, completeness_badge, view_count, sales_count").eq("status", "live").limit(50),
        supabase.from("agent_demand_signals").select("query, category, tech_stack, max_price").order("created_at", { ascending: false }).limit(30),
        supabase.from("purchases").select("listing_id, amount_paid").limit(100),
        supabase.from("agent_listing_views").select("listing_id, action").limit(200),
      ]);

      const listings = listingsRes.data || [];
      const signals = signalsRes.data || [];
      const purchases = purchasesRes.data || [];
      const agentViews = viewsRes.data || [];

      // Compute conversion metrics
      const listingStats = listings.map(l => {
        const views = l.view_count || 0;
        const sales = l.sales_count || 0;
        const agentInteractions = agentViews.filter(v => v.listing_id === l.id).length;
        return {
          title: l.title,
          category: l.category,
          price: l.price,
          pricing_type: l.pricing_type,
          completeness: l.completeness_badge,
          hasScreenshots: (l.screenshots?.length || 0) > 0,
          hasDemo: !!l.demo_url,
          views,
          sales,
          agentInteractions,
          conversionRate: views > 0 ? ((sales / views) * 100).toFixed(1) + "%" : "N/A",
          descriptionLength: l.description?.length || 0,
        };
      });

      const unmetDemand = signals.map(s => `"${s.query}" (${s.category || "any"}, max $${s.max_price || "?"})` ).join("; ");

      const prompt = action === "listing_quality"
        ? "Analyze each listing for quality issues: missing screenshots, weak descriptions (<100 chars), no demo URL, poor pricing. Rank by severity."
        : action === "seo_gaps"
        ? "Identify SEO issues: missing meta potential, poor titles, keyword gaps in descriptions, pages that should exist but don't."
        : action === "conversion_funnel"
        ? "Analyze the conversion funnel: which listings have high views but low sales? What friction points exist? Suggest A/B tests."
        : action === "feature_gaps"
        ? "Compare against competitor marketplaces and agent demand signals. What features/categories are missing? What should we build?"
        : "Run a comprehensive product audit covering listing quality, SEO, conversion optimization, and feature gaps.";

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
              content: `You are a Product Improvement agent for OpenDraft, the #1 app store for AI agents. Analyze marketplace data and produce specific, actionable improvement suggestions that can be implemented as code changes or data updates.

Platform stats:
- ${listings.length} live listings
- ${purchases.length} total purchases
- ${agentViews.length} agent interactions

Listing analytics:
${JSON.stringify(listingStats, null, 2)}

Unmet demand signals: ${unmetDemand}

For each suggestion, include a clear "implementation" field describing what code/SQL/data change is needed. Be specific — reference actual listing titles, real numbers, concrete fixes.`
            },
            { role: "user", content: prompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "product_suggestions",
              description: "Return structured product improvement suggestions",
              parameters: {
                type: "object",
                properties: {
                  listing_quality: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        listing_title: { type: "string" },
                        issue: { type: "string" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        suggestion: { type: "string" },
                        implementation: { type: "string" }
                      },
                      required: ["listing_title", "issue", "severity", "suggestion", "implementation"]
                    }
                  },
                  seo_gaps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        page_or_listing: { type: "string" },
                        gap: { type: "string" },
                        fix: { type: "string" },
                        implementation: { type: "string" },
                        estimated_impact: { type: "string" }
                      },
                      required: ["page_or_listing", "gap", "fix", "implementation"]
                    }
                  },
                  conversion_improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string" },
                        current_metric: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        implementation: { type: "string" },
                        expected_lift: { type: "string" }
                      },
                      required: ["area", "issue", "suggestion", "implementation"]
                    }
                  },
                  feature_gaps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        feature: { type: "string" },
                        rationale: { type: "string" },
                        priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        implementation: { type: "string" },
                        effort: { type: "string", enum: ["small", "medium", "large"] }
                      },
                      required: ["feature", "rationale", "priority", "implementation", "effort"]
                    }
                  }
                },
                required: ["listing_quality", "seo_gaps", "conversion_improvements", "feature_gaps"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "product_suggestions" } }
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
    console.error("Product improvement agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
