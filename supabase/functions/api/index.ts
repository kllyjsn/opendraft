import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const BASE_URL = "https://opendraft.co";

function sb(auth?: string) {
  const opts: any = {};
  if (auth) opts.global = { headers: { Authorization: auth } };
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, opts);
}

function adminSb() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// ── OpenAPI Spec ──────────────────────────────────────────────────

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "OpenDraft Marketplace API",
    description: "REST API for the OpenDraft AI app marketplace. Browse listings, search builders, view bounties, and manage listings programmatically.",
    version: "1.0.0",
    contact: { email: "support@opendraft.co" },
  },
  servers: [{ url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/api` }],
  paths: {
    "/listings": {
      get: {
        summary: "Search listings",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search keyword" },
          { name: "category", in: "query", schema: { type: "string", enum: ["saas_tool","ai_app","landing_page","utility","game","other"] } },
          { name: "completeness", in: "query", schema: { type: "string", enum: ["prototype","mvp","production_ready"] } },
          { name: "max_price", in: "query", schema: { type: "integer" }, description: "Max price in cents" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["popular","newest","price_asc","price_desc"] } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: { "200": { description: "Array of listings" } },
      },
    },
    "/listings/{id}": {
      get: {
        summary: "Get listing by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Listing details with seller and reviews" } },
      },
    },
    "/trending": {
      get: {
        summary: "Get trending listings and market stats",
        responses: { "200": { description: "Trending data" } },
      },
    },
    "/bounties": {
      get: {
        summary: "List open bounties",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Array of bounties" } },
      },
    },
    "/builders": {
      get: {
        summary: "Search builders",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Array of builder profiles" } },
      },
    },
    "/builders/{username}": {
      get: {
        summary: "Get builder profile",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Builder profile with listings" } },
      },
    },
    "/categories": {
      get: {
        summary: "List all categories with counts",
        responses: { "200": { description: "Category counts" } },
      },
    },
    "/offers": {
      post: {
        summary: "Place an offer on a listing (auth required)",
        parameters: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["listing_id", "offer_amount"], properties: {
            listing_id: { type: "string", format: "uuid" },
            offer_amount: { type: "integer", description: "Bid amount in cents (min 25% of price)" },
            message: { type: "string", maxLength: 500 },
          }}}},
        },
        responses: { "201": { description: "Created offer" }, "401": { description: "Auth required" } },
      },
      get: {
        summary: "Get your offers (auth required)",
        parameters: [
          { name: "role", in: "query", schema: { type: "string", enum: ["buyer", "seller"], default: "buyer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "countered", "accepted", "rejected", "withdrawn"] } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: { "200": { description: "Array of offers" } },
      },
    },
    "/offers/{id}": {
      put: {
        summary: "Respond to an offer (accept/reject/counter/withdraw, auth required)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["action"], properties: {
            action: { type: "string", enum: ["accept", "reject", "counter", "withdraw"] },
            counter_amount: { type: "integer", description: "Counter amount in cents (required for counter action)" },
            message: { type: "string", maxLength: 500 },
          }}}},
        },
        responses: { "200": { description: "Updated offer status" } },
      },
    },
  },
};

// ── Route handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip the function prefix to get the route path
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/functions\/v1\/api/, "") || "/";
  const params = url.searchParams;

  try {
    // GET /openapi.json
    if (path === "/openapi.json" || path === "/openapi") {
      return json(OPENAPI_SPEC);
    }

    // GET /listings
    if (path === "/listings" && req.method === "GET") {
      const client = sb();
      let q = client
        .from("listings")
        .select("id,title,description,price,pricing_type,category,completeness_badge,tech_stack,screenshots,sales_count,view_count,demo_url,built_with")
        .eq("status", "live");

      const search = params.get("q");
      if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const category = params.get("category");
      if (category) q = q.eq("category", category);

      const completeness = params.get("completeness");
      if (completeness) q = q.eq("completeness_badge", completeness);

      const maxPrice = params.get("max_price");
      if (maxPrice) q = q.lte("price", parseInt(maxPrice));

      const sort = params.get("sort") || "popular";
      if (sort === "newest") q = q.order("created_at", { ascending: false });
      else if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("sales_count", { ascending: false });

      q = q.limit(Math.min(parseInt(params.get("limit") || "20"), 50));

      const { data, error: dbErr } = await q;
      if (dbErr) return err(dbErr.message, 500);

      // Log agent search demand signal if searching (fire-and-forget)
      if (search) {
        const admin = adminSb();
        admin.from("agent_demand_signals").insert({
          query: search.slice(0, 200),
          category: category || null,
          source: "api",
        }).then(() => {});
      }

      // Get agent popularity for all returned listings
      const admin = adminSb();
      const listingIds = (data || []).map((l: any) => l.id);
      const { data: agentPops } = listingIds.length > 0
        ? await admin.from("agent_popular_listings").select("listing_id,agent_view_count").in("listing_id", listingIds)
        : { data: [] };
      const popMap = new Map((agentPops || []).map((p: any) => [p.listing_id, p.agent_view_count]));

      return json((data || []).map((l: any) => ({
        id: l.id, title: l.title, description: l.description?.slice(0, 200),
        price_cents: l.price, pricing_type: l.pricing_type, category: l.category,
        completeness: l.completeness_badge, tech_stack: l.tech_stack,
        sales: l.sales_count, views: l.view_count, demo_url: l.demo_url,
        url: `${BASE_URL}/listing/${l.id}`,
        agent_views: popMap.get(l.id) || 0,
      })));
    }

    // GET /listings/:id
    const listingMatch = path.match(/^\/listings\/([a-f0-9-]{36})$/);
    if (listingMatch && req.method === "GET") {
      const client = sb();
      const { data, error: dbErr } = await client
        .from("listings").select("*").eq("id", listingMatch[1]).eq("status", "live").single();
      if (dbErr) return err("Listing not found", 404);

      const { data: seller } = await client
        .from("public_profiles").select("username,avatar_url,verified,total_sales").eq("user_id", data.seller_id).single();

      const { data: reviews } = await client
        .from("reviews").select("rating,review_text,created_at").eq("listing_id", data.id)
        .order("created_at", { ascending: false }).limit(10);

      // Log agent view (fire-and-forget)
      const admin = adminSb();
      admin.from("agent_listing_views").insert({ listing_id: data.id, source: "api", action: "view" }).then(() => {});

      // Get agent popularity
      const { data: agentPop } = await admin.from("agent_popular_listings").select("agent_view_count,unique_agents").eq("listing_id", data.id).maybeSingle();

      return json({
        ...data, seller, reviews: reviews || [], url: `${BASE_URL}/listing/${data.id}`,
        agent_popularity: agentPop ? { views: agentPop.agent_view_count, unique_agents: agentPop.unique_agents } : null,
      });
    }

    // GET /trending
    if (path === "/trending" && req.method === "GET") {
      const client = sb();
      const { data: topSales } = await client.from("listings")
        .select("id,title,category,price,sales_count,view_count,demo_url")
        .eq("status", "live").order("sales_count", { ascending: false }).limit(10);

      const { data: hotBounties } = await client.from("bounties")
        .select("title,category,budget,submissions_count")
        .eq("status", "open").order("budget", { ascending: false }).limit(5);

      return json({
        trending: (topSales || []).map((l: any) => ({
          id: l.id, title: l.title, category: l.category,
          price_cents: l.price, sales: l.sales_count, views: l.view_count,
          url: `${BASE_URL}/listing/${l.id}`,
        })),
        hot_bounties: hotBounties || [],
      });
    }

    // GET /bounties
    if (path === "/bounties" && req.method === "GET") {
      const client = sb();
      let q = client.from("bounties")
        .select("id,title,description,budget,category,tech_stack,submissions_count,created_at")
        .eq("status", "open").order("created_at", { ascending: false })
        .limit(Math.min(parseInt(params.get("limit") || "20"), 50));

      const category = params.get("category");
      if (category) q = q.eq("category", category);

      const { data, error: dbErr } = await q;
      if (dbErr) return err(dbErr.message, 500);
      return json(data);
    }

    // GET /builders
    if (path === "/builders" && req.method === "GET") {
      const client = sb();
      let q = client.from("public_profiles")
        .select("user_id,username,avatar_url,bio,verified,total_sales,followers_count")
        .order("total_sales", { ascending: false })
        .limit(Math.min(parseInt(params.get("limit") || "20"), 50));

      const search = params.get("q");
      if (search) q = q.ilike("username", `%${search}%`);

      const { data, error: dbErr } = await q;
      if (dbErr) return err(dbErr.message, 500);

      return json((data || []).map((p: any) => ({
        ...p, profile_url: `${BASE_URL}/builder/${p.user_id}`,
      })));
    }

    // GET /builders/:username
    const builderMatch = path.match(/^\/builders\/(.+)$/);
    if (builderMatch && req.method === "GET") {
      const client = sb();
      const { data: profile, error: dbErr } = await client
        .from("public_profiles").select("*").eq("username", decodeURIComponent(builderMatch[1])).single();
      if (dbErr) return err("Builder not found", 404);

      const { data: listings } = await client.from("listings")
        .select("id,title,price,pricing_type,category,completeness_badge,sales_count")
        .eq("seller_id", profile.user_id).eq("status", "live")
        .order("sales_count", { ascending: false }).limit(20);

      return json({ ...profile, listings: listings || [], url: `${BASE_URL}/builder/${profile.user_id}` });
    }

    // GET /categories
    if (path === "/categories" && req.method === "GET") {
      const client = sb();
      const cats = ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"];
      const results = [];
      for (const cat of cats) {
        const { count } = await client.from("listings").select("id", { count: "exact", head: true }).eq("status", "live").eq("category", cat);
        results.push({ category: cat, count: count || 0 });
      }
      return json(results);
    }

    // ── Offers / Bidding ───────────────────────────────────────────

    // Helper: extract user from Authorization header
    async function authUser() {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return null;
      const client = sb(authHeader);
      const token = authHeader.replace("Bearer ", "");
      const { data, error: authErr } = await client.auth.getUser(token);
      if (authErr || !data?.user) return null;
      return { id: data.user.id, client };
    }

    // POST /offers — place a new offer
    if (path === "/offers" && req.method === "POST") {
      const user = await authUser();
      if (!user) return err("Authentication required. Pass a Bearer token.", 401);

      const body = await req.json().catch(() => null);
      if (!body) return err("Invalid JSON body", 400);

      const { listing_id, offer_amount, message } = body;
      if (!listing_id || !offer_amount) return err("listing_id and offer_amount are required", 400);
      if (typeof offer_amount !== "number" || offer_amount < 1) return err("offer_amount must be a positive integer (cents)", 400);

      // Fetch listing
      const admin = adminSb();
      const { data: listing, error: lErr } = await admin.from("listings").select("id,price,seller_id,status").eq("id", listing_id).single();
      if (lErr || !listing) return err("Listing not found", 404);
      if (listing.status !== "live") return err("Listing is not available", 400);
      if (listing.seller_id === user.id) return err("Cannot bid on your own listing", 400);

      const minBid = Math.ceil(listing.price * 0.25);
      if (offer_amount < minBid) return err(`Minimum bid is ${minBid} cents (25% of price)`, 400);

      // Check for existing pending offer
      const { data: existing } = await admin.from("offers")
        .select("id").eq("listing_id", listing_id).eq("buyer_id", user.id)
        .in("status", ["pending", "countered"]).limit(1);
      if (existing && existing.length > 0) return err("You already have an active offer on this listing. Withdraw it first.", 409);

      const { data: offer, error: insertErr } = await admin.from("offers").insert({
        listing_id, buyer_id: user.id, seller_id: listing.seller_id,
        offer_amount, original_price: listing.price,
        message: (message || "").slice(0, 500) || null,
        status: "pending",
      }).select().single();
      if (insertErr) return err(insertErr.message, 500);

      // Notify seller (fire-and-forget)
      admin.from("notifications").insert({
        user_id: listing.seller_id, type: "offer",
        title: "New offer received",
        message: `An agent offered $${(offer_amount / 100).toFixed(2)} on your listing`,
        link: `/listing/${listing_id}`,
      }).then(() => {});

      // Log demand signal
      admin.from("agent_listing_views").insert({ listing_id, source: "api", action: "bid" }).then(() => {});

      return json(offer, 201);
    }

    // GET /offers — get authenticated user's offers
    if (path === "/offers" && req.method === "GET") {
      const user = await authUser();
      if (!user) return err("Authentication required", 401);

      const role = params.get("role") || "buyer"; // buyer or seller
      const status = params.get("status"); // optional filter
      const limit = Math.min(parseInt(params.get("limit") || "20"), 50);

      let q = user.client.from("offers")
        .select("id,listing_id,buyer_id,seller_id,offer_amount,original_price,counter_amount,status,message,seller_message,created_at,updated_at")
        .order("created_at", { ascending: false }).limit(limit);

      if (role === "seller") q = q.eq("seller_id", user.id);
      else q = q.eq("buyer_id", user.id);

      if (status) q = q.eq("status", status);

      const { data, error: qErr } = await q;
      if (qErr) return err(qErr.message, 500);
      return json(data || []);
    }

    // PUT /offers/:id — respond to / update an offer
    const offerMatch = path.match(/^\/offers\/([a-f0-9-]{36})$/);
    if (offerMatch && req.method === "PUT") {
      const user = await authUser();
      if (!user) return err("Authentication required", 401);

      const body = await req.json().catch(() => null);
      if (!body) return err("Invalid JSON body", 400);

      const offerId = offerMatch[1];
      const admin = adminSb();
      const { data: offer, error: oErr } = await admin.from("offers").select("*").eq("id", offerId).single();
      if (oErr || !offer) return err("Offer not found", 404);

      const { action, counter_amount, message: msg } = body;
      if (!action) return err("action is required (accept, reject, counter, withdraw)", 400);

      // Buyer actions
      if (user.id === offer.buyer_id) {
        if (action === "withdraw" && ["pending", "countered"].includes(offer.status)) {
          await admin.from("offers").update({ status: "withdrawn", updated_at: new Date().toISOString() }).eq("id", offerId);
          return json({ id: offerId, status: "withdrawn" });
        }
        if (action === "accept" && offer.status === "countered" && offer.counter_amount) {
          await admin.from("offers").update({ status: "accepted", offer_amount: offer.counter_amount, updated_at: new Date().toISOString() }).eq("id", offerId);
          admin.from("notifications").insert({
            user_id: offer.seller_id, type: "offer",
            title: "Offer accepted",
            message: `Buyer accepted your counter of $${(offer.counter_amount / 100).toFixed(2)}`,
            link: `/listing/${offer.listing_id}`,
          }).then(() => {});
          return json({ id: offerId, status: "accepted", final_amount: offer.counter_amount });
        }
        if (action === "counter" && offer.status === "countered" && counter_amount) {
          if (typeof counter_amount !== "number" || counter_amount < 1) return err("counter_amount must be positive", 400);
          await admin.from("offers").update({
            status: "pending", offer_amount: counter_amount, counter_amount: null,
            message: (msg || "").slice(0, 500) || offer.message, updated_at: new Date().toISOString(),
          }).eq("id", offerId);
          return json({ id: offerId, status: "pending", offer_amount: counter_amount });
        }
        if (action === "reject" && offer.status === "countered") {
          await admin.from("offers").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", offerId);
          return json({ id: offerId, status: "rejected" });
        }
      }

      // Seller actions
      if (user.id === offer.seller_id) {
        if (action === "accept" && offer.status === "pending") {
          await admin.from("offers").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", offerId);
          admin.from("notifications").insert({
            user_id: offer.buyer_id, type: "offer",
            title: "Offer accepted!",
            message: `Your offer of $${(offer.offer_amount / 100).toFixed(2)} was accepted`,
            link: `/listing/${offer.listing_id}`,
          }).then(() => {});
          return json({ id: offerId, status: "accepted", final_amount: offer.offer_amount });
        }
        if (action === "reject" && offer.status === "pending") {
          await admin.from("offers").update({ status: "rejected", seller_message: (msg || "").slice(0, 500) || null, updated_at: new Date().toISOString() }).eq("id", offerId);
          return json({ id: offerId, status: "rejected" });
        }
        if (action === "counter" && offer.status === "pending" && counter_amount) {
          if (typeof counter_amount !== "number" || counter_amount < 1) return err("counter_amount must be positive", 400);
          await admin.from("offers").update({
            status: "countered", counter_amount,
            seller_message: (msg || "").slice(0, 500) || null, updated_at: new Date().toISOString(),
          }).eq("id", offerId);
          admin.from("notifications").insert({
            user_id: offer.buyer_id, type: "offer",
            title: "Counter offer received",
            message: `Seller countered with $${(counter_amount / 100).toFixed(2)}`,
            link: `/listing/${offer.listing_id}`,
          }).then(() => {});
          return json({ id: offerId, status: "countered", counter_amount });
        }
      }

      return err("Invalid action for current offer state or unauthorized", 400);
    }

    // Root
    if (path === "/" || path === "") {
      return json({
        name: "OpenDraft API",
        version: "1.0.0",
        docs: `${Deno.env.get("SUPABASE_URL")}/functions/v1/api/openapi.json`,
        endpoints: ["/listings", "/listings/:id", "/trending", "/bounties", "/builders", "/builders/:username", "/categories", "/offers"],
        mcp_server: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mcp-server`,
        website: BASE_URL,
      });
    }

    return err("Not found", 404);
  } catch (e: any) {
    console.error("API error:", e);
    return err(e.message || "Internal error", 500);
  }
});
