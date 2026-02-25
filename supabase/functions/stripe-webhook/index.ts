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
import { sanitizeStripeKey } from "../_shared/sanitize-stripe-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: Generate a signed download URL from storage (valid 24 hours)
async function getSignedDownloadUrl(supabaseUrl: string, supabaseServiceKey: string, filePath: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/listing-files/${filePath}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 86400 }), // 24 hours
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.signedURL ? `${supabaseUrl}/storage/v1${data.signedURL}` : null;
  } catch {
    return null;
  }
}

// Helper: Send buyer confirmation email via Resend
const BUILT_WITH_LABELS: Record<string, string> = {
  lovable: "Lovable", claude_code: "Claude Code", cursor: "Cursor",
  bolt: "Bolt", replit: "Replit", other: "Other",
};

const COMPLETENESS_LABELS: Record<string, string> = {
  prototype: "Prototype", mvp: "MVP", production_ready: "Production Ready",
};

async function sendBuyerEmail({
  buyerEmail, listingTitle, signedUrl, githubUrl, amountPaid, resendApiKey, listingId,
  description, techStack, builtWith, completenessBadge, demoUrl, pricingType,
}: {
  buyerEmail: string; listingTitle: string; signedUrl: string | null;
  githubUrl: string | null; amountPaid: number; resendApiKey: string; listingId?: string;
  description?: string | null; techStack?: string[]; builtWith?: string | null;
  completenessBadge?: string | null; demoUrl?: string | null; pricingType?: string;
}) {
  const paid = `$${(amountPaid / 100).toFixed(2)}`;
  const isMonthly = pricingType === "monthly";
  const hasFile = !!signedUrl;
  const hasGithub = !!githubUrl;

  const deliverySection = hasFile
    ? `<a href="${signedUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-bottom:12px;">⬇ Download your project</a>
       <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">This link expires in 24 hours. You can generate a new one anytime from your <a href="https://opendraft.co/profile" style="color:#7c3aed;">profile page</a>.</p>`
    : hasGithub
    ? `<a href="${githubUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none;">View on GitHub</a>`
    : `<p style="color:#6b7280;">Head to your <a href="https://opendraft.co/profile" style="color:#7c3aed;">profile page</a> to access your purchase.</p>`;

  const listingUrl = listingId ? `https://opendraft.co/listing/${listingId}` : "https://opendraft.co";

  // Build project details section from listing metadata
  const shortDesc = description ? (description.length > 200 ? description.slice(0, 200).replace(/\n/g, " ") + "…" : description.replace(/\n/g, " ")) : null;
  const badgeLabel = completenessBadge ? COMPLETENESS_LABELS[completenessBadge] ?? completenessBadge : null;
  const toolLabel = builtWith ? BUILT_WITH_LABELS[builtWith] ?? builtWith : null;
  const stackStr = (techStack && techStack.length > 0) ? techStack.slice(0, 6).join(" · ") : null;

  let projectDetailsHtml = "";
  if (shortDesc || badgeLabel || toolLabel || stackStr || demoUrl) {
    const rows: string[] = [];
    if (shortDesc) {
      rows.push(`<p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.5;">${shortDesc}</p>`);
    }
    const metaParts: string[] = [];
    if (badgeLabel) metaParts.push(`<span style="display:inline-block;background:#ede9fe;color:#4c1d95;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${badgeLabel}</span>`);
    if (toolLabel) metaParts.push(`<span style="display:inline-block;background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">🛠 ${toolLabel}</span>`);
    if (isMonthly) metaParts.push(`<span style="display:inline-block;background:#eff6ff;color:#1e40af;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">Monthly subscription</span>`);
    if (metaParts.length > 0) {
      rows.push(`<p style="margin:0 0 10px;">${metaParts.join(" ")}</p>`);
    }
    if (stackStr) {
      rows.push(`<p style="margin:0 0 8px;color:#9ca3af;font-size:12px;"><strong style="color:#6b7280;">Tech:</strong> ${stackStr}</p>`);
    }
    if (demoUrl) {
      rows.push(`<p style="margin:0;"><a href="${demoUrl}" style="color:#7c3aed;font-size:13px;font-weight:600;">View live demo →</a></p>`);
    }
    projectDetailsHtml = `
        <tr><td style="padding:0 40px 24px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <p style="margin:0 0 10px;color:#374151;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">About this project</p>
            ${rows.join("\n            ")}
          </div>
        </td></tr>`;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#ddd6fe;font-size:13px;">OpenDraft</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:900;">🎉 Welcome aboard!</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">You just purchased:</p>
          <p style="margin:0 0 4px;color:#111827;font-size:20px;font-weight:800;">${listingTitle}</p>
          <p style="margin:0 0 28px;color:#6b7280;font-size:14px;">Paid <strong style="color:#111827;">${paid}${isMonthly ? "/mo" : ""}</strong></p>
          ${deliverySection}
        </td></tr>

        <!-- Project-specific details -->
        ${projectDetailsHtml}

        <!-- What's included -->
        <tr><td style="padding:0 40px 36px;">
          <div style="background:#f8f7ff;border:1px solid #ede9fe;border-radius:12px;padding:24px;">
            <p style="margin:0 0 16px;color:#4c1d95;font-size:15px;font-weight:800;">Here's what you get:</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;vertical-align:top;width:24px;">♾️</td>
                <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;"><strong>Unlimited app usage</strong> — Use the app as much as you want, with no caps or restrictions.</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;vertical-align:top;width:24px;">💬</td>
                <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;"><strong>Talk directly with the builder</strong> — Got an idea, a feature request, or need help? Message the builder right from <a href="${listingUrl}" style="color:#7c3aed;font-weight:600;">opendraft.co</a>. They're here to help.</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;vertical-align:top;width:24px;">🔄</td>
                <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;"><strong>Monthly updates</strong> — Ongoing improvements, bug fixes, and new features shipped every month.</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;vertical-align:top;width:24px;">🛠</td>
                <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;"><strong>Feature requests</strong> — Want something added? Submit requests in-app and the builder will prioritize what matters to you.</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#374151;font-size:14px;vertical-align:top;width:24px;">📦</td>
                <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;"><strong>Stability & support</strong> — The builder maintains the app so you can focus on your work, not the tech.</td>
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- How to get the most out of it -->
        <tr><td style="padding:0 40px 36px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
            <p style="margin:0 0 10px;color:#166534;font-size:14px;font-weight:800;">💡 How to get the most out of your purchase</p>
            <ol style="margin:0;padding:0 0 0 20px;color:#374151;font-size:13px;line-height:1.8;">
              <li><strong>Start using the app</strong> — dive in and explore all the features.</li>
              <li><strong>Message the builder</strong> — introduce yourself, share your use case, and ask questions.</li>
              <li><strong>Request features</strong> — tell the builder what would make this app perfect for you.</li>
              <li><strong>Stay updated</strong> — check back monthly for new features and improvements.</li>
            </ol>
          </div>
        </td></tr>

        <tr><td style="padding:0 40px 36px;text-align:center;">
          <a href="${listingUrl}" style="display:inline-block;background:#111827;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">View your project on OpenDraft →</a>
        </td></tr>

        <tr><td style="padding:24px 40px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Questions? Reply to this email or message the builder directly at <a href="https://opendraft.co" style="color:#7c3aed;">opendraft.co</a>
          </p>
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
      to: [buyerEmail],
      subject: `Welcome aboard: ${listingTitle} — here's what to expect`,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error [${res.status}]: ${await res.text()}`);
}

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

// Helper: Log a webhook event to the audit table
async function logWebhookEvent(
  supabaseUrl: string,
  supabaseServiceKey: string,
  stripeEventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  status: string,
  errorMessage?: string
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/webhook_events`, {
      method: "POST",
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        payload,
        processing_status: status,
        error_message: errorMessage ?? null,
        processed_at: status === "success" ? new Date().toISOString() : null,
      }),
    });
  } catch (logErr) {
    console.error("Failed to log webhook event:", logErr);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let supabaseUrl = "";
  let supabaseServiceKey = "";
  let stripeEventId = "unknown";
  let eventType = "unknown";

  try {
    // ------------------------------------------------------------------
    // Step 1: Validate required environment variables
    // ------------------------------------------------------------------
    let stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeKey = sanitizeStripeKey(stripeKey);
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase vars not configured");

    // ------------------------------------------------------------------
    // Step 2: Initialize Stripe Client
    // ------------------------------------------------------------------
    const stripeClient = new Stripe(stripeKey);

    // Read the raw request body (needed for signature verification)
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      throw new Error("Missing stripe-signature header — is this a legitimate Stripe webhook?");
    }

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      throw new Error("Invalid JSON in webhook body");
    }

    stripeEventId = (parsedBody.id as string) ?? "unknown";
    eventType = typeof parsedBody.type === "string" ? parsedBody.type : "";
    const isV2ThinEvent = eventType.startsWith("v2.");

    // ------------------------------------------------------------------
    // Step 3: Log event receipt immediately (before processing)
    // ------------------------------------------------------------------
    await logWebhookEvent(supabaseUrl, supabaseServiceKey, stripeEventId, eventType, parsedBody, "received");

    // ------------------------------------------------------------------
    // Step 4: Idempotency check — skip if already processed successfully
    // ------------------------------------------------------------------
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/webhook_events?stripe_event_id=eq.${stripeEventId}&processing_status=eq.success&select=id`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`Skipping duplicate event ${stripeEventId} — already processed successfully`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isV2ThinEvent) {
      let thinEvent: { id: string; type: string };
      try {
        if (webhookSecret) {
          thinEvent = stripeClient.parseThinEvent(body, sig, webhookSecret) as { id: string; type: string };
        } else {
          console.warn("WARNING: No STRIPE_WEBHOOK_SECRET set. Skipping thin event signature verification.");
          thinEvent = { id: parsedBody.id as string, type: eventType };
        }
      } catch (sigErr) {
        throw new Error(`Thin event signature verification failed: ${sigErr}`);
      }

      console.log(`Processing V2 thin event: ${thinEvent.type} (id: ${thinEvent.id})`);
      const fullEvent = await stripeClient.v2.core.events.retrieve(thinEvent.id);

      if (thinEvent.type === "v2.core.account[requirements].updated") {
        await handleAccountRequirementsUpdated(fullEvent, supabaseUrl, supabaseServiceKey);
      } else if (thinEvent.type.startsWith("v2.core.account[configuration.") && thinEvent.type.endsWith("].capability_status_updated")) {
        await handleCapabilityStatusUpdated(fullEvent, supabaseUrl, supabaseServiceKey);
      } else {
        console.log(`Unhandled V2 event type: ${thinEvent.type}`);
      }

    } else {
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
      } else if (event.type === "checkout.session.async_payment_succeeded") {
        await handleCheckoutSessionCompleted(event, supabaseUrl, supabaseServiceKey, resendApiKey ?? null);
      } else if (event.type === "checkout.session.async_payment_failed") {
        console.log("Async payment failed — purchase NOT granted:", (event.data.object as Stripe.Checkout.Session).id);
      } else {
        console.log(`Unhandled V1 event type: ${event.type}`);
      }
    }

    // Mark event as successfully processed
    await logWebhookEvent(supabaseUrl, supabaseServiceKey, stripeEventId, eventType, parsedBody, "success");

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);

    // Log the failure so we can retry or investigate
    if (supabaseUrl && supabaseServiceKey) {
      await logWebhookEvent(supabaseUrl, supabaseServiceKey, stripeEventId, eventType, {}, "failed", message);
    }

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
  const metadata = session.metadata ?? {};
  const { listing_id, buyer_id, seller_id, price, seller_stripe_account_id } = metadata;

  console.log(`Checkout session ${session.id} completed. Metadata:`, JSON.stringify(metadata));
  console.log(`Payment status: ${session.payment_status}, Amount total: ${session.amount_total}`);

  // Only process listing-based purchases (productId purchases don't need DB records here)
  if (!listing_id || !buyer_id || !seller_id || !price) {
    console.warn("Missing required metadata for purchase record — skipping DB insert. Fields present:", 
      Object.keys(metadata).join(", ") || "(none)");
    return;
  }

  // Guard: only grant access when payment is fully confirmed.
  if (session.payment_status !== "paid") {
    console.log(`Skipping purchase insert — payment_status is '${session.payment_status}', not 'paid'. Will handle on payment_intent.succeeded.`);
    return;
  }

  // Idempotency: check if we already recorded this purchase
  const dupeCheckRes = await fetch(
    `${supabaseUrl}/rest/v1/purchases?stripe_session_id=eq.${session.id}&select=id`,
    { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
  );
  const dupeRows = await dupeCheckRes.json();
  if (Array.isArray(dupeRows) && dupeRows.length > 0) {
    console.log(`Purchase already exists for session ${session.id} — skipping duplicate insert`);
    return;
  }

  const amount = parseInt(price, 10);
  const platformFee = Math.round(amount * 0.2);
  const sellerAmount = amount - platformFee;

  const payoutTransferred = !!seller_stripe_account_id;

  console.log(`Purchase: listing=${listing_id}, amount=${amount}, seller_connected=${payoutTransferred}`);

  // Insert the purchase record into our DB — retry up to 3 times
  let insertSuccess = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
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
        payout_transferred: payoutTransferred,
      }),
    });

    if (insertRes.ok) {
      insertSuccess = true;
      console.log(`Purchase record inserted successfully for session ${session.id} (attempt ${attempt})`);
      break;
    }

    const err = await insertRes.text();
    console.error(`Purchase insert attempt ${attempt}/3 FAILED for session ${session.id}. Status: ${insertRes.status}. Error: ${err}`);

    if (attempt < 3) {
      // Wait before retrying (exponential backoff: 500ms, 1500ms)
      await new Promise(r => setTimeout(r, attempt * 500));
    }
  }

  if (!insertSuccess) {
    console.error(`CRITICAL: All 3 purchase insert attempts FAILED for session ${session.id}`);
    console.error(`Lost purchase data: listing=${listing_id}, buyer=${buyer_id}, seller=${seller_id}, amount=${amount}`);
    throw new Error(`Failed to insert purchase after 3 attempts for session ${session.id}`);
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

  // Send seller + buyer emails if Resend is configured
  if (resendApiKey) {
    try {
      const [listingRes, sellerRes, buyerRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${listing_id}&select=title,file_path,github_url,description,tech_stack,built_with,completeness_badge,demo_url,pricing_type`, {
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

      const listingInfo = listingData?.[0];
      const buyerEmail = buyerUser?.email;

      // Generate a 24-hour signed download URL if a ZIP exists
      let signedUrl: string | null = null;
      if (listingInfo?.file_path) {
        signedUrl = await getSignedDownloadUrl(supabaseUrl, supabaseServiceKey, listingInfo.file_path);
      }

      // Send both emails in parallel
      await Promise.all([
        sendSellerEmail({
          sellerEmail: sellerUser?.email,
          sellerName: sellerUser?.user_metadata?.name ?? "",
          listingTitle: listingInfo?.title ?? "Your project",
          sellerAmount,
          buyerEmail: buyerEmail ?? "a buyer",
          resendApiKey,
        }),
        buyerEmail ? sendBuyerEmail({
          buyerEmail,
          listingTitle: listingInfo?.title ?? "Your purchase",
          signedUrl,
          githubUrl: listingInfo?.github_url ?? null,
          amountPaid: amount,
          resendApiKey,
          listingId: listing_id,
          description: listingInfo?.description ?? null,
          techStack: listingInfo?.tech_stack ?? [],
          builtWith: listingInfo?.built_with ?? null,
          completenessBadge: listingInfo?.completeness_badge ?? null,
          demoUrl: listingInfo?.demo_url ?? null,
          pricingType: listingInfo?.pricing_type ?? "one_time",
        }) : Promise.resolve(),
      ]);
    } catch (emailErr) {
      console.error("Failed to send emails:", emailErr);
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
