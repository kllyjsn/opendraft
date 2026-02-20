/**
 * scrape-listing Edge Function
 * ----------------------------
 * Scrapes a project URL using Firecrawl and extracts structured listing
 * details (title, description, tech stack, category) to auto-fill the
 * listing creation form.
 *
 * Uses Firecrawl's scrape + branding + JSON extraction to pull:
 *  - Page title & description
 *  - Tech stack (from meta tags, page content)
 *  - Screenshot
 *  - Category suggestion
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Scraping service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping listing URL:", formattedUrl);

    // Scrape the page for markdown content, screenshot, and links
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          "markdown",
          "screenshot",
          "links",
          {
            type: "json",
            prompt: `Analyze this web application/project page and extract the following information:
- title: The name/title of the project or app (short, catchy)
- description: A compelling 2-4 sentence description of what this project does, its key features, and value proposition. Write it as if you're selling it on a marketplace.
- tech_stack: An array of technologies used (e.g. ["React", "TypeScript", "Tailwind", "Supabase"]). Infer from the page content, meta tags, or visible tech indicators.
- category: One of: "saas_tool", "ai_app", "landing_page", "utility", "game", "other". Pick the best fit.
- completeness: One of: "prototype", "mvp", "production_ready". Judge based on polish, features visible, and overall quality.`,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                tech_stack: { type: "array", items: { type: "string" } },
                category: {
                  type: "string",
                  enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"],
                },
                completeness: {
                  type: "string",
                  enum: ["prototype", "mvp", "production_ready"],
                },
              },
              required: ["title", "description"],
            },
          },
        ],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({
          success: false,
          error: scrapeData.error || `Scrape failed (${scrapeResponse.status})`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract data from response (Firecrawl nests under data)
    const result = scrapeData.data || scrapeData;
    const extracted = result.json || result.extract || {};
    const screenshot = result.screenshot || null;
    const metadata = result.metadata || {};

    // Build the response with extracted + fallback data
    const listing = {
      title: extracted.title || metadata.title || "",
      description: extracted.description || metadata.description || "",
      tech_stack: extracted.tech_stack || [],
      category: extracted.category || "other",
      completeness: extracted.completeness || "mvp",
      screenshot_url: screenshot,
      demo_url: formattedUrl,
      source_url: formattedUrl,
    };

    console.log("Extracted listing data:", JSON.stringify(listing, null, 2));

    return new Response(
      JSON.stringify({ success: true, listing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scrape-listing error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
