import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Autonomous SEO Content Agent
 * Runs daily via cron. Generates one long-tail blog post targeting
 * keywords the platform needs to rank for.
 */

const TOPIC_BANK = [
  { keyword: "best vibe coding tools 2026", vertical: "developers", category: "Vibe Coding" },
  { keyword: "buy react templates online", vertical: "developers", category: "Templates" },
  { keyword: "ai app marketplace for developers", vertical: "developers", category: "AI Apps" },
  { keyword: "best website builder for restaurants 2026", vertical: "restaurants", category: "SMB Growth" },
  { keyword: "salon booking app template", vertical: "salons", category: "SMB Growth" },
  { keyword: "contractor website template free", vertical: "contractors", category: "SMB Growth" },
  { keyword: "fitness app template react", vertical: "fitness", category: "Health & Fitness" },
  { keyword: "healthcare portal template", vertical: "healthcare", category: "Healthcare" },
  { keyword: "real estate listing app template", vertical: "real-estate", category: "Real Estate" },
  { keyword: "how to sell code online", vertical: "creators", category: "Creator Economy" },
  { keyword: "mcp server marketplace", vertical: "agents", category: "Agent Economy" },
  { keyword: "ai agents buying software autonomously", vertical: "agents", category: "Agent Economy" },
  { keyword: "best saas starter kit 2026", vertical: "developers", category: "SaaS" },
  { keyword: "no code app store", vertical: "general", category: "Vibe Coding" },
  { keyword: "sell lovable apps online", vertical: "creators", category: "Creator Economy" },
  { keyword: "autonomous ai marketplace", vertical: "agents", category: "Agent Economy" },
  { keyword: "react dashboard template production ready", vertical: "developers", category: "Templates" },
  { keyword: "small business app marketplace", vertical: "smb", category: "SMB Growth" },
  { keyword: "white label saas template", vertical: "enterprise", category: "Enterprise" },
  { keyword: "ai generated app marketplace", vertical: "general", category: "AI Apps" },
  { keyword: "vibe coding explained for beginners", vertical: "general", category: "Vibe Coding" },
  { keyword: "best ai coding assistant 2026", vertical: "developers", category: "AI Apps" },
  { keyword: "deploy react app one click", vertical: "developers", category: "Templates" },
  { keyword: "passive income selling code", vertical: "creators", category: "Creator Economy" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Check what slugs already exist
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug");
    
    const existingSlugs = new Set((existing || []).map(p => p.slug));

    // Pick a topic we haven't written about
    const available = TOPIC_BANK.filter(t => {
      const slug = t.keyword.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
      return !existingSlugs.has(slug);
    });

    if (available.length === 0) {
      return new Response(JSON.stringify({ message: "All topics covered", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick random topic
    const topic = available[Math.floor(Math.random() * available.length)];
    const slug = topic.keyword.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Generate the blog post using AI
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
            content: `You are a world-class SEO content writer for OpenDraft (opendraft.co), the first agent-native app marketplace. Write blog posts that:
- Target the exact keyword naturally (use it 3-5 times)
- Are 1200-1800 words, practical, and authoritative
- Include specific examples, data points, and actionable advice
- Reference OpenDraft features where natural (marketplace, one-click deploy, AI agents, remix economy)
- Use markdown headers (## and ###) to structure content
- End with a CTA to browse or sell on OpenDraft
- Sound like a sharp, knowledgeable founder — NOT generic AI slop
- Include contrarian takes and specific numbers where possible`
          },
          {
            role: "user",
            content: `Write an SEO-optimized blog post targeting the keyword: "${topic.keyword}"

Category: ${topic.category}
Vertical: ${topic.vertical}

Return a JSON object with these exact fields:
{
  "title": "compelling title including the keyword (under 65 chars)",
  "description": "meta description with keyword (under 155 chars)",
  "content": "full markdown content of the blog post",
  "read_time": "X min read"
}`
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
                title: { type: "string", description: "Blog post title under 65 chars" },
                description: { type: "string", description: "Meta description under 155 chars" },
                content: { type: "string", description: "Full markdown content" },
                read_time: { type: "string", description: "Estimated read time like '6 min read'" }
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

    // Insert into blog_posts table
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

    // Auto-tweet the new post
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
          type: "new_listing",
          custom_text: `📝 New on the blog: "${args.title}"\n\n${args.description}\n\nhttps://opendraft.lovable.app/blog/${slug}`,
        }),
      });
    } catch (e) {
      console.error("Tweet failed:", e);
    }

    // Log to swarm_tasks
    await supabase.from("swarm_tasks").insert({
      agent_type: "seo_writer",
      action: "generate_blog_post",
      status: "completed",
      input: { topic, slug },
      output: { title: args.title, word_count: args.content.split(/\s+/).length },
      triggered_by: "cron",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      slug,
      title: args.title,
      keyword: topic.keyword,
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
