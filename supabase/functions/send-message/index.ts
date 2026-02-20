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

    const { conversationId, listingId, sellerId, content } = await req.json();

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
    if (!convoId && listingId && sellerId) {
      // Check if conversation exists
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

    if (!convoId) {
      return new Response(JSON.stringify({ error: "Conversation ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
