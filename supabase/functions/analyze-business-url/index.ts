/**
 * analyze-business-url Edge Function
 * Scrapes a company URL via Firecrawl, then uses AI to analyze the business
 * and recommend software builds + industry insights.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("Firecrawl is not configured");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI is not configured");

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping business URL:", formattedUrl);

    // Step 1: Scrape with Firecrawl
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "links"],
        onlyMainContent: true,
      }),
    });

    if (!scrapeRes.ok) {
      const errData = await scrapeRes.text();
      console.error("Firecrawl error:", scrapeRes.status, errData);
      throw new Error("Could not analyze that URL. Please check the address and try again.");
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
    const pageTitle = metadata.title || formattedUrl;

    if (!markdown || markdown.length < 50) {
      throw new Error("Could not extract enough content from that site. Try a different URL.");
    }

    // Truncate content to avoid token limits
    const truncated = markdown.slice(0, 6000);

    console.log("Scraped", truncated.length, "chars. Analyzing with AI...");

    // Step 2: AI analysis
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a business technology advisor for OpenDraft, a marketplace of production-ready web applications. Analyze the business website content and recommend software that would help them grow. Be specific and actionable. Focus on tools they likely DON'T already have.`,
          },
          {
            role: "user",
            content: `Analyze this business website and recommend apps they should build or buy:

Website: ${formattedUrl}
Title: ${pageTitle}

Content:
${truncated}

Respond using the suggest_apps tool.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_apps",
              description: "Return business analysis with app recommendations",
              parameters: {
                type: "object",
                properties: {
                  business_name: { type: "string", description: "The business name" },
                  industry: { type: "string", description: "Primary industry/vertical" },
                  summary: { type: "string", description: "1-2 sentence business summary" },
                  insights: {
                    type: "array",
                    description: "3-4 key industry insights about their tech needs",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                  },
                  recommended_builds: {
                    type: "array",
                    description: "4-6 specific app/tool recommendations they should have",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "App name, e.g. 'Customer Booking Portal'" },
                        description: { type: "string", description: "What it does and why they need it" },
                        category: {
                          type: "string",
                          enum: ["saas_tool", "ai_app", "landing_page", "utility", "other"],
                        },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        search_query: {
                          type: "string",
                          description: "Search query to find this type of app on the marketplace",
                        },
                      },
                      required: ["name", "description", "category", "priority", "search_query"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["business_name", "industry", "summary", "insights", "recommended_builds"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_apps" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      throw new Error("Analysis failed. Please try again.");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured recommendations.");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        url: formattedUrl,
        pageTitle,
        ...analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-business-url error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
