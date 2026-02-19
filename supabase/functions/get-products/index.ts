/**
 * get-products Edge Function
 * ------------------------------------
 * Fetches all active Stripe Products from the platform account.
 *
 * This powers the storefront — it lists all products created by any seller,
 * along with their prices and the connected account info stored in metadata.
 *
 * Products are fetched from the PLATFORM (no connected account header),
 * then we expand their default price data for display.
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: STRIPE_SECRET_KEY must be set in your Lovable Cloud secrets.
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";

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

    // ------------------------------------------------------------------
    // Step 2: Initialize the Stripe Client (platform-level)
    // No connected account ID — products live on the platform account.
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    // ------------------------------------------------------------------
    // Step 3: List all active products from the platform
    //
    // We expand "default_price" to get price data in a single API call
    // instead of making a separate price lookup per product.
    // "active: true" filters out archived/deleted products.
    // ------------------------------------------------------------------
    const products = await stripeClient.products.list({
      active: true,
      // Expand the default_price field so we get full Price object data
      expand: ["data.default_price"],
      // Return up to 100 products — for production, implement pagination
      limit: 100,
    });

    // ------------------------------------------------------------------
    // Step 4: Transform the product data for the frontend
    //
    // We extract only the fields the storefront needs and normalize
    // the price data (the expanded default_price can be a Price object).
    // ------------------------------------------------------------------
    const storefront = products.data
      .filter((p) => p.metadata?.seller_stripe_account_id) // Only show products from our sellers
      .map((product) => {
        // The default_price may be expanded (full Price object) or just an ID string
        const price = typeof product.default_price === "object" && product.default_price !== null
          ? product.default_price as Stripe.Price
          : null;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          // Price in smallest currency unit (cents), null if no default price
          unitAmount: price?.unit_amount ?? null,
          currency: price?.currency ?? "usd",
          // The Price ID is what we pass to checkout session line_items
          priceId: price?.id ?? null,
          // Metadata contains seller info we stored at product creation time
          sellerUserId: product.metadata?.seller_user_id ?? null,
          sellerStripeAccountId: product.metadata?.seller_stripe_account_id ?? null,
          createdAt: product.created,
        };
      });

    console.log(`Returning ${storefront.length} products from platform`);

    return new Response(JSON.stringify({ products: storefront }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("get-products error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
