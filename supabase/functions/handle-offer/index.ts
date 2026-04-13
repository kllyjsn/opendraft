/**
 * handle-offer Edge Function
 * --------------------------
 * Handles offer creation, acceptance, rejection, and counter-offers.
 * Sends in-app notifications + email notifications via Resend.
 *
 * Actions:
 *  - create: Buyer submits an offer (min 25% of listing price)
 *  - accept: Seller accepts an offer
 *  - reject: Seller rejects an offer
 *  - counter: Seller sends a counter-offer
 *  - accept_counter: Buyer accepts the counter-offer
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml } from "../_shared/html-escape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OpenDraft <notifications@opendraft.co>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error("Email send failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "create") {
      // ---- CREATE OFFER ----
      const { listingId, offerAmount, message } = body;
      if (!listingId || typeof listingId !== "string" || !uuidRegex.test(listingId))
        throw new Error("Invalid listingId");
      if (typeof offerAmount !== "number" || offerAmount < 100)
        throw new Error("Offer must be at least $1.00");

      // Fetch listing
      const { data: listing, error: lErr } = await adminClient
        .from("listings").select("id, price, seller_id, title, status")
        .eq("id", listingId).single();
      if (lErr || !listing) throw new Error("Listing not found");
      if (listing.status !== "live") throw new Error("Listing is not available");
      if (listing.price === 0) throw new Error("Cannot make offers on free listings");
      if (listing.seller_id === user.id) throw new Error("Cannot bid on your own listing");

      // Enforce 25% minimum
      const minOffer = Math.ceil(listing.price * 0.25);
      if (offerAmount < minOffer)
        throw new Error(`Offer must be at least $${(minOffer / 100).toFixed(2)} (25% of asking price)`);
      if (offerAmount >= listing.price)
        throw new Error("Offer must be less than the asking price. Just buy it!");

      // Check for existing pending offer
      const { data: existingOffer } = await adminClient
        .from("offers").select("id")
        .eq("listing_id", listingId).eq("buyer_id", user.id)
        .in("status", ["pending", "countered"])
        .maybeSingle();
      if (existingOffer) throw new Error("You already have an active offer on this listing");

      // Insert offer
      const { data: offer, error: insertErr } = await adminClient.from("offers").insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        offer_amount: offerAmount,
        original_price: listing.price,
        message: message?.slice(0, 500) || null,
        status: "pending",
      }).select("id").single();
      if (insertErr) throw new Error(insertErr.message);

      // Create notification for seller
      await adminClient.from("notifications").insert({
        user_id: listing.seller_id,
        type: "new_offer",
        title: "New offer received! 💰",
        message: `Someone offered $${(offerAmount / 100).toFixed(2)} for "${listing.title}" (asking $${(listing.price / 100).toFixed(2)}).`,
        link: "/dashboard?tab=offers",
        metadata: { offer_id: offer.id, listing_id: listingId },
      });

      // Send email to seller
      const { data: sellerAuth } = await adminClient.auth.admin.getUserById(listing.seller_id);
      if (sellerAuth?.user?.email) {
        await sendEmail(
          sellerAuth.user.email,
          `New offer on "${listing.title}" — $${(offerAmount / 100).toFixed(2)}`,
          `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#6366f1;">Someone made an offer! 💰</h2>
            <p>A buyer offered <strong>$${(offerAmount / 100).toFixed(2)}</strong> for your project <strong>"${escapeHtml(listing.title)}"</strong> (asking $${(listing.price / 100).toFixed(2)}).</p>
            ${message ? `<p style="color:#666;border-left:3px solid #e5e7eb;padding-left:12px;margin:16px 0;">"${escapeHtml(message)}"</p>` : ""}
            <p>Do you accept their offer?</p>
            <a href="https://opendraft.co/dashboard?tab=offers" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">Review Offer</a>
            <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
          </div>`
        );
      }

      return new Response(JSON.stringify({ success: true, offerId: offer.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "accept" || action === "reject" || action === "counter") {
      // ---- SELLER RESPONDS ----
      const { offerId, counterAmount, sellerMessage } = body;
      if (!offerId || !uuidRegex.test(offerId)) throw new Error("Invalid offerId");

      const { data: offer, error: oErr } = await adminClient
        .from("offers").select("*").eq("id", offerId).single();
      if (oErr || !offer) throw new Error("Offer not found");
      if (offer.seller_id !== user.id) throw new Error("Not your offer to respond to");
      if (offer.status !== "pending") throw new Error("Offer is no longer pending");

      // Fetch listing title
      const { data: listing } = await adminClient
        .from("listings").select("title").eq("id", offer.listing_id).single();
      const title = listing?.title || "Unknown project";

      if (action === "accept") {
        await adminClient.from("offers").update({
          status: "accepted",
          seller_message: sellerMessage?.slice(0, 500) || null,
        }).eq("id", offerId);

        // Notify buyer
        await adminClient.from("notifications").insert({
          user_id: offer.buyer_id,
          type: "offer_accepted",
          title: "Offer accepted! 🎉",
          message: `Your offer of $${(offer.offer_amount / 100).toFixed(2)} for "${title}" was accepted! Click to checkout.`,
          link: `/checkout/${offer.listing_id}?offer=${offerId}`,
          metadata: { offer_id: offerId, listing_id: offer.listing_id },
        });

        const { data: buyerAuth } = await adminClient.auth.admin.getUserById(offer.buyer_id);
        if (buyerAuth?.user?.email) {
          await sendEmail(
            buyerAuth.user.email,
            `Your offer on "${title}" was accepted! 🎉`,
            `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#22c55e;">Offer accepted! 🎉</h2>
              <p>The seller accepted your offer of <strong>$${(offer.offer_amount / 100).toFixed(2)}</strong> for <strong>"${escapeHtml(title)}"</strong>.</p>
              <a href="https://opendraft.co/checkout/${offer.listing_id}?offer=${offerId}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">Complete Purchase</a>
              <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
            </div>`
          );
        }

      } else if (action === "reject") {
        await adminClient.from("offers").update({
          status: "rejected",
          seller_message: sellerMessage?.slice(0, 500) || null,
        }).eq("id", offerId);

        await adminClient.from("notifications").insert({
          user_id: offer.buyer_id,
          type: "offer_rejected",
          title: "Offer declined",
          message: `Your offer of $${(offer.offer_amount / 100).toFixed(2)} for "${title}" was declined.`,
          link: `/listing/${offer.listing_id}`,
          metadata: { offer_id: offerId, listing_id: offer.listing_id },
        });

        const { data: buyerAuth } = await adminClient.auth.admin.getUserById(offer.buyer_id);
        if (buyerAuth?.user?.email) {
          await sendEmail(
            buyerAuth.user.email,
            `Update on your offer for "${title}"`,
            `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2>Offer update</h2>
              <p>Unfortunately, the seller declined your offer of <strong>$${(offer.offer_amount / 100).toFixed(2)}</strong> for <strong>"${escapeHtml(title)}"</strong>.</p>
              ${sellerMessage ? `<p style="color:#666;border-left:3px solid #e5e7eb;padding-left:12px;">"${escapeHtml(sellerMessage)}"</p>` : ""}
              <p>You can still purchase at the full price or make a new offer.</p>
              <a href="https://opendraft.co/listing/${offer.listing_id}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View Listing</a>
              <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
            </div>`
          );
        }

      } else if (action === "counter") {
        if (typeof counterAmount !== "number" || counterAmount < 100)
          throw new Error("Counter amount must be at least $1.00");
        if (counterAmount >= offer.original_price)
          throw new Error("Counter must be less than the asking price");
        if (counterAmount <= offer.offer_amount)
          throw new Error("Counter must be higher than the buyer's offer");

        await adminClient.from("offers").update({
          status: "countered",
          counter_amount: counterAmount,
          seller_message: sellerMessage?.slice(0, 500) || null,
        }).eq("id", offerId);

        await adminClient.from("notifications").insert({
          user_id: offer.buyer_id,
          type: "offer_countered",
          title: "Counter-offer received! 🔄",
          message: `The seller countered with $${(counterAmount / 100).toFixed(2)} for "${title}" (you offered $${(offer.offer_amount / 100).toFixed(2)}).`,
          link: `/listing/${offer.listing_id}`,
          metadata: { offer_id: offerId, listing_id: offer.listing_id, counter_amount: counterAmount },
        });

        const { data: buyerAuth } = await adminClient.auth.admin.getUserById(offer.buyer_id);
        if (buyerAuth?.user?.email) {
          await sendEmail(
            buyerAuth.user.email,
            `Counter-offer on "${title}" — $${(counterAmount / 100).toFixed(2)}`,
            `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#f59e0b;">Counter-offer! 🔄</h2>
              <p>The seller countered your offer of $${(offer.offer_amount / 100).toFixed(2)} with <strong>$${(counterAmount / 100).toFixed(2)}</strong> for <strong>"${escapeHtml(title)}"</strong>.</p>
              ${sellerMessage ? `<p style="color:#666;border-left:3px solid #e5e7eb;padding-left:12px;">"${escapeHtml(sellerMessage)}"</p>` : ""}
              <a href="https://opendraft.co/listing/${offer.listing_id}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View Counter-Offer</a>
              <p style="color:#999;font-size:12px;margin-top:24px;">— OpenDraft</p>
            </div>`
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "accept_counter") {
      // ---- BUYER ACCEPTS COUNTER ----
      const { offerId } = body;
      if (!offerId || !uuidRegex.test(offerId)) throw new Error("Invalid offerId");

      const { data: offer, error: oErr } = await adminClient
        .from("offers").select("*").eq("id", offerId).single();
      if (oErr || !offer) throw new Error("Offer not found");
      if (offer.buyer_id !== user.id) throw new Error("Not your offer");
      if (offer.status !== "countered") throw new Error("No counter-offer to accept");

      await adminClient.from("offers").update({ status: "accepted" }).eq("id", offerId);

      const { data: listing } = await adminClient
        .from("listings").select("title").eq("id", offer.listing_id).single();
      const title = listing?.title || "Unknown project";
      const acceptedAmount = offer.counter_amount || offer.offer_amount;

      // Notify seller
      await adminClient.from("notifications").insert({
        user_id: offer.seller_id,
        type: "counter_accepted",
        title: "Counter-offer accepted! 🎉",
        message: `The buyer accepted your counter of $${(acceptedAmount / 100).toFixed(2)} for "${title}".`,
        link: "/dashboard?tab=offers",
        metadata: { offer_id: offerId, listing_id: offer.listing_id },
      });

      return new Response(JSON.stringify({ success: true, checkoutUrl: `/checkout/${offer.listing_id}?offer=${offerId}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error("Invalid action. Use: create, accept, reject, counter, accept_counter");
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("handle-offer error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
