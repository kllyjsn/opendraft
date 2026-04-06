import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Capture a real screenshot of a live URL using Firecrawl.
 * Returns the screenshot as a base64 data URL or null on failure.
 */
async function captureRealScreenshot(
  url: string,
  firecrawlKey: string
): Promise<string | null> {
  try {
    console.log(`Capturing real screenshot of: ${url}`);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["screenshot"],
        waitFor: 5000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl screenshot failed (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    const screenshot = data.data?.screenshot || data.screenshot;

    if (!screenshot) {
      console.error("No screenshot returned from Firecrawl");
      return null;
    }

    return screenshot;
  } catch (e) {
    console.error("Firecrawl capture error:", e);
    return null;
  }
}

/**
 * Download a screenshot URL (or base64 data URL) and return raw bytes.
 */
async function screenshotToBytes(screenshot: string): Promise<Uint8Array | null> {
  try {
    // If it's a base64 data URL
    if (screenshot.startsWith("data:image")) {
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    }

    // If it's a regular URL, download it
    if (screenshot.startsWith("http")) {
      const resp = await fetch(screenshot);
      if (!resp.ok) return null;
      const buffer = await resp.arrayBuffer();
      return new Uint8Array(buffer);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: AI-generate a screenshot when no demo_url is available.
 */
async function generateAIScreenshot(
  title: string,
  description: string,
  category: string,
  apiKey: string
): Promise<Uint8Array | null> {
  const CATEGORY_PROMPTS: Record<string, string> = {
    saas_tool:
      "a polished SaaS dashboard web application with sidebar navigation, data tables, metric cards showing KPIs, and charts. Clean professional dark-mode UI with modern design",
    ai_app:
      "an AI-powered web application with a chat/prompt interface, response output panel, and sleek modern UI. Glassmorphism elements with gradient accents",
    utility:
      "a clean developer utility/tool web application with functional UI panels, input/output areas, and a focused minimal design. Professional and practical layout",
    landing_page:
      "a modern startup landing page with a bold hero section, feature cards, social proof section, and call-to-action buttons. Beautiful typography and gradients",
    game:
      "a browser-based game interface with colorful graphics, a game board/canvas area, score display, and playful UI elements. Bright engaging colors",
    other:
      "a beautiful productivity web application with organized cards, lists, and clean minimalist design. Warm neutral palette with elegant spacing",
  };

  const categoryVisual = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.other;

  const prompt = `Generate a high-fidelity UI screenshot of a web application called "${title}". 
The app is: ${description.slice(0, 200)}.
It should look like ${categoryVisual}, showing the main dashboard/home view with realistic content and navigation.
The screenshot must look like a real, polished web application with realistic UI components, actual text content, buttons, navigation, and data. 
Professional quality, 16:9 aspect ratio, photorealistic web UI screenshot. No browser chrome, just the app content.
Make it visually distinct and unique - use the app name "${title}" in the UI header/navbar.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    console.error(`AI generation failed: ${response.status} ${await response.text()}`);
    return null;
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageUrl || !imageUrl.startsWith("data:image")) {
    console.error("No valid image returned from AI");
    return null;
  }

  const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate: only allow service-role or anon key (cron/internal calls)
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (authHeader !== `Bearer ${supabaseKey}` && authHeader !== `Bearer ${anonKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Neither FIRECRAWL_API_KEY nor LOVABLE_API_KEY configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 1, 5);
    const offset = body.offset || 0;
    const mode = body.mode || "all"; // "all" | "duplicates_only" | "missing_only"

    let query = supabase
      .from("listings")
      .select("id, title, category, description, screenshots, demo_url, github_url")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (mode === "missing_only") {
      query = query.or("screenshots.is.null,screenshots.eq.{}");
    }

    const fetchSize = mode === "duplicates_only" ? Math.max(batchSize * 50, 100) : batchSize;
    query = query.range(offset, offset + fetchSize - 1);

    const { data: rawListings, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    let listings = rawListings || [];

    if (mode === "duplicates_only") {
      listings = listings.filter((l: any) => {
        const ss = l.screenshots as string[] | null;
        if (!ss || ss.length === 0) return true;
        return ss.some(
          (url: string) =>
            url.includes("/pool/") ||
            url.includes("/unique/") ||
            url.includes("/unique-v2/") ||
            url.includes(".svg") ||
            url.includes("data:image/svg") ||
            !url.includes("/ai-generated/")
        );
      }).slice(0, batchSize);
    }

    if (!listings.length) {
      return new Response(
        JSON.stringify({ message: "No listings need screenshots", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;
    let errors = 0;
    const results: { id: string; title: string; status: string; method: string }[] = [];

    for (const listing of listings) {
      try {
        const safeName = listing.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const ts = Date.now();

        let imageData: Uint8Array | null = null;
        let method = "none";

        // Priority 1: Capture real screenshot from demo_url using Firecrawl
        if (listing.demo_url && FIRECRAWL_API_KEY) {
          console.log(`Capturing real screenshot for "${listing.title}" from ${listing.demo_url}...`);
          const screenshot = await captureRealScreenshot(listing.demo_url, FIRECRAWL_API_KEY);
          if (screenshot) {
            imageData = await screenshotToBytes(screenshot);
            if (imageData) method = "firecrawl_capture";
          }
        }

        // Priority 2: Try GitHub pages URL if available
        if (!imageData && listing.github_url && FIRECRAWL_API_KEY) {
          // Try to derive a GitHub Pages or raw preview URL
          const ghUrl = listing.github_url as string;
          console.log(`Trying GitHub URL for "${listing.title}": ${ghUrl}...`);
          const screenshot = await captureRealScreenshot(ghUrl, FIRECRAWL_API_KEY);
          if (screenshot) {
            imageData = await screenshotToBytes(screenshot);
            if (imageData) method = "github_capture";
          }
        }

        // Priority 3: AI-generate as fallback (only if no real capture succeeded)
        if (!imageData && LOVABLE_API_KEY) {
          console.log(`No live URL for "${listing.title}", falling back to AI generation...`);
          imageData = await generateAIScreenshot(
            listing.title,
            listing.description || listing.title,
            listing.category,
            LOVABLE_API_KEY
          );
          if (imageData) method = "ai_generated";
        }

        if (!imageData) {
          errors++;
          results.push({ id: listing.id, title: listing.title, status: "no_image", method });
          continue;
        }

        const filePath = `ai-generated/${safeName}-${ts}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("listing-screenshots")
          .upload(filePath, imageData, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadErr) {
          console.error(`Upload error for ${listing.title}:`, uploadErr);
          errors++;
          results.push({ id: listing.id, title: listing.title, status: "upload_error", method });
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
          errors++;
          results.push({ id: listing.id, title: listing.title, status: "update_error", method });
        } else {
          updated++;
          results.push({ id: listing.id, title: listing.title, status: "success", method });
        }
      } catch (e) {
        console.error(`Error processing ${listing.title}:`, e);
        errors++;
        results.push({ id: listing.id, title: listing.title, status: "error", method: "unknown" });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${listings.length}: ${updated} updated, ${errors} errors`,
        processed: listings.length,
        updated,
        errors,
        next_offset: offset + batchSize,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-unique-screenshots error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
