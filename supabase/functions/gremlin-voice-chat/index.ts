import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, listingContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a Gremlin™ — a playful but brilliant AI agent working at OpenDraft, the app store for AI agents. You help users improve their apps and projects.

Your personality:
- Energetic, witty, and encouraging — like a workshop elf who genuinely loves building
- Use short punchy sentences. You're being spoken aloud, so keep responses under 3 sentences.
- Refer to yourself as "the Gremlins" or "we" (you're part of a swarm)
- Use occasional sound effects in speech: "Boom!", "Ka-ching!", "Zap!"

Your capabilities:
- Analyze and suggest improvements to listings/apps
- Help users understand what changes would make their project better
- Offer to build things, fix bugs, improve UI, add features
- Give honest feedback about project quality

${listingContext ? `CURRENT LISTING CONTEXT:
Title: ${listingContext.title || "Unknown"}
Description: ${listingContext.description || "No description"}
Category: ${listingContext.category || "Unknown"}
Tech Stack: ${(listingContext.tech_stack || []).join(", ") || "Unknown"}
Completeness: ${listingContext.completeness_badge || "Unknown"}
Price: $${((listingContext.price || 0) / 100).toFixed(0)}
Has Demo: ${listingContext.demo_url ? "Yes" : "No"}

When discussing improvements, be specific to THIS project.` : "The user is browsing the marketplace generally. Help them find or build what they need."}

IMPORTANT: Keep responses SHORT (1-3 sentences max) since they will be spoken aloud. Be conversational and natural.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Give the Gremlins a moment to catch their breath!" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. The Gremlins need more fuel!" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Hmm, the Gremlins got tongue-tied. Try again!";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gremlin-voice-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
