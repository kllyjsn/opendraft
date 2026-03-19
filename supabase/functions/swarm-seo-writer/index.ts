import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TOPIC_BANK } from "./topics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Autonomous SEO Content Agent
 * Narrative: "Every business, better software."
 * Generates long-tail blog posts targeting 150+ keywords across ownership,
 * SaaS replacement, margin improvement, and all verticals.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug");
    
    const existingSlugs = new Set((existing || []).map(p => p.slug));

    const available = TOPIC_BANK.filter(t => {
      const slug = t.keyword.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
      return !existingSlugs.has(slug);
    });

    if (available.length === 0) {
      return new Response(JSON.stringify({ message: "All topics covered", count: 0, total: TOPIC_BANK.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick random topic
    const topic = available[Math.floor(Math.random() * available.length)];
    const slug = topic.keyword.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a world-class SEO content writer for OpenDraft (opendraft.co). OpenDraft's mission: every business deserves better software — software they own, not rent.

BRAND VOICE — Ogilvy-crisp, declarative, founder-sharp:
- Core line: "Every business, better software."
- Key themes: own your code forever, kill per-seat fees, paste your URL and get a custom app in 90 seconds, your code · your margins · your rules
- Positioning: replace expensive SaaS subscriptions with custom apps you own outright. No lock-in. No per-seat tax. Full source code.

Write blog posts that:
- Target the exact keyword naturally (use it 3-5 times)
- Are 1500-2500 words, practical, and authoritative
- Thread the ownership narrative throughout — every business paying SaaS fees is overpaying
- Include specific examples: a restaurant replacing Toast, a gym replacing Mindbody, a founder replacing Notion
- Use the "paste your site → get an app → own the code" flow as a concrete example
- Reference OpenDraft features: URL analyzer, one-click deploy, AI agents, full source code, remix economy
- Use markdown headers (## and ###) to structure content with 5-7 sections
- Include a comparison table or numbered list for scannability
- End with a strong CTA: "Paste your site. Own the result."
- Sound like a sharp, opinionated founder — NOT generic AI content
- Include contrarian takes: "Per-seat pricing is a tax on growth", "SaaS companies profit from your dependency"
- Mention competitor alternatives fairly but position ownership as the winning strategy`
          },
          {
            role: "user",
            content: `Write an SEO-optimized blog post targeting: "${topic.keyword}"

Category: ${topic.category}
Vertical: ${topic.vertical}

Return JSON: { "title": "under 65 chars with keyword", "description": "meta description under 155 chars", "content": "full markdown", "read_time": "X min read" }`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "publish_blog_post",
            description: "Publish a new SEO blog post",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                content: { type: "string" },
                read_time: { type: "string" }
              },
              required: ["title", "description", "content", "read_time"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "publish_blog_post" } }
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      throw new Error(`AI generation failed: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const args = JSON.parse(toolCall.function.arguments);

    const { error: insertErr } = await supabase.from("blog_posts").insert({
      slug,
      title: args.title,
      description: args.description,
      content: args.content,
      read_time: args.read_time || "6 min read",
      category: topic.category,
      keywords: [topic.keyword, topic.vertical, topic.category.toLowerCase()],
      published: true,
      generated_by: "swarm-seo-writer",
    });

    if (insertErr) throw insertErr;

    // Auto-tweet
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/post-to-x`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "blog_post",
          text: `📝 New: "${args.title}"\n\n${args.description}\n\nhttps://opendraft.co/blog/${slug}`,
          skip_art: false,
        }),
      });
    } catch (e) {
      console.error("Tweet failed:", e);
    }

    await supabase.from("swarm_tasks").insert({
      agent_type: "seo_writer",
      action: "generate_blog_post",
      status: "completed",
      input: { topic, slug, remaining: available.length - 1 },
      output: { title: args.title, word_count: args.content.split(/\s+/).length },
      triggered_by: "cron",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      slug,
      title: args.title,
      keyword: topic.keyword,
      remaining: available.length - 1,
      total_topics: TOPIC_BANK.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("SEO Writer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});