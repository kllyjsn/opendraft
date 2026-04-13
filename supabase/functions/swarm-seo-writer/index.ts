import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TOPIC_BANK } from "./topics.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Enterprise-focused categories get prioritized
const HIGH_PRIORITY_CATEGORIES = new Set([
  "Enterprise Strategy",  // core enterprise narrative
  "TCO Analysis",         // CFO / finance angle
  "IT Governance",        // CISO / compliance angle
  "Own Your Software",    // ownership positioning
  "Replace Your SaaS",    // competitive positioning
  "AI Maintenance",       // addressing key objection
  "Thought Leadership",   // brand authority
  "Digital Transformation", // strategic context
]);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    // Weighted topic selection: prioritize high-traffic categories
    const weighted = available.map(t => ({
      topic: t,
      weight: HIGH_PRIORITY_CATEGORIES.has(t.category) ? 3 : 1,
    }));
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    let topic = weighted[0].topic;
    for (const w of weighted) {
      roll -= w.weight;
      if (roll <= 0) { topic = w.topic; break; }
    }

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
            content: `You are a world-class enterprise technology writer creating blog posts for OpenDraft (opendraft.co).

BRAND: "Every business, better software." — own your operational tools, eliminate per-seat dependency, govern your technology stack.

AUDIENCE: Enterprise technology leaders — CIOs, CTOs, VPs of Engineering, CFOs, and CISOs at mid-market and enterprise companies. They read Harvard Business Review, Stratechery, and First Round Review. They make or influence six-figure software purchasing decisions.

CONTENT STRATEGY — Write like the best enterprise technology publications:
- Lead with a STRATEGIC INSIGHT: a market shift, a data point, or a decision framework
- Every section must deliver actionable intelligence — not generic advice
- Use specific examples at enterprise scale: "$420K annual SaaS spend → $12K one-time owned alternatives" 
- Reference recognizable enterprise challenges: vendor consolidation, compliance burden, M&A integration
- Write with authority but acknowledge nuance and tradeoffs honestly
- Thread the ownership narrative as a strategic option, not a silver bullet
- Include frameworks, decision matrices, or evaluation criteria readers can apply

STRUCTURE:
- Title: under 60 chars, includes the keyword, appeals to senior decision-makers
- Opening paragraph: strategic hook + clear promise of what the reader will learn
- 5-7 sections with ## headers that work as standalone strategic insights
- Include at least one comparison framework, decision matrix, or ROI calculation
- Reference OpenDraft's enterprise features (governed catalogs, compliance tagging, AI maintenance) where natural
- End with a strategic recommendation, not a hard sell

VOICE:
- Authoritative and measured — like a respected industry analyst
- Use "you" language addressing technology leaders directly
- Acknowledge complexity: "The answer depends on..." is stronger than oversimplified claims
- Data-informed: cite industry benchmarks, spending patterns, and adoption trends
- Avoid: hype language, urgency tactics, "game-changer", "revolutionary", "mind-blowing"
- Avoid: "In today's fast-paced world", "It's no secret that", "Let's dive in", "In conclusion"
- Avoid: indie hacker tone, meme references, overly casual language
- Never sound like marketing copy — sound like strategic advisory content`
          },
          {
            role: "user",
            content: `Write an SEO-optimized blog post targeting: "${topic.keyword}"

Category: ${topic.category}
Vertical: ${topic.vertical}

IMPORTANT: This content must provide genuine strategic value to enterprise technology leaders. It should be the kind of article a CIO would share with their leadership team or bookmark for a procurement review. If it reads like generic content marketing, it fails.

Return JSON: { "title": "under 60 chars with keyword, enterprise-appropriate", "description": "meta description under 155 chars — include a specific strategic benefit or data point", "content": "full markdown, 1500-2500 words", "read_time": "X min read" }`
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

    // Auto-tweet with better format — pull an insight from the post
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
