import { getCorsHeaders } from "../_shared/cors.ts";
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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    // Step 1: Scrape the main page for content + screenshot + extraction
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "screenshot", "extract"],
        extract: {
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
        onlyMainContent: true,
        waitFor: 5000,
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

    // Extract data from main scrape
    const result = scrapeData.data || scrapeData;
    const extracted = result.extract || result.json || {};
    const mainScreenshot = result.screenshot || null;
    const metadata = result.metadata || {};

    // Step 2: Map the site to find additional pages for screenshots
    const screenshots: string[] = [];
    if (mainScreenshot) screenshots.push(mainScreenshot);

    try {
      console.log("Mapping site for additional pages...");
      const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          limit: 20,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapResponse.json();

      if (mapResponse.ok && mapData.links?.length) {
        // Filter out the main URL and pick up to 2 additional pages
        const additionalUrls = (mapData.links as string[])
          .filter((link: string) => {
            const l = link.toLowerCase();
            return (
              l !== formattedUrl.toLowerCase() &&
              !l.includes("/login") &&
              !l.includes("/signup") &&
              !l.includes("/auth") &&
              !l.includes("/terms") &&
              !l.includes("/privacy") &&
              !l.includes("/api/") &&
              !l.endsWith(".xml") &&
              !l.endsWith(".json")
            );
          })
          .slice(0, 2);

        console.log("Scraping additional pages for screenshots:", additionalUrls);

        // Scrape additional pages in parallel for screenshots only
        const additionalScrapes = await Promise.allSettled(
          additionalUrls.map((pageUrl: string) =>
            fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: pageUrl,
                formats: ["screenshot"],
                waitFor: 3000,
              }),
            }).then((r) => r.json())
          )
        );

        for (const result of additionalScrapes) {
          if (result.status === "fulfilled") {
            const s = result.value?.data?.screenshot || result.value?.screenshot;
            if (s) screenshots.push(s);
          }
        }
      }
    } catch (mapErr) {
      console.warn("Failed to get additional screenshots (non-fatal):", mapErr);
    }

    console.log(`Collected ${screenshots.length} screenshot(s)`);

    // Build the response with extracted + fallback data
    const listing = {
      title: extracted.title || metadata.title || "",
      description: extracted.description || metadata.description || "",
      tech_stack: extracted.tech_stack || [],
      category: extracted.category || "other",
      completeness: extracted.completeness || "mvp",
      screenshot_url: screenshots[0] || null,
      screenshots: screenshots.slice(0, 3),
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
