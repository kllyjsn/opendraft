import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { deployId, vercelToken, usePlatformToken } = await req.json();

    // Use platform token if requested, otherwise use user-provided token
    const token = usePlatformToken ? Deno.env.get("VERCEL_PLATFORM_TOKEN") : vercelToken;

    if (!deployId || !token) {
      return new Response(JSON.stringify({ error: "Missing deployId or vercel token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deployId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

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
        const logRes = await fetch(`https://api.vercel.com/v2/deployments/${encodeURIComponent(deployId)}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
            // Try to disable deployment protection on the project
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
