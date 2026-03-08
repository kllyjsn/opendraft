import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const SCREENSHOT_ANGLES = [
  "showing the main home/dashboard view with realistic content, data, and navigation fully populated",
  "showing a secondary view like settings, detail panel, or alternate screen with forms and interactive elements",
];

async function generateAIScreenshot(
  title: string,
  description: string,
  category: string,
  apiKey: string
): Promise<Uint8Array | null> {
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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    // AI generation is slow - process 1 at a time to avoid timeouts
    const batchSize = Math.min(body.batch_size || 1, 3);
    const offset = body.offset || 0;
    const mode = body.mode || "all"; // "all" | "duplicates_only" | "missing_only"

    let query = supabase
      .from("listings")
      .select("id, title, category, description, screenshots")
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (mode === "missing_only") {
      // Only listings with no screenshots at all
      query = query.or("screenshots.is.null,screenshots.eq.{}");
    }

    // Fetch more than needed for client-side filtering
    const fetchSize = mode === "duplicates_only" ? Math.max(batchSize * 50, 100) : batchSize;
    query = query.range(offset, offset + fetchSize - 1);

    const { data: rawListings, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    let listings = rawListings || [];

    // Filter for duplicates mode: pool URLs or SVG data URIs
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
    const results: { id: string; title: string; status: string }[] = [];

    for (const listing of listings) {
      try {
        const safeName = listing.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const ts = Date.now();

        console.log(`Generating AI screenshot for "${listing.title}"...`);

        const imageData = await generateAIScreenshot(
          listing.title,
          listing.description || listing.title,
          listing.category,
          LOVABLE_API_KEY
        );

        if (!imageData) {
          errors++;
          results.push({ id: listing.id, title: listing.title, status: "no_image_generated" });
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
          results.push({ id: listing.id, title: listing.title, status: "upload_error" });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("listing-screenshots")
          .getPublicUrl(filePath);

        const screenshots = [urlData.publicUrl];

        if (screenshots.length > 0) {
          const { error: updateErr } = await supabase
            .from("listings")
            .update({ screenshots })
            .eq("id", listing.id);

          if (updateErr) {
            errors++;
            results.push({ id: listing.id, title: listing.title, status: "update_error" });
          } else {
            updated++;
            results.push({ id: listing.id, title: listing.title, status: "success" });
          }
        } else {
          errors++;
          results.push({ id: listing.id, title: listing.title, status: "no_images_generated" });
        }
      } catch (e) {
        console.error(`Error processing ${listing.title}:`, e);
        errors++;
        results.push({ id: listing.id, title: listing.title, status: "error" });
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
