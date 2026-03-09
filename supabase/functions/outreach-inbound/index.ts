import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json();

    // Resend sends different webhook event types
    // For inbound: the payload contains from, to, subject, text, html
    const eventType = payload.type;

    // Handle Resend inbound email webhook
    if (eventType === "email.received" || payload.from) {
      const fromEmail = typeof payload.from === "string"
        ? payload.from
        : payload.from?.email || payload.data?.from || "";
      const subject = payload.subject || payload.data?.subject || "(No subject)";
      const body = payload.text || payload.data?.text || payload.html || payload.data?.html || "";
      const toEmail = typeof payload.to === "string"
        ? payload.to
        : (Array.isArray(payload.to) ? payload.to[0] : payload.data?.to?.[0]) || "";

      if (!fromEmail) {
        return new Response(JSON.stringify({ error: "No sender email" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean email address (handle "Name <email>" format)
      const cleanEmail = fromEmail.includes("<")
        ? fromEmail.match(/<(.+?)>/)?.[1] || fromEmail
        : fromEmail;

      // Find the lead by email
      const { data: lead } = await supabase
        .from("outreach_leads")
        .select("id, campaign_id, business_name")
        .eq("contact_email", cleanEmail.toLowerCase())
        .single();

      if (!lead) {
        // Try case-insensitive match
        const { data: leadFuzzy } = await supabase
          .from("outreach_leads")
          .select("id, campaign_id, business_name")
          .ilike("contact_email", cleanEmail)
          .limit(1)
          .single();

        if (!leadFuzzy) {
          console.log(`No lead found for email: ${cleanEmail}`);
          return new Response(JSON.stringify({ status: "no_matching_lead", email: cleanEmail }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Use fuzzy match
        await storeInboundMessage(supabase, leadFuzzy, subject, body, cleanEmail);
        return new Response(JSON.stringify({ status: "stored", lead: leadFuzzy.business_name }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await storeInboundMessage(supabase, lead, subject, body, cleanEmail);

      return new Response(JSON.stringify({ status: "stored", lead: lead.business_name }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle Resend event webhooks (delivery, open, bounce, etc.)
    if (eventType && payload.data) {
      const data = payload.data;
      const tags = data.tags || {};
      const leadId = tags.lead_id;

      if (eventType === "email.delivered" && leadId) {
        await supabase
          .from("outreach_messages")
          .update({ message_status: "delivered" })
          .eq("lead_id", leadId)
          .eq("message_status", "sent")
          .order("created_at", { ascending: false })
          .limit(1);
      }

      if (eventType === "email.opened" && leadId) {
        await supabase
          .from("outreach_messages")
          .update({ message_status: "opened" })
          .eq("lead_id", leadId)
          .in("message_status", ["sent", "delivered"])
          .order("created_at", { ascending: false })
          .limit(1);
      }

      if (eventType === "email.bounced" && leadId) {
        await supabase
          .from("outreach_messages")
          .update({ message_status: "bounced" })
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Inbound webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function storeInboundMessage(
  supabase: any,
  lead: { id: string; campaign_id: string; business_name: string },
  subject: string,
  body: string,
  fromEmail: string
) {
  // Store the inbound message
  await supabase
    .from("outreach_messages")
    .insert({
      campaign_id: lead.campaign_id,
      lead_id: lead.id,
      channel: "email",
      subject,
      body: body.slice(0, 10000), // Cap body length
      message_status: "received",
      direction: "inbound",
      ai_generated: false,
      metadata: { from_email: fromEmail, type: "inbound_reply" },
    });

  // Update lead status to replied
  await supabase
    .from("outreach_leads")
    .update({
      lead_status: "replied",
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  // Mark the latest outbound message to this lead as "replied"
  await supabase
    .from("outreach_messages")
    .update({ 
      message_status: "replied",
      replied_at: new Date().toISOString(),
    })
    .eq("lead_id", lead.id)
    .eq("direction", "outbound")
    .in("message_status", ["sent", "delivered", "opened"])
    .order("created_at", { ascending: false })
    .limit(1);
}
