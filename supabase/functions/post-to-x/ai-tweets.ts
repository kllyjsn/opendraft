/**
 * AI-generated tweet content using Lovable AI Gateway
 * V3: Enterprise ICP — authentic, measured, authoritative tone
 * Voice: Thoughtful technology advisor, not a sales account
 */

const SITE_URL = "https://opendraft.co";
const REPORT_URL = `${SITE_URL}/blog/vibe-coding-state-of-the-market`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── ENTERPRISE-FOCUSED VALUE TOPICS ──
const VALUE_TOPICS = [
  // IT governance & procurement
  "how enterprise IT teams evaluate build vs buy in 2026",
  "the hidden cost of shadow IT — and how to fix it with governed app catalogs",
  "why procurement cycles for SaaS are getting longer and what it means",
  "how CIOs are rethinking software ownership as part of cost optimization",
  "the compliance burden of managing 200+ SaaS vendors",
  // Software strategy
  "why forward-thinking CTOs are building internal app marketplaces",
  "the strategic case for owning your operational software stack",
  "how to reduce vendor concentration risk in your technology portfolio",
  "total cost of ownership analysis: subscription vs ownership models at scale",
  "what happens to your data and workflows when a SaaS vendor gets acquired",
  // Digital transformation
  "how AI-assisted development is changing the build vs buy equation",
  "the rise of composable enterprise software — what it means for IT leaders",
  "why enterprise software procurement needs a new framework",
  "how organizations are achieving faster time-to-value with pre-built owned apps",
  // Operational efficiency
  "the real math on per-seat pricing at 500+ employees",
  "how IT leaders are consolidating their SaaS portfolio without losing capability",
  "why software standardization matters more at scale",
  "the operational risk of depending on vendors you don't control",
];

// ── ENTERPRISE PERSONAS ──
const PERSONAS = [
  "a CIO sharing a strategic observation about enterprise software",
  "a VP of Engineering reflecting on a procurement decision",
  "a technology strategist analyzing market shifts",
  "a CFO who's rethought their approach to software investment",
  "an IT governance leader sharing a framework",
  "a digital transformation consultant sharing a pattern they've seen across clients",
  "a CISO reflecting on the security implications of vendor sprawl",
  "a COO who improved margins through smarter technology decisions",
];

// ── TWEET FORMATS ──
const FORMATS = [
  "a measured strategic insight that demonstrates deep understanding",
  "a concise framework or mental model for technology decisions",
  "a brief observation about an enterprise trend, backed by reasoning",
  "a thought-provoking question for IT and business leaders",
  "a before/after scenario at an enterprise scale (500+ employees)",
  "a lesson from a real procurement or technology decision",
  "a data-informed perspective on software economics",
  "a nuanced take that acknowledges tradeoffs honestly",
];

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

  const blogRes = await fetch(
    `${supabaseUrl}/rest/v1/blog_posts?published=eq.true&order=created_at.desc&limit=5&select=title,slug,description,category`,
    { headers }
  );
  const posts = await blogRes.json().catch(() => []);
  const post = posts.length > 0 ? pick(posts) : null;

  const persona = pick(PERSONAS);
  const blogUrl = post ? `${SITE_URL}/blog/${post.slug}` : SITE_URL;
  const blogTitle = post?.title || "software ownership strategy";
  const blogDesc = post?.description || "";

  const prompt = `You are ${persona}. Write ONE tweet sharing a blog post with enterprise decision-makers.

BLOG: "${blogTitle}"
SUMMARY: ${blogDesc}
URL: ${blogUrl}

CRITICAL RULES:
- MUST be under 270 characters including the URL
- Pull out the most strategically interesting insight — not a generic summary
- Write as someone who found this genuinely valuable for their work
- Tone: authoritative but approachable, like a respected colleague sharing a resource
- NO hype language ("game-changer", "mind-blowing", "you won't believe")
- NO emojis except possibly one at the end
- NO hashtags
- Sound like a senior leader, not a marketing account
- Include the URL at the end
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
        temperature: 0.9,
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
    ? `Worth reading for anyone rethinking their software strategy: ${blogUrl}`
    : `The economics of software ownership are shifting. Worth examining.\n\n${SITE_URL}`;
}

/**
 * Generate enterprise-focused value tweet — strategic insights for IT/business leaders
 * Only ~25% include a direct CTA
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

  const includeCTA = Math.random() < 0.25;

  const prompt = `You are ${persona}. Write ONE tweet as ${format} about "${topic}".

DATE: ${dateContext}
CONTEXT: A marketplace of ${totalApps}+ production-ready apps available for enterprise teams to own outright.

${includeCTA
    ? `Include ${SITE_URL} naturally at the end — but the tweet must provide genuine strategic value first.`
    : `Do NOT include any links or URLs. This tweet should be pure insight — a strategic observation, framework, or perspective that stands on its own.`
  }

ANTI-REPETITION: Recent themes to AVOID: ${recentTypes.slice(0, 5).join(", ") || "none"}

CRITICAL RULES:
- MUST be under 270 characters total
- Write for a CIO, VP Engineering, or CFO audience — not indie hackers
- Tone: measured, authoritative, thoughtful — like Harvard Business Review, not TechCrunch comments
- NO hype, NO urgency, NO "game-changer" language
- NO emojis in first line (0-1 total)
- NO hashtags
- Acknowledge complexity and tradeoffs — don't oversimplify
- If it sounds like marketing copy, rewrite it as strategic analysis
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
        temperature: 0.9,
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

  return `Enterprise software strategy is shifting from managing vendor relationships to owning operational tools.\n\nThe economics are worth examining.`;
}

export async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dateContext = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const persona = pick(PERSONAS);

  const prompt = `You are ${persona}. Write ONE tweet (max 270 chars) sharing a data point from the "State of the Market" report on AI-assisted software development.

DATE: ${dateContext}
REPORT URL: ${REPORT_URL}

Key data: 2M+ organizations now use AI-assisted development. Non-technical leaders are gaining software ownership. The subscription model faces structural challenges at enterprise scale.

RULES:
- Lead with the most strategically relevant data point
- Write for enterprise technology leaders
- Sound analytical, not promotional
- Include ${REPORT_URL} at the end
- NO hype language, NO emojis, NO hashtags
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
        temperature: 0.85,
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

  return `2M+ organizations now build with AI-assisted development tools. The implications for enterprise software procurement are significant.\n\nFull analysis → ${REPORT_URL}`;
}
