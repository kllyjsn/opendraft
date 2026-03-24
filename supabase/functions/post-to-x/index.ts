/**
 * post-to-x Edge Function — 5X UPGRADE
 * ─────────────────────────────────────
 * Now supports: threads, dynamic AI tweets, data drops, builder spotlights,
 * hot takes, and anti-repetition via recent post tracking.
 */

import { createOAuthHeader } from "./oauth.ts";
import { uploadMediaToTwitter } from "./media.ts";
import {
  newListingTweet,
  saleMilestoneTweet,
  trendingDigestTweet,
  weeklyStatsTweet,
  engagementHookTweet,
  fomoTweet,
  painPointTweet,
  gremlinTweet,
  questionTweet,
  successStoryTweet,
  directCtaTweet,
  dataDropTweet,
  builderSpotlightTweet,
  hotTakeTweet,
  miniThreadTweet,
  getTweetArtPrompt,
} from "./templates.ts";
import { generateBlogTweet, generateVibeReportTweet, generateDynamicTweet } from "./ai-tweets.ts";
import { tipTweet, insightTweet, discussionTweet, builderStoryTweet } from "./value-tweets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generate tweet art using Lovable AI image generation
 */
async function generateTweetArt(postType: string): Promise<string | null> {
  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) return null;

    const prompt = getTweetArtPrompt(postType);
    console.log(`Generating art for ${postType}: ${prompt.substring(0, 80)}...`);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: `Generate an image: ${prompt}. The image should be 1200x675 pixels (Twitter optimal), landscape orientation.` }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      console.error("Art generation failed:", aiRes.status);
      return null;
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) return null;

    console.log("Art generated successfully");
    return imageUrl;
  } catch (e) {
    console.error("Art generation error:", e);
    return null;
  }
}

/**
 * Upload a base64 data URL image to Twitter
 */
async function uploadBase64ToTwitter(
  dataUrl: string, ck: string, cs: string, at: string, ats: string
): Promise<string> {
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) throw new Error("Invalid data URL");

  const boundary = `----Boundary${crypto.randomUUID().replace(/-/g, "")}`;
  const multipartBody = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="media_data"`,
    "",
    base64Data,
    `--${boundary}`,
    `Content-Disposition: form-data; name="media_category"`,
    "",
    "tweet_image",
    `--${boundary}--`,
  ].join("\r\n");

  const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
  const authHeader = await createOAuthHeader("POST", MEDIA_UPLOAD_URL, ck, cs, at, ats);

  const uploadRes = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`Media upload failed [${uploadRes.status}]: ${JSON.stringify(uploadData)}`);
  return uploadData.media_id_string;
}

/**
 * Post a single tweet and return the tweet ID
 */
async function postTweet(
  text: string, mediaId: string | null,
  ck: string, cs: string, at: string, ats: string,
  replyToId?: string
): Promise<string> {
  const tweetUrl = "https://api.x.com/2/tweets";
  const authHeader = await createOAuthHeader("POST", tweetUrl, ck, cs, at, ats);

  const tweetBody: Record<string, unknown> = { text };
  if (mediaId) tweetBody.media = { media_ids: [mediaId] };
  if (replyToId) tweetBody.reply = { in_reply_to_tweet_id: replyToId };

  const res = await fetch(tweetUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(tweetBody),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`X API error [${res.status}]: ${JSON.stringify(data)}`);
  return data.data?.id || "";
}

/**
 * Post a thread (array of tweets as replies to each other)
 */
async function postThread(
  tweets: string[], mediaId: string | null,
  ck: string, cs: string, at: string, ats: string
): Promise<string[]> {
  const tweetIds: string[] = [];

  for (let i = 0; i < tweets.length; i++) {
    const mid = i === 0 ? mediaId : null; // Only attach image to first tweet
    const replyTo = i > 0 ? tweetIds[i - 1] : undefined;
    const id = await postTweet(tweets[i], mid, ck, cs, at, ats, replyTo);
    tweetIds.push(id);

    // Small delay between thread tweets to avoid rate limits
    if (i < tweets.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return tweetIds;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ck = Deno.env.get("TWITTER_CONSUMER_KEY")!;
    const cs = Deno.env.get("TWITTER_CONSUMER_SECRET")!;
    const at = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
    const ats = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

    if (!ck || !cs || !at || !ats) throw new Error("Twitter API credentials not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supaHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    const body = await req.json();
    const postType = body.type;
    const skipArt = body.skip_art === true;
    let tweetText = "";
    let threadTweets: string[] | null = null;
    let screenshotUrl: string | null = null;
    let generatedArtUrl: string | null = null;
    let resolvedType = postType;

    // ─── CONVERSION-FOCUSED POST TYPES ───────────────────────────

    if (postType === "engagement_hook") {
      tweetText = engagementHookTweet();

    } else if (postType === "fomo") {
      const [listingsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, {
          headers: { ...supaHeaders, Prefer: "count=exact" },
        }),
      ]);
      const appsCount = parseInt(listingsRes.headers.get("content-range")?.split("/")?.[1] || "1000");
      tweetText = fomoTweet({ apps: appsCount, browsing: 80 + Math.floor(Math.random() * 100) });

    } else if (postType === "pain_point") {
      tweetText = painPointTweet();

    } else if (postType === "gremlin_update") {
      tweetText = gremlinTweet();

    } else if (postType === "question") {
      tweetText = questionTweet();

    } else if (postType === "success_story") {
      tweetText = successStoryTweet();

    } else if (postType === "direct_cta") {
      tweetText = directCtaTweet();

    } else if (postType === "hot_take") {
      tweetText = hotTakeTweet();

    // ─── NEW: DATA DROP ──────────────────────────────────────────
    } else if (postType === "data_drop") {
      const [totalRes, weekSalesRes, weekListingsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/purchases?created_at=gte.${new Date(Date.now() - 7 * 86400000).toISOString()}&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/listings?created_at=gte.${new Date(Date.now() - 7 * 86400000).toISOString()}&status=eq.live&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
      ]);
      tweetText = dataDropTweet({
        totalApps: parseInt(totalRes.headers.get("content-range")?.split("/")?.[1] || "500"),
        weeklySales: parseInt(weekSalesRes.headers.get("content-range")?.split("/")?.[1] || "20"),
        weeklyListings: parseInt(weekListingsRes.headers.get("content-range")?.split("/")?.[1] || "15"),
      });

    // ─── NEW: BUILDER SPOTLIGHT ──────────────────────────────────
    } else if (postType === "builder_spotlight") {
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?total_sales=gt.0&order=total_sales.desc&limit=5&select=username,total_sales,user_id`,
        { headers: supaHeaders }
      );
      const builders = await profileRes.json().catch(() => []);
      const builder = builders.length > 0 ? builders[Math.floor(Math.random() * builders.length)] : null;

      if (builder) {
        const listingsRes = await fetch(
          `${supabaseUrl}/rest/v1/listings?seller_id=eq.${builder.user_id}&status=eq.live&order=sales_count.desc&limit=1&select=title`,
          { headers: supaHeaders }
        );
        const topApp = await listingsRes.json().catch(() => []);
        const listCountRes = await fetch(
          `${supabaseUrl}/rest/v1/listings?seller_id=eq.${builder.user_id}&status=eq.live&select=id`,
          { headers: { ...supaHeaders, Prefer: "count=exact" } }
        );
        const appCount = parseInt(listCountRes.headers.get("content-range")?.split("/")?.[1] || "1");

        tweetText = builderSpotlightTweet({
          name: builder.username,
          appCount: appCount,
          topApp: topApp[0]?.title,
          totalSales: builder.total_sales,
        });
      } else {
        tweetText = builderSpotlightTweet({});
      }

    // ─── NEW: MINI-THREAD ────────────────────────────────────────
    } else if (postType === "mini_thread") {
      threadTweets = miniThreadTweet();

    // ─── NEW: FULLY AI-GENERATED TWEET ───────────────────────────
    } else if (postType === "ai_generated") {
      tweetText = await generateDynamicTweet(supabaseUrl, supabaseKey);

    // ─── NEW VALUE-FIRST POST TYPES ─────────────────────────────
    } else if (postType === "tip") {
      tweetText = tipTweet();
    } else if (postType === "insight") {
      tweetText = insightTweet();
    } else if (postType === "discussion") {
      tweetText = discussionTweet();
    } else if (postType === "builder_story") {
      tweetText = builderStoryTweet();

    // ─── SMART RANDOM — rebalanced: 50% value, 50% promotional ──
    } else if (postType === "random_conversion") {
      // VALUE-FIRST types (no hard CTA — build trust & followers)
      // PROMOTIONAL types (include CTA — drive traffic)
      const weightedTypes = [
        // Value-first (50% of total weight)
        { type: "tip", weight: 12 },
        { type: "insight", weight: 12 },
        { type: "discussion", weight: 10 },
        { type: "builder_story", weight: 8 },
        { type: "ai_generated", weight: 10 },  // now value-first with 70% no-CTA
        // Promotional (50% of total weight)
        { type: "engagement_hook", weight: 6 },
        { type: "pain_point", weight: 5 },
        { type: "hot_take", weight: 6 },
        { type: "success_story", weight: 5 },
        { type: "blog_post", weight: 8 },
        { type: "mini_thread", weight: 6 },
        { type: "gremlin_update", weight: 4 },
        { type: "fomo", weight: 3 },
        { type: "direct_cta", weight: 3 },
        { type: "data_drop", weight: 2 },
      ];

      // Anti-repetition: check recent posts and de-weight
      let recentTypes: string[] = [];
      try {
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const recentRes = await fetch(
          `${supabaseUrl}/rest/v1/swarm_tasks?agent_type=eq.social_poster&created_at=gte.${since}&order=created_at.desc&limit=8&select=output`,
          { headers: supaHeaders }
        );
        const recentTasks = await recentRes.json().catch(() => []);
        recentTypes = recentTasks.map((t: any) => t.output?.resolved_type || t.output?.post_type || "").filter(Boolean);
      } catch {}

      // De-weight recently used types
      const adjusted = weightedTypes.map(wt => ({
        ...wt,
        weight: recentTypes.includes(wt.type) ? Math.max(1, wt.weight * 0.3) : wt.weight,
      }));

      const totalWeight = adjusted.reduce((sum, t) => sum + t.weight, 0);
      let roll = Math.random() * totalWeight;
      let chosen = adjusted[0].type;
      for (const wt of adjusted) {
        roll -= wt.weight;
        if (roll <= 0) { chosen = wt.type; break; }
      }

      resolvedType = chosen;
      console.log(`Random chose: ${chosen} (de-weighted: ${recentTypes.join(",")})`);

      // Handle chosen type
      if (chosen === "tip") tweetText = tipTweet();
      else if (chosen === "insight") tweetText = insightTweet();
      else if (chosen === "discussion") tweetText = discussionTweet();
      else if (chosen === "builder_story") tweetText = builderStoryTweet();
      else if (chosen === "engagement_hook") tweetText = engagementHookTweet();
      else if (chosen === "fomo") tweetText = fomoTweet({ browsing: 80 + Math.floor(Math.random() * 100) });
      else if (chosen === "pain_point") tweetText = painPointTweet();
      else if (chosen === "gremlin_update") tweetText = gremlinTweet();
      else if (chosen === "question") tweetText = questionTweet();
      else if (chosen === "success_story") tweetText = successStoryTweet();
      else if (chosen === "direct_cta") tweetText = directCtaTweet();
      else if (chosen === "hot_take") tweetText = hotTakeTweet();
      else if (chosen === "ai_generated") tweetText = await generateDynamicTweet(supabaseUrl, supabaseKey);
      else if (chosen === "blog_post") tweetText = await generateBlogTweet(supabaseUrl, supabaseKey);
      else if (chosen === "mini_thread") threadTweets = miniThreadTweet();
      else if (chosen === "data_drop") {
        const totalRes = await fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } });
        tweetText = dataDropTweet({ totalApps: parseInt(totalRes.headers.get("content-range")?.split("/")?.[1] || "500") });
      } else tweetText = tipTweet();

    // ─── ORIGINAL POST TYPES ─────────────────────────────────────

    } else if (postType === "new_listing" && body.listing_id) {
      const res = await fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=*`, { headers: supaHeaders });
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = newListingTweet(listings[0]);
      screenshotUrl = listings[0].screenshots?.[0] || null;

    } else if (postType === "sale_milestone" && body.listing_id && body.milestone) {
      const res = await fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${body.listing_id}&select=id,title,screenshots`, { headers: supaHeaders });
      const listings = await res.json();
      if (!listings?.[0]) throw new Error("Listing not found");
      tweetText = saleMilestoneTweet(listings[0], body.milestone);
      screenshotUrl = listings[0].screenshots?.[0] || null;

    } else if (postType === "trending") {
      const res = await fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&order=sales_count.desc.nullslast,view_count.desc.nullslast&limit=5&select=id,title,price,sales_count,screenshots`, { headers: supaHeaders });
      const listings = await res.json();
      if (!listings?.length) throw new Error("No trending listings");
      tweetText = trendingDigestTweet(listings);
      screenshotUrl = listings[0]?.screenshots?.[0] || null;

    } else if (postType === "weekly_stats") {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [listingsRes, salesRes, buildersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?created_at=gte.${weekAgo}&status=eq.live&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/purchases?created_at=gte.${weekAgo}&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/profiles?created_at=gte.${weekAgo}&select=id`, { headers: { ...supaHeaders, Prefer: "count=exact" } }),
      ]);
      tweetText = weeklyStatsTweet({
        listings: parseInt(listingsRes.headers.get("content-range")?.split("/")?.[1] || "0"),
        sales: parseInt(salesRes.headers.get("content-range")?.split("/")?.[1] || "0"),
        builders: parseInt(buildersRes.headers.get("content-range")?.split("/")?.[1] || "0"),
      });

    } else if (postType === "blog_post") {
      tweetText = body.text || await generateBlogTweet(supabaseUrl, supabaseKey);
      if (!skipArt) generatedArtUrl = await generateTweetArt("blog_post");

    } else if (postType === "vibe_coding_report") {
      tweetText = await generateVibeReportTweet(supabaseUrl, supabaseKey);

    } else if (postType === "custom" && body.text) {
      tweetText = body.text;
      screenshotUrl = body.image_url || null;

    } else {
      throw new Error("Invalid post type. Supported: engagement_hook, fomo, pain_point, gremlin_update, question, success_story, direct_cta, hot_take, data_drop, builder_spotlight, mini_thread, ai_generated, random_conversion, new_listing, sale_milestone, trending, weekly_stats, blog_post, vibe_coding_report, custom");
    }

    // ─── Generate art for types that don't have images ───────────
    const noArtTypes = new Set(["random_conversion", "blog_post", "custom", "question", "mini_thread", "tip", "insight", "discussion", "builder_story"]);
    if (!screenshotUrl && !generatedArtUrl && !skipArt && !noArtTypes.has(postType)) {
      // 70% chance to generate art (up from 60%)
      if (Math.random() < 0.7) {
        generatedArtUrl = await generateTweetArt(resolvedType || postType);
      }
    }

    // ─── Upload media ────────────────────────────────────────────
    let mediaId: string | null = null;

    if (generatedArtUrl) {
      try {
        mediaId = await uploadBase64ToTwitter(generatedArtUrl, ck, cs, at, ats);
        console.log("AI art uploaded, media_id:", mediaId);
      } catch (e) {
        console.error("AI art upload failed, posting without image:", e);
      }
    } else if (screenshotUrl) {
      try {
        mediaId = await uploadMediaToTwitter(screenshotUrl, ck, cs, at, ats);
        console.log("Screenshot uploaded, media_id:", mediaId);
      } catch (e) {
        console.error("Media upload failed, posting without image:", e);
      }
    }

    // ─── Post tweet or thread ────────────────────────────────────
    if (threadTweets && threadTweets.length > 1) {
      // Post as a thread
      if (!skipArt && !generatedArtUrl && Math.random() < 0.7) {
        generatedArtUrl = await generateTweetArt(resolvedType || "engagement_hook");
        if (generatedArtUrl) {
          try {
            mediaId = await uploadBase64ToTwitter(generatedArtUrl, ck, cs, at, ats);
          } catch (e) {
            console.error("Thread art upload failed:", e);
          }
        }
      }

      const tweetIds = await postThread(threadTweets, mediaId, ck, cs, at, ats);
      console.log(`Thread posted: ${tweetIds.length} tweets, type=${resolvedType}`);

      return new Response(JSON.stringify({
        success: true,
        tweet_ids: tweetIds,
        text: threadTweets[0],
        thread_length: threadTweets.length,
        has_media: !!mediaId,
        art_generated: !!generatedArtUrl,
        type: resolvedType,
        is_thread: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single tweet
    const tweetId = await postTweet(tweetText, mediaId, ck, cs, at, ats);
    console.log(`Posted to X: ${resolvedType}`, tweetId, mediaId ? "(with art)" : "(text only)");

    return new Response(JSON.stringify({
      success: true,
      tweet_id: tweetId,
      text: tweetText,
      has_media: !!mediaId,
      art_generated: !!generatedArtUrl,
      type: resolvedType,
      is_thread: false,
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
