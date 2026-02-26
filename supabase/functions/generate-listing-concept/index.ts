import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchTrends(query: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 6, tbs: "qdr:w" }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data?.data || [])
      .map((r: any) => `- ${r.title}: ${r.description || ""}`)
      .join("\n")
      .slice(0, 1500);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Database not configured");

    // Auth check — only admins can trigger this
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    let sellerId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseUser.auth.getUser(token);
      if (user) sellerId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 3, 10);
    const themes: string[] = body.themes || [];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if caller is admin
    if (sellerId) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sellerId)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) throw new Error("Unauthorized — admin only");
    } else {
      throw new Error("Authentication required");
    }

    // 1. Gather market signals — recent searches and trending categories
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select("event_type, event_data")
      .in("event_type", ["search", "magic_import", "ai_search"])
      .order("created_at", { ascending: false })
      .limit(50);

    const searchTerms = (recentActivity || [])
      .map((a) => {
        const d = a.event_data as Record<string, unknown> | null;
        return d?.query || d?.prompt || d?.url || "";
      })
      .filter(Boolean)
      .slice(0, 20);

    // 2. Get existing listings to avoid duplicates
    const { data: existingListings } = await supabase
      .from("listings")
      .select("title, category, tech_stack")
      .limit(100);

    const existingTitles = (existingListings || []).map((l) => l.title).join(", ");

    // 3. EXTERNAL TREND DATA (Firecrawl)
    let externalContext = "";
    if (FIRECRAWL_API_KEY) {
      console.log("Fetching internet trends for concept generation...");

      const trendQueries = [
        "trending SaaS apps launching 2026",
        "most popular AI tools developers",
        "viral web app ideas micro-SaaS",
        ...(themes.length > 0 ? themes.map(t => `trending ${t} apps 2026`) : []),
      ];

      const results = await Promise.allSettled(
        trendQueries.map(q => searchTrends(q, FIRECRAWL_API_KEY))
      );

      const trendTexts: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          trendTexts.push(`## ${trendQueries[i]}\n${r.value}`);
        }
      });

      externalContext = trendTexts.join("\n\n").slice(0, 5000);
      console.log(`Gathered ${trendTexts.length} trend search results`);
    }

    // 4. Use AI to generate concepts
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
            content: `You are a tastemaker product strategist for OpenDraft, a marketplace where developers buy and sell vibe-coded apps, templates, and SaaS tools.

Your goal is to generate HIGHLY MARKETABLE app concepts that are:
1. TREND-AWARE: Inspired by what's trending on Product Hunt, Hacker News, and among indie hackers
2. DIVERSE: Spread across ALL categories (saas_tool, ai_app, landing_page, utility, game, other) — don't just default to AI tools
3. SPECIFIC: Not generic "dashboard" or "CRM" — each should have a unique angle and clear value prop
4. BUYER-FOCUSED: Think about who would pay money for this and why
5. AHEAD OF THE CURVE: Slightly ahead of trends, not copying last month's viral product

Think about breadth:
- SaaS tools: Niche vertical solutions, workflow automation, team collaboration
- AI apps: Creative tools, analysis tools, personalized experiences
- Landing pages: Specific industry templates, high-converting designs
- Utilities: Developer tools, productivity apps, browser extensions
- Games: Casual web games, puzzle games, multiplayer experiences
- Other: Marketplaces, directories, communities, content platforms

And depth:
- Each concept should feel like a COMPLETE product idea with a clear user journey
- Include innovative features that differentiate from competitors
- Consider monetization angles (freemium, subscription, one-time)`,
          },
          {
            role: "user",
            content: `Generate ${count} new app listing concepts for our marketplace.

${themes.length > 0 ? `REQUESTED THEMES: ${themes.join(", ")}\n` : ""}

INTERNAL DEMAND SIGNALS (what our users are searching for):
${searchTerms.length > 0 ? searchTerms.map(t => `- ${t}`).join("\n") : "General interest — generate diverse concepts across all categories"}

EXISTING LISTINGS (AVOID DUPLICATES):
${existingTitles || "None yet — fill the marketplace with diverse, compelling options"}

${externalContext ? `
═══ LIVE INTERNET TRENDS (use these as inspiration) ═══
${externalContext}
` : ""}

IMPORTANT: Generate ${count} concepts spread across DIFFERENT categories. At least half should be inspired by current internet trends. Each should feel fresh, specific, and immediately valuable to a buyer.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_listing_concepts",
              description: "Return generated app listing concepts",
              parameters: {
                type: "object",
                properties: {
                  concepts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Catchy, specific product title (3-8 words)" },
                        description: { type: "string", description: "Compelling 3-4 sentence product description highlighting unique angle, key features, and target buyer" },
                        category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"] },
                        completeness_badge: { type: "string", enum: ["prototype", "mvp", "production_ready"] },
                        tech_stack: { type: "array", items: { type: "string" }, description: "3-6 relevant technologies" },
                        price_cents: { type: "number", description: "Suggested price in cents. Range $5-$199 based on complexity and value" },
                        built_with: { type: "string", enum: ["lovable", "cursor", "bolt", "replit", "v0", "other"] },
                        trend_inspiration: { type: "string", description: "What internet trend or market signal inspired this concept" },
                        buyer_persona: { type: "string", description: "Who would buy this (e.g. 'freelance designers needing client portals')" },
                        key_differentiator: { type: "string", description: "What makes this different from existing solutions" },
                      },
                      required: ["title", "description", "category", "completeness_badge", "tech_stack", "price_cents", "built_with", "trend_inspiration", "buyer_persona", "key_differentiator"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["concepts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_listing_concepts" } },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response generated");

    const { concepts } = JSON.parse(toolCall.function.arguments || '{"concepts":[]}');

    // 5. Insert as pending listings
    const inserted: string[] = [];
    for (const concept of concepts) {
      const { data, error } = await supabase.from("listings").insert({
        seller_id: sellerId,
        title: concept.title,
        description: concept.description,
        price: concept.price_cents || 2900,
        category: concept.category || "other",
        completeness_badge: concept.completeness_badge || "mvp",
        tech_stack: concept.tech_stack || [],
        built_with: concept.built_with || "lovable",
        status: "pending",
        pricing_type: "one_time",
      }).select("id").single();

      if (!error && data) {
        inserted.push(data.id);
      } else {
        console.error("Insert error:", error?.message);
      }
    }

    // 6. Log the generation event
    await supabase.from("activity_log").insert({
      event_type: "ai_concept_generation",
      user_id: sellerId,
      event_data: {
        count: inserted.length,
        concepts: concepts.map((c: any) => ({
          title: c.title,
          category: c.category,
          trend: c.trend_inspiration,
        })),
        used_external_trends: !!FIRECRAWL_API_KEY,
        trend_sources_used: externalContext ? "firecrawl_search" : "none",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        generated: inserted.length,
        listing_ids: inserted,
        concepts: concepts.map((c: any) => ({
          title: c.title,
          category: c.category,
          price: c.price_cents,
          trend_inspiration: c.trend_inspiration,
          buyer_persona: c.buyer_persona,
          key_differentiator: c.key_differentiator,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-listing-concept error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
