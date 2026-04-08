import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

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
  const corsHeaders = getCorsHeaders(req);
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

    // 1. Gather market signals
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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a VISIONARY product strategist and naming genius for OpenDraft — the premium marketplace where developers buy and sell stunning vibe-coded apps, templates, and SaaS tools.

## YOUR MISSION
Generate concepts so compelling that developers immediately think "I NEED to build this" or "I NEED to buy this." Each concept should feel like a Product Hunt #1 launch waiting to happen.

## NAMING PHILOSOPHY
Create MEMORABLE, BRANDABLE names — NOT generic descriptions. Study these patterns:
- **Compound words**: Raycast, Basecamp, Figma, Linear, Notion
- **Evocative words**: Obsidian, Mercury, Loom, Pitch, Arc
- **Playful combos**: Cal.com, Dub.co, Resend, Clerk, Drizzle
- **NEVER**: "AI Dashboard Manager" or "Smart Task Tracker" — those are descriptions, not brands

## QUALITY BAR FOR DESCRIPTIONS
Write like the best Product Hunt launches. Each description should:
- Open with a HOOK that creates desire ("Finally, a...")
- Highlight the UNIQUE ANGLE (not just features)
- Name the SPECIFIC buyer and their pain point
- End with an aspirational outcome
- Example: "Finally, a meeting scheduler that doesn't look like it was built in 2005. Meridian brings Linear-quality design to calendar management — auto-blocks focus time, syncs with every tool, and makes your schedule actually work for you. Built for founders and indie hackers who value their time."

## CONCEPT REQUIREMENTS
1. **TREND-DRIVEN**: External internet trends are your PRIMARY inspiration — what's blowing up RIGHT NOW
2. **AGENT-INCLUSIVE**: At least 30% MUST be agent-first — MCP servers, API toolkits, autonomous workflows
3. **DIVERSE**: Spread across ALL categories — don't cluster
4. **SPECIFIC**: Each has a unique angle. Not "CRM" but "CRM for freelance designers with project-based billing"
5. **AHEAD OF THE CURVE**: Anticipate 3-6 months out
6. **VISUALLY AMBITIOUS**: Each should have a clear visual identity (color, style, vibe)

## PRICING STRATEGY
- Landing pages / simple utilities: $5-$15
- MVP tools / dashboards: $15-$49
- Full SaaS starters / production apps: $49-$149
- Agent tools / MCP servers: $29-$99
- Premium / niche enterprise tools: $99-$199
- Price should reflect VALUE TO BUYER, not effort to build`,
          },
          {
            role: "user",
            content: `Generate ${count} EXCEPTIONAL app listing concepts.

${themes.length > 0 ? `REQUESTED THEMES: ${themes.join(", ")}\n` : ""}

${externalContext ? `
═══ PRIMARY: LIVE INTERNET TRENDS (build concepts around these) ═══
${externalContext}
` : ""}

SECONDARY — Internal demand signals:
${searchTerms.length > 0 ? searchTerms.map(t => `- ${t}`).join("\n") : "No recent searches"}

EXISTING LISTINGS (AVOID DUPLICATES):
${existingTitles || "None yet — fill the marketplace with diverse, compelling options"}

REQUIREMENTS:
1. ${count} concepts across DIFFERENT categories
2. At least ${Math.max(1, Math.ceil(count * 0.3))} MUST be agent-first
3. Internet trends drive 60%+ of concepts
4. BRANDABLE names only — no generic descriptions
5. Descriptions written like Product Hunt launches
6. Each concept should have a clear visual identity / color vibe`,
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
                        title: { type: "string", description: "Brandable product name, 1-4 words. Think Linear, Raycast, Obsidian — NOT 'AI Task Manager'" },
                        description: { type: "string", description: "3-5 sentence Product Hunt-quality description. Hook → unique angle → specific buyer → aspirational outcome" },
                        category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"] },
                        completeness_badge: { type: "string", enum: ["prototype", "mvp", "production_ready"] },
                        tech_stack: { type: "array", items: { type: "string" }, description: "4-6 relevant technologies" },
                        price_cents: { type: "number", description: "Price in cents based on value ($5-$199 range)" },
                        built_with: { type: "string", enum: ["lovable", "cursor", "bolt", "replit", "v0", "other"] },
                        trend_inspiration: { type: "string", description: "The specific trend or signal that inspired this" },
                        buyer_persona: { type: "string", description: "Specific buyer persona, e.g. 'indie hackers launching on Product Hunt'" },
                        key_differentiator: { type: "string", description: "The ONE thing that makes this better than alternatives" },
                        agent_ready: { type: "boolean", description: "True if designed for AI agent consumption" },
                        exposed_tools: { type: "string", description: "For agent-ready: MCP tools/API endpoints exposed. Empty string otherwise." },
                      },
                      required: ["title", "description", "category", "completeness_badge", "tech_stack", "price_cents", "built_with", "trend_inspiration", "buyer_persona", "key_differentiator", "agent_ready", "exposed_tools"],
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
