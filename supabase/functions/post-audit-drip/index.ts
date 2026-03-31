import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DripPayload {
  email: string;
  business_name: string;
  industry: string;
  top_app: string;
  monthly_savings: number;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DripPayload = await req.json();

    if (!body.email || !body.email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const annualSavings = body.monthly_savings * 12;

    // Send immediate audit results email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OpenDraft <jason@opendraft.co>",
        to: [body.email],
        subject: `Your ${body.business_name} audit is ready — save $${body.monthly_savings}/mo`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 22px; font-weight: 800; margin: 0;">Your ${body.business_name} Audit</h1>
    <p style="color: #666; font-size: 14px; margin-top: 4px;">${body.industry}</p>
  </div>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
    <p style="font-size: 12px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Potential Savings</p>
    <p style="font-size: 32px; font-weight: 900; color: #16a34a; margin: 0;">$${body.monthly_savings}/mo</p>
    <p style="font-size: 13px; color: #666; margin: 4px 0 0;">That's <strong>$${annualSavings}/year</strong> by owning your software</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="font-size: 12px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Top Recommendation</p>
    <p style="font-size: 18px; font-weight: 700; margin: 0;">${body.top_app}</p>
    <p style="color: #666; font-size: 13px; margin: 8px 0 0;">This is the highest-impact app we identified for your business.</p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://opendraft.co/?generate=${encodeURIComponent(body.top_app)}"
       style="display: inline-block; background: #1a1a1a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">
      Build ${body.top_app} Now →
    </a>
  </div>

  <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
    <p style="font-size: 12px; color: #999;">
      Sent by <a href="https://opendraft.co" style="color: #666;">OpenDraft</a> · The software platform built for enterprises
    </p>
  </div>
</body>
</html>`,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log to activity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    await sb.from("activity_log").insert({
      event_type: "post_audit_drip_sent",
      event_data: {
        email: body.email,
        business_name: body.business_name,
        industry: body.industry,
        top_app: body.top_app,
        monthly_savings: body.monthly_savings,
      },
      page: "/",
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("post-audit-drip error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
