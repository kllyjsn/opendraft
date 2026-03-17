/**
 * analyze-business-url Edge Function
 * Scrapes a company URL via Firecrawl, then uses AI to analyze the business
 * and recommend software builds + industry insights.
 * Falls back to AI-only analysis if Firecrawl is unavailable.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function tryScrape(url: string, firecrawlKey: string): Promise<{ markdown: string; pageTitle: string } | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown", "links"], onlyMainContent: true }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn("Firecrawl unavailable:", res.status, errText);
      return null;
    }
    const data = await res.json();
    const markdown = data.data?.markdown || data.markdown || "";
    const metadata = data.data?.metadata || data.metadata || {};
    if (markdown.length < 50) return null;
    return { markdown: markdown.slice(0, 6000), pageTitle: metadata.title || url };
  } catch (err) {
    console.warn("Firecrawl fetch failed:", err);
    return null;
  }
}

const TOOL_SCHEMA = {
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
          description: "4-6 specific app/tool recommendations they should build",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "App name, e.g. 'Customer Booking Portal'" },
              description: { type: "string", description: "What it does and why they need it" },
              category: { type: "string", enum: ["saas_tool", "ai_app", "landing_page", "utility", "other"] },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              search_query: { type: "string", description: "Search query to find this type of app on the marketplace" },
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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI is not configured");

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Extract domain for fallback
    const domain = new URL(formattedUrl).hostname.replace("www.", "");

    console.log("Analyzing business URL:", formattedUrl);

    // Try Firecrawl scrape, fall back gracefully
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    let scraped: { markdown: string; pageTitle: string } | null = null;
    if (firecrawlKey) {
      scraped = await tryScrape(formattedUrl, firecrawlKey);
    }

    const contentBlock = scraped
      ? `Website: ${formattedUrl}\nTitle: ${scraped.pageTitle}\n\nContent:\n${scraped.markdown}`
      : `Website URL: ${formattedUrl}\nDomain: ${domain}\n\nNote: I could not scrape the full page content. Analyze based on the domain name, common knowledge about this company, and general industry patterns. Be specific and helpful.`;

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
            content: `You are a business technology advisor for OpenDraft, a platform where users can generate and deploy production-ready web applications instantly. Analyze the business and recommend specific apps/tools they should BUILD to grow their business. Focus on internal tools, customer-facing apps, and automation they likely don't have. Be creative and specific — name the apps like real products.`,
          },
          {
            role: "user",
            content: `Analyze this business and recommend apps they should build:\n\n${contentBlock}\n\nRespond using the suggest_apps tool.`,
          },
        ],
        tools: [TOOL_SCHEMA],
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
        pageTitle: scraped?.pageTitle || domain,
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
