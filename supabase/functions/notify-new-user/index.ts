import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "kllyjsn@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    // Supports both direct call { user_id, email, username } and DB webhook { record }
    const record = payload.record ?? payload;
    const userId = record.user_id ?? record.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    const email = authUser?.user?.email ?? "unknown";
    const username = profile?.username ?? email.split("@")[0];
    const avatarUrl = profile?.avatar_url ?? null;
    const provider =
      authUser?.user?.app_metadata?.provider ?? "email";
    const createdAt = authUser?.user?.created_at
      ? new Date(authUser.user.created_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "just now";

    // Check existing listings
    const { count: listingCount } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId);

    // Check existing purchases
    const { count: purchaseCount } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId);

    // Build synopsis
    const synopsis = [
      `📧 **Email:** ${email}`,
      `👤 **Username:** ${username}`,
      `🔐 **Auth Provider:** ${provider}`,
      `📅 **Signed up:** ${createdAt}`,
      avatarUrl ? `🖼️ **Avatar:** ${avatarUrl}` : null,
      `📦 **Listings:** ${listingCount ?? 0}`,
      `🛒 **Purchases:** ${purchaseCount ?? 0}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Synopsis:\n", synopsis);
      return new Response(
        JSON.stringify({ success: false, error: "No RESEND_API_KEY" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8fa;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e8ec;">
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899,#06b6d4);padding:24px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;">🎉 New User Signup</h1>
    </div>
    <div style="padding:24px;">
      ${avatarUrl ? `<img src="${avatarUrl}" width="64" height="64" style="border-radius:50%;margin-bottom:16px;" />` : ""}
      <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:120px;">Email</td><td style="padding:8px 0;font-weight:600;">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Username</td><td style="padding:8px 0;font-weight:600;">${username}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Auth Provider</td><td style="padding:8px 0;">${provider}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Signed Up</td><td style="padding:8px 0;">${createdAt}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Listings</td><td style="padding:8px 0;">${listingCount ?? 0}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Purchases</td><td style="padding:8px 0;">${purchaseCount ?? 0}</td></tr>
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="https://opendraft.co/admin" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:bold;font-size:13px;">
          View Admin Dashboard →
        </a>
      </div>
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
        from: "OpenDraft <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `🆕 New user: ${username} (${email})`,
        html,
      }),
    });

    const result = await res.json();
    console.log("New user notification sent:", result);

    return new Response(JSON.stringify({ success: true, synopsis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-new-user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
