import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * Email Drip Engine
 * -----------------
 * Automated email sequences triggered by user lifecycle events.
 * Called by cron or revenue-automation.
 *
 * Sequences:
 *   1. Welcome (Day 0) — "Your free app credit is waiting"
 *   2. Value showcase (Day 2) — "Top apps you might love"
 *   3. Upgrade nudge (Day 5) — "Unlock unlimited access"
 *   4. Win-back (Day 14) — "We miss you — here's what's new"
 *   5. Churned subscriber (Day 3 after cancel) — "Come back for 20% off"
 */

interface DripEmail {
  subject: string;
  body: string;
}

function welcomeEmail(username: string): DripEmail {
  return {
    subject: "Your free app is waiting 🎁",
    body: `Hi ${username},

Welcome to OpenDraft! You have 1 free App Credit ready to use.

Browse 1,000+ production-ready apps — each includes full source code, deploy configs, security audits, and direct builder messaging.

→ Claim your free app: https://opendraft.co

Your credit never expires. When you're ready to scale, plans start at $20/mo for 5 apps.

— The OpenDraft Team`,
  };
}

function valueShowcaseEmail(username: string, topApps: string[]): DripEmail {
  const appList = topApps.map((a, i) => `${i + 1}. ${a}`).join("\n");
  return {
    subject: "Top apps shipping this week 🚀",
    body: `Hi ${username},

Here's what's trending on OpenDraft this week:

${appList}

Each app includes full React + TypeScript source code, deploy configs, and lifetime access.

→ Browse all apps: https://opendraft.co

— The OpenDraft Team`,
  };
}

function upgradeNudgeEmail(username: string): DripEmail {
  return {
    subject: "Unlock unlimited apps for $20/mo ⚡",
    body: `Hi ${username},

You claimed your free app — nice! Ready to scale?

With a Starter plan ($20/mo), you get 5 production-ready apps with:
• Full source code (React + TypeScript)
• Netlify / Vercel deploy configs
• Security audits & auto-generated READMEs
• Direct messaging with builders
• Lifetime access — yours forever

Or go Unlimited for $50/mo — claim every app on the platform.

→ View plans: https://opendraft.co/credits

— The OpenDraft Team`,
  };
}

function winbackEmail(username: string): DripEmail {
  return {
    subject: "We've added 50+ new apps since you left 👀",
    body: `Hi ${username},

It's been a while! Here's what you've missed:

• 50+ new production-ready apps added
• Improved security audits on all listings
• New categories: AI agents, SaaS tools, and more

Your free app credit is still waiting if you haven't used it.

→ See what's new: https://opendraft.co

— The OpenDraft Team`,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    const results: string[] = [];

    // Helper: send email via Resend
    async function sendEmail(to: string, email: DripEmail, tag: string) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "OpenDraft <hello@opendraft.co>",
          to: [to],
          subject: email.subject,
          text: email.body,
          tags: [{ name: "drip", value: tag }],
        }),
      });
      return res.ok;
    }

    // Helper: check if we already sent this drip type to this user
    async function alreadySent(userId: string, dripType: string): Promise<boolean> {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/notifications?user_id=eq.${userId}&type=eq.drip_${dripType}&select=id&limit=1`,
        { headers }
      );
      const data = await res.json();
      return data?.length > 0;
    }

    // Helper: record that we sent a drip
    async function recordDrip(userId: string, dripType: string, title: string) {
      await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          type: `drip_${dripType}`,
          title,
          message: `Drip email: ${dripType}`,
          link: "/",
        }),
      });
    }

    // Get users with their signup date and purchase count
    // Using profiles + auth metadata via profiles table
    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=user_id,username,created_at&order=created_at.desc&limit=500`,
      { headers }
    );
    const profiles = await profilesRes.json();

    // Get purchase counts per user
    const purchasesRes = await fetch(
      `${supabaseUrl}/rest/v1/purchases?select=buyer_id&limit=1000`,
      { headers }
    );
    const purchases = await purchasesRes.json();
    const purchaseMap = new Map<string, number>();
    for (const p of (purchases || [])) {
      purchaseMap.set(p.buyer_id, (purchaseMap.get(p.buyer_id) || 0) + 1);
    }

    // Get active subscriptions
    const subsRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?status=eq.active&select=user_id`,
      { headers }
    );
    const subs = await subsRes.json();
    const subscribedIds = new Set((subs || []).map((s: any) => s.user_id));

    // Get user emails via auth admin API
    const emailMap = new Map<string, string>();
    const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=500`, {
      headers: { ...headers, apikey: supabaseKey },
    });
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      for (const u of (usersData?.users || [])) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }

    // Get top apps for value showcase
    const topRes = await fetch(
      `${supabaseUrl}/rest/v1/listings?status=eq.live&order=view_count.desc&limit=5&select=title`,
      { headers }
    );
    const topApps = ((await topRes.json()) || []).map((l: any) => l.title);

    const now = Date.now();
    let emailsSent = 0;

    for (const profile of (profiles || [])) {
      const userId = profile.user_id;
      const email = emailMap.get(userId);
      if (!email) continue;

      const username = profile.username || "there";
      const createdAt = new Date(profile.created_at).getTime();
      const daysSinceSignup = (now - createdAt) / (1000 * 60 * 60 * 24);
      const hasPurchased = (purchaseMap.get(userId) || 0) > 0;
      const isSubscribed = subscribedIds.has(userId);

      // Day 0-1: Welcome email (if no purchase yet)
      if (daysSinceSignup >= 0.5 && daysSinceSignup < 2 && !hasPurchased) {
        if (!(await alreadySent(userId, "welcome"))) {
          const sent = await sendEmail(email, welcomeEmail(username), "welcome");
          if (sent) {
            await recordDrip(userId, "welcome", "Welcome drip sent");
            emailsSent++;
          }
        }
      }

      // Day 2-4: Value showcase
      if (daysSinceSignup >= 2 && daysSinceSignup < 5 && !hasPurchased && topApps.length > 0) {
        if (!(await alreadySent(userId, "value_showcase"))) {
          const sent = await sendEmail(email, valueShowcaseEmail(username, topApps), "value_showcase");
          if (sent) {
            await recordDrip(userId, "value_showcase", "Value showcase drip sent");
            emailsSent++;
          }
        }
      }

      // Day 5-13: Upgrade nudge (only if claimed free but not subscribed)
      if (daysSinceSignup >= 5 && daysSinceSignup < 14 && hasPurchased && !isSubscribed) {
        if (!(await alreadySent(userId, "upgrade_nudge"))) {
          const sent = await sendEmail(email, upgradeNudgeEmail(username), "upgrade_nudge");
          if (sent) {
            await recordDrip(userId, "upgrade_nudge", "Upgrade nudge drip sent");
            emailsSent++;
          }
        }
      }

      // Day 14+: Win-back (if no purchase and not subscribed)
      if (daysSinceSignup >= 14 && !hasPurchased && !isSubscribed) {
        if (!(await alreadySent(userId, "winback"))) {
          const sent = await sendEmail(email, winbackEmail(username), "winback");
          if (sent) {
            await recordDrip(userId, "winback", "Win-back drip sent");
            emailsSent++;
          }
        }
      }

      // Rate limit: max 20 emails per run
      if (emailsSent >= 20) break;
    }

    results.push(`Sent ${emailsSent} drip emails`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("email-drip error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
