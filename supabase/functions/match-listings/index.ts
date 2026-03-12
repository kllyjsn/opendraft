import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    // Strategy: Run text search AND broad fetch in parallel for maximum coverage
    const [textSearchResult, broadResult] = await Promise.all([
      // 1. Text/trigram search — finds exact & fuzzy keyword matches
      supabase.rpc("search_listings", {
        search_query: prompt.trim(),
        page_limit: 50,
        page_offset: 0,
        sort_by: "relevance",
      }),
      // 2. Broad fetch — catches semantic matches text search would miss
      supabase
        .from("listings")
        .select("id,title,description,price,completeness_badge,tech_stack,screenshots,category,sales_count")
        .eq("status", "live")
        .order("sales_count", { ascending: false })
        .limit(300),
    ]);

    // Merge listings, deduplicating by ID, text-search results first
    const seenIds = new Set<string>();
    const allListings: any[] = [];

    // Text search results get priority — they already matched keywords
    if (textSearchResult.data) {
      for (const l of textSearchResult.data) {
        if (!seenIds.has(l.id)) {
          seenIds.add(l.id);
          allListings.push({ ...l, _textMatch: true, _relevanceScore: l.relevance_score || 0 });
        }
      }
    }

    // Add broad results for semantic coverage
    if (broadResult.data) {
      for (const l of broadResult.data) {
        if (!seenIds.has(l.id)) {
          seenIds.add(l.id);
          allListings.push({ ...l, _textMatch: false, _relevanceScore: 0 });
        }
      }
    }

    if (allListings.length === 0) {
      return new Response(JSON.stringify({ matches: [], hasResults: false, textMatches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build listing text for AI — include text-match hints to help scoring
    const listingsText = allListings
      .map((l, i) => {
        const textHint = l._textMatch ? ` | TEXT_MATCH (relevance: ${l._relevanceScore.toFixed(2)})` : "";
        return `[${i}] ID: ${l.id} | Title: "${l.title}" | Desc: "${(l.description || "").slice(0, 200)}" | Cat: ${l.category} | Tech: ${(l.tech_stack || []).join(", ")} | Price: $${(l.price / 100).toFixed(2)} | Badge: ${l.completeness_badge} | Sales: ${l.sales_count || 0}${textHint}`;
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
            content: `You are an expert marketplace search assistant. Given a user's build idea and a catalog of available projects, find ALL semantically relevant matches. 

SCORING RULES:
- 1.0 = Perfect match (same concept, same tech)
- 0.8-0.9 = Strong match (same domain/purpose, overlapping tech)
- 0.6-0.7 = Good match (related concept, could be adapted)
- 0.5 = Weak but useful (tangentially related, shares some tech or patterns)
- Items marked TEXT_MATCH already matched keywords — boost their score by 0.1

Be GENEROUS with matching. Think about:
1. Direct matches (user wants X, listing IS X)
2. Adjacent matches (user wants X, listing is similar to X or could become X)
3. Tech stack matches (user mentions React/AI/etc, listing uses those)
4. Template matches (listing provides a foundation the user could build on)
5. Category matches (same industry/domain even if different specific feature)

Return up to 8 matches. Only return matches with score >= 0.45.`,
          },
          {
            role: "user",
            content: `User wants to build: "${prompt}"\n\nAvailable projects (${allListings.length} total):\n${listingsText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return the best matching project indices with relevance scores",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "Index from the listing list" },
                        score: { type: "number", description: "Relevance score from 0.0 to 1.0" },
                        reason: { type: "string", description: "One compelling sentence explaining why this is a great starting point" },
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

    if (aiResponse.status === 429) {
      // Fall back to text search results only
      const fallbackMatches = allListings
        .filter(l => l._textMatch)
        .slice(0, 6)
        .map(l => ({ ...l, score: l._relevanceScore, reason: "Matched by keyword search" }));
      
      return new Response(JSON.stringify({ 
        matches: fallbackMatches, 
        hasResults: fallbackMatches.length > 0,
        fallback: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      // Same fallback for billing issues
      const fallbackMatches = allListings
        .filter(l => l._textMatch)
        .slice(0, 6)
        .map(l => ({ ...l, score: l._relevanceScore, reason: "Matched by keyword search" }));
      
      return new Response(JSON.stringify({ 
        matches: fallbackMatches, 
        hasResults: fallbackMatches.length > 0,
        fallback: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response");

    const matchData = JSON.parse(toolCall.function.arguments || '{"matches":[]}');

    const topMatches = matchData.matches
      .filter((m: { index: number; score: number; reason: string }) => m.score >= 0.45 && allListings[m.index])
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 8)
      .map((m: { index: number; score: number; reason: string }) => {
        const listing = allListings[m.index];
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

    // Log demand signal if no good matches found
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
