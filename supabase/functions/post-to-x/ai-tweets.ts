/**
 * AI-generated tweet content using Lovable AI Gateway
 * V2: Value-first content, diverse voices, anti-repetition
 */

const SITE_URL = "https://opendraft.co";
const REPORT_URL = `${SITE_URL}/blog/vibe-coding-state-of-the-market`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── VALUE-FIRST TOPICS (teach something, don't just sell) ──
const VALUE_TOPICS = [
  // Actionable tips (no pitch needed)
  "a specific tactic to reduce SaaS spend this week",
  "how to audit your software stack in 30 minutes",
  "the 3-question framework for build vs buy decisions",
  "why your per-seat costs compound faster than you think",
  "a hidden cost of SaaS most founders miss: data portability",
  "how one founder automated their entire ops with 4 owned tools",
  // Industry insights
  "the shift from SaaS subscriptions to owned software in 2026",
  "why VCs are now asking about software ownership in due diligence",
  "the margin advantage companies get from owning their tools",
  "how AI maintenance eliminates the biggest objection to custom software",
  // Builder/creator angles
  "how a side project became a $2k/month passive income stream",
  "the economics of selling code templates vs building SaaS",
  "why the best developers are becoming product owners",
  "how vibe coding is creating a new generation of builder-entrepreneurs",
  // Contrarian/thought leadership
  "why 'best-in-class SaaS' is often 90% features you'll never use",
  "the psychology behind why businesses over-pay for software subscriptions",
  "how the SaaS pricing model was designed to extract maximum revenue, not deliver maximum value",
  "what the shift from renting to owning means for the future of business software",
];

// ── DIVERSE PERSONAS (not just anti-SaaS crusaders) ──
const PERSONAS = [
  "a pragmatic CFO sharing a money-saving insight",
  "an experienced founder giving genuine advice to early-stage entrepreneurs",
  "a developer who discovered they could earn more selling code than working a 9-5",
  "a small business owner who figured out a better way",
  "a curious analyst breaking down industry economics",
  "a mentor sharing a lesson they learned the hard way",
  "a startup advisor who's seen this pattern across 50+ companies",
  "a builder sharing their weekly revenue numbers transparently",
];

// ── TWEET STYLES (variety prevents feed fatigue) ──
const FORMATS = [
  "a surprising insight that makes people think differently — no hard sell",
  "a concrete tip someone can act on today",
  "a short story (3-4 lines) about a real-world scenario",
  "a contrarian observation that invites discussion",
  "a before/after comparison with specific numbers",
  "a question that sparks genuine conversation in the replies",
  "a data point or stat with brief analysis",
  "a lesson learned, told humbly",
];

/**
 * Check recent posts to avoid repetition
 */
async function getRecentPostTypes(supabaseUrl: string, supabaseKey: string): Promise<string[]> {
  try {
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/swarm_tasks?agent_type=eq.social_poster&created_at=gte.${since}&order=created_at.desc&limit=10&select=output`,
      { headers }
    );
    const tasks = await res.json().catch(() => []);
    return tasks
      .map((t: any) => t.output?.post_type || t.output?.resolved_type || "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function generateBlogTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  // Get a recent blog post to promote
  const blogRes = await fetch(
    `${supabaseUrl}/rest/v1/blog_posts?published=eq.true&order=created_at.desc&limit=5&select=title,slug,description,category`,
    { headers }
  );
  const posts = await blogRes.json().catch(() => []);
  const post = posts.length > 0 ? pick(posts) : null;

  const persona = pick(PERSONAS);
  const dateContext = new Date().toLocaleString("en-US", { weekday: "long", month: "long" });

  const blogUrl = post ? `${SITE_URL}/blog/${post.slug}` : SITE_URL;
  const blogTitle = post?.title || "software ownership";
  const blogDesc = post?.description || "";

  const prompt = `You are ${persona}. Write ONE tweet promoting a blog post.

BLOG: "${blogTitle}"
SUMMARY: ${blogDesc}
URL: ${blogUrl}

CRITICAL RULES:
- MUST be under 270 characters including the URL
- DO NOT just say "New blog post!" — pull out the most interesting INSIGHT from the title/summary
- Lead with a hook that makes someone curious enough to click
- The tweet should provide partial value on its own (a teaser insight)
- Sound like a real person sharing something interesting they read, NOT a brand account
- Include the URL naturally, ideally at the end
- No emojis in the first line
- 0-1 hashtags max
- Output ONLY the tweet text, nothing else`;

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 1.0,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text) text = text.replace(/^```[\s\S]*?```$/gm, "").replace(/^["'`]+|["'`]+$/g, "").trim();
      if (text && text.length > 20) {
        if (text.length > 280) text = text.substring(0, 277) + "...";
        return text;
      }
    }
  } catch (e) {
    console.error("AI blog tweet generation failed:", e);
  }

  return post
    ? `${post.description}\n\n${blogUrl}`
    : `Own your software. Kill per-seat fees.\n\n${SITE_URL}`;
}

/**
 * Generate a value-first AI tweet — teaches or provokes thought
 * Only ~30% of these include a direct CTA
 */
export async function generateDynamicTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  const recentTypes = await getRecentPostTypes(supabaseUrl, supabaseKey);

  const [trendingRes, totalRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast&limit=3&select=title,sales_count,price,category`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, { headers: { ...headers, Prefer: "count=exact" } }),
  ]);

  const trending = await trendingRes.json().catch(() => []);
  const totalApps = parseInt(totalRes.headers.get("content-range")?.split("/")?.[1] || "500");

  const topic = pick(VALUE_TOPICS);
  const persona = pick(PERSONAS);
  const format = pick(FORMATS);
  const dateContext = new Date().toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // 30% include CTA, 70% are pure value
  const includeCTA = Math.random() < 0.3;

  const prompt = `You are ${persona}. Write ONE tweet as ${format} about "${topic}".

DATE: ${dateContext}
MARKETPLACE CONTEXT: ${totalApps}+ owned apps available, top: "${trending[0]?.title || "AI Dashboard"}"

${includeCTA
    ? `Include ${SITE_URL} naturally at the end — but the tweet must provide value BEFORE the link.`
    : `Do NOT include any links or URLs. This tweet should be pure value — an insight, tip, or thought that stands on its own. People will check the profile if they're interested.`
  }

ANTI-REPETITION: Recent post themes to AVOID: ${recentTypes.slice(0, 5).join(", ") || "none"}

CRITICAL RULES:
- MUST be under 270 characters total
- First line must be a genuine insight or hook — NOT a sales pitch
- Sound like a real human sharing knowledge, NOT a brand account blasting promos
- No corporate language ("excited to announce", "check out", "don't miss")
- No emojis in the first line
- If it reads like an ad, rewrite it as advice
- 0-1 hashtags max
- Output ONLY the tweet text`;

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 1.0,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text) text = text.replace(/^```[\s\S]*?```$/gm, "").replace(/^["'`]+|["'`]+$/g, "").trim();
      if (text && text.length > 20 && text.length <= 280) return text;
      if (text && text.length > 280) return text.substring(0, 277) + "...";
    }
  } catch (e) {
    console.error("Dynamic tweet generation failed:", e);
  }

  return `The average business spends $14k/month on SaaS.\n\n80% of those tools could be owned outright for a one-time cost.\n\nThe math is worth checking.`;
}

export async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dateContext = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const persona = pick(PERSONAS);

  const prompt = `You are ${persona}. Write ONE tweet (max 270 chars) sharing an insight from the "Vibe Coding: State of the Market" report.

DATE: ${dateContext}
REPORT URL: ${REPORT_URL}

Key data: 2M+ people now build software using AI coding tools. Non-technical founders are owning their code. The subscription model is being challenged.

RULES:
- Lead with the most INTERESTING data point or insight — not "check out our report"
- Sound like someone genuinely excited by the data, not marketing it
- Include ${REPORT_URL} at the end
- 1 hashtag max (#vibecoding)
- No emojis in the first line
- Output ONLY the tweet text`;

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.95,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text) text = text.replace(/^["'`]+|["'`]+$/g, "").trim();
      if (text && text.length > 20) {
        if (text.length > 280) text = text.substring(0, 277) + "...";
        return text;
      }
    }
  } catch (e) {
    console.error("AI vibe report tweet failed:", e);
  }

  return `2M+ people now build and own their apps with AI.\n\nThe era of renting software is ending.\n\nFull report → ${REPORT_URL}\n\n#vibecoding`;
}
