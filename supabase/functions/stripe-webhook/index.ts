import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendSellerEmail({
  sellerEmail,
  sellerName,
  listingTitle,
  sellerAmount,
  buyerEmail,
  supabaseUrl,
  supabaseServiceKey,
}: {
  sellerEmail: string;
  sellerName: string;
  listingTitle: string;
  sellerAmount: number;
  buyerEmail: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}) {
  const earned = `$${(sellerAmount / 100).toFixed(2)}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#ddd6fe;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">OpenDraft</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:900;">💸 New sale!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hey ${sellerName || "there"},</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Your project <strong style="color:#111827;">${listingTitle}</strong> just sold on OpenDraft. Here's a summary:
            </p>

            <!-- Earnings box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;border:1px solid #ede9fe;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">You earned</p>
                  <p style="margin:0;font-size:40px;font-weight:900;color:#4c1d95;">${earned}</p>
                  <p style="margin:6px 0 0;font-size:12px;color:#8b5cf6;">After 20% platform fee · Paid to your connected Stripe account</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Project</td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;font-weight:600;text-align:right;">${listingTitle}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:14px;">Buyer</td>
                <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${buyerEmail}</td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
              Your payout will be sent to your connected Stripe account automatically. 
              Check your <a href="https://dashboard.stripe.com/balance" style="color:#7c3aed;font-weight:600;">Stripe dashboard</a> for payout timing.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">OpenDraft · The marketplace for vibe-coded projects</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: sellerEmail,
      subject: `💸 You just made ${earned} on OpenDraft!`,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase vars not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) throw new Error("Missing stripe-signature header");
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { listing_id, buyer_id, seller_id, price } = session.metadata ?? {};

      if (!listing_id || !buyer_id || !seller_id || !price) {
        throw new Error("Missing metadata in session");
      }

      const amount = parseInt(price, 10);
      const platformFee = Math.round(amount * 0.2);
      const sellerAmount = amount - platformFee;

      // Insert purchase
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

      // Increment sales_count on listing
      await fetch(`${supabaseUrl}/rest/v1/rpc/increment_sales_count`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listing_id_param: listing_id }),
      });

      // Increment total_sales on seller profile
      await fetch(`${supabaseUrl}/rest/v1/rpc/increment_seller_sales`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seller_id_param: seller_id }),
      });

      // Fetch listing title, seller email/name, and buyer email for the notification
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
        listingRes.json(),
        sellerRes.json(),
        buyerRes.json(),
      ]);

      const listingTitle = listingData?.[0]?.title ?? "Your project";
      const sellerEmail = sellerUser?.email;
      const sellerName = sellerUser?.user_metadata?.name ?? sellerUser?.user_metadata?.full_name ?? "";
      const buyerEmail = buyerUser?.email ?? "a buyer";

      // Send seller notification email
      if (sellerEmail) {
        try {
          await sendSellerEmail({
            sellerEmail,
            sellerName,
            listingTitle,
            sellerAmount,
            buyerEmail,
            supabaseUrl,
            supabaseServiceKey,
          });
          console.log(`Sale email sent to ${sellerEmail}`);
        } catch (emailErr) {
          // Don't fail the webhook if email fails
          console.error("Failed to send sale email:", emailErr);
        }
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
