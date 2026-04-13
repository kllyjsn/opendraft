import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * lambda-screenshot Edge Function
 * --------------------------------
 * Proxies screenshot requests to an external AWS Lambda service.
 *
 * Flow:
 *   1. Receives a listing ID (or direct ZIP URL)
 *   2. Looks up the listing's file_path in storage to get a signed URL
 *   3. Sends the signed URL to your AWS Lambda
 *   4. Lambda: downloads ZIP → npm install → npm run build → Puppeteer screenshot
 *   5. Receives screenshot back, uploads to storage, updates listing
 *
 * Required secrets:
 *   - LAMBDA_SCREENSHOT_URL: Your AWS API Gateway endpoint
 *   - LAMBDA_SCREENSHOT_KEY: (optional) API key for your Lambda
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LAMBDA_URL = Deno.env.get("LAMBDA_SCREENSHOT_URL");
    if (!LAMBDA_URL) {
      return new Response(
        JSON.stringify({ error: "LAMBDA_SCREENSHOT_URL not configured. Set this secret to your AWS API Gateway endpoint." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LAMBDA_KEY = Deno.env.get("LAMBDA_SCREENSHOT_KEY") || "";

    const body = await req.json().catch(() => ({}));
    const { listing_id, zip_url, batch } = body;

    // Support single listing or batch mode
    const listingIds: string[] = batch
      ? batch
      : listing_id
        ? [listing_id]
        : [];

    // If a direct zip_url is provided (for testing), skip DB lookup
    if (zip_url && !listing_id) {
      const screenshot = await callLambda(LAMBDA_URL, LAMBDA_KEY, {
        zip_url,
        title: body.title || "Test",
      });

      return new Response(
        JSON.stringify({ success: !!screenshot, screenshot_url: screenshot }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!listingIds.length) {
      // Auto-discover: find listings with ZIP files but no good screenshots
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, file_path, screenshots, demo_url")
        .eq("status", "live")
        .not("file_path", "is", null)
        .order("created_at", { ascending: false })
        .limit(body.limit || 5);

      if (listings?.length) {
        for (const l of listings) listingIds.push(l.id);
      }
    }

    if (!listingIds.length) {
      return new Response(
        JSON.stringify({ message: "No listings to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch listing details
    const { data: listings, error: fetchErr } = await supabase
      .from("listings")
      .select("id, title, file_path, demo_url, category, screenshots")
      .in("id", listingIds);

    if (fetchErr) throw fetchErr;

    const results: { id: string; title: string; status: string; method?: string }[] = [];

    for (const listing of listings || []) {
      try {
        // Get a signed URL for the ZIP file
        let fileUrl: string | null = null;

        if (listing.file_path) {
          const { data: signedData, error: signErr } = await supabase.storage
            .from("listing-files")
            .createSignedUrl(listing.file_path, 600); // 10-minute expiry

          if (!signErr && signedData?.signedUrl) {
            fileUrl = signedData.signedUrl;
          }
        }

        if (!fileUrl) {
          // No ZIP file available — skip or try demo_url fallback
          if (listing.demo_url) {
            results.push({
              id: listing.id,
              title: listing.title,
              status: "skipped_no_zip_has_demo_url",
              method: "use_firecrawl_instead",
            });
          } else {
            results.push({
              id: listing.id,
              title: listing.title,
              status: "skipped_no_file",
            });
          }
          continue;
        }

        console.log(`Sending "${listing.title}" to Lambda for screenshot...`);

        const screenshotUrl = await callLambda(LAMBDA_URL, LAMBDA_KEY, {
          zip_url: fileUrl,
          title: listing.title,
          category: listing.category,
        });

        if (!screenshotUrl) {
          results.push({ id: listing.id, title: listing.title, status: "lambda_failed" });
          continue;
        }

        // Download the screenshot from Lambda's response and upload to our storage
        const imageData = await downloadImage(screenshotUrl);
        if (!imageData) {
          results.push({ id: listing.id, title: listing.title, status: "download_failed" });
          continue;
        }

        const safeName = listing.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const filePath = `lambda-screenshots/${safeName}-${Date.now()}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("listing-screenshots")
          .upload(filePath, imageData, { contentType: "image/png", upsert: false });

        if (uploadErr) {
          console.error(`Upload error for ${listing.title}:`, uploadErr);
          results.push({ id: listing.id, title: listing.title, status: "upload_error" });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("listing-screenshots")
          .getPublicUrl(filePath);

        const { error: updateErr } = await supabase
          .from("listings")
          .update({ screenshots: [urlData.publicUrl] })
          .eq("id", listing.id);

        if (updateErr) {
          results.push({ id: listing.id, title: listing.title, status: "db_update_error" });
        } else {
          results.push({
            id: listing.id,
            title: listing.title,
            status: "success",
            method: "lambda_render",
          });
        }
      } catch (e) {
        console.error(`Error processing ${listing.title}:`, e);
        results.push({ id: listing.id, title: listing.title, status: "error" });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length}: ${successCount} succeeded`,
        processed: results.length,
        success: successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("lambda-screenshot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Call the AWS Lambda screenshot service.
 *
 * Expected Lambda contract:
 *   POST body: { zip_url: string, title: string, category?: string }
 *   Response:  { screenshot_url: string } or { screenshot: "base64..." }
 *
 * Returns a URL or base64 data URL for the screenshot, or null on failure.
 */
async function callLambda(
  lambdaUrl: string,
  apiKey: string,
  payload: { zip_url: string; title: string; category?: string }
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(lambdaUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Lambda returned ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = await response.json();

    // Support both URL and base64 responses
    if (data.screenshot_url) return data.screenshot_url;
    if (data.screenshot) {
      return data.screenshot.startsWith("data:")
        ? data.screenshot
        : `data:image/png;base64,${data.screenshot}`;
    }

    console.error("Lambda response missing screenshot_url or screenshot field");
    return null;
  } catch (e) {
    console.error("Lambda call failed:", e);
    return null;
  }
}

/**
 * Download an image from a URL (or decode base64) into bytes.
 */
async function downloadImage(urlOrBase64: string): Promise<Uint8Array | null> {
  try {
    if (urlOrBase64.startsWith("data:image")) {
      const base64 = urlOrBase64.replace(/^data:image\/\w+;base64,/, "");
      return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    }

    const resp = await fetch(urlOrBase64);
    if (!resp.ok) return null;
    return new Uint8Array(await resp.arrayBuffer());
  } catch {
    return null;
  }
}
