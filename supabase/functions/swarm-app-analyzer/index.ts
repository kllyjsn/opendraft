import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { listing_id, trigger = "manual", user_id, focus_prompt } = body;

    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load project goals
    const { data: goals } = await supabase
      .from("project_goals")
      .select("goals_prompt, structured_goals")
      .eq("listing_id", listing_id)
      .limit(1);

    const goalsPrompt = goals?.[0]?.goals_prompt || listing.description;

    // Step 1: Capture live site context (screenshot + markdown + summary)
    let screenshotBase64: string | null = null;
    let screenshotUrl: string | null = null;
    let siteMarkdown: string | null = null;
    let siteSummary: string | null = null;

    const normalizeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const targetUrl = listing.demo_url ? normalizeUrl(listing.demo_url) : null;

    if (targetUrl && FIRECRAWL_API_KEY) {
      try {
        console.log("Capturing screenshot + content of:", targetUrl);
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: targetUrl,
            formats: ["screenshot", "markdown", "summary"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          screenshotBase64 = scrapeData.data?.screenshot || scrapeData.screenshot || null;
          siteMarkdown = scrapeData.data?.markdown || scrapeData.markdown || null;
          siteSummary = scrapeData.data?.summary || scrapeData.summary || null;
          console.log(
            "Screenshot:",
            screenshotBase64 ? "yes" : "no",
            "Markdown:",
            siteMarkdown ? `${siteMarkdown.length} chars` : "no",
            "Summary:",
            siteSummary ? "yes" : "no",
          );
        } else {
          console.error("Firecrawl scrape failed with status:", scrapeResp.status);
        }
      } catch (e) {
        console.error("Screenshot/content capture failed:", e);
      }
    }

    const hasLiveContext = Boolean(screenshotBase64 || (siteMarkdown && siteMarkdown.trim().length > 20));

    // Even without live context, we can still analyze using listing metadata (description, tech stack, goals, category)
    const hasMetadataContext = Boolean(listing.description && listing.description.trim().length > 10);

    // If we captured a screenshot, upload it
    if (screenshotBase64) {
      try {
        const binaryStr = atob(screenshotBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const path = `analysis/${listing_id}/${Date.now()}.png`;
        await supabase.storage.from("listing-screenshots").upload(path, bytes, {
          contentType: "image/png",
          upsert: true,
        });
        const { data: urlData } = supabase.storage.from("listing-screenshots").getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      } catch (e) {
        console.error("Screenshot upload failed:", e);
      }
    }

    // Create improvement cycle
    const { data: cycle } = await supabase
      .from("improvement_cycles")
      .insert({
        listing_id,
        user_id: user_id || listing.seller_id,
        trigger,
        screenshot_url: screenshotUrl,
        status: "analyzing",
      })
      .select()
      .single();

    // Step 2: AI Analysis — compare live site content + screenshot vs goals
    const truncatedMarkdown = siteMarkdown ? siteMarkdown.substring(0, 10000) : null;

    const analysisMessages: any[] = [
      {
        role: "system",
        content: `You are a senior product analyst and UX expert. You're analyzing a deployed web application to suggest improvements.

The app's stated goals/purpose:
"${goalsPrompt}"

${listing.tech_stack?.length ? `Tech stack: ${listing.tech_stack.join(", ")}` : ""}
${listing.category ? `Category: ${listing.category}` : ""}
${targetUrl ? `Live URL: ${targetUrl}` : ""}
${siteSummary ? `\nPAGE SUMMARY:\n${siteSummary}\n` : ""}

${truncatedMarkdown ? `\nACTUAL SCRAPED PAGE CONTENT:\n\`\`\`\n${truncatedMarkdown}\n\`\`\`\n` : ""}

${hasLiveContext ? `You must ground suggestions in the observed site content. Do NOT give generic advice.
For each suggestion, refer to a concrete element/page section/problem visible in the scraped content or screenshot.` : `No live site content was available. Analyze based on the listing metadata above (title, description, tech stack, category, goals).
Ground your suggestions in what this specific product IS — its category, its tech stack, its stated purpose. Be specific to THIS app, not generic.`}

Priorities:
1. Better align the app with its stated goals
2. ${hasLiveContext ? 'Improve UX/UI quality based on observed content' : 'Suggest UX/UI improvements specific to this type of app'}
3. Add missing features expected for this exact product
4. ${hasLiveContext ? 'Fix obvious issues or content gaps you can identify' : 'Identify likely gaps based on the description and category'}
5. Improve performance/accessibility where relevant

${focus_prompt ? `\nUSER'S SPECIFIC REQUEST: "${focus_prompt}"\nPrioritize this first, then other improvements.\n` : ""}
Be specific and implementation-ready.`
      },
    ];

    if (screenshotBase64) {
      analysisMessages.push({
        role: "user",
        content: [
          { type: "text", text: `Here is the live screenshot for "${listing.title}". Analyze it together with the scraped page content from the system prompt.` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
        ],
      });
    } else {
      analysisMessages.push({
        role: "user",
        content: `Analyze "${listing.title}" using the scraped live page content provided in the system prompt and suggest concrete improvements.`,
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: analysisMessages,
        tools: [{
          type: "function",
          function: {
            name: "improvement_analysis",
            description: "Return structured improvement suggestions",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "Current alignment with goals, 0-100" },
                overall_assessment: { type: "string", description: "Brief overall assessment" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      category: { type: "string", enum: ["ux", "feature", "performance", "design", "accessibility", "bug_fix"] },
                      priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      description: { type: "string" },
                      implementation_hint: { type: "string", description: "Specific code/design changes needed" },
                      risk_level: { type: "string", enum: ["low", "medium", "high"] },
                      estimated_effort: { type: "string", enum: ["small", "medium", "large"] },
                    },
                    required: ["title", "category", "priority", "description", "implementation_hint", "risk_level"]
                  }
                }
              },
              required: ["overall_score", "overall_assessment", "suggestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "improvement_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI analysis error ${aiResp.status}: ${errText}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured analysis output");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store suggestions as individual improvement_changes
    for (const suggestion of analysis.suggestions || []) {
      await supabase.from("improvement_changes").insert({
        cycle_id: cycle?.id,
        file_path: suggestion.category,
        change_type: "suggestion",
        description: `${suggestion.title}: ${suggestion.description}`,
        code: suggestion.implementation_hint,
        risk_level: suggestion.risk_level || "low",
      });
    }

    // Update cycle
    await supabase.from("improvement_cycles").update({
      status: "pending",
      analysis: {
        overall_score: analysis.overall_score,
        overall_assessment: analysis.overall_assessment,
      },
      suggestions: analysis.suggestions || [],
    }).eq("id", cycle?.id);

    // Notify owner
    await supabase.from("notifications").insert({
      user_id: user_id || listing.seller_id,
      type: "improvement_ready",
      title: `App analysis complete — Score: ${analysis.overall_score}/100 🔍`,
      message: `${analysis.suggestions?.length || 0} improvement suggestions for "${listing.title}"`,
      link: `/dashboard?tab=improvements`,
    });

    return new Response(JSON.stringify({
      success: true,
      cycle_id: cycle?.id,
      score: analysis.overall_score,
      suggestion_count: analysis.suggestions?.length || 0,
      screenshot_url: screenshotUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("App analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
