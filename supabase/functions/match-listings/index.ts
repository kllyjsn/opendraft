import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) throw new Error("Prompt is required");
    if (prompt.length > 500) throw new Error("Prompt must be 500 characters or less");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("AI not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Database not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Strategy: Run text search + category-filtered + broad fetch in parallel
    const [textSearchResult, broadResult] = await Promise.all([
      // 1. Text/trigram search — exact & fuzzy keyword matches
      supabase.rpc("search_listings", {
        search_query: prompt.trim(),
        page_limit: 80,
        page_offset: 0,
        sort_by: "relevance",
      }),
      // 2. Broad fetch — top listings by quality for semantic matching
      supabase
        .from("listings")
        .select("id,title,description,price,completeness_badge,tech_stack,screenshots,category,sales_count,file_path,github_url,demo_url,agent_ready")
        .eq("status", "live")
        .order("sales_count", { ascending: false })
        .limit(500),
    ]);

    // Merge and deduplicate
    const seenIds = new Set<string>();
    const allListings: any[] = [];

    if (textSearchResult.data) {
      for (const l of textSearchResult.data) {
        if (!seenIds.has(l.id)) {
          seenIds.add(l.id);
          allListings.push({ ...l, _textMatch: true, _relevanceScore: l.relevance_score || 0 });
        }
      }
    }

    if (broadResult.data) {
      for (const l of broadResult.data) {
        if (!seenIds.has(l.id)) {
          seenIds.add(l.id);
          allListings.push({ ...l, _textMatch: false, _relevanceScore: 0 });
        }
      }
    }

    if (allListings.length === 0) {
      return new Response(JSON.stringify({ matches: [], hasResults: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-compute quality signals for each listing
    const enriched = allListings.map((l) => {
      const hasScreenshot = l.screenshots && l.screenshots.length > 0 
        && l.screenshots[0] !== '' && !l.screenshots[0]?.endsWith('.svg');
      const hasDeliverable = !!(l.file_path || l.github_url);
      const hasDemo = !!l.demo_url;
      const qualityScore = (hasScreenshot ? 1 : 0) + (hasDeliverable ? 1 : 0) + (hasDemo ? 1 : 0) + (l.sales_count > 0 ? 1 : 0);
      return { ...l, _hasScreenshot: hasScreenshot, _hasDeliverable: hasDeliverable, _quality: qualityScore };
    });

    // Sort: quality listings first, then text matches, then the rest
    enriched.sort((a, b) => {
      // Text matches with quality first
      if (a._textMatch && !b._textMatch) return -1;
      if (!a._textMatch && b._textMatch) return 1;
      // Then by quality score
      if (b._quality !== a._quality) return b._quality - a._quality;
      return (b.sales_count || 0) - (a.sales_count || 0);
    });

    // Take top 200 for AI analysis (prioritizes quality)
    const candidates = enriched.slice(0, 200);

    // Build compact listing text for AI
    const listingsText = candidates
      .map((l, i) => {
        const signals: string[] = [];
        if (l._textMatch) signals.push(`KW_MATCH(${l._relevanceScore.toFixed(1)})`);
        if (l._hasScreenshot) signals.push("HAS_IMG");
        if (l._hasDeliverable) signals.push("HAS_CODE");
        if (l.demo_url) signals.push("HAS_DEMO");
        if (l.agent_ready) signals.push("AGENT_READY");
        const signalStr = signals.length > 0 ? ` [${signals.join(",")}]` : "";
        return `[${i}] "${l.title}" — ${(l.description || "").slice(0, 150)} | ${l.category} | ${(l.tech_stack || []).join(",")} | $${(l.price / 100).toFixed(0)} | ${l.completeness_badge} | ${l.sales_count || 0} sales${signalStr}`;
      })
      .join("\n");

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
            content: `You are a marketplace search engine. Match a user's build idea to the BEST available projects.

SCORING (be precise):
- 0.95-1.0 = Near-identical concept + matching tech stack
- 0.80-0.94 = Same domain/purpose, could ship as-is or with minimal changes
- 0.65-0.79 = Related concept, solid starting point with modifications
- 0.50-0.64 = Shares patterns/tech, useful foundation
- Below 0.50 = Don't include

QUALITY BOOST: Items marked HAS_IMG, HAS_CODE, HAS_DEMO are higher quality — boost score by 0.05 for each.
KEYWORD BOOST: Items marked KW_MATCH already matched keywords — boost by 0.05.

MATCHING STRATEGY — think creatively:
1. Direct: "todo app" → todo/task manager apps
2. Domain: "fitness tracker" → health apps, workout tools, habit trackers
3. Pattern: "subscription billing" → any SaaS with Stripe, payment templates
4. Tech: "React dashboard" → any admin panel, analytics dashboard
5. Adjacent: "social media" → chat apps, feed builders, profile templates
6. Component: user wants a feature → any app that HAS that feature as part of it

Return 6-10 matches. Quality > quantity. Prefer items with HAS_IMG and HAS_CODE.
Write a SHORT, compelling "reason" — explain WHY this is useful for their specific idea (not generic).`,
          },
          {
            role: "user",
            content: `User wants: "${prompt}"\n\n${candidates.length} candidates:\n${listingsText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return matched projects with scores",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number" },
                        score: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["index", "score", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_matches" } },
      }),
    });

    // Fallback for rate limits or billing
    if (aiResponse.status === 429 || aiResponse.status === 402) {
      const fallbackMatches = enriched
        .filter(l => l._textMatch && l._hasScreenshot)
        .slice(0, 8)
        .map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price,
          completeness_badge: l.completeness_badge,
          tech_stack: l.tech_stack,
          screenshots: l.screenshots,
          category: l.category,
          sales_count: l.sales_count,
          score: Math.min(0.85, 0.5 + (l._relevanceScore || 0) * 0.3 + l._quality * 0.05),
          reason: "Matched by keyword relevance",
        }));

      return new Response(JSON.stringify({
        matches: fallbackMatches,
        hasResults: fallbackMatches.length > 0,
        fallback: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response");

    const matchData = JSON.parse(toolCall.function.arguments || '{"matches":[]}');

    const topMatches = matchData.matches
      .filter((m: { index: number; score: number }) => m.score >= 0.50 && candidates[m.index])
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 10)
      .map((m: { index: number; score: number; reason: string }) => {
        const listing = candidates[m.index];
        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          completeness_badge: listing.completeness_badge,
          tech_stack: listing.tech_stack,
          screenshots: listing.screenshots,
          category: listing.category,
          sales_count: listing.sales_count,
          score: m.score,
          reason: m.reason,
        };
      });

    // Log demand signal if no good matches
    if (topMatches.length === 0) {
      supabase.from("agent_demand_signals").insert({
        query: prompt.slice(0, 200),
        source: "homepage",
      }).then(() => {});
    }

    return new Response(JSON.stringify({ matches: topMatches, hasResults: topMatches.length > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-listings error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
