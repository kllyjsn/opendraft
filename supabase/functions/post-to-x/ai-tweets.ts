/**
 * AI-generated tweet content using Lovable AI Gateway
 * Enhanced with real marketplace data injection and varied personas
 */

const SITE_URL = "https://opendraft.co";
const REPORT_URL = `${SITE_URL}/blog/vibe-coding-state-of-the-market`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const BLOG_TOPICS = [
  "vibe coding", "AI agents", "MCP servers", "monetizing side projects",
  "no-code to pro-code", "AI-built SaaS", "template marketplaces",
  "shipping faster with AI", "autonomous software", "multi-agent workflows",
  "indie hacking in 2026", "AI coding tools", "developer productivity",
  "self-healing deployments", "agent commerce", "security-hardened templates",
  "the assembly era of software", "buy vs build decision", "micro-SaaS portfolios",
  "non-technical founders shipping code", "AI maintenance crews",
  "the death of boilerplate", "software as a commodity", "marketplace economics",
];

const PERSONAS = [
  "a sharp VC observing market trends",
  "a serial founder who's launched 12 products",
  "a developer-turned-CEO sharing hard-won wisdom",
  "a witty tech philosopher",
  "a data-obsessed analyst dropping insights",
  "an irreverent indie hacker",
  "a reformed perfectionist who learned to ship fast",
  "a contrarian thinker challenging conventional wisdom",
];

const FORMATS = [
  "a provocative one-liner with a killer punchline",
  "a mini-story with a twist ending",
  "a numbered list of 3-4 insights",
  "a before/after comparison",
  "a hot take that makes people stop scrolling",
  "a question that sparks debate in the replies",
  "a stat-driven observation that reframes the narrative",
  "a short dialogue between two founders",
];

export async function generateBlogTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  const [trendingRes, demandRes, recentRes, statsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast&limit=5&select=title,category,tech_stack,price,sales_count`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/agent_demand_signals?order=created_at.desc&limit=8&select=query,category`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=created_at.desc&limit=5&select=title,category,price`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, { headers: { ...headers, Prefer: "count=exact" } }),
  ]);

  const [trending, demand, recent] = await Promise.all([
    trendingRes.json().catch(() => []),
    demandRes.json().catch(() => []),
    recentRes.json().catch(() => []),
  ]);

  const totalApps = parseInt(statsRes.headers.get("content-range")?.split("/")?.[1] || "500");
  const trendingInfo = (trending || []).map((l: any) => `"${l.title}" (${l.sales_count} sales, $${(l.price/100).toFixed(0)})`).join(", ");
  const demandQueries = (demand || []).map((d: any) => d.query).join(", ");
  const recentTitles = (recent || []).map((l: any) => `"${l.title}"`).join(", ");

  const topic = pick(BLOG_TOPICS);
  const persona = pick(PERSONAS);
  const format = pick(FORMATS);
  const dateContext = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const dayOfWeek = new Date().toLocaleString("en-US", { weekday: "long" });

  const prompt = `You are ${persona}, writing for OpenDraft (opendraft.co) — the app store for AI-built software.

Write ONE tweet as ${format} about "${topic}".

CRITICAL: MUST be under 270 characters including the URL and any hashtags. Count carefully.

REAL-TIME CONTEXT (weave in naturally, don't force):
- Date: ${dayOfWeek}, ${dateContext}
- ${totalApps}+ live apps on the marketplace
- Trending apps: ${trendingInfo || "various AI tools and SaaS apps"}
- What people are searching for: ${demandQueries || "AI tools, automation, dashboards"}
- Just listed: ${recentTitles || "new apps"}

VOICE RULES:
- First line MUST stop the scroll — no emojis in the first line
- Sound like a real person, not a brand account
- Be opinionated, even slightly controversial
- Include ${SITE_URL} naturally (never as the first word)
- 0-2 relevant hashtags at the end (optional)
- NEVER start with "Just published", "New blog", "Check out", or "Excited to"
- No corporate speak. No buzzword salad.
- Make people think, laugh, or feel called out
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
        temperature: 1.0, // Higher temp for more creativity
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      let text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text) text = text.replace(/^```[\s\S]*?```$/gm, "").replace(/^["'`]+|["'`]+$/g, "").trim();
      if (text && text.length > 20) {
        if (text.length > 280) {
          console.log(`AI tweet was ${text.length} chars, truncating`);
          text = text.substring(0, 277) + "...";
        }
        return text;
      }
      console.log("AI returned unusable text:", text?.length, text?.substring(0, 50));
    } else {
      console.error("AI gateway returned", aiRes.status, await aiRes.text());
    }
  } catch (e) {
    console.error("AI blog tweet generation failed, using fallback:", e);
  }

  const fallbacks = [
    `The barrier to building software just collapsed.\n\nAI agents are now discovering, buying, and deploying apps autonomously.\n\n${SITE_URL}\n\n#vibecoding #AIagents`,
    `Every week, new builders ship production apps in hours — not months.\n\nThe marketplace for AI-built software is here.\n\n${SITE_URL}\n\n#buildinpublic`,
    `What if your next SaaS wasn't built by a dev team — but assembled from proven components in an afternoon?\n\nThat's already happening.\n\n${SITE_URL}\n\n#vibecoding`,
  ];
  return pick(fallbacks);
}

/**
 * Generate a fully AI-crafted tweet using real marketplace data
 * Used for the new "ai_generated" post type — maximum variety
 */
export async function generateDynamicTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  const [trendingRes, recentSalesRes, totalRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast&limit=3&select=title,sales_count,price,category`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/purchases?order=created_at.desc&limit=5&select=amount_paid,created_at`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, { headers: { ...headers, Prefer: "count=exact" } }),
  ]);

  const trending = await trendingRes.json().catch(() => []);
  const recentSales = await recentSalesRes.json().catch(() => []);
  const totalApps = parseInt(totalRes.headers.get("content-range")?.split("/")?.[1] || "500");

  const topic = pick(BLOG_TOPICS);
  const persona = pick(PERSONAS);
  const format = pick(FORMATS);
  const dateContext = new Date().toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const prompt = `You are ${persona}. Write ONE viral tweet as ${format} about "${topic}" for OpenDraft (opendraft.co).

CONTEXT:
- ${dateContext}
- ${totalApps}+ apps on the marketplace
- Top app: "${trending[0]?.title || "AI Dashboard"}" with ${trending[0]?.sales_count || 10} sales
- ${recentSales.length} purchases in the last 24 hours

RULES:
- MUST be under 270 characters total (including URL)
- First line must be a SCROLL-STOPPER
- No emojis in the first line
- Include ${SITE_URL} once, naturally
- Sound genuinely human and opinionated
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

  return `${totalApps}+ apps. Full source code. AI maintenance.\n\nThe future of software isn't building from scratch.\n\n${SITE_URL}`;
}

export async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dateContext = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const persona = pick(PERSONAS);

  const prompt = `You are ${persona}. Write ONE tweet (max 270 chars) promoting our "Vibe Coding: State of the Market" report.

DATE: ${dateContext}
REPORT URL: ${REPORT_URL}

The report covers how 2M+ people now build software using AI coding tools (Lovable, Cursor, Claude Code, Bolt, Replit, Windsurf). Key themes: non-technical founders shipping production apps, AI agents buying software autonomously, the supply of software 10x-ing.

RULES:
- Lead with a provocative insight or surprising stat
- Sound like ${persona}
- Include ${REPORT_URL} naturally
- 1-2 hashtags at end (#vibecoding always)
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
    console.error("AI vibe report tweet failed, using fallback:", e);
  }

  return `Vibe Coding: State of the Market\n\nThe barrier to building software just collapsed. 2M+ people now ship production apps using AI.\n\nFull report → ${REPORT_URL}\n\n#vibecoding #AI`;
}
