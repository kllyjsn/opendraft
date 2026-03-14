import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Daily cron: iterates ALL live listings (deployed or not),
 * triggers auto-enrichment and app analysis for each.
 * No longer requires goals or deployed sites — covers everything.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // ── PHASE 1: Deployed sites with health tracking ──
    const { data: deployedSites } = await supabase
      .from("deployed_sites")
      .select("listing_id, user_id, site_url")
      .in("status", ["healthy", "degraded"])
      .limit(200);

    // ── PHASE 2: ALL live listings (no deploy/goals/demo required) ──
    const { data: demoListings } = await supabase
      .from("listings")
      .select("id, seller_id, demo_url")
      .eq("status", "live")
      .limit(500);

    // Merge both sources — deduplicate
    const deployedIds = new Set((deployedSites || []).map(s => s.listing_id));
    const allTargets: { listing_id: string; user_id: string }[] = [];

    for (const s of (deployedSites || [])) {
      allTargets.push({ listing_id: s.listing_id, user_id: s.user_id });
    }
    for (const l of (demoListings || [])) {
      if (!deployedIds.has(l.id)) {
        allTargets.push({ listing_id: l.id, user_id: l.seller_id });
      }
    }

    if (!allTargets.length) {
      return new Response(JSON.stringify({ message: "No listings to analyze", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listingIds = allTargets.map(s => s.listing_id);

    // Load goals (optional — enhances analysis but not required)
    const { data: goalsData } = await supabase
      .from("project_goals")
      .select("listing_id, user_id")
      .in("listing_id", listingIds);

    const goalsMap = new Map((goalsData || []).map(g => [g.listing_id, g.user_id]));

    // Check recent analysis — deployed: 24h cooldown, non-deployed: 7d cooldown
    const { data: recentCycles } = await supabase
      .from("improvement_cycles")
      .select("listing_id, created_at")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false })
      .limit(500);

    const recentMap = new Map<string, string>();
    for (const c of recentCycles || []) {
      if (!recentMap.has(c.listing_id)) {
        recentMap.set(c.listing_id, c.created_at);
      }
    }

    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    let triggered = 0;
    const results: { listing_id: string; status: string }[] = [];

    // ── PHASE 0: Trigger auto-enrichment (text, screenshots, badges) ──
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/swarm-auto-enrich`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch_size: 20, triggered_by: "cron" }),
      });
      results.push({ listing_id: "auto-enrich", status: "triggered" });
    } catch (e) {
      results.push({ listing_id: "auto-enrich", status: "failed" });
    }

    // ── PHASE 3: Deep analysis per listing ──
    for (const target of allTargets) {
      const isDeployed = deployedIds.has(target.listing_id);
      const cooldown = isDeployed ? eightHoursAgo : twoDaysAgo;

      const lastAnalysis = recentMap.get(target.listing_id);
      if (lastAnalysis && lastAnalysis > cooldown) {
        results.push({ listing_id: target.listing_id, status: "skipped_recent" });
        continue;
      }

      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/swarm-app-analyzer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing_id: target.listing_id,
            trigger: "cron",
            user_id: goalsMap.get(target.listing_id) || target.user_id,
          }),
        });

        if (resp.ok) {
          triggered++;
          results.push({ listing_id: target.listing_id, status: "triggered" });
        } else {
          results.push({ listing_id: target.listing_id, status: `error_${resp.status}` });
        }
      } catch (e) {
        results.push({ listing_id: target.listing_id, status: "error" });
      }

      // Rate limit between analyses
      if (triggered < allTargets.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Log to swarm_tasks
    await supabase.from("swarm_tasks").insert({
      agent_type: "self_healing",
      action: "daily_analysis",
      status: "completed",
      input: { total_targets: allTargets.length, deployed: deployedIds.size, with_goals: goalsMap.size },
      output: { triggered, results },
      triggered_by: "cron",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      total_targets: allTargets.length,
      deployed_sites: deployedIds.size,
      demo_only: allTargets.length - deployedIds.size,
      with_goals: goalsMap.size,
      triggered,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Self-healing cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
