/**
 * health-check Edge Function
 * --------------------------
 * Returns platform health status by checking database connectivity,
 * storage availability, and key service metrics.
 * Used for uptime monitoring and disaster recovery alerting.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency_ms: number };
    storage: { status: string; latency_ms: number };
    auth: { status: string; latency_ms: number };
  };
  metrics?: {
    total_listings: number;
    live_listings: number;
    total_purchases: number;
    pending_listings: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Missing environment configuration",
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);
  const result: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "unknown", latency_ms: 0 },
      storage: { status: "unknown", latency_ms: 0 },
      auth: { status: "unknown", latency_ms: 0 },
    },
  };

  // Check database
  try {
    const start = performance.now();
    const { count, error } = await client
      .from("listings")
      .select("id", { count: "exact", head: true });
    const latency = Math.round(performance.now() - start);
    result.checks.database = { status: error ? "error" : "ok", latency_ms: latency };

    if (!error) {
      // Gather metrics
      const [liveRes, purchaseRes, pendingRes] = await Promise.all([
        client.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
        client.from("purchases").select("id", { count: "exact", head: true }),
        client.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      result.metrics = {
        total_listings: count ?? 0,
        live_listings: liveRes.count ?? 0,
        total_purchases: purchaseRes.count ?? 0,
        pending_listings: pendingRes.count ?? 0,
      };
    }
  } catch {
    result.checks.database = { status: "error", latency_ms: 0 };
  }

  // Check storage
  try {
    const start = performance.now();
    const { error } = await client.storage.from("listing-screenshots").list("", { limit: 1 });
    const latency = Math.round(performance.now() - start);
    result.checks.storage = { status: error ? "error" : "ok", latency_ms: latency };
  } catch {
    result.checks.storage = { status: "error", latency_ms: 0 };
  }

  // Check auth service
  try {
    const start = performance.now();
    // A lightweight auth check — list 0 users just to verify the service responds
    const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    const latency = Math.round(performance.now() - start);
    result.checks.auth = { status: error ? "error" : "ok", latency_ms: latency };
  } catch {
    result.checks.auth = { status: "error", latency_ms: 0 };
  }

  // Determine overall status
  const checkStatuses = Object.values(result.checks).map((c) => c.status);
  if (checkStatuses.every((s) => s === "ok")) {
    result.status = "healthy";
  } else if (checkStatuses.some((s) => s === "error")) {
    result.status = checkStatuses.every((s) => s === "error") ? "unhealthy" : "degraded";
  }

  const httpStatus = result.status === "unhealthy" ? 503 : 200;

  return new Response(JSON.stringify(result, null, 2), {
    status: httpStatus,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" },
  });
});
