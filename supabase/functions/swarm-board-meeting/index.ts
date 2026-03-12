import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DIRECTORS = {
  ceo: {
    title: "Chief Executive Officer",
    focus: "Overall strategy, growth trajectory, competitive positioning, and company vision",
    systemPrompt: `You are the CEO of OpenDraft, an AI-powered marketplace for buying and selling web application templates and tools. You think like a world-class startup CEO (think Brian Chesky, Stewart Butterfield).

Your focus areas:
- Overall business strategy and vision alignment
- Growth trajectory analysis (user growth, GMV growth, market penetration)
- Competitive positioning vs ThemeForest, Gumroad, Lemon Squeezy, etc.
- Strategic partnerships and ecosystem development
- Agent-driven commerce strategy (MCP/API marketplace)
- Company culture and team scaling decisions

Analyze the data provided and give SPECIFIC, ACTIONABLE strategic recommendations. No generic advice. Reference actual numbers.`,
  },
  cfo: {
    title: "Chief Financial Officer",
    focus: "Revenue optimization, unit economics, pricing strategy, and financial health",
    systemPrompt: `You are the CFO of OpenDraft, an AI-powered marketplace. You think like a world-class startup CFO (think Ruth Porat, Sarah Friar).

Your focus areas:
- Revenue analysis and growth rate
- Unit economics (CAC, LTV, take rate optimization)
- Pricing strategy optimization (are listings priced right? Should platform fees change?)
- Payout efficiency and Stripe Connect health
- Cash flow and runway projections
- Revenue diversification (one-time vs monthly, bounties, premium features)

Analyze the financial data and give SPECIFIC recommendations with projected revenue impact. Show the math.`,
  },
  cmo: {
    title: "Chief Marketing Officer",
    focus: "User acquisition, brand positioning, conversion optimization, and growth marketing",
    systemPrompt: `You are the CMO of OpenDraft, an AI-powered marketplace. You think like a world-class growth marketer (think Sean Ellis, Emily Kramer).

Your focus areas:
- User acquisition channels and efficiency
- Conversion funnel analysis (visit → signup → list → sell)
- SEO performance and content strategy
- Brand positioning and differentiation
- Community building and viral loops
- Agent/developer marketing (MCP ecosystem, developer relations)
- Social proof and trust signals

Analyze the marketing data and give SPECIFIC, ACTIONABLE campaigns with expected ROI. Include specific channel tactics.`,
  },
  cto: {
    title: "Chief Technology Officer",
    focus: "Technical architecture, platform reliability, security, and engineering priorities",
    systemPrompt: `You are the CTO of OpenDraft, built on React + Vite + Tailwind + Supabase. You think like a world-class startup CTO (think Werner Vogels, Kelsey Hightower).

Your focus areas:
- Platform reliability and performance
- Security posture (RLS policies, API key management, edge function security)
- Technical debt and architecture improvements
- Edge function health and latency
- MCP server and API infrastructure
- Developer experience (build times, deploy pipeline, testing)
- Scalability bottlenecks

Analyze the technical data and give SPECIFIC engineering priorities with effort estimates and risk levels.`,
  },
  cpo: {
    title: "Chief Product Officer",
    focus: "Product-market fit, feature prioritization, user experience, and roadmap",
    systemPrompt: `You are the CPO of OpenDraft, an AI-powered marketplace. You think like a world-class product leader (think Shreyas Doshi, Lenny Rachitsky).

Your focus areas:
- Product-market fit signals (retention, NPS proxies, power user behavior)
- Feature prioritization using ICE/RICE scoring
- User experience friction points
- Listing quality and discovery optimization
- Agent experience (MCP server usability, API ergonomics)
- Marketplace dynamics (supply vs demand balance, liquidity)
- Bounty system effectiveness

Analyze the product data and give SPECIFIC feature recommendations with ICE scores and user impact.`,
  },
};

async function gatherPlatformData(supabase: any) {
  const [
    { count: totalListings },
    { count: liveListings },
    { count: totalPurchases },
    { count: totalProfiles },
    { data: recentListings },
    { data: recentPurchases },
    { data: topListings },
    { count: totalBounties },
    { count: openBounties },
    { data: pricingBreakdown },
    { data: categoryBreakdown },
    { data: recentActivity },
    { count: totalOffers },
    { data: agentDemand },
    { count: agentViews },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("purchases").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("id,title,price,pricing_type,category,sales_count,view_count,completeness_badge,created_at,tech_stack,built_with").eq("status", "live").order("created_at", { ascending: false }).limit(20),
    supabase.from("purchases").select("amount_paid,platform_fee,seller_amount,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("listings").select("id,title,price,sales_count,view_count,category").eq("status", "live").order("sales_count", { ascending: false }).limit(10),
    supabase.from("bounties").select("*", { count: "exact", head: true }),
    supabase.from("bounties").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("listings").select("price,pricing_type,category").eq("status", "live"),
    supabase.from("listings").select("category").eq("status", "live"),
    supabase.from("activity_log").select("event_type,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("offers").select("*", { count: "exact", head: true }),
    supabase.from("agent_demand_signals").select("query,category,max_price,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("agent_listing_views").select("*", { count: "exact", head: true }),
  ]);

  // Compute metrics
  const totalRevenue = (recentPurchases || []).reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);
  const totalPlatformFees = (recentPurchases || []).reduce((sum: number, p: any) => sum + (p.platform_fee || 0), 0);
  const avgPrice = pricingBreakdown?.length ? Math.round(pricingBreakdown.reduce((s: number, l: any) => s + l.price, 0) / pricingBreakdown.length) : 0;
  const monthlyCount = pricingBreakdown?.filter((l: any) => l.pricing_type === "monthly").length || 0;
  const oneTimeCount = pricingBreakdown?.filter((l: any) => l.pricing_type === "one_time").length || 0;

  const categories: Record<string, number> = {};
  (categoryBreakdown || []).forEach((l: any) => { categories[l.category] = (categories[l.category] || 0) + 1; });

  const conversionRate = totalProfiles && totalPurchases ? ((totalPurchases / totalProfiles) * 100).toFixed(1) : "0";
  const listingConversion = totalListings && totalPurchases ? ((totalPurchases / totalListings) * 100).toFixed(1) : "0";

  return {
    overview: {
      total_listings: totalListings || 0,
      live_listings: liveListings || 0,
      total_purchases: totalPurchases || 0,
      total_users: totalProfiles || 0,
      total_bounties: totalBounties || 0,
      open_bounties: openBounties || 0,
      total_offers: totalOffers || 0,
      agent_views: agentViews || 0,
    },
    financial: {
      total_revenue_cents: totalRevenue,
      total_platform_fees_cents: totalPlatformFees,
      avg_listing_price_cents: avgPrice,
      monthly_subscriptions: monthlyCount,
      one_time_purchases: oneTimeCount,
      conversion_rate_pct: conversionRate,
      listing_conversion_pct: listingConversion,
    },
    categories,
    recent_listings: (recentListings || []).slice(0, 10),
    top_performing: topListings || [],
    agent_demand: agentDemand || [],
    recent_activity_types: (() => {
      const types: Record<string, number> = {};
      (recentActivity || []).forEach((a: any) => { types[a.event_type] = (types[a.event_type] || 0) + 1; });
      return types;
    })(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Admin-only access
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
    const { directors: requestedDirectors, include_synthesis } = body;
    const directorsToRun = requestedDirectors || Object.keys(DIRECTORS);

    // Create the board meeting task
    const { data: meetingTask } = await supabase.from("swarm_tasks").insert({
      agent_type: "board_meeting",
      action: "convene",
      status: "running",
      input: { directors: directorsToRun, include_synthesis },
      triggered_by: "manual",
    }).select().single();

    const meetingId = meetingTask?.id;

    try {
      // Gather real platform data
      const platformData = await gatherPlatformData(supabase);

      const directorResults: Record<string, any> = {};

      // Run each director agent
      for (const dirKey of directorsToRun) {
        const director = DIRECTORS[dirKey as keyof typeof DIRECTORS];
        if (!director) continue;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: director.systemPrompt },
              {
                role: "user",
                content: `Here is the current state of our marketplace platform. Analyze this data and provide your board-level recommendations.\n\n${JSON.stringify(platformData, null, 2)}\n\nProvide your analysis and top 3-5 actionable recommendations, each with expected impact and priority.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "board_recommendation",
                description: "Provide structured board-level recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    health_assessment: {
                      type: "string",
                      enum: ["critical", "needs_attention", "healthy", "thriving"],
                      description: "Overall health in this director's domain",
                    },
                    headline: {
                      type: "string",
                      description: "One-line executive summary (max 100 chars)",
                    },
                    key_metrics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          metric: { type: "string" },
                          value: { type: "string" },
                          trend: { type: "string", enum: ["up", "down", "flat", "unknown"] },
                          assessment: { type: "string", enum: ["good", "warning", "critical"] },
                        },
                        required: ["metric", "value", "trend", "assessment"],
                      },
                      description: "3-5 key metrics for this domain",
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          priority: { type: "string", enum: ["P0", "P1", "P2"] },
                          effort: { type: "string", enum: ["low", "medium", "high"] },
                          expected_impact: { type: "string" },
                          implementation: { type: "string", description: "Specific implementation steps" },
                        },
                        required: ["title", "description", "priority", "effort", "expected_impact", "implementation"],
                      },
                    },
                    risks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          risk: { type: "string" },
                          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                          mitigation: { type: "string" },
                        },
                        required: ["risk", "severity", "mitigation"],
                      },
                    },
                  },
                  required: ["health_assessment", "headline", "key_metrics", "recommendations", "risks"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "board_recommendation" } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          directorResults[dirKey] = { error: `AI error ${aiResponse.status}: ${errText.slice(0, 200)}` };
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        directorResults[dirKey] = toolCall
          ? JSON.parse(toolCall.function.arguments)
          : { error: "No structured output from AI" };
      }

      // Synthesis: Have the "board" produce a unified action plan
      let synthesis = null;
      if (include_synthesis !== false) {
        const synthResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `You are the Board Secretary synthesizing a board meeting for OpenDraft, an AI-powered marketplace. Each C-suite executive has provided their analysis. Your job is to:
1. Identify the TOP 5 cross-functional initiatives that multiple directors agree on
2. Flag any conflicts between director recommendations
3. Create a prioritized 30-60-90 day action plan
4. Highlight the single most critical decision the company must make NOW

Be decisive. No hedging. This is a board resolution, not a brainstorm.`,
              },
              {
                role: "user",
                content: `Here are the individual director analyses:\n\n${JSON.stringify(directorResults, null, 2)}\n\nSynthesize these into a unified board resolution.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "board_resolution",
                description: "Produce the unified board resolution and action plan",
                parameters: {
                  type: "object",
                  properties: {
                    overall_health: {
                      type: "string",
                      enum: ["critical", "needs_attention", "healthy", "thriving"],
                    },
                    executive_summary: { type: "string", description: "3-sentence board summary" },
                    critical_decision: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        recommendation: { type: "string" },
                        rationale: { type: "string" },
                      },
                      required: ["question", "recommendation", "rationale"],
                    },
                    unified_initiatives: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          owners: { type: "array", items: { type: "string" }, description: "Which directors champion this" },
                          priority: { type: "string", enum: ["P0", "P1", "P2"] },
                          timeline: { type: "string", enum: ["30_days", "60_days", "90_days"] },
                          expected_revenue_impact: { type: "string" },
                          implementation: { type: "string" },
                        },
                        required: ["title", "description", "owners", "priority", "timeline", "expected_revenue_impact", "implementation"],
                      },
                    },
                    conflicts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          issue: { type: "string" },
                          positions: { type: "string" },
                          resolution: { type: "string" },
                        },
                        required: ["issue", "positions", "resolution"],
                      },
                    },
                    kpis_to_track: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          metric: { type: "string" },
                          current: { type: "string" },
                          target_30d: { type: "string" },
                          target_90d: { type: "string" },
                        },
                        required: ["metric", "current", "target_30d", "target_90d"],
                      },
                    },
                  },
                  required: ["overall_health", "executive_summary", "critical_decision", "unified_initiatives", "conflicts", "kpis_to_track"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "board_resolution" } },
          }),
        });

        if (synthResponse.ok) {
          const synthData = await synthResponse.json();
          const synthToolCall = synthData.choices?.[0]?.message?.tool_calls?.[0];
          synthesis = synthToolCall ? JSON.parse(synthToolCall.function.arguments) : null;
        }
      }

      const output = {
        directors: directorResults,
        synthesis,
        platform_snapshot: {
          total_listings: platformData.overview.total_listings,
          live_listings: platformData.overview.live_listings,
          total_users: platformData.overview.total_users,
          total_purchases: platformData.overview.total_purchases,
          total_revenue_cents: platformData.financial.total_revenue_cents,
        },
        convened_at: new Date().toISOString(),
      };

      await supabase.from("swarm_tasks").update({
        status: "completed",
        output,
        completed_at: new Date().toISOString(),
      }).eq("id", meetingId);

      return new Response(JSON.stringify({ success: true, task_id: meetingId, result: output }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (agentError) {
      await supabase.from("swarm_tasks").update({
        status: "failed",
        error: agentError instanceof Error ? agentError.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("id", meetingId);
      throw agentError;
    }

  } catch (e) {
    console.error("Board meeting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
