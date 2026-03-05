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
// BLOG POST TEMPLATES — High-quality, varied hooks
// Each post gets multiple unique tweet angles
// ---------------------------------------------------------------

interface BlogEntry {
  title: string;
  slug: string;
  hook: string;      // Short punchy hook for the tweet body
  hashtags: string;   // 1-2 relevant hashtags
}

const BLOG_CATALOG: BlogEntry[] = [
  {
    title: "We Hit $10K ARR With Zero Employees — Here's How",
    slug: "autonomous-revenue-zero-employees",
    hook: "No support team. No marketing dept. No ops staff.\n\nJust AI agents, cron jobs, and edge functions running a profitable marketplace.",
    hashtags: "#buildinpublic #AI",
  },
  {
    title: "AI Agents Are Now Buying Software",
    slug: "ai-agents-buying-software",
    hook: "Last month, an AI agent discovered a template, negotiated 15% off, paid, and deployed it — in under 90 seconds.\n\nNo human involved.",
    hashtags: "#AIagents #MCP",
  },
  {
    title: "Self-Healing Deployments: How Our AI Fixes Broken Sites",
    slug: "site-doctor-self-healing-deploys",
    hook: "Your deployed site breaks at 3 AM.\n\nOur Site Doctor detects it, diagnoses the issue, and rebuilds — before you wake up.",
    hashtags: "#DevOps #AI",
  },
  {
    title: "The Complete Guide to MCP Servers in 2026",
    slug: "mcp-servers-complete-guide-2026",
    hook: "MCP is the new REST.\n\nIf you want AI agents to use your product, you need an MCP server. Here's everything you need to know.",
    hashtags: "#MCP #AIagents",
  },
  {
    title: "What Is Vibe Coding? The Complete Guide",
    slug: "what-is-vibe-coding",
    hook: "Describe what you want. AI writes the code.\n\nVibe coding is how 2M+ people are building software in 2026.",
    hashtags: "#vibecoding #AI",
  },
  {
    title: "The 6 Best AI Coding Tools in 2026",
    slug: "best-ai-coding-tools-2026",
    hook: "Lovable, Cursor, Claude Code, Bolt, Replit, Windsurf — which one should you actually use?\n\nWe compared them all.",
    hashtags: "#AIcoding #devtools",
  },
  {
    title: "How to Monetize Your Side Project in 2026",
    slug: "monetize-side-project",
    hook: "You built something cool over the weekend.\n\nNow it's sitting on GitHub collecting dust.\n\nHere's how to turn it into $200/mo recurring revenue.",
    hashtags: "#indiehackers #buildinpublic",
  },
  {
    title: "The Rise of the AI Agent Marketplace",
    slug: "rise-of-ai-agent-marketplace",
    hook: "The buyers aren't just humans anymore.\n\nAI agents are discovering, evaluating, and purchasing software — programmatically.",
    hashtags: "#AIagents #marketplace",
  },
  {
    title: "Build Multi-Agent Workflows With Vibe Coding",
    slug: "vibe-coding-multi-agent-workflows",
    hook: "Single AI agents are powerful.\n\nBut chain 4-5 specialized agents together? That's where the real magic happens.",
    hashtags: "#multiagent #vibecoding",
  },
];

function blogPostTweet(entry: BlogEntry): string {
  const url = `${SITE_URL}/blog/${entry.slug}`;

  const templates = [
    // Hook-first format (best engagement)
    `${entry.hook}\n\n${url}\n\n${entry.hashtags}`,

    // Title-led with curiosity gap
    `${entry.title}\n\n${entry.hook.split("\n")[0]}\n\nRead → ${url}`,

    // Thread-starter style
    `New on the OpenDraft blog:\n\n${entry.title}\n\n${entry.hook.split("\n\n")[0]}\n\n${url}`,
  ];
  return pick(templates);
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
      if (body.rotate) {
        // Rotate through blog catalog by hour — ensures variety across the day
        const hourOfDay = new Date().getUTCHours();
        const entry = BLOG_CATALOG[hourOfDay % BLOG_CATALOG.length];
        tweetText = blogPostTweet(entry);
      } else if (body.slug) {
        // Post a specific blog entry by slug
        const entry = BLOG_CATALOG.find(e => e.slug === body.slug);
        if (!entry) throw new Error(`Blog slug "${body.slug}" not found in catalog`);
        tweetText = blogPostTweet(entry);
      } else if (body.title && body.custom_slug) {
        // Fully custom blog post tweet
        tweetText = blogPostTweet({
          title: body.title,
          slug: body.custom_slug,
          hook: body.hook || body.description || "",
          hashtags: body.hashtags || "#opendraft",
        });
      } else {
        throw new Error("blog_post requires rotate:true, slug, or title+custom_slug");
      }

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
