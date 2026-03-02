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

    const { data: listings, error } = await supabase
      .from("listings")
      .select("id,title,description,price,completeness_badge,tech_stack,screenshots,category,sales_count")
      .eq("status", "live")
      .order("sales_count", { ascending: false })
      .limit(200);

    if (error) throw error;

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({ matches: [], hasResults: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listingsText = listings
      .map((l, i) =>
        `[${i}] ID: ${l.id} | Title: "${l.title}" | Description: "${l.description.slice(0, 150)}" | Category: ${l.category} | Tech: ${(l.tech_stack || []).join(", ")} | Price: $${(l.price / 100).toFixed(2)} | Completeness: ${l.completeness_badge}`
      )
      .join("\n");

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
            content:
              "You are a marketplace search assistant. Given a user's build idea and available projects, find the best semantic matches. Only return matches with score >= 0.5. If nothing matches well, return empty array. Be generous with matching if the user's idea overlaps in any meaningful way.",
          },
          {
            role: "user",
            content: `User wants to build: "${prompt}"\n\nAvailable projects:\n${listingsText}`,
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
                        reason: { type: "string", description: "One concise sentence why this matches" },
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
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response");

    const matchData = JSON.parse(toolCall.function.arguments || '{"matches":[]}');

    const topMatches = matchData.matches
      .filter((m: { index: number; score: number; reason: string }) => m.score >= 0.5 && listings[m.index])
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 4)
      .map((m: { index: number; score: number; reason: string }) => ({
        ...listings[m.index],
        score: m.score,
        reason: m.reason,
      }));

    // Log demand signal if no good matches found (fire-and-forget)
    // Only log from homepage search — agent demand signals are logged separately in the MCP server
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
