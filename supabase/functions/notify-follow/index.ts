import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { followingId } = await req.json();
    if (!followingId) {
      return new Response(JSON.stringify({ error: "followingId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get follower profile
    const { data: followerProfile } = await serviceClient
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", user.id)
      .single();

    const followerName = followerProfile?.username || "Someone";

    // Create in-app notification
    await serviceClient.from("notifications").insert({
      user_id: followingId,
      type: "new_follower",
      title: "New follower",
      message: `${followerName} started following you`,
      link: `/builder/${user.id}`,
    });

    // Send email notification
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const { data: recipientAuth } = await serviceClient.auth.admin.getUserById(followingId);
        const recipientEmail = recipientAuth?.user?.email;

        if (recipientEmail) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "OpenDraft <notifications@opendraft.co>",
              to: [recipientEmail],
              subject: `${followerName} is now following you on OpenDraft`,
              html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                <h2 style="color:#6366f1;">New follower 🎉</h2>
                <p><strong>${followerName}</strong> started following you on OpenDraft.</p>
                <a href="https://opendraft.co/builder/${user.id}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View their profile</a>
                <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
              </div>`,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Follow email notification failed:", emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-follow error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
