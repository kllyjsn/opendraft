/**
 * post-to-x Edge Function
 * -----------------------
 * Automatically posts to X/Twitter with media support.
 * Supports: new_listing, sale_milestone, trending, weekly_stats,
 *           blog_post, vibe_coding_report, custom
 *
 * Uses OAuth 1.0a for X API v2 + v1.1 media upload
 */

import { createOAuthHeader } from "./oauth.ts";
import { uploadMediaToTwitter } from "./media.ts";
import {
  newListingTweet,
  saleMilestoneTweet,
  trendingDigestTweet,
  weeklyStatsTweet,
} from "./templates.ts";
import { generateBlogTweet, generateVibeReportTweet } from "./ai-tweets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")!;
    const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
    const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      throw new Error("Twitter API credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    const body = await req.json();
    const postType = body.type;
    let tweetText = "";
    let screenshotUrl: string | null = null;

    if (postType === "new_listing" && body.listing_id) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=*`,
        { headers }
      );
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = newListingTweet(listings[0]);
      screenshotUrl = listings[0].screenshots?.[0] || null;

    } else if (postType === "sale_milestone" && body.listing_id && body.milestone) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=id,title,screenshots`,
        { headers }
      );
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = saleMilestoneTweet(listings[0], body.milestone);
      screenshotUrl = listings[0].screenshots?.[0] || null;

    } else if (postType === "trending") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast,view_count.desc.nullslast&limit=5&select=id,title,price,sales_count,screenshots`,
        { headers }
      );
      const listings = await res.json();
      if (!listings?.length) throw new Error("No trending listings");
      tweetText = trendingDigestTweet(listings);
      // Use the top trending listing's screenshot
      screenshotUrl = listings[0]?.screenshots?.[0] || null;

    } else if (postType === "weekly_stats") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [listingsRes, salesRes, buildersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?created_at=gte.${weekAgo}&status=eq.live&select=id`, {
          headers: { ...headers, Prefer: "count=exact" },
        }),
        fetch(`${supabaseUrl}/rest/v1/purchases?created_at=gte.${weekAgo}&select=id`, {
          headers: { ...headers, Prefer: "count=exact" },
        }),
        fetch(`${supabaseUrl}/rest/v1/profiles?created_at=gte.${weekAgo}&select=id`, {
          headers: { ...headers, Prefer: "count=exact" },
        }),
      ]);
      const listingsCount = parseInt(listingsRes.headers.get("content-range")?.split("/")?.[1] || "0");
      const salesCount = parseInt(salesRes.headers.get("content-range")?.split("/")?.[1] || "0");
      const buildersCount = parseInt(buildersRes.headers.get("content-range")?.split("/")?.[1] || "0");
      tweetText = weeklyStatsTweet({ listings: listingsCount, sales: salesCount, builders: buildersCount });

    } else if (postType === "blog_post") {
      if (body.rotate || !body.text) {
        tweetText = await generateBlogTweet(supabaseUrl, supabaseKey);
      } else if (body.text) {
        tweetText = body.text;
      } else {
        throw new Error("blog_post: pass rotate:true for AI-generated tweets or text for custom");
      }

    } else if (postType === "vibe_coding_report") {
      tweetText = await generateVibeReportTweet(supabaseUrl, supabaseKey);

    } else if (postType === "custom" && body.text) {
      tweetText = body.text;
      screenshotUrl = body.image_url || null;

    } else {
      throw new Error("Invalid post type. Use: new_listing, sale_milestone, trending, weekly_stats, blog_post, vibe_coding_report, or custom");
    }

    // Upload media if we have a screenshot
    let mediaId: string | null = null;
    if (screenshotUrl) {
      try {
        mediaId = await uploadMediaToTwitter(
          screenshotUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
        );
        console.log("Media uploaded, media_id:", mediaId);
      } catch (e) {
        console.error("Media upload failed, posting without image:", e);
      }
    }

    // Post tweet via X API v2
    const tweetUrl = "https://api.x.com/2/tweets";
    const authHeader = await createOAuthHeader(
      "POST", tweetUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
    );

    const tweetBody: Record<string, unknown> = { text: tweetText };
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] };
    }

    const tweetRes = await fetch(tweetUrl, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(tweetBody),
    });

    const tweetData = await tweetRes.json();
    if (!tweetRes.ok) {
      console.error("X API error:", JSON.stringify(tweetData));
      throw new Error(`X API error [${tweetRes.status}]: ${JSON.stringify(tweetData)}`);
    }

    console.log(`Posted to X: ${postType}`, tweetData.data?.id, mediaId ? "(with image)" : "(text only)");

    return new Response(JSON.stringify({
      success: true,
      tweet_id: tweetData.data?.id,
      text: tweetText,
      has_media: !!mediaId,
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
