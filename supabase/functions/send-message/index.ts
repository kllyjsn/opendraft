import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const { conversationId, listingId, sellerId, recipientId, content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (content.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let convoId = conversationId;

    // Create conversation if needed
    if (!convoId) {
      // Case 1: Listing-based conversation
      if (listingId && sellerId) {
        const { data: existing } = await serviceClient
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("buyer_id", user.id)
          .maybeSingle();

        if (existing) {
          convoId = existing.id;
        } else {
          const { data: newConvo, error: convoError } = await serviceClient
            .from("conversations")
            .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
            .select("id")
            .single();
          if (convoError) throw new Error(convoError.message);
          convoId = newConvo.id;
        }
      }
      // Case 2: Direct message (no listing)
      else if (recipientId) {
        if (recipientId === user.id) {
          return new Response(JSON.stringify({ error: "Cannot message yourself" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Normalize: use LEAST/GREATEST to find existing DM regardless of who initiated
        const least = user.id < recipientId ? user.id : recipientId;
        const greatest = user.id < recipientId ? recipientId : user.id;

        const { data: existing } = await serviceClient
          .from("conversations")
          .select("id")
          .is("listing_id", null)
          .or(`and(buyer_id.eq.${least},seller_id.eq.${greatest}),and(buyer_id.eq.${greatest},seller_id.eq.${least})`)
          .maybeSingle();

        if (existing) {
          convoId = existing.id;
        } else {
          const { data: newConvo, error: convoError } = await serviceClient
            .from("conversations")
            .insert({ buyer_id: user.id, seller_id: recipientId })
            .select("id")
            .single();
          if (convoError) throw new Error(convoError.message);
          convoId = newConvo.id;
        }
      } else {
        return new Response(JSON.stringify({ error: "Recipient or conversation required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify participant
    const { data: convo } = await serviceClient
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", convoId)
      .single();

    if (!convo || (convo.buyer_id !== user.id && convo.seller_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert message
    const { data: message, error: msgError } = await serviceClient
      .from("messages")
      .insert({ conversation_id: convoId, sender_id: user.id, content: content.trim() })
      .select()
      .single();

    if (msgError) throw new Error(msgError.message);

    // Update conversation timestamp
    await serviceClient
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convoId);

    // Publish to PubNub
    const publishKey = Deno.env.get("PUBNUB_PUBLISH_KEY");
    const subscribeKey = Deno.env.get("PUBNUB_SUBSCRIBE_KEY");

    if (publishKey && subscribeKey) {
      const channel = `chat_${convoId}`;
      const pubnubPayload = {
        id: message.id,
        conversation_id: convoId,
        sender_id: user.id,
        content: content.trim(),
        created_at: message.created_at,
        read: false,
      };

      const url = `https://ps.pndsn.com/publish/${publishKey}/${subscribeKey}/0/${channel}/0/${encodeURIComponent(JSON.stringify(pubnubPayload))}`;
      await fetch(url);
    }

    // Send email notification to recipient
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const recipientUserId = convo.buyer_id === user.id ? convo.seller_id : convo.buyer_id;
        const [recipientAuth, senderProfile] = await Promise.all([
          serviceClient.auth.admin.getUserById(recipientUserId),
          serviceClient.from("profiles").select("username").eq("user_id", user.id).single(),
        ]);
        const recipientEmail = recipientAuth.data?.user?.email;
        const senderName = senderProfile.data?.username || "Someone";
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
              subject: `New message from ${senderName} on OpenDraft`,
              html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                <h2 style="color:#6366f1;">New message 💬</h2>
                <p><strong>${senderName}</strong> sent you a message:</p>
                <p style="color:#374151;border-left:3px solid #e5e7eb;padding-left:12px;margin:16px 0;">"${content.trim().slice(0, 200)}${content.trim().length > 200 ? "…" : ""}"</p>
                <a href="https://opendraft.co/messages" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View Messages</a>
                <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
              </div>`,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }
    }

    // ── Site Doctor: detect bug reports and auto-trigger diagnosis ──
    const bugKeywords = ["broken", "not working", "error", "bug", "crash", "blank page", "404", "500", "white screen", "doesn't load", "won't load", "can't access", "down", "offline"];
    const lowerContent = content.toLowerCase();
    const isBugReport = bugKeywords.some(kw => lowerContent.includes(kw));

    if (isBugReport && convo) {
      try {
        // Find the listing associated with this conversation
        const { data: convoFull } = await serviceClient
          .from("conversations")
          .select("listing_id")
          .eq("id", convoId)
          .single();

        if (convoFull?.listing_id) {
          // Fire-and-forget site doctor
          const doctorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/site-doctor`;
          fetch(doctorUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
            },
            body: JSON.stringify({
              mode: "chat_report",
              listing_id: convoFull.listing_id,
              reported_issue: content.trim(),
              reporter_id: user.id,
            }),
          }).catch(e => console.error("Site doctor trigger failed:", e));
        }
      } catch (e) {
        console.error("Bug detection failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ message, conversationId: convoId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-message error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
