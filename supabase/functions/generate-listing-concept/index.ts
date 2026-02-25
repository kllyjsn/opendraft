import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
    const count = Math.min(body.count || 3, 5);

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

    // 3. Use AI to generate concepts
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
            content: `You are a product strategist for a marketplace called OpenDraft where developers buy and sell vibe-coded apps, templates, and SaaS tools. Generate unique, compelling app concepts that developers would want to buy as starter projects or templates. Each concept should be specific, practical, and immediately useful. Focus on trending niches, AI-powered tools, and developer productivity.`,
          },
          {
            role: "user",
            content: `Generate ${count} new app listing concepts for our marketplace.

Recent user search demand signals: ${searchTerms.length > 0 ? searchTerms.join(", ") : "General interest in AI tools, SaaS, dashboards, landing pages"}

Existing listings to AVOID duplicating: ${existingTitles || "None yet"}

For each concept, provide realistic details that would make a compelling listing.`,
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
                        description: { type: "string", description: "Compelling 2-3 sentence product description highlighting value and features" },
                        category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"] },
                        completeness_badge: { type: "string", enum: ["prototype", "mvp", "production_ready"] },
                        tech_stack: { type: "array", items: { type: "string" }, description: "3-6 relevant technologies" },
                        price_cents: { type: "number", description: "Suggested price in cents (e.g. 2900 = $29). Range $5-$199" },
                        built_with: { type: "string", enum: ["lovable", "cursor", "bolt", "replit", "v0", "other"], description: "Which AI tool it was built with" },
                      },
                      required: ["title", "description", "category", "completeness_badge", "tech_stack", "price_cents", "built_with"],
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

    // 4. Insert as pending listings
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

    // 5. Log the generation event
    await supabase.from("activity_log").insert({
      event_type: "ai_concept_generation",
      user_id: sellerId,
      event_data: { count: inserted.length, concepts: concepts.map((c: any) => c.title) },
    });

    return new Response(
      JSON.stringify({
        success: true,
        generated: inserted.length,
        listing_ids: inserted,
        concepts: concepts.map((c: any) => ({ title: c.title, category: c.category, price: c.price_cents })),
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
