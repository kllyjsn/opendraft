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

const FETCH_TIMEOUT_MS = 20000;
const SCRAPE_TIMEOUT_MS = 9000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function getDomainName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function titleFromDomain(domain: string) {
  const core = domain.split(".")[0] || domain;
  return core
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFallbackAnalysis(formattedUrl: string, domain: string) {
  const businessName = titleFromDomain(domain);

  return {
    business_name: businessName,
    industry: "Digital Business Operations",
    summary: `${businessName} can accelerate growth with a focused stack of internal automation and customer-facing tools built on OpenDraft.`,
    insights: [
      {
        title: "Manual workflows create hidden drag",
        description: "Teams often lose velocity on repetitive approvals, onboarding, and reporting that can be automated quickly.",
      },
      {
        title: "Self-serve experiences convert better",
        description: "Customers expect instant answers, guided onboarding, and transparent progress dashboards without waiting on support.",
      },
      {
        title: "Operational visibility drives margin",
        description: "Real-time KPI dashboards help identify bottlenecks in acquisition, retention, and expansion before they become expensive.",
      },
      {
        title: "AI copilots improve team output",
        description: "Role-specific copilots reduce time spent on routine writing, research, and triage while preserving quality.",
      },
    ],
    recommended_builds: [
      {
        name: "Client Onboarding Command Center",
        description: "A guided onboarding portal with milestones, document collection, and handoff automation to speed activation.",
        category: "saas_tool",
        priority: "high",
        search_query: `${domain} onboarding portal workflow dashboard`,
      },
      {
        name: "AI Lead Qualification Assistant",
        description: "An AI intake flow that scores inbound leads, routes priority accounts, and drafts personalized follow-ups.",
        category: "ai_app",
        priority: "high",
        search_query: `${domain} ai lead qualification assistant`,
      },
      {
        name: "Customer Success Health Dashboard",
        description: "A live dashboard tracking adoption, risk flags, and renewal readiness so teams can intervene proactively.",
        category: "utility",
        priority: "medium",
        search_query: `${domain} customer success health dashboard`,
      },
      {
        name: "ROI Proof Landing Experience",
        description: "A conversion-focused landing flow with industry proof points, calculators, and direct demo capture.",
        category: "landing_page",
        priority: "medium",
        search_query: `${domain} roi calculator landing page`,
      },
    ],
    pageTitle: businessName,
    url: formattedUrl,
    analysis_source: "fallback",
  };
}

async function tryScrape(url: string, firecrawlKey: string): Promise<{ markdown: string; pageTitle: string } | null> {
  try {
    const res = await withTimeout(
      fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["markdown", "links"], onlyMainContent: true }),
      }),
      SCRAPE_TIMEOUT_MS,
      "firecrawl_scrape"
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Firecrawl unavailable:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const markdown = data.data?.markdown || data.markdown || "";
    const metadata = data.data?.metadata || data.metadata || {};
    if (markdown.length < 50) return null;

    return { markdown: markdown.slice(0, 4500), pageTitle: metadata.title || url };
  } catch (err) {
    console.warn("Firecrawl fetch failed:", err);
    return null;
  }
}

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "suggest_apps",
    description: "Return business analysis with app recommendations and brand identity",
    parameters: {
      type: "object",
      properties: {
        business_name: { type: "string", description: "The business name" },
        industry: { type: "string", description: "Primary industry/vertical" },
        summary: { type: "string", description: "1-2 sentence business summary" },
        brand_identity: {
          type: "object",
          description: "Visual brand identity extracted from the website",
          properties: {
            primary_color: { type: "string", description: "Primary brand color as hex, e.g. '#00ED64' for MongoDB green" },
            secondary_color: { type: "string", description: "Secondary brand color as hex" },
            accent_color: { type: "string", description: "Accent/highlight color as hex" },
            background_style: { type: "string", enum: ["light", "dark", "gradient"], description: "Overall background approach" },
            design_mood: { type: "string", description: "2-4 word design mood, e.g. 'technical minimalist', 'warm corporate', 'bold playful'" },
            typography_style: { type: "string", enum: ["geometric-sans", "humanist-sans", "rounded", "monospace-accent", "serif-accent", "system-default"], description: "Font personality that matches the brand" },
            border_radius: { type: "string", enum: ["sharp", "subtle", "rounded", "pill"], description: "Corner style matching brand feel" },
            visual_references: { type: "string", description: "1 sentence describing what the generated UI should feel like, referencing the source brand. E.g. 'MongoDB Atlas console — dark panels, green accents, data-dense layouts'" },
          },
          required: ["primary_color", "secondary_color", "accent_color", "background_style", "design_mood", "typography_style", "border_radius", "visual_references"],
          additionalProperties: false,
        },
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
      required: ["business_name", "industry", "summary", "brand_identity", "insights", "recommended_builds"],
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

    // Validate URL early
    const domain = getDomainName(formattedUrl);

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

    try {
      const aiRes = await withTimeout(
        fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content:
                  "You are a business technology advisor for OpenDraft, a platform where users can generate and deploy production-ready web applications instantly. Analyze the business and recommend specific apps/tools they should BUILD to grow their business. Focus on internal tools, customer-facing apps, and automation they likely do not have. Be creative and specific.",
              },
              {
                role: "user",
                content: `Analyze this business and recommend apps they should build:\n\n${contentBlock}\n\nRespond using the suggest_apps tool.`,
              },
            ],
            tools: [TOOL_SCHEMA],
            tool_choice: { type: "function", function: { name: "suggest_apps" } },
          }),
        }),
        FETCH_TIMEOUT_MS,
        "lovable_ai"
      );

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
        throw new Error("ai_request_failed");
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error("ai_missing_tool_args");
      }

      const analysis = JSON.parse(toolCall.function.arguments);

      return new Response(
        JSON.stringify({
          success: true,
          url: formattedUrl,
          pageTitle: scraped?.pageTitle || domain,
          analysis_source: "ai",
          ...analysis,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (aiError) {
      console.error("AI analysis failed, using fallback:", aiError);
      const fallback = buildFallbackAnalysis(formattedUrl, domain);

      return new Response(
        JSON.stringify({
          success: true,
          ...fallback,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-business-url error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
