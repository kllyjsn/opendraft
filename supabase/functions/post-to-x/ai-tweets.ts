/**
 * AI-generated tweet content using Lovable AI Gateway
 * Narrative: "Every business, better software."
 * Voice: Ogilvy-crisp, ownership-first, anti-SaaS-rent, margin-obsessed
 */

const SITE_URL = "https://opendraft.co";
const REPORT_URL = `${SITE_URL}/blog/vibe-coding-state-of-the-market`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const BLOG_TOPICS = [
  // Ownership narrative
  "owning your software vs renting SaaS", "killing per-seat pricing",
  "code ownership for small business", "the SaaS subscription trap",
  "why your margins shrink with every SaaS tool", "software you own forever",
  // Product narrative
  "paste your URL get an app", "custom apps from your website",
  "90-second app deployment", "replacing SaaS with owned software",
  // Tech / builder
  "vibe coding", "AI agents", "MCP servers", "monetizing side projects",
  "AI-built SaaS", "template marketplaces", "shipping faster with AI",
  "autonomous software", "multi-agent workflows", "indie hacking in 2026",
  "self-healing deployments", "agent commerce", "security-hardened templates",
  "the assembly era of software", "buy vs build decision", "micro-SaaS portfolios",
  "non-technical founders shipping code", "software as a commodity",
];

const PERSONAS = [
  "a sharp CFO who hates per-seat pricing",
  "a serial founder who replaced 8 SaaS tools with owned apps",
  "a developer-turned-CEO sharing hard-won wisdom",
  "a witty business strategist",
  "a data-obsessed analyst dropping margin insights",
  "an irreverent indie hacker who owns all their code",
  "a reformed SaaS addict who saw the light",
  "a contrarian thinker challenging subscription economics",
];

const FORMATS = [
  "a provocative one-liner about software ownership",
  "a mini-story about a founder who stopped renting software",
  "a numbered list of 3-4 reasons to own your code",
  "a before/after comparison: renting SaaS vs owning your app",
  "a hot take about per-seat pricing that makes people stop scrolling",
  "a question about why businesses still rent software they could own",
  "a stat-driven observation that reframes SaaS spending",
  "a short dialogue between a CFO and a SaaS salesperson",
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

  const prompt = `You are ${persona}, writing for OpenDraft (opendraft.co) — where businesses replace rented SaaS with software they own.

Brand line: "Every business, better software."
Core message: Paste your site. We build the app. You own the code. Forever.

Write ONE tweet as ${format} about "${topic}".

CRITICAL: MUST be under 270 characters including the URL and any hashtags. Count carefully.

REAL-TIME CONTEXT (weave in naturally, don't force):
- Date: ${dayOfWeek}, ${dateContext}
- ${totalApps}+ apps available — all with full source code
- Trending: ${trendingInfo || "custom business apps replacing SaaS"}
- Demand: ${demandQueries || "CRM alternatives, booking systems, dashboards"}
- Just listed: ${recentTitles || "new apps"}

VOICE RULES:
- First line MUST stop the scroll — no emojis in the first line
- Thread the ownership narrative: own > rent, your code > their platform
- Sound like a real person who's fed up with per-seat pricing
- Include ${SITE_URL} naturally (never as the first word)
- 0-2 relevant hashtags at the end (optional)
- NEVER start with "Just published", "New blog", "Check out", or "Excited to"
- No corporate speak. Crisp like Ogilvy. Sharp like a founder.
- Make people think about what they're renting vs what they could own
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
    `Every per-seat fee is a tax on your growth.\n\nOwn your software instead.\n\n${SITE_URL}`,
    `Paste your site. Get a custom app. Own the code. Forever.\n\nThat's the whole pitch.\n\n${SITE_URL}`,
    `Your SaaS bill grows with every hire. Your owned software doesn't.\n\nBetter margins start here.\n\n${SITE_URL}`,
  ];
  return pick(fallbacks);
}

/**
 * Generate a fully AI-crafted tweet using real marketplace data
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

Brand: "Every business, better software." Own your code. Kill per-seat fees. Paste your site, get an app.

CONTEXT:
- ${dateContext}
- ${totalApps}+ apps on the marketplace, all with full source code
- Top app: "${trending[0]?.title || "AI Dashboard"}" with ${trending[0]?.sales_count || 10} sales
- ${recentSales.length} purchases in the last 24 hours

RULES:
- MUST be under 270 characters total (including URL)
- First line must be a SCROLL-STOPPER about ownership or SaaS waste
- No emojis in the first line
- Include ${SITE_URL} once, naturally
- Sound genuinely human — a founder fed up with software rent
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

  return `${totalApps}+ apps. Full source code. No per-seat fees. Ever.\n\nOwn your software.\n\n${SITE_URL}`;
}

export async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dateContext = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const persona = pick(PERSONAS);

  const prompt = `You are ${persona}. Write ONE tweet (max 270 chars) promoting our "Vibe Coding: State of the Market" report.

DATE: ${dateContext}
REPORT URL: ${REPORT_URL}
BRAND: "Every business, better software." The report proves the shift from renting SaaS to owning custom software.

The report covers how 2M+ people now build software using AI coding tools (Lovable, Cursor, Claude Code, Bolt, Replit, Windsurf). Key themes: non-technical founders owning their code, the death of per-seat pricing, software ownership as a margin advantage.

RULES:
- Lead with a provocative insight about ownership or SaaS waste
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

  return `The era of renting software is ending. 2M+ people now build and own their apps with AI.\n\nFull report → ${REPORT_URL}\n\n#vibecoding`;
}