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

    // Step 1b: Fetch actual source code from GitHub or storage
    let sourceCodeContext: string | null = null;

    if (listing.github_url) {
      try {
        // Extract owner/repo from GitHub URL
        const ghMatch = listing.github_url.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
        if (ghMatch) {
          const [, owner, repo] = ghMatch;
          const repoName = repo.replace(/\.git$/, "");
          console.log("Fetching source from GitHub:", owner, repoName);

          // Fetch key files in parallel: package.json, README, and src directory listing
          const filesToFetch = ["package.json", "README.md", "src/App.tsx", "src/pages/Index.tsx", "src/main.tsx", "index.html"];
          const fileContents: string[] = [];

          const fetchResults = await Promise.allSettled(
            filesToFetch.map(async (filePath) => {
              const resp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, {
                headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "OpenDraft-Analyzer" },
              });
              if (resp.ok) {
                const content = await resp.text();
                return { path: filePath, content: content.substring(0, 3000) };
              }
              return null;
            })
          );

          for (const result of fetchResults) {
            if (result.status === "fulfilled" && result.value) {
              fileContents.push(`--- ${result.value.path} ---\n${result.value.content}`);
            }
          }

          // Also fetch src directory tree
          try {
            const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`, {
              headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "OpenDraft-Analyzer" },
            });
            if (treeResp.ok) {
              const treeData = await treeResp.json();
              const srcFiles = (treeData.tree || [])
                .filter((f: any) => f.type === "blob" && (f.path.startsWith("src/") || f.path === "index.html" || f.path === "package.json"))
                .map((f: any) => f.path)
                .slice(0, 80);
              if (srcFiles.length) {
                fileContents.unshift(`--- FILE TREE (src/) ---\n${srcFiles.join("\n")}`);
              }
            }
          } catch (_) { /* ignore tree fetch errors */ }

          if (fileContents.length > 0) {
            sourceCodeContext = fileContents.join("\n\n").substring(0, 15000);
            console.log("Source code context:", sourceCodeContext.length, "chars from", fileContents.length, "files");
          }
        }
      } catch (e) {
        console.error("GitHub source fetch failed:", e);
      }
    }

    const hasLiveContext = Boolean(screenshotBase64 || (siteMarkdown && siteMarkdown.trim().length > 20));
    const hasSourceCode = Boolean(sourceCodeContext && sourceCodeContext.length > 50);

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
        content: `You are a senior product analyst, UX expert, and code reviewer. You're analyzing a web application to suggest improvements.

The app's stated goals/purpose:
"${goalsPrompt}"

${listing.tech_stack?.length ? `Tech stack: ${listing.tech_stack.join(", ")}` : ""}
${listing.category ? `Category: ${listing.category}` : ""}
${targetUrl ? `Live URL: ${targetUrl}` : ""}
${siteSummary ? `\nPAGE SUMMARY:\n${siteSummary}\n` : ""}

${truncatedMarkdown ? `\nLIVE SITE CONTENT:\n\`\`\`\n${truncatedMarkdown}\n\`\`\`\n` : ""}

${sourceCodeContext ? `\nACTUAL SOURCE CODE:\n\`\`\`\n${sourceCodeContext}\n\`\`\`\n` : ""}

${hasSourceCode ? `You have the ACTUAL SOURCE CODE of this application. Ground ALL suggestions in specific files, components, and code patterns you can see.
Reference specific file names, component names, missing imports, code smells, architectural issues, and concrete bugs.
Do NOT give generic advice — every suggestion must point to something real in the codebase.` : hasLiveContext ? `You must ground suggestions in the observed site content. Do NOT give generic advice.
For each suggestion, refer to a concrete element/page section/problem visible in the scraped content or screenshot.` : `Analyze based on the listing metadata above. Be as specific as possible to this app's category and tech stack.`}

Priorities:
1. ${hasSourceCode ? 'Find real bugs, code smells, missing error handling, and security issues in the actual code' : 'Better align the app with its stated goals'}
2. ${hasSourceCode ? 'Identify missing features by looking at the component structure and routes' : hasLiveContext ? 'Improve UX/UI quality based on observed content' : 'Suggest improvements specific to this type of app'}
3. ${hasSourceCode ? 'Spot UX problems from the component code (missing loading states, no error boundaries, poor accessibility)' : 'Add missing features expected for this exact product'}
4. ${hasSourceCode ? 'Suggest architectural improvements based on the file tree and code patterns' : 'Fix obvious issues or content gaps'}
5. Improve performance/accessibility where relevant

${focus_prompt ? `\nUSER'S SPECIFIC REQUEST: "${focus_prompt}"\nPrioritize this first, then other improvements.\n` : ""}
Be specific and implementation-ready. Reference actual file paths and code when possible.`
      },
    ];

    if (screenshotBase64) {
      analysisMessages.push({
        role: "user",
        content: [
          { type: "text", text: `Here is the live screenshot for "${listing.title}". Analyze it together with the source code and scraped content.` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
        ],
      });
    } else if (hasSourceCode) {
      analysisMessages.push({
        role: "user",
        content: `Analyze "${listing.title}" using the actual source code provided. Find real problems, missing features, and concrete improvements based on what the code actually does.`,
      });
    } else if (hasLiveContext) {
      analysisMessages.push({
        role: "user",
        content: `Analyze "${listing.title}" using the scraped live page content and suggest concrete improvements.`,
      });
    } else {
      analysisMessages.push({
        role: "user",
        content: `Analyze "${listing.title}" based on its listing metadata: "${listing.description}". Category: ${listing.category || 'unknown'}. Tech stack: ${listing.tech_stack?.join(', ') || 'unknown'}. Suggest concrete, specific improvements for this exact type of app.`,
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
