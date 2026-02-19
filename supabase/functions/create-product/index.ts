/**
 * create-product Edge Function
 * ------------------------------------
 * Creates a Stripe Product at the PLATFORM level (not on the connected account).
 *
 * Design rationale:
 *  - Products are created on the platform account so we have full control
 *    over pricing and fees.
 *  - We store the seller's Stripe account ID in the product's metadata so
 *    we know where to transfer funds when a purchase is made.
 *  - We also store the seller's user ID (from our DB) in metadata for lookups.
 *
 * Flow:
 *  1. Authenticate the seller
 *  2. Verify they have an onboarded Stripe Connect account
 *  3. Create the product on the platform using stripeClient.products.create()
 *  4. The default_price_data creates an attached price in the same call
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Lovable Cloud secrets.
// This is the platform's secret key — NOT the connected account's key.
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Add it in your Cloud secrets.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ------------------------------------------------------------------
    // Step 2: Authenticate the seller
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
    // Step 3: Parse and validate the request body
    // Expected: { name, description, priceInCents, currency }
    // ------------------------------------------------------------------
    const body = await req.json();
    const { name, description, priceInCents, currency = "usd" } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Product name is required");
    }
    if (name.length > 200) {
      throw new Error("Product name must be 200 characters or less");
    }
    if (description !== undefined && (typeof description !== "string" || description.length > 2000)) {
      throw new Error("Description must be a string of 2000 characters or less");
    }
    if (!priceInCents || typeof priceInCents !== "number" || !Number.isInteger(priceInCents) || priceInCents < 100 || priceInCents > 10000000) {
      throw new Error("priceInCents must be an integer between 100 and 10000000");
    }
    if (typeof currency !== "string" || currency.length !== 3) {
      throw new Error("Currency must be a 3-letter ISO code");
    }

    // ------------------------------------------------------------------
    // Step 4: Look up seller's Stripe Connect account ID from our DB
    // We need this to store in the product metadata for routing transfers
    // ------------------------------------------------------------------
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarded")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      throw new Error("You must connect a Stripe account before creating products. Complete onboarding first.");
    }

    // ------------------------------------------------------------------
    // Step 5: Initialize the Stripe Client (platform-level key)
    // All product requests go through the platform's stripeClient.
    // Do NOT pass a connected account ID here — products live on the platform.
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    // ------------------------------------------------------------------
    // Step 6: Create the Stripe Product at platform level
    //
    // We use default_price_data to create a Price object in the same call.
    // Metadata stores the mapping from product → connected account so we
    // can route transfers correctly at checkout time.
    //
    // NOTE: We do NOT create the product on the connected account.
    // Charges will use "destination charges" (payment_intent_data.transfer_data)
    // which routes funds from the platform to the connected account.
    // ------------------------------------------------------------------
    const product = await stripeClient.products.create({
      // Product display name shown in Stripe dashboard and checkout
      name: name,
      // Optional description shown in checkout and dashboard
      description: description || undefined,
      // Create a default price in the same API call for convenience
      default_price_data: {
        // Amount in the smallest currency unit (e.g., cents for USD)
        unit_amount: priceInCents,
        // ISO 4217 currency code — default "usd"
        currency: currency,
      },
      // ------------------------------------------------------------------
      // CRITICAL: Store the connected account ID in metadata.
      // This is how we know WHERE to transfer funds when this product is sold.
      // We query this metadata in create-checkout-session to set transfer_data.
      // ------------------------------------------------------------------
      metadata: {
        seller_user_id: user.id,               // Our DB user ID
        seller_stripe_account_id: profile.stripe_account_id, // Connected account ID
        seller_onboarded: String(profile.stripe_onboarded ?? false),
      },
    });

    console.log(`Created platform product: ${product.id} for seller: ${user.id}, account: ${profile.stripe_account_id}`);

    return new Response(
      JSON.stringify({
        id: product.id,
        name: product.name,
        description: product.description,
        // The default_price is the Price ID we'll reference at checkout
        defaultPriceId: product.default_price,
        metadata: product.metadata,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-product error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
