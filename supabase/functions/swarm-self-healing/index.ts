import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Daily cron: iterates deployed sites with goals, captures screenshots,
 * and triggers the app analyzer for each.
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
    // Find deployed sites that have project goals set
    const { data: deployedSites } = await supabase
      .from("deployed_sites")
      .select("listing_id, user_id, site_url")
      .in("status", ["healthy", "degraded"])
      .limit(50);

    if (!deployedSites?.length) {
      return new Response(JSON.stringify({ message: "No deployed sites to analyze", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listingIds = deployedSites.map((s) => s.listing_id);

    // Only analyze sites that have goals defined
    const { data: goalsData } = await supabase
      .from("project_goals")
      .select("listing_id, user_id")
      .in("listing_id", listingIds);

    const goalsMap = new Map((goalsData || []).map((g) => [g.listing_id, g.user_id]));

    // Check which listings were analyzed recently (skip if < 24h ago)
    const { data: recentCycles } = await supabase
      .from("improvement_cycles")
      .select("listing_id, created_at")
      .in("listing_id", listingIds)
      .eq("trigger", "cron")
      .order("created_at", { ascending: false })
      .limit(200);

    const recentMap = new Map<string, string>();
    for (const c of recentCycles || []) {
      if (!recentMap.has(c.listing_id)) {
        recentMap.set(c.listing_id, c.created_at);
      }
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let triggered = 0;
    const results: { listing_id: string; status: string }[] = [];

    for (const site of deployedSites) {
      // Skip if no goals
      if (!goalsMap.has(site.listing_id)) {
        results.push({ listing_id: site.listing_id, status: "skipped_no_goals" });
        continue;
      }

      // Skip if analyzed recently
      const lastAnalysis = recentMap.get(site.listing_id);
      if (lastAnalysis && lastAnalysis > oneDayAgo) {
        results.push({ listing_id: site.listing_id, status: "skipped_recent" });
        continue;
      }

      // Trigger analysis
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/swarm-app-analyzer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing_id: site.listing_id,
            trigger: "cron",
            user_id: goalsMap.get(site.listing_id) || site.user_id,
          }),
        });

        if (resp.ok) {
          triggered++;
          results.push({ listing_id: site.listing_id, status: "triggered" });
        } else {
          results.push({ listing_id: site.listing_id, status: `error_${resp.status}` });
        }
      } catch (e) {
        results.push({ listing_id: site.listing_id, status: "error" });
      }

      // Rate limit: wait between analyses
      if (triggered < deployedSites.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Log to swarm_tasks
    await supabase.from("swarm_tasks").insert({
      agent_type: "self_healing",
      action: "daily_analysis",
      status: "completed",
      input: { total_sites: deployedSites.length, with_goals: goalsMap.size },
      output: { triggered, results },
      triggered_by: "cron",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      total_sites: deployedSites.length,
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
