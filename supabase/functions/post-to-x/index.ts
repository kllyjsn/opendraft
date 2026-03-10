/**
 * post-to-x Edge Function
 * -----------------------
 * Posts to X/Twitter with AI-generated art and highly varied templates.
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
  getTweetArtPrompt,
} from "./templates.ts";
import { generateBlogTweet, generateVibeReportTweet } from "./ai-tweets.ts";

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
    if (!lovableApiKey) {
      console.log("No LOVABLE_API_KEY, skipping art generation");
      return null;
    }

    const prompt = getTweetArtPrompt(postType);
    console.log(`Generating tweet art for ${postType}: ${prompt.substring(0, 80)}...`);

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
      console.error("AI art generation failed:", aiRes.status, await aiRes.text());
      return null;
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.log("AI returned no image");
      return null;
    }

    console.log("AI art generated successfully");
    return imageUrl; // data:image/png;base64,...
  } catch (e) {
    console.error("Art generation error:", e);
    return null;
  }
}

/**
 * Upload a base64 data URL image to Twitter
 */
async function uploadBase64ToTwitter(
  dataUrl: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<string> {
  // Extract base64 data from data URL
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
  const authHeader = await createOAuthHeader(
    "POST", MEDIA_UPLOAD_URL,
    consumerKey, consumerSecret, accessToken, accessTokenSecret
  );

  const uploadRes = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Media upload failed [${uploadRes.status}]: ${JSON.stringify(uploadData)}`);
  }

  return uploadData.media_id_string;
}

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
    const skipArt = body.skip_art === true;
    let tweetText = "";
    let screenshotUrl: string | null = null;
    let generatedArtUrl: string | null = null;

    // ─── CONVERSION-FOCUSED POST TYPES ───────────────────────────
    
    if (postType === "engagement_hook") {
      tweetText = engagementHookTweet();
      
    } else if (postType === "fomo") {
      const [listingsRes, profilesRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?status=eq.live&select=id`, {
          headers: { ...headers, Prefer: "count=exact" },
        }),
        fetch(`${supabaseUrl}/rest/v1/profiles?select=id`, {
          headers: { ...headers, Prefer: "count=exact" },
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
      
    } else if (postType === "random_conversion") {
      const types = ["engagement_hook", "fomo", "pain_point", "gremlin_update", "question", "success_story", "direct_cta"];
      const chosen = types[Math.floor(Math.random() * types.length)];
      
      if (chosen === "engagement_hook") tweetText = engagementHookTweet();
      else if (chosen === "fomo") tweetText = fomoTweet({ browsing: 80 + Math.floor(Math.random() * 100) });
      else if (chosen === "pain_point") tweetText = painPointTweet();
      else if (chosen === "gremlin_update") tweetText = gremlinTweet();
      else if (chosen === "question") tweetText = questionTweet();
      else if (chosen === "success_story") tweetText = successStoryTweet();
      else tweetText = directCtaTweet();

      // Generate art for the chosen type
      if (!skipArt) {
        generatedArtUrl = await generateTweetArt(chosen);
      }

    // ─── ORIGINAL POST TYPES ─────────────────────────────────────
    
    } else if (postType === "new_listing" && body.listing_id) {
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
      if (!skipArt) {
        generatedArtUrl = await generateTweetArt("blog_post");
      }

    } else if (postType === "vibe_coding_report") {
      tweetText = await generateVibeReportTweet(supabaseUrl, supabaseKey);

    } else if (postType === "custom" && body.text) {
      tweetText = body.text;
      screenshotUrl = body.image_url || null;

    } else {
      throw new Error("Invalid post type. Use: engagement_hook, fomo, pain_point, gremlin_update, question, success_story, direct_cta, random_conversion, new_listing, sale_milestone, trending, weekly_stats, blog_post, vibe_coding_report, or custom");
    }

    // ─── Generate art for types that don't have images ───────────
    if (!screenshotUrl && !generatedArtUrl && !skipArt && postType !== "random_conversion" && postType !== "blog_post" && postType !== "custom" && postType !== "question") {
      // 60% chance to generate art (keeps some tweets text-only for variety)
      if (Math.random() < 0.6) {
        generatedArtUrl = await generateTweetArt(postType);
      }
    }

    // ─── Upload media ────────────────────────────────────────────
    let mediaId: string | null = null;
    
    if (generatedArtUrl) {
      try {
        mediaId = await uploadBase64ToTwitter(
          generatedArtUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
        );
        console.log("AI art uploaded, media_id:", mediaId);
      } catch (e) {
        console.error("AI art upload failed, posting without image:", e);
      }
    } else if (screenshotUrl) {
      try {
        mediaId = await uploadMediaToTwitter(
          screenshotUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
        );
        console.log("Screenshot uploaded, media_id:", mediaId);
      } catch (e) {
        console.error("Media upload failed, posting without image:", e);
      }
    }

    // ─── Post tweet ──────────────────────────────────────────────
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

    console.log(`Posted to X: ${postType}`, tweetData.data?.id, mediaId ? "(with AI art)" : "(text only)");

    return new Response(JSON.stringify({
      success: true,
      tweet_id: tweetData.data?.id,
      text: tweetText,
      has_media: !!mediaId,
      art_generated: !!generatedArtUrl,
      type: postType,
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
