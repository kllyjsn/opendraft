import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth — admin only
    const authHeader = req.headers.get("Authorization");
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) userId = user.id;
    }
    if (!userId) throw new Error("Authentication required");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await sb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Unauthorized — admin only");

    // ── 1. Gather internal demand signals ──
    const { data: searchLogs } = await sb
      .from("activity_log")
      .select("event_type, event_data, created_at")
      .in("event_type", ["search", "magic_import", "ai_search", "page_view"])
      .order("created_at", { ascending: false })
      .limit(200);

    // Extract search queries
    const searches: { query: string; count: number; latest: string }[] = [];
    const queryMap = new Map<string, { count: number; latest: string }>();
    for (const log of searchLogs || []) {
      const d = log.event_data as Record<string, unknown> | null;
      const q = String(d?.query || d?.prompt || d?.url || "").trim().toLowerCase();
      if (!q || q.length < 3) continue;
      const existing = queryMap.get(q);
      if (existing) {
        existing.count++;
        if (log.created_at > existing.latest) existing.latest = log.created_at;
      } else {
        queryMap.set(q, { count: 1, latest: log.created_at });
      }
    }
    for (const [query, data] of queryMap) {
      searches.push({ query, ...data });
    }
    searches.sort((a, b) => b.count - a.count);

    // ── 2. Open bounties = explicit demand ──
    const { data: bounties } = await sb
      .from("bounties")
      .select("title, description, budget, category, tech_stack, submissions_count")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20);

    // ── 3. Current supply snapshot ──
    const { data: listings } = await sb
      .from("listings")
      .select("title, category, tech_stack, sales_count, view_count, price")
      .eq("status", "live")
      .order("view_count", { ascending: false })
      .limit(100);

    // Category distribution
    const categoryCount: Record<string, number> = {};
    for (const l of listings || []) {
      categoryCount[l.category] = (categoryCount[l.category] || 0) + 1;
    }

    // High-demand (many views, few sales) = opportunity
    const highDemandLowSupply = (listings || [])
      .filter(l => (l.view_count || 0) > 10 && (l.sales_count || 0) <= 1)
      .slice(0, 10)
      .map(l => ({ title: l.title, views: l.view_count, sales: l.sales_count }));

    // ── 4. AI analysis ──
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a market analyst for OpenDraft, a marketplace where developers buy and sell vibe-coded apps & templates. Analyze the provided demand signals and supply data to identify:
1. Unmet demand — what people are searching for but can't find
2. Market gaps — categories or niches with high interest but low supply
3. Pricing insights — where pricing could be optimized
4. Actionable recommendations — specific products to build next

Be data-driven, specific, and actionable. Reference actual search terms and numbers.`,
          },
          {
            role: "user",
            content: `Analyze this marketplace data:

TOP SEARCH QUERIES (what people are looking for):
${searches.slice(0, 25).map(s => `- "${s.query}" (searched ${s.count}x)`).join("\n") || "No search data yet"}

OPEN BOUNTIES (explicit demand):
${(bounties || []).map(b => `- "${b.title}" — $${b.budget / 100} budget, ${b.submissions_count} submissions, category: ${b.category}`).join("\n") || "No open bounties"}

CURRENT SUPPLY BY CATEGORY:
${Object.entries(categoryCount).map(([k, v]) => `- ${k}: ${v} listings`).join("\n") || "No listings yet"}

HIGH-VIEW LOW-SALE LISTINGS (interest but no conversion):
${highDemandLowSupply.map(l => `- "${l.title}" — ${l.views} views, ${l.sales} sales`).join("\n") || "None"}

Provide a comprehensive market analysis.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_analysis",
              description: "Return structured market analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence executive summary" },
                  unmet_demands: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        need: { type: "string" },
                        evidence: { type: "string" },
                        opportunity_score: { type: "number", description: "1-10 score" },
                      },
                      required: ["need", "evidence", "opportunity_score"],
                      additionalProperties: false,
                    },
                  },
                  market_gaps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        gap: { type: "string" },
                        category: { type: "string" },
                        suggested_price_range: { type: "string" },
                      },
                      required: ["gap", "category", "suggested_price_range"],
                      additionalProperties: false,
                    },
                  },
                  recommended_builds: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"] },
                        estimated_demand: { type: "string", enum: ["low", "medium", "high", "very_high"] },
                        suggested_price_cents: { type: "number" },
                        tech_stack: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "description", "category", "estimated_demand", "suggested_price_cents", "tech_stack"],
                      additionalProperties: false,
                    },
                  },
                  pricing_insights: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["summary", "unmet_demands", "market_gaps", "recommended_builds", "pricing_insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "market_analysis" } },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiResponse.ok) throw new Error("AI analysis failed");

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis generated");

    const analysis = JSON.parse(toolCall.function.arguments || "{}");

    // Log the research event
    await sb.from("activity_log").insert({
      event_type: "market_research",
      user_id: userId,
      event_data: { searches_analyzed: searches.length, bounties_analyzed: (bounties || []).length },
    });

    return new Response(
      JSON.stringify({
        success: true,
        raw_signals: {
          top_searches: searches.slice(0, 15),
          open_bounties: (bounties || []).length,
          total_listings: (listings || []).length,
          category_distribution: categoryCount,
          high_demand_low_conversion: highDemandLowSupply,
        },
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("market-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
