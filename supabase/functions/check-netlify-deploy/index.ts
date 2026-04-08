import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { siteId, deployId, netlifyToken } = await req.json();

    if (!siteId || !deployId || !netlifyToken) {
      return new Response(JSON.stringify({ error: "Missing siteId, deployId, or netlifyToken" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch deploy status from Netlify
    const statusRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}`,
      { headers: { Authorization: `Bearer ${netlifyToken}` } }
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      return new Response(JSON.stringify({ error: `Netlify API error: ${statusRes.status}`, details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await statusRes.json();

    // Extract relevant fields
    const result: Record<string, unknown> = {
      state: data.state || "unknown",
      errorMessage: data.error_message || null,
      deployUrl: data.deploy_ssl_url || data.deploy_url || data.ssl_url || data.url || null,
      adminUrl: data.admin_url || null,
      title: data.title || null,
      createdAt: data.created_at || null,
      updatedAt: data.updated_at || null,
      publishedAt: data.published_at || null,
      buildLog: null as string | null,
    };

    // If the build failed or errored, try to fetch the build log
    if (data.state === "error" || data.state === "failed") {
      try {
        const logRes = await fetch(
          `https://api.netlify.com/api/v1/deploys/${deployId}/log`,
          { headers: { Authorization: `Bearer ${netlifyToken}` } }
        );
        if (logRes.ok) {
          const logEntries = await logRes.json();
          // logEntries is an array of { message, section, ... }
          if (Array.isArray(logEntries)) {
            // Get last 40 lines for context
            const lines = logEntries
              .map((e: { message?: string }) => e.message || "")
              .filter(Boolean);
            const errorLines = lines.slice(-40);
            result.buildLog = errorLines.join("\n");
          }
        }
      } catch {
        // Log fetch failed, that's okay
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
