/**
 * post-to-x Edge Function
 * -----------------------
 * Automatically posts to X/Twitter. Supports multiple post types:
 *  - new_listing: When a new listing goes live
 *  - sale_milestone: When a listing hits sales milestones (5, 10, 25, 50, 100)
 *  - trending: Daily trending apps digest
 *  - custom: Admin-triggered custom posts
 *  - blog_post: Automated blog promotion with rotation
 *
 * Uses OAuth 1.0a for X API v2
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://opendraft.co";

// OAuth 1.0a helpers
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function createOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // IMPORTANT: Do NOT include POST body params in signature for JSON requests
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = await hmacSha1(signingKey, signatureBase);

  oauthParams["oauth_signature"] = signature;

  const header = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return header;
}

// Helper: pick a random item from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------
// TWEET TEMPLATES — High-quality, varied, platform-native copy
// ---------------------------------------------------------------

function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(0)}`;
  const badge = listing.completeness_badge === "production_ready" ? "Production-ready" :
    listing.completeness_badge === "mvp" ? "MVP" : "Prototype";
  const url = `${SITE_URL}/listing/${listing.id}`;
  
  const templates = [
    `New drop on OpenDraft 🏪\n\n"${listing.title}"\n${badge} · ${price}\n\nOwn the source. Deploy today.\n\n${url}`,
    `Just listed → ${listing.title}\n\n${badge} · Ready to fork and ship.\n\n${url}`,
    `Fresh on the marketplace:\n\n${listing.title} (${price})\n\nFork it. Ship it. Support included.\n\n${url}`,
  ];
  return pick(templates);
}

function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  const templates = [
    `${milestone} builders chose "${listing.title}" on OpenDraft.\n\nSee what they're shipping 👇\n${url}`,
    `"${listing.title}" just crossed ${milestone} sales 🎉\n\nJoin them → ${url}`,
    `${milestone}x sold.\n\n"${listing.title}" is one of the most popular projects on OpenDraft.\n\n${url}`,
  ];
  return pick(templates);
}

function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "FREE" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return `Trending on OpenDraft today 🔥\n\n${lines.join("\n")}\n\nBrowse → ${SITE_URL}`;
}

function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return `This week on OpenDraft:\n\n🏪 ${stats.listings} new apps listed\n💰 ${stats.sales} sales completed\n👷 ${stats.builders} builders joined\n\nThe app store for AI agents.\n\n${SITE_URL}`;
}

// ---------------------------------------------------------------
// AI-GENERATED BLOG TWEETS — Fresh, market-aware content every time
// Uses Lovable AI to generate unique tweets based on current
// marketplace trends, recent listings, and demand signals.
// ---------------------------------------------------------------

const BLOG_TOPICS = [
  "vibe coding", "AI agents", "MCP servers", "monetizing side projects",
  "no-code to pro-code", "AI-built SaaS", "template marketplaces",
  "shipping faster with AI", "autonomous software", "multi-agent workflows",
  "indie hacking in 2026", "AI coding tools", "developer productivity",
  "self-healing deployments", "agent commerce", "security-hardened templates",
];

async function generateBlogTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  // Fetch fresh marketplace context in parallel
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

  // Pick a random topic angle
  const topic = pick(BLOG_TOPICS);
  const now = new Date();
  const dateContext = `${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`;

  const prompt = `You are the social media voice of OpenDraft (opendraft.co) — the app store for AI-built software and AI agents. Write ONE tweet (max 270 chars) that feels like a fresh, original thought about "${topic}".

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
    const aiRes = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 20 && text.length <= 280) {
        return text;
      }
    }
  } catch (e) {
    console.error("AI blog tweet generation failed, using fallback:", e);
  }

  // Fallback: generate a solid tweet from context without AI
  const fallbacks = [
    `The barrier to building software just collapsed.\n\nAI agents are now discovering, buying, and deploying apps autonomously on OpenDraft.\n\n${SITE_URL}\n\n#vibecoding #AIagents`,
    `Every week, new builders ship production apps in hours — not months.\n\nThe marketplace for AI-built software is here.\n\n${SITE_URL}\n\n#buildinpublic #AI`,
    `What if the next great SaaS tool wasn't built by a dev team — but by a single person with an AI coding tool?\n\nThat's already happening.\n\n${SITE_URL}\n\n#vibecoding #indiehackers`,
  ];
  return pick(fallbacks);
}

// ---------------------------------------------------------------
// VIBE CODING STATE OF THE MARKET — AI-generated daily insights
// ---------------------------------------------------------------

const REPORT_URL = `${SITE_URL}/blog/vibe-coding-state-of-the-market`;

async function generateVibeReportTweet(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const now = new Date();
  const dateContext = `${now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

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
    const aiRes = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const text = aiData?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 20 && text.length <= 280) {
        return text;
      }
    }
  } catch (e) {
    console.error("AI vibe report tweet failed, using fallback:", e);
  }

  // Fallback
  return `Vibe Coding: State of the Market\n\nThe barrier to building software just collapsed. 2M+ people now ship production apps using AI.\n\nFull report → ${REPORT_URL}\n\n#vibecoding #AI`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET");
    const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN");
    const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      throw new Error("Twitter API credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const postType = body.type;
    let tweetText = "";

    if (postType === "new_listing" && body.listing_id) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=*`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = newListingTweet(listings[0]);

    } else if (postType === "sale_milestone" && body.listing_id && body.milestone) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=id,title`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = saleMilestoneTweet(listings[0], body.milestone);

    } else if (postType === "trending") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast,view_count.desc.nullslast&limit=5&select=id,title,price,sales_count`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const listings = await res.json();
      if (!listings?.length) throw new Error("No trending listings");
      tweetText = trendingDigestTweet(listings);

    } else if (postType === "weekly_stats") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [listingsRes, salesRes, buildersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?created_at=gte.${weekAgo}&status=eq.live&select=id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "count=exact" },
        }),
        fetch(`${supabaseUrl}/rest/v1/purchases?created_at=gte.${weekAgo}&select=id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "count=exact" },
        }),
        fetch(`${supabaseUrl}/rest/v1/profiles?created_at=gte.${weekAgo}&select=id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "count=exact" },
        }),
      ]);

      const listingsCount = parseInt(listingsRes.headers.get("content-range")?.split("/")?.[1] || "0");
      const salesCount = parseInt(salesRes.headers.get("content-range")?.split("/")?.[1] || "0");
      const buildersCount = parseInt(buildersRes.headers.get("content-range")?.split("/")?.[1] || "0");

      tweetText = weeklyStatsTweet({ listings: listingsCount, sales: salesCount, builders: buildersCount });

    } else if (postType === "blog_post") {
      if (body.rotate || !body.text) {
        // AI-generate a fresh, market-aware tweet every time
        tweetText = await generateBlogTweet(supabaseUrl, supabaseKey);
      } else if (body.text) {
        // Allow custom override
        tweetText = body.text;
      } else {
        throw new Error("blog_post: pass rotate:true for AI-generated tweets or text for custom");
      }

    } else if (postType === "vibe_coding_report") {
      tweetText = await generateVibeReportTweet(supabaseUrl, supabaseKey);

    } else if (postType === "custom" && body.text) {
      tweetText = body.text;

    } else {
      throw new Error("Invalid post type. Use: new_listing, sale_milestone, trending, weekly_stats, blog_post, or custom");
    }

    // Post to X API v2
    const tweetUrl = "https://api.x.com/2/tweets";
    const authHeader = await createOAuthHeader(
      "POST", tweetUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
    );

    const tweetRes = await fetch(tweetUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const tweetData = await tweetRes.json();

    if (!tweetRes.ok) {
      console.error("X API error:", JSON.stringify(tweetData));
      throw new Error(`X API error [${tweetRes.status}]: ${JSON.stringify(tweetData)}`);
    }

    console.log(`Posted to X: ${postType}`, tweetData.data?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      tweet_id: tweetData.data?.id,
      text: tweetText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("post-to-x error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
