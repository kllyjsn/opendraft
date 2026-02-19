/**
 * stripe-webhook Edge Function
 * ------------------------------------
 * Handles incoming Stripe webhook events including:
 *
 *  1. V1 events (checkout.session.completed) — standard payment processing
 *  2. V2 thin events — account requirement changes for connected accounts
 *
 * V2 Thin Events:
 * --------------
 * Stripe sends "thin" events for V2 account changes (e.g., requirements updated).
 * A thin event only contains the event ID and type — NO payload data.
 * We must call stripeClient.v2.core.events.retrieve(thinEvent.id) to get the full event.
 *
 * To register for V2 thin events:
 *  1. Go to Stripe Dashboard → Developers → Webhooks
 *  2. Click "+ Add destination"
 *  3. In "Events from" section, select "Connected accounts"
 *  4. Click "Show advanced options" → Payload style: "Thin"
 *  5. Add event types:
 *     - v2.core.account[requirements].updated
 *     - v2.core.account[configuration.recipient].capability_status_updated
 *
 * For local testing with Stripe CLI:
 *  stripe listen --thin-events 'v2.core.account[requirements].updated,
 *    v2.core.account[configuration.recipient].capability_status_updated'
 *    --forward-thin-to <YOUR_LOCAL_ENDPOINT>
 *
 * Webhook Signature Verification:
 * --------------------------------
 * PLACEHOLDER: STRIPE_WEBHOOK_SECRET must be set in your Cloud secrets.
 * Get this from the Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret
 */

// ---------------------------------------------------------------------------
// PLACEHOLDER: Ensure these secrets are set in your Lovable Cloud dashboard:
//  - STRIPE_SECRET_KEY (starts with sk_test_ or sk_live_)
//  - STRIPE_WEBHOOK_SECRET (starts with whsec_)
// ---------------------------------------------------------------------------
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: Send seller notification email via Resend
async function sendSellerEmail({
  sellerEmail, sellerName, listingTitle, sellerAmount, buyerEmail, resendApiKey,
}: {
  sellerEmail: string; sellerName: string; listingTitle: string;
  sellerAmount: number; buyerEmail: string; resendApiKey: string;
}) {
  const earned = `$${(sellerAmount / 100).toFixed(2)}`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#ddd6fe;font-size:13px;">OpenDraft</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:900;">💸 New sale!</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${sellerName || "there"},</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
            <strong style="color:#111827;">${listingTitle}</strong> just sold. You earned
            <strong style="color:#4c1d95;font-size:24px;">${earned}</strong>.
          </p>
          <p style="color:#9ca3af;font-size:12px;">Buyer: ${buyerEmail} · After 20% platform fee · Paid to your Stripe account</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "OpenDraft <noreply@opendraft.lovable.app>",
      to: [sellerEmail],
      subject: `💸 You just made ${earned} on OpenDraft!`,
      html,
    }),
  });

  if (!res.ok) throw new Error(`Resend error [${res.status}]: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ------------------------------------------------------------------
    // Step 1: Validate required environment variables
    // ------------------------------------------------------------------
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase vars not configured");

    // ------------------------------------------------------------------
    // Step 2: Initialize Stripe Client
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    // Read the raw request body (needed for signature verification)
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // ------------------------------------------------------------------
    // Step 3: Verify the webhook signature
    //
    // This proves the request came from Stripe and wasn't tampered with.
    // PLACEHOLDER: Set STRIPE_WEBHOOK_SECRET in your Cloud secrets.
    // Without verification, anyone could send fake webhook payloads.
    // ------------------------------------------------------------------
    if (!sig) {
      throw new Error("Missing stripe-signature header — is this a legitimate Stripe webhook?");
    }

    // ------------------------------------------------------------------
    // Step 4: Detect whether this is a V2 thin event or a V1 event
    //
    // V2 thin events have a "type" field that starts with "v2."
    // We parse the body first to check before constructing the event.
    // ------------------------------------------------------------------
    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      throw new Error("Invalid JSON in webhook body");
    }

    const eventType = typeof parsedBody.type === "string" ? parsedBody.type : "";
    const isV2ThinEvent = eventType.startsWith("v2.");

    if (isV2ThinEvent) {
      // ----------------------------------------------------------------
      // V2 THIN EVENT HANDLING
      //
      // Thin events contain ONLY the event ID and type — no data payload.
      // We must verify the thin event signature and then fetch the full event.
      //
      // Step 4a: Parse the thin event (signature verification happens here)
      // Step 4b: Retrieve the full event data from the V2 events API
      // Step 4c: Route to the appropriate handler based on event type
      // ----------------------------------------------------------------

      // Parse and verify the thin event signature
      // Note: For V2 thin events, use parseThinEvent (not constructEvent)
      let thinEvent: { id: string; type: string };
      try {
        if (webhookSecret) {
          // stripeClient.parseThinEvent verifies signature & returns { id, type }
          thinEvent = stripeClient.parseThinEvent(body, sig, webhookSecret) as { id: string; type: string };
        } else {
          // No secret configured — log a warning (insecure for production)
          console.warn("WARNING: No STRIPE_WEBHOOK_SECRET set. Skipping thin event signature verification.");
          thinEvent = { id: parsedBody.id as string, type: eventType };
        }
      } catch (sigErr) {
        throw new Error(`Thin event signature verification failed: ${sigErr}`);
      }

      console.log(`Processing V2 thin event: ${thinEvent.type} (id: ${thinEvent.id})`);

      // ----------------------------------------------------------------
      // Retrieve the full V2 event data from Stripe
      // The thin event is just a notification — all the data is here:
      // ----------------------------------------------------------------
      const fullEvent = await stripeClient.v2.core.events.retrieve(thinEvent.id);

      // Route to the correct handler based on event type
      if (thinEvent.type === "v2.core.account[requirements].updated") {
        await handleAccountRequirementsUpdated(fullEvent, supabaseUrl, supabaseServiceKey);
      } else if (thinEvent.type.startsWith("v2.core.account[configuration.") && thinEvent.type.endsWith("].capability_status_updated")) {
        await handleCapabilityStatusUpdated(fullEvent, supabaseUrl, supabaseServiceKey);
      } else {
        console.log(`Unhandled V2 event type: ${thinEvent.type}`);
      }

    } else {
      // ----------------------------------------------------------------
      // V1 EVENT HANDLING (standard Stripe events)
      //
      // V1 events contain full data payloads and use constructEvent
      // for signature verification.
      // ----------------------------------------------------------------
      let event: Stripe.Event;

      if (webhookSecret) {
        event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        console.warn("WARNING: No STRIPE_WEBHOOK_SECRET set. Skipping V1 event signature verification.");
        event = parsedBody as unknown as Stripe.Event;
      }

      console.log(`Processing V1 event: ${event.type}`);

      if (event.type === "checkout.session.completed") {
        await handleCheckoutSessionCompleted(event, supabaseUrl, supabaseServiceKey, resendApiKey ?? null);
      } else {
        console.log(`Unhandled V1 event type: ${event.type}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ------------------------------------------------------------------
// Handler: checkout.session.completed (V1)
// Records the purchase in our DB, updates sales counts, sends email
// ------------------------------------------------------------------
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  supabaseUrl: string,
  supabaseServiceKey: string,
  resendApiKey: string | null
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const { listing_id, buyer_id, seller_id, price } = session.metadata ?? {};

  // Only process listing-based purchases (productId purchases don't need DB records here)
  if (!listing_id || !buyer_id || !seller_id || !price) {
    console.log("Non-listing checkout session completed (product-based purchase) — skipping DB insert");
    return;
  }

  const amount = parseInt(price, 10);
  const platformFee = Math.round(amount * 0.2);
  const sellerAmount = amount - platformFee;

  // Insert the purchase record into our DB
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/purchases`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      listing_id,
      buyer_id,
      seller_id,
      amount_paid: amount,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    throw new Error(`Failed to insert purchase: ${err}`);
  }

  // Increment sales counters
  await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/rpc/increment_sales_count`, {
      method: "POST",
      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id_param: listing_id }),
    }),
    fetch(`${supabaseUrl}/rest/v1/rpc/increment_seller_sales`, {
      method: "POST",
      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id_param: seller_id }),
    }),
  ]);

  // Send seller notification email if Resend is configured
  if (resendApiKey) {
    try {
      const [listingRes, sellerRes, buyerRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${listing_id}&select=title`, {
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
        }),
        fetch(`${supabaseUrl}/auth/v1/admin/users/${seller_id}`, {
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
        }),
        fetch(`${supabaseUrl}/auth/v1/admin/users/${buyer_id}`, {
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
        }),
      ]);

      const [listingData, sellerUser, buyerUser] = await Promise.all([
        listingRes.json(), sellerRes.json(), buyerRes.json(),
      ]);

      await sendSellerEmail({
        sellerEmail: sellerUser?.email,
        sellerName: sellerUser?.user_metadata?.name ?? "",
        listingTitle: listingData?.[0]?.title ?? "Your project",
        sellerAmount,
        buyerEmail: buyerUser?.email ?? "a buyer",
        resendApiKey,
      });
    } catch (emailErr) {
      console.error("Failed to send sale email:", emailErr);
    }
  }

  console.log(`Purchase recorded: listing=${listing_id}, buyer=${buyer_id}, amount=${amount}`);
}

// ------------------------------------------------------------------
// Handler: v2.core.account[requirements].updated
//
// Triggered when Stripe updates the requirements on a connected account.
// This happens when regulators, card networks, or Stripe change what
// information is needed to keep the account in good standing.
//
// We log the change and could notify the seller to complete new requirements.
// ------------------------------------------------------------------
async function handleAccountRequirementsUpdated(
  fullEvent: { id: string; type: string; data?: Record<string, unknown> },
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  console.log(`Account requirements updated event: ${fullEvent.id}`);
  console.log("Event data:", JSON.stringify(fullEvent.data ?? {}, null, 2));

  // Extract the account ID from the event data
  // The V2 event structure: fullEvent.data.object.id = account ID
  const accountId = (fullEvent.data as Record<string, Record<string, unknown>>)?.object?.id as string | undefined;

  if (accountId) {
    console.log(`Requirements changed for account: ${accountId}`);
    // TODO: Notify the seller to complete any new requirements
    // You could send an email here via Resend, or update a DB flag
    // to show a notification in their dashboard

    // Example: Update stripe_onboarded to false if requirements become due
    // This would trigger the seller to re-visit the Connect panel
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?stripe_account_id=eq.${accountId}&select=user_id`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    const profiles = await profileRes.json();
    if (profiles?.[0]?.user_id) {
      console.log(`Found seller user_id: ${profiles[0].user_id} for account: ${accountId}`);
      // Optional: Set stripe_onboarded = false to force them to re-check status
    }
  }
}

// ------------------------------------------------------------------
// Handler: v2.core.account[configuration.recipient].capability_status_updated
//
// Triggered when the status of a capability changes on a connected account.
// E.g., when stripe_transfers becomes "active" (seller can now receive payments)
// or "restricted" (something went wrong).
//
// Use this to update the seller's onboarding status in real-time.
// ------------------------------------------------------------------
async function handleCapabilityStatusUpdated(
  fullEvent: { id: string; type: string; data?: Record<string, unknown> },
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  console.log(`Capability status updated event: ${fullEvent.id}`);
  console.log("Event data:", JSON.stringify(fullEvent.data ?? {}, null, 2));

  const accountId = (fullEvent.data as Record<string, Record<string, unknown>>)?.object?.id as string | undefined;

  if (accountId) {
    console.log(`Capability status changed for account: ${accountId}`);
    // TODO: Re-fetch the account status and update our DB accordingly
    // This ensures seller dashboard reflects real-time capability changes
  }
}
