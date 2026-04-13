import { getCorsHeaders } from "../_shared/cors.ts";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth gate: only allow service-role or anon key (internal trigger)
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (authHeader !== `Bearer ${supabaseKey}` && authHeader !== `Bearer ${anonKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, username, listing_title } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8fa;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e8ec;">
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899,#06b6d4);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:24px;margin:0;">Welcome to OpenDraft! 🎉</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#1a1a2e;font-size:16px;margin:0 0 16px;">Hey ${username || "there"},</p>
      <p style="color:#64648c;font-size:14px;line-height:1.7;margin:0 0 16px;">
        Your first listing <strong style="color:#1a1a2e;">"${listing_title}"</strong> has been submitted and is pending review. We'll have it live within 24 hours.
      </p>
      <p style="color:#64648c;font-size:14px;line-height:1.7;margin:0 0 24px;">
        As a founding creator, here's what you get:
      </p>
      <ul style="color:#64648c;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
        <li><strong style="color:#1a1a2e;">0% platform fees</strong> — keep 100% of every sale for 6 months</li>
        <li><strong style="color:#1a1a2e;">Priority listing review</strong> — approved within 24 hours</li>
        <li><strong style="color:#1a1a2e;">Marketing spotlight</strong> — featured on our homepage</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://opendraft.co/guides/creators" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;font-size:14px;">
          Read the Creator Handbook →
        </a>
      </div>
      <p style="color:#64648c;font-size:14px;line-height:1.7;margin:24px 0 0;">
        Need help optimizing your listing? Just reply to this email — we're here.
      </p>
      <p style="color:#64648c;font-size:14px;margin:24px 0 0;">
        — The OpenDraft Team
      </p>
    </div>
    <div style="background:#f8f8fa;padding:16px 24px;text-align:center;border-top:1px solid #e8e8ec;">
      <p style="color:#a0a0b0;font-size:12px;margin:0;">
        <a href="https://opendraft.co/founders" style="color:#7c3aed;text-decoration:none;">Founder First Program</a> · 
        <a href="https://opendraft.co/dashboard" style="color:#7c3aed;text-decoration:none;">Your Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OpenDraft <jason@opendraft.co>",
        to: email,
        subject: `Welcome to OpenDraft — "${listing_title}" is pending review 🚀`,
        html,
      }),
    });

    const result = await res.json();
    console.log("Creator welcome email sent:", result);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending creator welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
