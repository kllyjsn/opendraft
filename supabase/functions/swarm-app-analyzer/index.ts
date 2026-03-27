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

    // Step 1: Screenshot the deployed app (if demo_url available)
    let screenshotBase64: string | null = null;
    let screenshotUrl: string | null = null;
    let siteMarkdown: string | null = null;

    if (listing.demo_url && FIRECRAWL_API_KEY) {
      try {
        console.log("Capturing screenshot + content of:", listing.demo_url);
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: listing.demo_url,
            formats: ["screenshot", "markdown"],
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          screenshotBase64 = scrapeData.data?.screenshot || scrapeData.screenshot || null;
          siteMarkdown = scrapeData.data?.markdown || scrapeData.markdown || null;
          console.log("Screenshot:", screenshotBase64 ? "yes" : "no", "Markdown:", siteMarkdown ? `${siteMarkdown.length} chars` : "no");
        }
      } catch (e) {
        console.error("Screenshot/content capture failed:", e);
      }
    }

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

    // Step 2: AI Analysis — compare screenshot + current state vs goals
    const analysisMessages: any[] = [
      {
        role: "system",
        content: `You are a senior product analyst and UX expert. You're analyzing a deployed web application to suggest improvements.

The app's stated goals/purpose:
"${goalsPrompt}"

${listing.tech_stack?.length ? `Tech stack: ${listing.tech_stack.join(", ")}` : ""}
${listing.category ? `Category: ${listing.category}` : ""}

Analyze the current state and suggest specific, actionable improvements that would:
1. Better align the app with its stated goals
2. Improve UX/UI quality
3. Add missing features that users would expect
4. Fix any obvious issues or gaps
5. Enhance performance or accessibility

${focus_prompt ? `\n**USER'S SPECIFIC REQUEST**: The owner specifically asked you to focus on: "${focus_prompt}"\nPrioritize suggestions that address this request first, then add other improvements.\n` : ""}
Be specific — include exact component names, CSS changes, or feature descriptions.
Prioritize suggestions by impact (high → low).`
      },
    ];

    if (screenshotBase64) {
      analysisMessages.push({
        role: "user",
        content: [
          { type: "text", text: `Here is a screenshot of the currently deployed app "${listing.title}". Analyze it against the goals and suggest improvements.` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
        ],
      });
    } else {
      analysisMessages.push({
        role: "user",
        content: `The app "${listing.title}" doesn't have a live screenshot available. Based on its description and goals, suggest improvements:\n\nDescription: ${listing.description}\nGoals: ${goalsPrompt}`,
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
