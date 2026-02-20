/**
 * check-connect-status Edge Function
 * ------------------------------------
 * Retrieves the current onboarding status of a seller's Stripe Connect account.
 *
 * We always fetch status LIVE from the Stripe V2 API (not cached in DB)
 * to ensure accuracy. After fetching, we update the DB for reference.
 *
 * Status is determined by:
 *  - account.requirements.summary.minimum_deadline.status !== "currently_due" &&
 *    !== "past_due" → onboarding complete (no blocking requirements)
 *  - account.configuration.recipient.capabilities.stripe_balance.stripe_transfers.status
 *    === "active" → fully able to receive payments
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Lovable Cloud secrets.
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ------------------------------------------------------------------
    // Step 1: Validate required environment variables
    // ------------------------------------------------------------------
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Add it in your Cloud secrets.");
    }
    stripeKey = sanitizeStripeKey(stripeKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ------------------------------------------------------------------
    // Step 2: Authenticate the calling user
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // ------------------------------------------------------------------
    // Step 3: Look up the seller's Stripe account ID from our DB
    // ------------------------------------------------------------------
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    // If no account ID is stored, the seller hasn't started onboarding yet
    if (!profile?.stripe_account_id) {
      return new Response(JSON.stringify({ onboarded: false, readyToReceivePayments: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // Step 4: Fetch live account status from Stripe V2 API
    //
    // We include "configuration.recipient" and "requirements" in the
    // response so we can check capability status and any outstanding
    // requirements (things the seller still needs to complete).
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    const account = await stripeClient.v2.core.accounts.retrieve(
      profile.stripe_account_id,
      {
        // Request these expanded sub-objects in the response
        include: ["configuration.recipient", "requirements"],
      }
    );

    // ------------------------------------------------------------------
    // Step 5: Determine onboarding completion status
    //
    // "readyToReceivePayments" = stripe_transfers capability is active
    // "onboardingComplete" = no blocking requirements (currently_due or past_due)
    // ------------------------------------------------------------------
    const readyToReceivePayments =
      // @ts-ignore — V2 types may not be fully typed in older SDK versions
      account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";

    // Check if there are any outstanding requirements blocking the account
    // @ts-ignore
    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete =
      requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

    // For backwards compatibility, "onboarded" means both conditions are met
    const onboarded = readyToReceivePayments && onboardingComplete;

    // ------------------------------------------------------------------
    // Step 6: Update our DB to reflect the current live status
    // ------------------------------------------------------------------
    const { data: profileBefore } = await adminClient
      .from("profiles")
      .select("stripe_onboarded")
      .eq("user_id", user.id)
      .single();

    await adminClient
      .from("profiles")
      .update({ stripe_onboarded: onboarded })
      .eq("user_id", user.id);

    // ------------------------------------------------------------------
    // Step 7: Trigger pending payout transfer if seller just became onboarded
    //
    // When a seller connects Stripe for the first time (transitions from
    // not-onboarded → onboarded), we automatically transfer any earnings
    // they accumulated while unconnected ("Earn Now, Pay Later" model).
    // ------------------------------------------------------------------
    const justBecameOnboarded = !profileBefore?.stripe_onboarded && onboarded;
    let pendingPayoutResult = null;

    if (justBecameOnboarded) {
      console.log(`Seller ${user.id} just completed onboarding — triggering pending payout transfer`);
      try {
        // Query unpaid purchases for this seller
        const { data: pendingPurchases } = await adminClient
          .from("purchases")
          .select("id, seller_amount, stripe_payment_intent_id")
          .eq("seller_id", user.id)
          .eq("payout_transferred", false);

        if (pendingPurchases && pendingPurchases.length > 0) {
          const stripeClient = new Stripe(stripeKey);
          let transferred = 0;

          for (const purchase of pendingPurchases) {
            try {
              await stripeClient.transfers.create({
                amount: purchase.seller_amount,
                currency: "usd",
                destination: profile.stripe_account_id,
                ...(purchase.stripe_payment_intent_id
                  ? { source_transaction: purchase.stripe_payment_intent_id }
                  : {}),
                metadata: { purchase_id: purchase.id },
              });
              await adminClient.from("purchases").update({ payout_transferred: true }).eq("id", purchase.id);
              transferred++;
            } catch (transferErr) {
              console.error(`Failed to transfer for purchase ${purchase.id}:`, transferErr);
            }
          }

          pendingPayoutResult = { transferred, total: pendingPurchases.length };
          console.log(`Auto-transferred ${transferred}/${pendingPurchases.length} pending payouts for seller ${user.id}`);
        }
      } catch (payoutErr) {
        console.error("Failed to auto-transfer pending payouts:", payoutErr);
      }
    }

    // Also include the pending earnings amount for the dashboard display
    const { data: pendingRows } = await adminClient
      .from("purchases")
      .select("seller_amount")
      .eq("seller_id", user.id)
      .eq("payout_transferred", false);

    const pendingEarnings = (pendingRows ?? []).reduce((sum, p) => sum + p.seller_amount, 0);

    console.log(`Account ${profile.stripe_account_id} status — onboarded: ${onboarded}, ready: ${readyToReceivePayments}, pendingEarnings: ${pendingEarnings}`);

    return new Response(
      JSON.stringify({
        onboarded,
        readyToReceivePayments,
        onboardingComplete,
        requirementsStatus: requirementsStatus ?? null,
        accountId: profile.stripe_account_id,
        pendingEarnings,
        ...(pendingPayoutResult ? { autoTransferred: pendingPayoutResult } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("check-connect-status error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
