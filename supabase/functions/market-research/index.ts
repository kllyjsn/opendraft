import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Trend sources to scrape ──
const TREND_SOURCES = [
  { url: "https://www.producthunt.com", label: "Product Hunt", search: "trending" },
  { url: "https://news.ycombinator.com", label: "Hacker News", search: "Show HN" },
  { url: "https://github.com/trending", label: "GitHub Trending" },
  { url: "https://www.indiehackers.com", label: "Indie Hackers" },
  { url: "https://trends.google.com/trending?geo=US", label: "Google Trends" },
];

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    // Truncate to keep prompt manageable
    const md = data?.data?.markdown || data?.markdown || "";
    return md.slice(0, 3000);
  } catch (e) {
    console.error(`Scrape failed for ${url}:`, e);
    return null;
  }
}

async function searchTrends(query: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: 8,
        tbs: "qdr:w", // last week
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const results = data?.data || [];
    return results
      .map((r: any) => `- ${r.title}: ${r.description || ""}`)
      .join("\n")
      .slice(0, 2000);
  } catch (e) {
    console.error("Trend search failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
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
    for (const [query, data] of queryMap) searches.push({ query, ...data });
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

    const categoryCount: Record<string, number> = {};
    for (const l of listings || []) {
      categoryCount[l.category] = (categoryCount[l.category] || 0) + 1;
    }

    const highDemandLowSupply = (listings || [])
      .filter(l => (l.view_count || 0) > 10 && (l.sales_count || 0) <= 1)
      .slice(0, 10)
      .map(l => ({ title: l.title, views: l.view_count, sales: l.sales_count }));

    // ── 4. EXTERNAL TREND SCANNING (Firecrawl) ──
    const externalTrends: { source: string; content: string }[] = [];

    if (FIRECRAWL_API_KEY) {
      console.log("Scanning external trend sources...");

      // Scrape trend pages in parallel
      const scrapePromises = TREND_SOURCES.map(async (src) => {
        const content = await scrapeWithFirecrawl(src.url, FIRECRAWL_API_KEY);
        if (content) {
          externalTrends.push({ source: src.label, content });
        }
      });

      // Also search for specific trending topics
      const trendSearches = [
        "trending AI SaaS tools 2026",
        "most popular developer tools startups 2026",
        "viral micro-SaaS ideas indie hackers",
        "best selling app templates marketplace",
        "trending web app ideas vibe coding AI",
      ];

      const searchPromises = trendSearches.map(async (q) => {
        const content = await searchTrends(q, FIRECRAWL_API_KEY);
        if (content) {
          externalTrends.push({ source: `Search: "${q}"`, content });
        }
      });

      // Run all scrapes and searches in parallel, with a 15s timeout
      await Promise.race([
        Promise.allSettled([...scrapePromises, ...searchPromises]),
        new Promise(resolve => setTimeout(resolve, 15000)),
      ]);

      console.log(`Collected ${externalTrends.length} external trend sources`);
    }

    // ── 5. AI analysis with combined internal + external signals ──
    const externalTrendsText = externalTrends.length > 0
      ? externalTrends.map(t => `### ${t.source}\n${t.content}`).join("\n\n").slice(0, 8000)
      : "No external data available (Firecrawl not configured)";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a market analyst and tastemaker for OpenDraft, a marketplace where developers buy and sell vibe-coded apps & templates. You have access to both internal marketplace data AND real-time internet trends.

Your job is to:
1. Cross-reference EXTERNAL trends (Product Hunt, HN, GitHub, indie hackers) with INTERNAL demand
2. Identify emerging niches BEFORE they become saturated
3. Spot patterns in what's going viral and translate them into buildable template products
4. Be a tastemaker — recommend products that are slightly ahead of the curve, not just copying what exists
5. Think about breadth (covering many categories) AND depth (specific, well-scoped apps)

Focus on what's MARKETABLE — apps that solve real pain points, leverage trending tech, and have clear buyer personas. Price recommendations should reflect the current market willingness to pay.`,
          },
          {
            role: "user",
            content: `Analyze this comprehensive marketplace + internet trend data:

═══ INTERNAL SIGNALS ═══

TOP SEARCH QUERIES (what our users want):
${searches.slice(0, 25).map(s => `- "${s.query}" (${s.count}×)`).join("\n") || "No search data yet"}

OPEN BOUNTIES (explicit demand with $$):
${(bounties || []).map(b => `- "${b.title}" — $${b.budget / 100} budget, ${b.submissions_count} submissions, ${b.category}`).join("\n") || "No open bounties"}

CURRENT SUPPLY BY CATEGORY:
${Object.entries(categoryCount).map(([k, v]) => `- ${k}: ${v} listings`).join("\n") || "Empty marketplace"}

HIGH-VIEW LOW-SALE LISTINGS (interest without conversion):
${highDemandLowSupply.map(l => `- "${l.title}" — ${l.views} views, ${l.sales} sales`).join("\n") || "None"}

═══ EXTERNAL TRENDS (LIVE INTERNET DATA) ═══

${externalTrendsText}

═══ ANALYSIS REQUEST ═══

Provide a comprehensive analysis that combines internal demand with external trends. Be specific about which trends from the internet map to marketplace opportunities. Recommend 8-12 specific builds across diverse categories — some riding current waves, some predicting emerging ones.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "market_analysis",
              description: "Return structured market analysis with trend-powered insights",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "3-4 sentence executive summary mentioning key external trends spotted" },
                  trending_now: {
                    type: "array",
                    description: "What's hot RIGHT NOW on the internet that maps to template opportunities",
                    items: {
                      type: "object",
                      properties: {
                        trend: { type: "string", description: "The trend or viral pattern spotted" },
                        source: { type: "string", description: "Where this trend was spotted (Product Hunt, HN, etc.)" },
                        template_opportunity: { type: "string", description: "How to turn this into a sellable template" },
                        urgency: { type: "string", enum: ["build_now", "build_soon", "watch"], description: "How quickly to act" },
                      },
                      required: ["trend", "source", "template_opportunity", "urgency"],
                      additionalProperties: false,
                    },
                  },
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
                    description: "8-12 specific app concepts covering diverse categories and both trending + evergreen niches",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"] },
                        estimated_demand: { type: "string", enum: ["low", "medium", "high", "very_high"] },
                        suggested_price_cents: { type: "number" },
                        tech_stack: { type: "array", items: { type: "string" } },
                        trend_source: { type: "string", description: "What external trend inspired this (or 'internal demand' if from search/bounty data)" },
                        buyer_persona: { type: "string", description: "Who would buy this and why" },
                      },
                      required: ["title", "description", "category", "estimated_demand", "suggested_price_cents", "tech_stack", "trend_source", "buyer_persona"],
                      additionalProperties: false,
                    },
                  },
                  pricing_insights: {
                    type: "array",
                    items: { type: "string" },
                  },
                  emerging_niches: {
                    type: "array",
                    description: "3-5 niches that aren't mainstream yet but show early signals",
                    items: {
                      type: "object",
                      properties: {
                        niche: { type: "string" },
                        signal: { type: "string" },
                        timeframe: { type: "string", description: "When this could peak (e.g. '2-3 months', '6 months')" },
                      },
                      required: ["niche", "signal", "timeframe"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "trending_now", "unmet_demands", "market_gaps", "recommended_builds", "pricing_insights", "emerging_niches"],
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
      event_data: {
        searches_analyzed: searches.length,
        bounties_analyzed: (bounties || []).length,
        external_sources_scanned: externalTrends.length,
        sources: externalTrends.map(t => t.source),
      },
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
          external_sources_scanned: externalTrends.map(t => t.source),
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
