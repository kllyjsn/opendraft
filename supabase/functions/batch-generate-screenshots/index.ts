import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_VISUALS: Record<string, string> = {
  saas_tool: "a modern SaaS dashboard web application with charts, sidebar navigation, data tables, and a clean professional UI. Dark mode with indigo/purple accent colors",
  ai_app: "an AI-powered web application with a chat interface, neural network visualization, and modern glassmorphism design. Gradient purple-to-blue color scheme",
  utility: "a clean developer utility tool web application with a code editor, output panel, and minimal UI. Monospace fonts with a dark editor theme",
  landing_page: "a stunning startup landing page with hero section, gradient backgrounds, feature cards, and call-to-action buttons. Modern typography with vibrant colors",
  game: "a fun browser-based game interface with colorful graphics, score display, game controls, and playful animations. Bright and engaging color palette",
  other: "a beautiful personal productivity web application with cards, lists, and a clean minimalist design. Warm neutral colors with subtle accents",
};

const SCREENSHOT_VARIANTS = [
  "showing the main dashboard/home view with realistic data and content populated",
  "showing a detail view or settings panel with forms, modals, or secondary navigation",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 5, 10);

    // Find listings without screenshots
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, category, description")
      .eq("status", "live")
      .or("screenshots.is.null,screenshots.eq.{},screenshots.eq.{\"\"}") 
      .order("created_at", { ascending: false })
      .limit(batchSize);

    if (!listings?.length) {
      return new Response(JSON.stringify({ message: "No listings need screenshots", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; title: string; status: string; screenshots?: number }[] = [];

    for (const listing of listings) {
      try {
        const categoryVisual = CATEGORY_VISUALS[listing.category] || CATEGORY_VISUALS.other;
        const screenshots: string[] = [];

        for (let i = 0; i < 2; i++) {
          const variant = SCREENSHOT_VARIANTS[i];
          const prompt = `Generate a high-fidelity screenshot mockup of a web application called "${listing.title}". It should look like ${categoryVisual}, ${variant}. The screenshot should look like a real, polished web application running in a browser. Include realistic UI elements, text content, and data. Professional quality, 16:9 aspect ratio, photorealistic web UI screenshot.`;

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });

          if (!aiResponse.ok) {
            console.error(`AI generation failed for ${listing.title} screenshot ${i + 1}:`, await aiResponse.text());
            continue;
          }

          const aiData = await aiResponse.json();
          const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageUrl) {
            console.error(`No image returned for ${listing.title} screenshot ${i + 1}`);
            continue;
          }

          // Extract base64 data and upload to storage
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

          const safeName = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
          const filePath = `ai-screenshots/${safeName}-${i + 1}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("listing-screenshots")
            .upload(filePath, binaryData, {
              contentType: "image/png",
              upsert: false,
            });

          if (uploadError) {
            console.error(`Upload failed for ${listing.title}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from("listing-screenshots")
            .getPublicUrl(filePath);

          screenshots.push(publicUrlData.publicUrl);
        }

        if (screenshots.length > 0) {
          await supabase
            .from("listings")
            .update({ screenshots })
            .eq("id", listing.id);

          results.push({ id: listing.id, title: listing.title, status: "success", screenshots: screenshots.length });
        } else {
          results.push({ id: listing.id, title: listing.title, status: "no_images_generated" });
        }
      } catch (err) {
        console.error(`Error for ${listing.title}:`, err);
        results.push({ id: listing.id, title: listing.title, status: "error" });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;

    return new Response(JSON.stringify({
      message: `Generated screenshots for ${successCount}/${results.length} listings`,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("batch-generate-screenshots error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
