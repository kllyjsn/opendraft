/**
 * transfer-pending-payouts Edge Function
 * ------------------------------------
 * Transfers any pending seller earnings to their newly connected Stripe account.
 *
 * Called automatically from check-connect-status when a seller first becomes
 * fully onboarded (stripe_transfers capability becomes "active").
 *
 * For each purchase where payout_transferred = false for this seller:
 *  1. Creates a Stripe Transfer from the platform to their connected account
 *  2. Marks the purchase as payout_transferred = true
 *
 * This enables the "Earn Now, Pay Later" model — buyers can always purchase
 * regardless of whether the seller has connected Stripe yet.
 */

import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let stripeKey = sanitizeStripeKey(Deno.env.get("STRIPE_SECRET_KEY")!);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the seller's Stripe account
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarded")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_account_id || !profile?.stripe_onboarded) {
      return new Response(JSON.stringify({ error: "Stripe account not fully onboarded yet" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Find all purchases where payout hasn't been transferred yet for this seller
    const { data: pendingPurchases, error: fetchErr } = await adminClient
      .from("purchases")
      .select("id, seller_amount, stripe_payment_intent_id")
      .eq("seller_id", user.id)
      .eq("payout_transferred", false);

    if (fetchErr) throw new Error(`Failed to fetch pending payouts: ${fetchErr.message}`);
    if (!pendingPurchases || pendingPurchases.length === 0) {
      return new Response(JSON.stringify({ transferred: 0, message: "No pending payouts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeClient = new Stripe(stripeKey);
    const results: { purchaseId: string; status: string; transferId?: string }[] = [];

    // Transfer each pending payout individually so partial failures don't block others
    for (const purchase of pendingPurchases) {
      try {
        // Create a Stripe Transfer from the platform account to the seller's connected account
        const transfer = await stripeClient.transfers.create({
          amount: purchase.seller_amount,
          currency: "usd",
          destination: profile.stripe_account_id,
          // Link to the originating payment intent for Stripe's reconciliation
          ...(purchase.stripe_payment_intent_id
            ? { source_transaction: purchase.stripe_payment_intent_id }
            : {}),
          metadata: { purchase_id: purchase.id },
        });

        // Mark as transferred in our DB
        await adminClient
          .from("purchases")
          .update({ payout_transferred: true })
          .eq("id", purchase.id);

        results.push({ purchaseId: purchase.id, status: "transferred", transferId: transfer.id });
        console.log(`Transferred $${purchase.seller_amount / 100} to ${profile.stripe_account_id} for purchase ${purchase.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed to transfer for purchase ${purchase.id}: ${msg}`);
        results.push({ purchaseId: purchase.id, status: "failed" });
      }
    }

    const successCount = results.filter((r) => r.status === "transferred").length;

    return new Response(
      JSON.stringify({ transferred: successCount, total: pendingPurchases.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("transfer-pending-payouts error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
