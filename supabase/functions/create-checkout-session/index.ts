/**
 * create-checkout-session Edge Function
 * ------------------------------------
 * Creates a Stripe Checkout Session using a "Destination Charge" pattern.
 *
 * Destination Charge design:
 *  - The customer pays the PLATFORM (us)
 *  - We take an application_fee_amount (our cut, e.g. 20%)
 *  - The remaining funds are transferred to the seller's connected account
 *    via transfer_data.destination
 *
 * This gives us full control over the payment experience while still
 * routing funds to the right seller automatically.
 *
 * Can handle two modes:
 *  1. listingId (legacy): fetches listing from our DB, looks up seller's account
 *  2. productId (new): fetches product from Stripe, gets account from metadata
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Lovable Cloud secrets.
// This is the PLATFORM secret key — NOT a connected account key.
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// The percentage of each sale the platform retains (20% = 0.20)
// PLACEHOLDER: Adjust this to change your platform fee percentage
const PLATFORM_FEE_PERCENT = 0.2;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    // ------------------------------------------------------------------
    // Step 2: Authenticate the buyer (optional but recommended)
    // We validate the session to get the buyer ID for purchase tracking.
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    let buyerId: string | null = null;

    if (authHeader) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: authHeader, apikey: supabaseServiceKey },
      });
      const userData = await userRes.json();
      if (userData?.id) buyerId = userData.id;
    }

    // ------------------------------------------------------------------
    // Step 3: Parse the request body
    // Supports two modes: listingId (legacy) or productId (Stripe product)
    // ------------------------------------------------------------------
    const body = await req.json();
    const listingId = body?.listingId;
    const productId = body?.productId;
    const discountCodeId = body?.discountCodeId;

    if (!listingId && !productId) {
      throw new Error("Either listingId or productId is required");
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (listingId && (typeof listingId !== "string" || !uuidRegex.test(listingId))) {
      throw new Error("Invalid listingId format");
    }
    if (productId && (typeof productId !== "string" || productId.length > 255)) {
      throw new Error("Invalid productId format");
    }
    if (discountCodeId && (typeof discountCodeId !== "string" || !uuidRegex.test(discountCodeId))) {
      throw new Error("Invalid discountCodeId format");
    }

    // ------------------------------------------------------------------
    // Step 4: Initialize the Stripe Client
    // Using platform-level credentials — destination charges originate here
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);
    const origin = req.headers.get("origin") || "https://opendraft.lovable.app";

    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
    let sellerStripeAccountId: string | null = null;
    let unitAmount: number;
    let sessionMetadata: Record<string, string> = {};

    if (productId) {
      // ----------------------------------------------------------------
      // Mode A: Stripe Product-based checkout
      //
      // Fetch the product from Stripe to get:
      //  - The default price (to build the line item)
      //  - The seller's connected account ID (from metadata)
      // ----------------------------------------------------------------
      const product = await stripeClient.products.retrieve(productId, {
        expand: ["default_price"],
      });

      const price = product.default_price as Stripe.Price | null;
      if (!price?.unit_amount) {
        throw new Error("Product has no default price configured");
      }

      unitAmount = price.unit_amount;

      // Get the seller's connected account from product metadata
      // This was stored when the product was created (see create-product function)
      sellerStripeAccountId = product.metadata?.seller_stripe_account_id ?? null;

      // Build the line item using price_data (not a Price ID) for flexibility
      lineItem = {
        price_data: {
          currency: price.currency || "usd",
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.images?.length ? product.images : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };

      sessionMetadata = {
        product_id: productId,
        seller_stripe_account_id: sellerStripeAccountId ?? "",
        price: String(unitAmount),
        ...(buyerId ? { buyer_id: buyerId } : {}),
      };
    } else {
      // ----------------------------------------------------------------
      // Mode B: Legacy listing-based checkout (fetches from our DB)
      // ----------------------------------------------------------------
      if (!buyerId) throw new Error("Authentication required for listing purchases");

      // Check for duplicate purchase
      const purchaseRes = await fetch(
        `${supabaseUrl}/rest/v1/purchases?listing_id=eq.${listingId}&buyer_id=eq.${buyerId}&select=id`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
      );
      const existing = await purchaseRes.json();
      if (existing?.length > 0) throw new Error("You already own this project");

      // Fetch the listing details
      const listingRes = await fetch(
        `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=*`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
      );
      const listings = await listingRes.json();
      const listing = listings?.[0];
      if (!listing) throw new Error("Listing not found");

      unitAmount = listing.price;

      // Fetch seller's Stripe Connect account from their profile
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?user_id=eq.${listing.seller_id}&select=stripe_account_id,stripe_onboarded`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
      );
      const profiles = await profileRes.json();
      const sellerProfile = profiles?.[0];

      if (sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded) {
        sellerStripeAccountId = sellerProfile.stripe_account_id;
      }

      lineItem = {
        price_data: {
          currency: "usd",
          product_data: {
            name: listing.title,
            description: listing.description?.slice(0, 200) || undefined,
            images: listing.screenshots?.[0] ? [listing.screenshots[0]] : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };

      sessionMetadata = {
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        price: String(unitAmount),
        // Track whether the seller gets an immediate payout (destination charge).
        // If seller is not onboarded, this is empty and platform holds their share.
        seller_stripe_account_id: sellerStripeAccountId ?? "",
      };
    }

    // ------------------------------------------------------------------
    // Step 5: Apply discount code if provided
    // Server-side validation: verify the code exists, is active, and hasn't
    // been used by this buyer. Then adjust the unit amount accordingly.
    // ------------------------------------------------------------------
    let discountApplied = false;
    let originalAmount = unitAmount;

    if (discountCodeId && buyerId) {
      // Fetch the discount code
      const dcRes = await fetch(
        `${supabaseUrl}/rest/v1/discount_codes?id=eq.${discountCodeId}&active=eq.true&select=id,code,discount_type,discount_value`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
      );
      const dcData = await dcRes.json();
      const discount = dcData?.[0];

      if (!discount) throw new Error("Invalid or inactive discount code");

      // Check if buyer already used this code
      const usageRes = await fetch(
        `${supabaseUrl}/rest/v1/discount_code_usage?discount_code_id=eq.${discountCodeId}&buyer_id=eq.${buyerId}&select=id`,
        { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
      );
      const usageData = await usageRes.json();
      if (usageData?.length > 0) throw new Error("Discount code already used");

      // Apply the discount
      if (discount.discount_type === "percentage") {
        unitAmount = Math.max(0, Math.round(unitAmount * (1 - discount.discount_value / 100)));
      } else {
        unitAmount = Math.max(0, unitAmount - discount.discount_value);
      }

      // Record usage
      await fetch(`${supabaseUrl}/rest/v1/discount_code_usage`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ discount_code_id: discountCodeId, buyer_id: buyerId }),
      });

      discountApplied = true;
      sessionMetadata.discount_code_id = discountCodeId;
      sessionMetadata.discount_code = discount.code;
      sessionMetadata.original_price = String(originalAmount);

      // Update the line item price
      if (lineItem.price_data) {
        lineItem.price_data.unit_amount = unitAmount;
      }
    }

    // ------------------------------------------------------------------
    // Step 6: Calculate the platform application fee
    //
    // application_fee_amount = what the platform keeps (in cents)
    // The rest is automatically transferred to the seller's connected account
    // via transfer_data.destination (Destination Charge pattern)
    // ------------------------------------------------------------------
    const applicationFeeAmount = Math.round(unitAmount * PLATFORM_FEE_PERCENT);

    console.log(`Checkout: amount=${unitAmount}${discountApplied ? ` (was ${originalAmount})` : ""}, fee=${applicationFeeAmount}, seller=${sellerStripeAccountId}`);

    // ------------------------------------------------------------------
    // Step 6: Build the Checkout Session parameters
    // ------------------------------------------------------------------
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      // success_url includes the session_id so we can look up the purchase
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: listingId ? `${origin}/listing/${listingId}` : `${origin}/storefront`,
      metadata: sessionMetadata,
    };

    // ------------------------------------------------------------------
    // Step 7: Add Destination Charge if seller has an onboarded account
    //
    // payment_intent_data.application_fee_amount = platform fee (we keep this)
    // payment_intent_data.transfer_data.destination = seller's account (they get remainder)
    //
    // Without this, all funds go to the platform (still valid for testing).
    // ------------------------------------------------------------------
    if (sellerStripeAccountId) {
      sessionParams.payment_intent_data = {
        // Platform keeps this amount (e.g., 20% of the sale)
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          // Stripe automatically transfers (unitAmount - applicationFeeAmount) here
          destination: sellerStripeAccountId,
        },
      };
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    // Return the hosted checkout URL for the frontend to redirect to
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("create-checkout-session error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
