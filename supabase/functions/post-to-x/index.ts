/**
 * post-to-x Edge Function
 * -----------------------
 * Automatically posts to X/Twitter. Supports multiple post types:
 *  - new_listing: When a new listing goes live
 *  - sale_milestone: When a listing hits sales milestones (5, 10, 25, 50, 100)
 *  - trending: Daily trending apps digest
 *  - custom: Admin-triggered custom posts
 *
 * Uses OAuth 1.0a for X API v2
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Tweet templates
function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(0)}`;
  const category = listing.category?.replace(/_/g, " ") || "app";
  const badge = listing.completeness_badge === "production_ready" ? "🚀 Production-ready" :
    listing.completeness_badge === "mvp" ? "⚡ MVP" : "🧪 Prototype";
  
  const templates = [
    `🆕 Just listed: "${listing.title}" — a ${category} for ${price}\n\n${badge} • Ready to fork & ship today\n\nhttps://opendraft.co/listing/${listing.id}`,
    `New on OpenDraft 🏪\n\n"${listing.title}" (${price})\n${badge}\n\nOwn the source code. Ship it today.\n\nhttps://opendraft.co/listing/${listing.id}`,
    `Fresh drop 🔥\n\n${listing.title} — ${price}\n\nFork it. Ship it. Own it.\n\nhttps://opendraft.co/listing/${listing.id}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function saleMilestoneTweet(listing: any, milestone: number): string {
  return `🎉 "${listing.title}" just hit ${milestone} sales on OpenDraft!\n\nJoin ${milestone}+ builders who shipped with this template.\n\nhttps://opendraft.co/listing/${listing.id}`;
}

function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "FREE" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return `🔥 Trending on OpenDraft today:\n\n${lines.join("\n")}\n\nBrowse all → https://opendraft.co`;
}

function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return `📊 OpenDraft this week:\n\n🏪 ${stats.listings} new apps listed\n💰 ${stats.sales} sales completed\n👷 ${stats.builders} active builders\n\nThe app store for AI agents keeps growing.\n\nhttps://opendraft.co`;
}

function blogPostTweet(post: { title: string; slug: string; description: string; category: string }): string {
  const templates = [
    `📝 New on the blog: "${post.title}"\n\n${post.description.slice(0, 120)}…\n\nhttps://opendraft.co/blog/${post.slug}`,
    `🧠 Fresh read → ${post.title}\n\n${post.description.slice(0, 100)}…\n\nRead more 👇\nhttps://opendraft.co/blog/${post.slug}`,
    `New from OpenDraft ✍️\n\n${post.title}\n\n${post.description.slice(0, 110)}…\n\nhttps://opendraft.co/blog/${post.slug}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
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
    const postType = body.type; // new_listing | sale_milestone | trending | weekly_stats | custom
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
      // Get stats for the last 7 days
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
      // Support rotate mode: cycle through blog posts by hour
      if (body.rotate) {
        const blogPosts = [
          { title: "We Hit $10K ARR With Zero Employees — Here's How", slug: "autonomous-revenue-zero-employees", description: "OpenDraft runs on AI agents, cron jobs, and automation. No customer support team, no marketing department. Here's the exact system.", category: "Behind the Build" },
          { title: "AI Agents Are Now Buying Software. Here's What That Means.", slug: "ai-agents-buying-software", description: "Autonomous AI agents are making purchasing decisions without human approval. We built the infrastructure to let them.", category: "Agent Economy" },
          { title: "Self-Healing Deployments: How Our AI Fixes Broken Sites Automatically", slug: "site-doctor-self-healing-deploys", description: "When a deployed site breaks, our autonomous Site Doctor diagnoses the issue and attempts a fix before the buyer notices.", category: "Engineering" },
          { title: "The Complete Guide to MCP Servers in 2026", slug: "mcp-servers-complete-guide-2026", description: "Model Context Protocol is becoming the backbone of the autonomous economy. Everything you need to know.", category: "Technical Deep Dive" },
          { title: "What Is Vibe Coding? The Complete Guide for 2026", slug: "what-is-vibe-coding", description: "Vibe coding is using AI tools like Lovable, Cursor, and Bolt to build software through natural language prompts.", category: "Guides" },
          { title: "The 6 Best AI Coding Tools in 2026", slug: "best-ai-coding-tools-2026", description: "A comparison of the top AI coding tools: Lovable, Cursor, Claude Code, Bolt, Replit, and more.", category: "Guides" },
          { title: "How to Monetize Your Side Project in 2026", slug: "monetize-side-project", description: "Stop letting side projects collect dust. Turn your AI-built app into recurring revenue.", category: "Guides" },
          { title: "The Rise of the AI Agent Marketplace", slug: "rise-of-ai-agent-marketplace", description: "How marketplaces are creating a new economy for autonomous agents and SaaS tools.", category: "Agent Economy" },
          { title: "Build Multi-Agent Workflows With Vibe Coding", slug: "vibe-coding-multi-agent-workflows", description: "Explore how to build sophisticated multi-agent AI systems using vibe coding tools.", category: "Technical Deep Dive" },
        ];
        const hourOfDay = new Date().getUTCHours();
        const postIndex = hourOfDay % blogPosts.length;
        const selected = blogPosts[postIndex];
        tweetText = blogPostTweet(selected);
      } else if (body.title && body.slug) {
        tweetText = blogPostTweet({
          title: body.title,
          slug: body.slug,
          description: body.description || "",
          category: body.category || "Blog",
        });
      } else {
        throw new Error("blog_post requires either rotate:true or title+slug");
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
