/**
 * create-connect-account Edge Function
 * ------------------------------------
 * Creates a Stripe Connect account for a seller using the V2 API,
 * then generates an Account Link for onboarding.
 *
 * Flow:
 *  1. Authenticate the calling user via Supabase JWT
 *  2. Check if the user already has a Stripe Connect account stored in their profile
 *  3. If not, create a new V2 account (platform is responsible for fees/losses)
 *  4. Save the account ID back to the user's profile in the DB
 *  5. Generate a Stripe Account Link (hosted onboarding UI) and return its URL
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Lovable Cloud secrets.
// It must start with "sk_test_" (test mode) or "sk_live_" (production).
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
    // Step 2: Authenticate the user from the Authorization header
    // The frontend passes the Supabase session JWT as a Bearer token.
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing Bearer token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create a Supabase client scoped to the user's session to verify their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid session" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // ------------------------------------------------------------------
    // Step 3: Initialize the Stripe Client
    // Using stripeClient pattern for all Stripe requests.
    // The API version is set automatically by the SDK.
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    // The return/refresh URLs tell Stripe where to redirect after onboarding
    const origin = req.headers.get("origin") || "https://opendraft.lovable.app";

    // ------------------------------------------------------------------
    // Step 4: Check if seller already has a Connect account in our DB
    // We store the Stripe account ID in the profiles table to avoid
    // creating duplicate accounts for the same user.
    // ------------------------------------------------------------------
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarded, username")
      .eq("user_id", user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      // ----------------------------------------------------------------
      // Step 5: Create a new Stripe Connect Express account (V1 API)
      // ----------------------------------------------------------------
      const account = await stripeClient.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: profile?.username || user.email?.split("@")[0] || "Seller",
        },
      });

      accountId = account.id;
      console.log(`Created new Connect account: ${accountId} for user: ${user.id}`);

      // ----------------------------------------------------------------
      // Step 6: Persist the account ID in the user's profile
      // ----------------------------------------------------------------
      await adminClient
        .from("profiles")
        .update({ stripe_account_id: accountId, stripe_onboarded: false })
        .eq("user_id", user.id);
    } else {
      console.log(`Reusing existing Connect account: ${accountId} for user: ${user.id}`);
    }

    // ------------------------------------------------------------------
    // Step 7: Create a Stripe Account Link for onboarding
    // ------------------------------------------------------------------
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/dashboard?connect=refresh`,
      return_url: `${origin}/dashboard?connect=success&accountId=${accountId}`,
    });

    console.log(`Generated account link for account: ${accountId}`);

    // Return the hosted onboarding URL to the frontend
    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-connect-account error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
