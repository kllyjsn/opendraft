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
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { suggestion, source_task_id, category } = body;

    if (!suggestion || !suggestion.implementation) {
      return new Response(JSON.stringify({ error: "Missing suggestion with implementation details" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "deploy_suggestion",
      action: "generate_code",
      status: "running",
      input: { suggestion, source_task_id, category },
      triggered_by: "manual",
    }).select().single();

    const taskId = task?.id;

    try {
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
              content: `You are a code generation agent for OpenDraft, a React + Vite + Tailwind + Supabase marketplace. 
              
Given a product improvement suggestion, generate the exact code changes needed to implement it.

The platform uses:
- React 18 + TypeScript + Vite
- Tailwind CSS with shadcn/ui design system
- Supabase for backend (tables: listings, profiles, purchases, etc.)
- Framer Motion for animations
- React Router for routing

Generate practical, production-ready code. Include file paths. If it's a SQL change, provide the migration. If it's a React component change, provide the full diff.`
            },
            {
              role: "user",
              content: `Implement this suggestion:

Title: ${suggestion.title || suggestion.feature || suggestion.area || suggestion.page_or_listing || suggestion.listing_title || "Improvement"}
Category: ${category}
Issue: ${suggestion.issue || suggestion.gap || suggestion.description || ""}
Suggestion: ${suggestion.suggestion || suggestion.fix || suggestion.rationale || ""}
Implementation hint: ${suggestion.implementation}

Generate the code changes needed.`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "code_changes",
              description: "Return structured code changes to implement the suggestion",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "One-line summary of what this change does" },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  changes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        file_path: { type: "string" },
                        change_type: { type: "string", enum: ["create", "modify", "delete", "sql_migration"] },
                        description: { type: "string" },
                        code: { type: "string" }
                      },
                      required: ["file_path", "change_type", "description", "code"]
                    }
                  },
                  test_steps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Steps to verify the change works"
                  }
                },
                required: ["summary", "risk_level", "changes", "test_steps"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "code_changes" } }
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : { error: "No structured output" };

      await supabase.from("swarm_tasks").update({
        status: "completed",
        output: result,
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);

      return new Response(JSON.stringify({ success: true, task_id: taskId, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (agentError) {
      await supabase.from("swarm_tasks").update({
        status: "failed",
        error: agentError instanceof Error ? agentError.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);
      throw agentError;
    }

  } catch (e) {
    console.error("Deploy suggestion agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
