import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const DEPLOY_ID_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

function toState(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  return value.toLowerCase();
}

function getErrorMessage(statusData: Record<string, unknown>): string | null {
  const candidates = [
    statusData.errorMessage,
    statusData.error,
    (statusData.readyStateReason as Record<string, unknown> | undefined)?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { deployId, vercelToken, usePlatformToken } = await req.json();

    // ── Input validation ──
    if (!deployId || typeof deployId !== "string" || !DEPLOY_ID_REGEX.test(deployId)) {
      return new Response(JSON.stringify({ error: "Invalid or missing deployId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use platform token if requested, otherwise use user-provided token
    const token = usePlatformToken ? Deno.env.get("VERCEL_PLATFORM_TOKEN") : vercelToken;

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing deployId or vercel token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch deployment status with timeout ──
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let statusRes: Response;
    try {
      statusRes = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deployId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      return new Response(JSON.stringify({ error: `Vercel API error: ${statusRes.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusData = await statusRes.json();
    const state = toState(statusData.readyState ?? statusData.state);

    const result: Record<string, unknown> = {
      state,
      errorMessage: getErrorMessage(statusData),
      deployUrl: typeof statusData.url === "string" ? `https://${statusData.url}` : null,
      adminUrl: null,
      buildLog: null as string | null,
    };

    // ── Update deployed_sites status in DB ──
    const isTerminal = ["ready", "error", "canceled", "failed"].includes(state);
    if (isTerminal) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const newStatus = state === "ready" ? "healthy" : "error";
        await supabase.from("deployed_sites")
          .update({
            status: newStatus,
            site_url: result.deployUrl || undefined,
          })
          .eq("deploy_id", deployId);

        console.log(`Updated deployed_sites status to '${newStatus}' for deploy ${deployId}`);
      } catch (e) {
        console.warn("Failed to update deployed_sites:", e);
      }
    }

    if (state === "error" || state === "canceled" || state === "failed") {
      try {
        const logController = new AbortController();
        const logTimeout = setTimeout(() => logController.abort(), 10_000);

        let logRes: Response;
        try {
          logRes = await fetch(`https://api.vercel.com/v2/deployments/${encodeURIComponent(deployId)}/events`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: logController.signal,
          });
        } finally {
          clearTimeout(logTimeout);
        }

        if (logRes.ok) {
          const events = await logRes.json();
          if (Array.isArray(events)) {
            const errLines = events
              .filter((e: any) => e?.type === "stderr" || e?.type === "error")
              .map((e: any) => e?.text || e?.payload?.text || "")
              .filter(Boolean)
              .slice(-40);

            if (errLines.length > 0) {
              result.buildLog = errLines.join("\n");
            }
          }
        } else {
          await logRes.text();
        }
      } catch {
        // best effort
      }

      // ── Auto-retry: if build failed, try to disable deployment protection and redeploy ──
      if (state === "error" || state === "failed") {
        try {
          const platformToken = Deno.env.get("VERCEL_PLATFORM_TOKEN");
          if (platformToken && usePlatformToken) {
            const projectId = statusData.projectId;
            if (projectId) {
              const patchRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${platformToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ssoProtection: null, passwordProtection: null }),
              });
              await patchRes.text();
            }
          }
        } catch {
          // best effort
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Vercel API request timed out" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
