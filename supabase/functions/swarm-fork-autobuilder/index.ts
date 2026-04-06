import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate: only allow service-role or anon key (cron/internal calls)
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (authHeader !== `Bearer ${supabaseKey}` && authHeader !== `Bearer ${anonKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { fork_request_id } = await req.json();
    if (!fork_request_id) {
      return new Response(JSON.stringify({ error: "fork_request_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load fork request
    const { data: forkReq, error: forkErr } = await supabase
      .from("fork_requests")
      .select("*")
      .eq("id", fork_request_id)
      .single();

    if (forkErr || !forkReq) {
      return new Response(JSON.stringify({ error: "Fork request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load parent listing
    const { data: parentListing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", forkReq.listing_id)
      .single();

    if (!parentListing) {
      return new Response(JSON.stringify({ error: "Parent listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load existing goals for parent listing (if any)
    const { data: existingGoals } = await supabase
      .from("project_goals")
      .select("goals_prompt, structured_goals")
      .eq("listing_id", parentListing.id)
      .maybeSingle();

    // Create improvement cycle record
    const { data: cycle } = await supabase
      .from("improvement_cycles")
      .insert({
        listing_id: parentListing.id,
        user_id: forkReq.builder_id,
        trigger: "fork_request",
        status: "pending",
        analysis: { fork_request_id, requester_id: forkReq.requester_id },
      })
      .select()
      .single();

    // Store goals from fork request
    await supabase.from("project_goals").upsert({
      user_id: forkReq.requester_id,
      listing_id: parentListing.id,
      goals_prompt: forkReq.description,
      structured_goals: { source: "fork_request", budget: forkReq.budget },
    }, { onConflict: "user_id,listing_id" });

    // Try to load parent source code from storage
    let parentSourceFiles: Record<string, string> = {};
    let hasSource = false;

    if (parentListing.file_path) {
      try {
        const { data: fileData } = await supabase.storage
          .from("listing-files")
          .download(parentListing.file_path);

        if (fileData) {
          const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
          const entries = Object.entries(zip.files);

          // Detect root prefix
          let rootPrefix = "";
          const dirs = entries.filter(([, f]) => f.dir).map(([n]) => n);
          if (dirs.length > 0) {
            const firstDir = dirs[0];
            const allUnderFirst = entries.every(([n]) => n.startsWith(firstDir));
            if (allUnderFirst) rootPrefix = firstDir;
          }

          for (const [path, file] of entries) {
            if (file.dir) continue;
            const cleanPath = rootPrefix ? path.replace(rootPrefix, "") : path;
            if (!cleanPath) continue;
            // Only include text files
            if (/\.(tsx?|jsx?|css|html|json|md|txt|yaml|toml|svg)$/i.test(cleanPath)) {
              try {
                parentSourceFiles[cleanPath] = await file.async("string");
              } catch { /* skip binary */ }
            }
          }
          hasSource = Object.keys(parentSourceFiles).length > 0;
        }
      } catch (e) {
        console.error("Failed to load parent source:", e);
      }
    }

    // Prepare source summary for AI (limit to key files to stay within context)
    const sourceContext = hasSource
      ? Object.entries(parentSourceFiles)
          .sort(([a], [b]) => {
            // Prioritize main app files
            const priority = (p: string) => {
              if (p.includes("App.tsx") || p.includes("App.jsx")) return 0;
              if (p.includes("main.tsx") || p.includes("main.jsx")) return 1;
              if (p.includes("index.css")) return 2;
              if (p.includes("package.json")) return 3;
              if (p.endsWith(".tsx") || p.endsWith(".jsx")) return 4;
              return 5;
            };
            return priority(a) - priority(b);
          })
          .slice(0, 30) // Limit files
          .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 3000)}`)
          .join("\n\n")
      : "No source code available. Generate a complete new app based on the parent listing description.";

    // AI: Generate fork modifications
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are an expert React/TypeScript developer. You're creating a customized fork of an existing app.

The parent app is: "${parentListing.title}" — ${parentListing.description}

${existingGoals?.goals_prompt ? `Original project goals: ${existingGoals.goals_prompt}` : ""}

The buyer has requested the following customizations. Implement ALL of them:

"${forkReq.description}"

Generate the COMPLETE modified source files. For each file, provide the full content (not diffs).
Use React + TypeScript + Tailwind CSS. Maintain the parent app's design language but add the requested features.
If no source code is available, create a complete app from scratch based on the parent description + requested changes.`
          },
          {
            role: "user",
            content: hasSource
              ? `Here is the parent app source code:\n\n${sourceContext}\n\nGenerate the modified version with the buyer's requested changes applied.`
              : `The parent app "${parentListing.title}" has no accessible source code. Create a complete new React + TypeScript + Tailwind app that:\n1. Matches the parent description: ${parentListing.description}\n2. Includes these customizations: ${forkReq.description}\n\nGenerate ALL source files needed.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "fork_result",
            description: "Return the forked app files and metadata",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Title for the forked listing" },
                description: { type: "string", description: "Description of the forked version" },
                changes_summary: { type: "string", description: "Summary of what was changed from the parent" },
                files: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string", description: "File path relative to project root" },
                      content: { type: "string", description: "Complete file content" },
                      change_type: { type: "string", enum: ["created", "modified", "unchanged"] },
                      change_description: { type: "string" }
                    },
                    required: ["path", "content", "change_type"]
                  }
                }
              },
              required: ["title", "description", "changes_summary", "files"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "fork_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output from AI");

    const result = JSON.parse(toolCall.function.arguments);
    const { title, description, changes_summary, files } = result;

    // Package into ZIP
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.path, file.content);
    }
    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    // Upload ZIP to storage
    const zipPath = `${forkReq.builder_id}/fork-${fork_request_id}-${Date.now()}.zip`;
    const { error: uploadErr } = await supabase.storage
      .from("listing-files")
      .upload(zipPath, zipBlob, { contentType: "application/zip", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    // Create draft listing
    const { data: newListing, error: listingErr } = await supabase
      .from("listings")
      .insert({
        title: title || `${parentListing.title} (Custom Fork)`,
        description: description || parentListing.description,
        price: forkReq.builder_fee || parentListing.price,
        pricing_type: parentListing.pricing_type,
        category: parentListing.category,
        completeness_badge: parentListing.completeness_badge,
        tech_stack: parentListing.tech_stack,
        built_with: parentListing.built_with,
        seller_id: forkReq.builder_id,
        file_path: zipPath,
        remixed_from: parentListing.id,
        status: "pending",
        screenshots: parentListing.screenshots,
      })
      .select()
      .single();

    if (listingErr) throw new Error(`Listing creation failed: ${listingErr.message}`);

    // Store individual changes for review
    const changedFiles = (files || []).filter((f: any) => f.change_type !== "unchanged");
    for (const file of changedFiles) {
      await supabase.from("improvement_changes").insert({
        cycle_id: cycle?.id,
        file_path: file.path,
        change_type: file.change_type,
        description: file.change_description || file.change_type,
        code: file.content.slice(0, 50000), // Limit stored code size
        risk_level: "low",
      });
    }

    // Update cycle with results
    await supabase.from("improvement_cycles").update({
      status: "pending",
      suggestions: { changes_summary, file_count: files.length, changed_count: changedFiles.length },
    }).eq("id", cycle?.id);

    // Update fork request status
    await supabase.from("fork_requests").update({
      status: "in_progress",
      delivered_listing_id: newListing.id,
    }).eq("id", fork_request_id);

    // Create remix chain entry
    await supabase.from("remix_chains").insert({
      parent_listing_id: parentListing.id,
      child_listing_id: newListing.id,
      remixer_id: forkReq.builder_id,
    });

    // Notify builder
    await supabase.from("notifications").insert({
      user_id: forkReq.builder_id,
      type: "fork_ready",
      title: "Fork auto-built! 🤖",
      message: `AI has generated a custom fork "${title}" based on the request. Review the changes before publishing.`,
      link: `/listing/${newListing.id}/edit`,
    });

    return new Response(JSON.stringify({
      success: true,
      listing_id: newListing.id,
      cycle_id: cycle?.id,
      title,
      changes_summary,
      file_count: files.length,
      changed_files: changedFiles.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Fork auto-builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
