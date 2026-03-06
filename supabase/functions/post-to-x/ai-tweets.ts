/**
 * AI-generated tweet content using Lovable AI Gateway
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
];

export async function generateBlogTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  const [trendingRes, demandRes, recentRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast&limit=3&select=title,category,tech_stack`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/agent_demand_signals?order=created_at.desc&limit=5&select=query,category`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=created_at.desc&limit=3&select=title,category`, { headers }),
  ]);

  const [trending, demand, recent] = await Promise.all([
    trendingRes.json().catch(() => []),
    demandRes.json().catch(() => []),
    recentRes.json().catch(() => []),
  ]);

  const trendingTitles = (trending || []).map((l: any) => l.title).join(", ");
  const demandQueries = (demand || []).map((d: any) => d.query).join(", ");
  const recentTitles = (recent || []).map((l: any) => l.title).join(", ");

  const topic = pick(BLOG_TOPICS);
  const dateContext = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const prompt = `You are the social media voice of OpenDraft (opendraft.co) — the app store for AI-built software and AI agents. Write ONE tweet that feels like a fresh, original thought about "${topic}". CRITICAL: The tweet MUST be under 260 characters total including URL and hashtags. Count carefully.

CONTEXT (use to make it timely & relevant):
- Date: ${dateContext}
- Trending apps on our marketplace: ${trendingTitles || "various AI tools and SaaS apps"}
- What AI agents are searching for: ${demandQueries || "AI tools, automation, MCP servers"}
- Recently listed: ${recentTitles || "new AI-built apps"}

RULES:
- Write as if you're a sharp founder sharing an insight, NOT a brand account
- Hook-first: the first line must stop the scroll
- No emojis in the first line
- Include 1-2 relevant hashtags at the end
- Include the URL ${SITE_URL} naturally (not as the first thing)
- Reference real trends (vibe coding, AI agents, MCP, etc.)
- NEVER start with "Just published" or "New blog post" — be original
- Sound human, opinionated, and slightly provocative
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
    `The barrier to building software just collapsed.\n\nAI agents are now discovering, buying, and deploying apps autonomously on OpenDraft.\n\n${SITE_URL}\n\n#vibecoding #AIagents`,
    `Every week, new builders ship production apps in hours — not months.\n\nThe marketplace for AI-built software is here.\n\n${SITE_URL}\n\n#buildinpublic #AI`,
    `What if the next great SaaS tool wasn't built by a dev team — but by a single person with an AI coding tool?\n\nThat's already happening.\n\n${SITE_URL}\n\n#vibecoding #indiehackers`,
  ];
  return pick(fallbacks);
}

export async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dateContext = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const prompt = `You are the social media voice of OpenDraft — the marketplace for AI-built software. Write ONE tweet (max 270 chars) promoting our "Vibe Coding: State of the Market" report.

DATE: ${dateContext}
REPORT URL: ${REPORT_URL}

The report covers how 2M+ people now build software using AI coding tools (Lovable, Cursor, Claude Code, Bolt, Replit, Windsurf). Key themes: non-technical founders shipping production apps, AI agents buying software autonomously, the supply of software 10x-ing.

RULES:
- Lead with a provocative insight or surprising stat — NOT "Check out our report"
- Sound like a sharp VC or founder sharing a market observation
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
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
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
      console.log("AI vibe tweet unusable:", text?.length);
    } else {
      console.error("AI gateway returned", aiRes.status, await aiRes.text());
    }
  } catch (e) {
    console.error("AI vibe report tweet failed, using fallback:", e);
  }

  return `Vibe Coding: State of the Market\n\nThe barrier to building software just collapsed. 2M+ people now ship production apps using AI.\n\nFull report → ${REPORT_URL}\n\n#vibecoding #AI`;
}
