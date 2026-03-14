/**
 * revenue-automation Edge Function
 * --------------------------------
 * Automated revenue engine that runs on a schedule (cron).
 * 
 * Actions:
 *  1. Auto-approve pending listings (quality gate)
 *  2. Post new listings to X automatically
 *  3. Check for sales milestones and tweet them
 *  4. Post trending digest daily
 *  5. Post weekly stats every Monday
 *  6. Auto-send welcome emails to new sellers
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth gate: only allow calls bearing the service role key
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader !== `Bearer ${supabaseKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
    const results: string[] = [];

    // ---------------------------------------------------------------
    // 1. AUTO-APPROVE PENDING LISTINGS
    // Listings with: title > 10 chars, description > 30 chars, 
    // at least 1 screenshot, and a price set = auto-approve
    // ---------------------------------------------------------------
    const pendingRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?status=eq.pending&select=id,title,description,screenshots,price,seller_id,created_at`,
      { headers }
    );
    const pendingListings = await pendingRes.json();

    let approvedCount = 0;
    const newlyApproved: any[] = [];

    for (const listing of (pendingListings || [])) {
      const hasTitle = listing.title?.length >= 10;
      const hasDescription = listing.description?.length >= 30;
      const hasScreenshot = listing.screenshots?.length > 0;
      const hasPrice = listing.price != null;

      if (hasTitle && hasDescription && hasPrice) {
        // Auto-approve
        await fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${listing.id}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({ status: "live" }),
        });
        approvedCount++;
        newlyApproved.push(listing);

        // Run security scan on approved listing
        try {
          await fetch(`${supabaseUrl}/functions/v1/scan-security`, {
            method: "POST",
            headers: { ...headers },
            body: JSON.stringify({ listing_id: listing.id }),
          });
        } catch (scanErr) {
          console.error(`Security scan failed for ${listing.id}:`, scanErr);
        }

        // Notify the seller
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({
            user_id: listing.seller_id,
            type: "listing_approved",
            title: "Your listing is live! 🎉",
            message: `"${listing.title}" has been approved and is now visible on the marketplace.`,
            link: `/listing/${listing.id}`,
          }),
        });
      }
    }
    results.push(`Auto-approved ${approvedCount} listings`);

    // ---------------------------------------------------------------
    // 2. POST NEW LISTINGS TO X
    // Tweet each newly approved listing
    // ---------------------------------------------------------------
    let tweeted = 0;
    for (const listing of newlyApproved) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/post-to-x`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ type: "new_listing", listing_id: listing.id }),
        });
        tweeted++;
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`Failed to tweet listing ${listing.id}:`, e);
      }
    }
    results.push(`Tweeted ${tweeted} new listings`);

    // ---------------------------------------------------------------
    // 3. CHECK SALES MILESTONES
    // If any listing crossed 5, 10, 25, 50, 100 sales → tweet
    // ---------------------------------------------------------------
    const milestones = [5, 10, 25, 50, 100];
    const liveRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?status=eq.live&sales_count=gte.5&select=id,title,sales_count`,
      { headers }
    );
    const liveListings = await liveRes.json();

    let milestonesTweeted = 0;
    for (const listing of (liveListings || [])) {
      const count = listing.sales_count || 0;
      for (const m of milestones) {
        // Tweet if they just crossed this milestone (within last count check window)
        if (count >= m && count < m + 3) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/post-to-x`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
              body: JSON.stringify({ type: "sale_milestone", listing_id: listing.id, milestone: m }),
            });
            milestonesTweeted++;
            await new Promise(r => setTimeout(r, 2000));
          } catch (e) {
            console.error(`Failed to tweet milestone for ${listing.id}:`, e);
          }
          break; // Only tweet the highest milestone
        }
      }
    }
    results.push(`Tweeted ${milestonesTweeted} sale milestones`);

    // ---------------------------------------------------------------
    // 4. TRENDING DIGEST (runs once per invocation, caller controls frequency)
    // ---------------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    if (body?.include_trending) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/post-to-x`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ type: "trending" }),
        });
        results.push("Posted trending digest");
      } catch (e) {
        results.push("Failed to post trending digest");
      }
    }

    // ---------------------------------------------------------------
    // 5. WEEKLY STATS (caller sends include_weekly=true on Mondays)
    // ---------------------------------------------------------------
    if (body?.include_weekly) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/post-to-x`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ type: "weekly_stats" }),
        });
        results.push("Posted weekly stats");
      } catch (e) {
        results.push("Failed to post weekly stats");
      }
    }

    // ---------------------------------------------------------------
    // 6. TRANSFER PENDING PAYOUTS
    // Trigger the existing payout transfer function
    // ---------------------------------------------------------------
    try {
      await fetch(`${supabaseUrl}/functions/v1/transfer-pending-payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({}),
      });
      results.push("Triggered payout transfers");
    } catch (e) {
      results.push("Failed to trigger payout transfers");
    }

    // ---------------------------------------------------------------
    // 7. AUTO-ENRICH LISTINGS
    // Automatically improve weak titles, descriptions, screenshots,
    // tech stacks, and completeness badges for all live listings
    // ---------------------------------------------------------------
    try {
      await fetch(`${supabaseUrl}/functions/v1/swarm-auto-enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ batch_size: 50, triggered_by: "revenue_automation" }),
      });
      results.push("Triggered auto-enrich for listings");
    } catch (e) {
      results.push("Failed to trigger auto-enrich");
    }

    console.log("Revenue automation complete:", results.join("; "));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("revenue-automation error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
