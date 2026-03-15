import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Growth Hacker Agent — runs every 4 hours via cron
 * 
 * 1. Re-engagement: Finds users who signed up but never claimed → creates notifications
 * 2. Inactive nudge: Users who claimed but haven't visited in 7 days → notification
 * 3. Milestone celebrations: Users hitting sales milestones → notification + tweet
 * 4. Referral code generation: Ensures every user has a referral code
 * 5. Urgency campaigns: Marks trending listings for scarcity UI
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const results: { action: string; count: number }[] = [];

  try {
    // ── 1. RE-ENGAGEMENT: Users who signed up 2+ days ago but never claimed ──
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get users who have credit balance but 0 purchases
    const { data: inactiveUsers } = await supabase
      .from("credit_balances")
      .select("user_id, balance")
      .gt("balance", 0)
      .lt("created_at", twoDaysAgo)
      .limit(50);

    let reengaged = 0;
    for (const u of (inactiveUsers || [])) {
      // Check if they have any purchases
      const { count } = await supabase
        .from("purchases")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", u.user_id);

      if ((count ?? 0) === 0) {
        // Check if we already sent this notification recently
        const { count: notifCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.user_id)
          .eq("type", "growth_nudge")
          .gt("created_at", sevenDaysAgo);

        if ((notifCount ?? 0) === 0) {
          await supabase.from("notifications").insert({
            user_id: u.user_id,
            type: "growth_nudge",
            title: "Your free credits are waiting! 🎁",
            message: `You have ${u.balance} credits ready to use. Browse trending apps and claim one now — they won't last forever.`,
            link: "/?sort=Popular",
          });
          reengaged++;
        }
      }
      if (reengaged >= 20) break;
    }
    results.push({ action: "re_engagement_nudges", count: reengaged });

    // ── 2. MILESTONE CELEBRATIONS ──
    const milestones = [5, 10, 25, 50, 100];
    const { data: sellers } = await supabase
      .from("profiles")
      .select("user_id, username, total_sales")
      .gt("total_sales", 0)
      .order("total_sales", { ascending: false })
      .limit(100);

    let celebrated = 0;
    for (const seller of (sellers || [])) {
      const sales = seller.total_sales ?? 0;
      const milestone = milestones.find(m => sales >= m);
      if (!milestone) continue;

      // Check if we already celebrated this milestone
      const { count: celebCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", seller.user_id)
        .eq("type", "milestone")
        .ilike("title", `%${milestone}%`);

      if ((celebCount ?? 0) === 0) {
        await supabase.from("notifications").insert({
          user_id: seller.user_id,
          type: "milestone",
          title: `🏆 ${milestone} sales milestone reached!`,
          message: `Congratulations! You've hit ${milestone} sales on OpenDraft. You're in the top tier of builders.`,
          link: "/dashboard",
        });
        celebrated++;

        // Auto-tweet milestone
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/post-to-x`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: "new_listing",
              custom_text: `🏆 Builder @${seller.username || "anonymous"} just hit ${milestone} sales on OpenDraft!\n\nThe vibe coding economy is real. Build → Ship → Earn.\n\nhttps://opendraft.lovable.app`,
            }),
          });
        } catch {}
      }
    }
    results.push({ action: "milestone_celebrations", count: celebrated });

    // ── 3. TRENDING LISTINGS — Mark hot listings for urgency UI ──
    // Find listings with most views in last 48h
    const twoDaysAgoISO = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select("event_data")
      .eq("event_type", "funnel:listing_viewed")
      .gt("created_at", twoDaysAgoISO)
      .limit(1000);

    // Count views per listing
    const viewCounts = new Map<string, number>();
    for (const a of (recentActivity || [])) {
      const listingId = (a.event_data as any)?.listing_id;
      if (listingId) {
        viewCounts.set(listingId, (viewCounts.get(listingId) || 0) + 1);
      }
    }

    // Get top 10 trending
    const trending = [...viewCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, views]) => ({ id, views }));

    results.push({ action: "trending_identified", count: trending.length });

    // ── 4. GENERATE SEO CONTENT (3x daily) ──
    // Trigger SEO writer 
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/swarm-seo-writer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ triggered_by: "growth-hacker" }),
      });
      results.push({ action: "seo_content_triggered", count: 1 });
    } catch {
      results.push({ action: "seo_content_triggered", count: 0 });
    }

    // ── 5. AUTO-ENRICH stale listings ──
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/swarm-auto-enrich`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch_size: 30, triggered_by: "growth-hacker" }),
      });
      results.push({ action: "auto_enrich_triggered", count: 1 });
    } catch {
      results.push({ action: "auto_enrich_triggered", count: 0 });
    }

    // Log to swarm_tasks
    await supabase.from("swarm_tasks").insert({
      agent_type: "growth_hacker",
      action: "growth_cycle",
      status: "completed",
      input: { triggered_by: "cron" },
      output: { results, trending },
      triggered_by: "cron",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, results, trending }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Growth hacker error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
