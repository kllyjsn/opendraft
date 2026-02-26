import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase helpers ──────────────────────────────────────────────

function getAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function getAnon(authHeader?: string) {
  const opts: any = {};
  if (authHeader) opts.global = { headers: { Authorization: authHeader } };
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, opts);
}

// ── API Key auth helper ───────────────────────────────────────────

async function resolveAuth(authHeader?: string): Promise<{ userId: string | null; source: "bearer" | "apikey" | "none" }> {
  if (!authHeader) return { userId: null, source: "none" };

  // Check for API key (prefixed with "od_")
  if (authHeader.startsWith("Bearer od_")) {
    const apiKey = authHeader.replace("Bearer ", "");
    const keyHash = await hashKey(apiKey);
    const sb = getAdmin();
    const { data } = await sb
      .from("agent_api_keys")
      .select("user_id")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .single();

    if (data) {
      // Update last_used_at
      await sb.from("agent_api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
      return { userId: data.user_id, source: "apikey" };
    }
    return { userId: null, source: "none" };
  }

  // Standard Bearer token
  const sb = getAnon(authHeader);
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return { userId: null, source: "none" };
  return { userId: data.user.id, source: "bearer" };
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return "od_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Demand signal capture ─────────────────────────────────────────

async function captureDemandSignal(query: string, category?: string, techStack?: string[], maxPrice?: number, agentId?: string) {
  try {
    const sb = getAdmin();
    await sb.from("agent_demand_signals").insert({
      query: query?.slice(0, 500) || "browsing",
      category: category || null,
      tech_stack: techStack || null,
      max_price: maxPrice || null,
      source: "mcp",
      agent_id: agentId || null,
    });
  } catch { /* non-fatal */ }
}

// ── MCP Server ────────────────────────────────────────────────────

const mcpServer = new McpServer({ name: "opendraft-marketplace", version: "3.0.0" });

// ── search_listings (with demand capture) ─────────────────────────

mcpServer.tool({
  name: "search_listings",
  description: "Search the OpenDraft marketplace for AI-built apps. Filter by keyword, category, tech stack, price range, and completeness. If no results match, your search is logged as a demand signal to inform builders what to create next.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword" },
      category: { type: "string", enum: ["saas_tool","ai_app","landing_page","utility","game","other"] },
      max_price: { type: "number", description: "Max price in cents" },
      tech_stack: { type: "array", items: { type: "string" }, description: "Filter by technologies" },
      completeness: { type: "string", enum: ["prototype","mvp","production_ready"] },
      limit: { type: "number", description: "Max results (default 20, max 50)" },
    },
  },
  handler: async (args: any) => {
    const sb = getAnon();
    let q = sb.from("listings")
      .select("id,title,description,price,pricing_type,category,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,demo_url")
      .eq("status", "live")
      .order("sales_count", { ascending: false })
      .limit(Math.min(args.limit || 20, 50));

    if (args.category) q = q.eq("category", args.category);
    if (args.completeness) q = q.eq("completeness_badge", args.completeness);
    if (args.max_price != null) q = q.lte("price", args.max_price);
    if (args.query) q = q.or(`title.ilike.%${args.query}%,description.ilike.%${args.query}%`);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    let results = data || [];
    if (args.tech_stack?.length) {
      const wanted = args.tech_stack.map((t: string) => t.toLowerCase());
      results = results.filter((l: any) => l.tech_stack?.some((t: string) => wanted.includes(t.toLowerCase())));
    }

    // Capture demand signal if no results
    if (results.length === 0 && (args.query || args.category || args.tech_stack?.length)) {
      await captureDemandSignal(args.query || "", args.category, args.tech_stack, args.max_price);
    }

    const mapped = results.map((l: any) => ({
      id: l.id, title: l.title, description: l.description?.slice(0, 200),
      price_cents: l.price, pricing_type: l.pricing_type, category: l.category,
      completeness: l.completeness_badge, tech_stack: l.tech_stack,
      sales: l.sales_count, views: l.view_count, demo_url: l.demo_url,
      url: `https://opendraft.lovable.app/listing/${l.id}`,
    }));

    const response: any = { listings: mapped, total: mapped.length };
    if (results.length === 0) {
      response.demand_captured = true;
      response.message = "No results found. Your search has been logged as a demand signal — builders will see what agents are looking for.";
    }

    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
});

// ── get_listing ───────────────────────────────────────────────────

mcpServer.tool({
  name: "get_listing",
  description: "Get full details for a specific listing by ID, including seller profile, reviews, and purchase decision data.",
  inputSchema: {
    type: "object",
    properties: { listing_id: { type: "string", description: "UUID of the listing" } },
    required: ["listing_id"],
  },
  handler: async (args: any) => {
    const sb = getAnon();
    const { data, error } = await sb.from("listings").select("*").eq("id", args.listing_id).eq("status", "live").single();
    if (error) throw new Error("Listing not found");

    const { data: profile } = await sb.from("public_profiles").select("username,avatar_url,verified,total_sales").eq("user_id", data.seller_id).single();
    const { data: reviews } = await sb.from("reviews").select("rating,review_text,created_at").eq("listing_id", args.listing_id).order("created_at", { ascending: false }).limit(5);

    const ratings = (reviews || []).map((r: any) => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;

    return { content: [{ type: "text", text: JSON.stringify({
      ...data, seller: profile, reviews: reviews || [],
      average_rating: avgRating, review_count: ratings.length,
      url: `https://opendraft.lovable.app/listing/${data.id}`,
      decision_factors: {
        has_demo: !!data.demo_url, has_source_code: !!data.file_path,
        has_screenshots: (data.screenshots?.length || 0) > 0,
        seller_verified: profile?.verified || false,
        seller_total_sales: profile?.total_sales || 0,
      },
    }, null, 2) }] };
  },
});

// ── list_categories ───────────────────────────────────────────────

mcpServer.tool({
  name: "list_categories",
  description: "Get all available listing categories with counts.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const sb = getAnon();
    const cats = ["saas_tool","ai_app","landing_page","utility","game","other"];
    const results = [];
    for (const cat of cats) {
      const { count } = await sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "live").eq("category", cat);
      results.push({ category: cat, count: count || 0 });
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
});

// ── get_trending ──────────────────────────────────────────────────

mcpServer.tool({
  name: "get_trending",
  description: "Get trending listings, hot bounties, and market intelligence. Includes what agents are searching for (demand signals).",
  inputSchema: { type: "object", properties: { limit: { type: "number", description: "Max results (default 10)" } } },
  handler: async (args: any) => {
    const sb = getAnon();
    const admin = getAdmin();
    const limit = Math.min(args.limit || 10, 30);

    const { data: topSales } = await sb.from("listings")
      .select("id,title,category,completeness_badge,price,pricing_type,sales_count,view_count,tech_stack,demo_url")
      .eq("status", "live").order("sales_count", { ascending: false }).limit(limit);

    const { data: hotBounties } = await sb.from("bounties")
      .select("id,title,category,budget,submissions_count")
      .eq("status", "open").order("budget", { ascending: false }).limit(5);

    // Recent demand signals — what agents are looking for
    const { data: demandSignals } = await admin.from("agent_demand_signals")
      .select("query,category,tech_stack,created_at")
      .order("created_at", { ascending: false }).limit(10);

    return { content: [{ type: "text", text: JSON.stringify({
      trending_listings: (topSales || []).map((l: any) => ({
        id: l.id, title: l.title, category: l.category,
        price_cents: l.price, sales: l.sales_count, views: l.view_count,
        url: `https://opendraft.lovable.app/listing/${l.id}`,
      })),
      hot_bounties: hotBounties || [],
      agent_demand_signals: demandSignals || [],
      marketplace_url: "https://opendraft.lovable.app",
    }, null, 2) }] };
  },
});

// ── list_bounties ─────────────────────────────────────────────────

mcpServer.tool({
  name: "list_bounties",
  description: "Browse open bounties — paid project requests from buyers. Great for finding work to fulfill.",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ["saas_tool","ai_app","landing_page","utility","game","other"] },
      limit: { type: "number" },
    },
  },
  handler: async (args: any) => {
    const sb = getAnon();
    let q = sb.from("bounties").select("id,title,description,budget,category,tech_stack,submissions_count,created_at")
      .eq("status", "open").order("created_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (args.category) q = q.eq("category", args.category);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ── get_bounty ────────────────────────────────────────────────────

mcpServer.tool({
  name: "get_bounty",
  description: "Get full details for a specific bounty.",
  inputSchema: { type: "object", properties: { bounty_id: { type: "string" } }, required: ["bounty_id"] },
  handler: async (args: any) => {
    const sb = getAnon();
    const { data, error } = await sb.from("bounties").select("*").eq("id", args.bounty_id).single();
    if (error) throw new Error("Bounty not found");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ── search_builders ───────────────────────────────────────────────

mcpServer.tool({
  name: "search_builders",
  description: "Search for builders by username or browse top builders.",
  inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } } },
  handler: async (args: any) => {
    const sb = getAnon();
    let q = sb.from("public_profiles").select("user_id,username,avatar_url,bio,verified,total_sales,followers_count")
      .order("total_sales", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (args.query) q = q.ilike("username", `%${args.query}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify((data || []).map((p: any) => ({ ...p, profile_url: `https://opendraft.lovable.app/builder/${p.user_id}` })), null, 2) }] };
  },
});

// ── get_builder_profile ───────────────────────────────────────────

mcpServer.tool({
  name: "get_builder_profile",
  description: "View a builder's full profile and listings.",
  inputSchema: { type: "object", properties: { username: { type: "string" } }, required: ["username"] },
  handler: async (args: any) => {
    const sb = getAnon();
    const { data: profile, error } = await sb.from("public_profiles").select("*").eq("username", args.username).single();
    if (error) throw new Error("Builder not found");
    const { data: listings } = await sb.from("listings").select("id,title,price,pricing_type,category,completeness_badge,sales_count")
      .eq("seller_id", profile.user_id).eq("status", "live").order("sales_count", { ascending: false }).limit(20);
    return { content: [{ type: "text", text: JSON.stringify({ ...profile, listings: listings || [], url: `https://opendraft.lovable.app/builder/${profile.user_id}` }, null, 2) }] };
  },
});

// ── get_reviews ───────────────────────────────────────────────────

mcpServer.tool({
  name: "get_reviews",
  description: "Get reviews and ratings for a listing.",
  inputSchema: { type: "object", properties: { listing_id: { type: "string" }, limit: { type: "number" } }, required: ["listing_id"] },
  handler: async (args: any) => {
    const sb = getAnon();
    const { data, error } = await sb.from("reviews").select("rating,review_text,created_at,buyer_id")
      .eq("listing_id", args.listing_id).order("created_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (error) throw new Error(error.message);
    const ratings = (data || []).map((r: any) => r.rating);
    const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;
    return { content: [{ type: "text", text: JSON.stringify({ average_rating: avg, total_reviews: ratings.length, reviews: data }, null, 2) }] };
  },
});

// ── create_account ────────────────────────────────────────────────

mcpServer.tool({
  name: "create_account",
  description: "Register a new user account. Use sign_in to get a token, or generate_api_key for persistent agent auth.",
  inputSchema: {
    type: "object",
    properties: { email: { type: "string" }, password: { type: "string" }, username: { type: "string" } },
    required: ["email", "password", "username"],
  },
  handler: async (args: any) => {
    if (!args.email || !args.password || !args.username) throw new Error("email, password, and username required");
    if (args.password.length < 8) throw new Error("Password must be at least 8 characters");
    if (args.username.length > 50) throw new Error("Username must be under 50 characters");
    const sb = getAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email: args.email, password: args.password, email_confirm: true,
      user_metadata: { name: args.username },
    });
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify({
      user_id: data.user.id, email: data.user.email,
      message: "Account created. Use sign_in to get a session token, or generate_api_key for persistent agent auth.",
    }, null, 2) }] };
  },
});

// ── sign_in ───────────────────────────────────────────────────────

mcpServer.tool({
  name: "sign_in",
  description: "Sign in and get an access token. For persistent auth, use generate_api_key after signing in.",
  inputSchema: {
    type: "object",
    properties: { email: { type: "string" }, password: { type: "string" } },
    required: ["email", "password"],
  },
  handler: async (args: any) => {
    if (!args.email || !args.password) throw new Error("email and password required");
    const sb = getAnon();
    const { data, error } = await sb.auth.signInWithPassword({ email: args.email, password: args.password });
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify({
      access_token: data.session.access_token, refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in, user_id: data.user.id,
      message: "Use this token as Bearer auth. For persistent agent auth, call generate_api_key.",
    }, null, 2) }] };
  },
});

// ── generate_api_key (NEW) ────────────────────────────────────────

mcpServer.tool({
  name: "generate_api_key",
  description: "Generate a persistent API key for agent authentication. API keys don't expire (until revoked) and start with 'od_'. Requires sign_in first.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Label for this key (e.g., 'my-agent')" },
      scopes: { type: "array", items: { type: "string", enum: ["read", "write", "purchase"] }, description: "Permissions: read (search/browse), write (create listings), purchase (buy)" },
    },
    required: ["name"],
  },
  handler: async () => {
    throw new Error("Authentication required. Sign in first with sign_in tool, then include the Bearer token.");
  },
});

// ── register_webhook (NEW) ────────────────────────────────────────

mcpServer.tool({
  name: "register_webhook",
  description: "Subscribe to real-time events via webhook. Get notified when new listings match your criteria. Requires auth.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Webhook URL to receive POST notifications" },
      events: { type: "array", items: { type: "string", enum: ["new_listing", "price_drop", "new_bounty"] }, description: "Events to subscribe to" },
      filters: {
        type: "object",
        description: "Optional filters",
        properties: {
          categories: { type: "array", items: { type: "string" } },
          tech_stack: { type: "array", items: { type: "string" } },
          max_price: { type: "number" },
        },
      },
    },
    required: ["url", "events"],
  },
  handler: async () => {
    throw new Error("Authentication required. Sign in or use an API key.");
  },
});

// ── get_demand_signals (NEW) ──────────────────────────────────────

mcpServer.tool({
  name: "get_demand_signals",
  description: "See what other agents and users are searching for but can't find. Great for discovering unmet market needs and deciding what to build.",
  inputSchema: { type: "object", properties: { limit: { type: "number", description: "Max results (default 20)" } } },
  handler: async (args: any) => {
    const sb = getAdmin();
    const { data, error } = await sb.from("agent_demand_signals")
      .select("query,category,tech_stack,max_price,created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit || 20, 50));
    if (error) throw new Error(error.message);

    // Aggregate top queries
    const queryMap = new Map<string, number>();
    (data || []).forEach((d: any) => {
      const q = d.query.toLowerCase().trim();
      if (q) queryMap.set(q, (queryMap.get(q) || 0) + 1);
    });
    const topQueries = [...queryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { content: [{ type: "text", text: JSON.stringify({
      recent_signals: data || [],
      top_unmet_queries: topQueries.map(([q, count]) => ({ query: q, search_count: count })),
      message: "These are searches that returned zero results. Building apps that match these signals has high demand.",
    }, null, 2) }] };
  },
});

// ── Authenticated tool placeholders ───────────────────────────────

mcpServer.tool({
  name: "create_listing",
  description: "List a new app for sale. Requires auth (Bearer token or API key with 'write' scope).",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      pricing_type: { type: "string", enum: ["one_time", "monthly"] },
      category: { type: "string", enum: ["saas_tool","ai_app","landing_page","utility","game","other"] },
      tech_stack: { type: "array", items: { type: "string" } },
      demo_url: { type: "string" }, github_url: { type: "string" },
      screenshots: { type: "array", items: { type: "string" } },
      completeness_badge: { type: "string", enum: ["prototype","mvp","production_ready"] },
    },
    required: ["title", "description", "price", "category"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

mcpServer.tool({
  name: "submit_to_bounty",
  description: "Submit a listing as a bounty solution. Requires auth.",
  inputSchema: {
    type: "object",
    properties: { bounty_id: { type: "string" }, listing_id: { type: "string" }, message: { type: "string" } },
    required: ["bounty_id", "listing_id"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

mcpServer.tool({
  name: "initiate_purchase",
  description: "Start Stripe checkout for a listing. Requires auth.",
  inputSchema: { type: "object", properties: { listing_id: { type: "string" } }, required: ["listing_id"] },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── place_offer ───────────────────────────────────────────────────

mcpServer.tool({
  name: "place_offer",
  description: "Place a bid/offer on a listing. Minimum offer is 25% of listing price. Requires auth. The seller will be notified and can accept, reject, or counter your offer.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing to bid on" },
      offer_amount: { type: "number", description: "Your offer amount in cents (e.g., 1999 = $19.99)" },
      message: { type: "string", description: "Optional message to the seller explaining your offer" },
    },
    required: ["listing_id", "offer_amount"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── get_my_offers ─────────────────────────────────────────────────

mcpServer.tool({
  name: "get_my_offers",
  description: "View all your active offers/bids. Shows status (pending, accepted, rejected, countered), counter amounts, and seller messages. Requires auth.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["pending", "accepted", "rejected", "countered", "all"], description: "Filter by offer status (default: all)" },
      limit: { type: "number", description: "Max results (default 20)" },
    },
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── respond_to_counter ────────────────────────────────────────────

mcpServer.tool({
  name: "respond_to_counter",
  description: "Accept or reject a seller's counter-offer, or place a new counter-bid. When a seller counters your offer, use this to continue negotiation. Requires auth.",
  inputSchema: {
    type: "object",
    properties: {
      offer_id: { type: "string", description: "UUID of the offer to respond to" },
      action: { type: "string", enum: ["accept", "reject", "counter"], description: "Your response to the counter-offer" },
      new_amount: { type: "number", description: "New offer amount in cents (required if action is 'counter')" },
      message: { type: "string", description: "Optional message to the seller" },
    },
    required: ["offer_id", "action"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── withdraw_offer ────────────────────────────────────────────────

mcpServer.tool({
  name: "withdraw_offer",
  description: "Withdraw/cancel a pending or countered offer. Requires auth.",
  inputSchema: {
    type: "object",
    properties: {
      offer_id: { type: "string", description: "UUID of the offer to withdraw" },
    },
    required: ["offer_id"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── quick_purchase (ZERO-FRICTION) ────────────────────────────────

mcpServer.tool({
  name: "quick_purchase",
  description: "One-call frictionless purchase: auto-creates an account (if needed), places a bid or buys at asking price, and returns a headless payment link. No multi-step onboarding required. Perfect for autonomous agents.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing to purchase" },
      email: { type: "string", description: "Agent's email (used for account creation if needed)" },
      offer_amount: { type: "number", description: "Optional: bid amount in cents. Omit to buy at asking price." },
      message: { type: "string", description: "Optional message to seller (for bids)" },
    },
    required: ["listing_id", "email"],
  },
  handler: async () => { throw new Error("This tool is handled by the authenticated route handler."); },
});

// ── headless_checkout ─────────────────────────────────────────────

mcpServer.tool({
  name: "headless_checkout",
  description: "Get a payment link for a listing without browser redirects. Returns a Stripe checkout URL that can be opened programmatically or shared. Requires auth.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing to purchase" },
      offer_id: { type: "string", description: "Optional: offer ID if purchasing at a negotiated price" },
    },
    required: ["listing_id"],
  },
  handler: async () => { throw new Error("Auth required. Use sign_in or API key."); },
});

// ── Hono app ──────────────────────────────────────────────────────

const app = new Hono();
const transport = new StreamableHttpTransport();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

app.options("/*", (c) => new Response(null, { headers: CORS }));

// GET — discovery
app.get("/*", (c) => {
  return c.json({
    name: "opendraft-marketplace",
    version: "3.1.0",
    protocol: "MCP (Model Context Protocol)",
    transport: "Streamable HTTP",
    description: "OpenDraft — the #1 app store for AI agents. 23 tools including zero-friction quick_purchase (one-call account creation + payment). Full autonomous bidding loop.",
    tools: [
      "search_listings", "get_listing", "list_categories", "get_trending",
      "list_bounties", "get_bounty", "search_builders", "get_builder_profile",
      "get_reviews", "get_demand_signals", "create_account", "sign_in",
      "generate_api_key", "register_webhook", "create_listing",
      "submit_to_bounty", "initiate_purchase",
      "place_offer", "get_my_offers", "respond_to_counter", "withdraw_offer",
      "quick_purchase", "headless_checkout",
    ],
    auth_methods: ["Bearer token (from sign_in)", "API key (od_xxx from generate_api_key)", "None (for quick_purchase)"],
    zero_friction: "quick_purchase — single call creates account + pays. No onboarding steps.",
    bidding_flow: "place_offer → (seller counters) → respond_to_counter → (accept/reject/counter) → headless_checkout",
    documentation: "https://opendraft.co/developers",
    agents_page: "https://opendraft.co/agents",
    llms_txt: "https://opendraft.co/llms.txt",
    mcp_discovery: "https://opendraft.co/.well-known/mcp.json",
    smithery: "https://opendraft.co/.well-known/smithery.yaml",
  });
});

// POST — handle authenticated tools manually, delegate rest to mcp-lite
app.post("/*", async (c) => {
  const authHeader = c.req.header("Authorization");
  const body = await c.req.json();

  if (body.method === "tools/call") {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};
    const authTools = ["create_listing", "initiate_purchase", "submit_to_bounty", "generate_api_key", "register_webhook", "place_offer", "get_my_offers", "respond_to_counter", "withdraw_offer", "quick_purchase", "headless_checkout"];

    if (authTools.includes(toolName)) {
      // quick_purchase has special auth handling — it auto-creates accounts
      if (toolName === "quick_purchase") {
        try {
          const admin = getAdmin();
          if (!args.listing_id || !args.email) throw new Error("listing_id and email are required");

          // Get listing
          const { data: listing, error: listErr } = await admin.from("listings")
            .select("id,price,pricing_type,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
          if (listErr || !listing) throw new Error("Listing not found or not live");

          // Try to resolve existing auth, or auto-create account
          let userId: string;
          const auth = await resolveAuth(authHeader);
          if (auth.userId) {
            userId = auth.userId;
          } else {
            // Auto-create account with random password
            const password = generateApiKey().slice(0, 24);
            const username = args.email.split("@")[0].slice(0, 30) + "_agent";
            const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
              email: args.email, password, email_confirm: true,
              user_metadata: { name: username },
            });
            if (createErr) {
              // Might already exist — try sign in
              const sb = getAnon();
              const { data: signInData, error: signErr } = await sb.auth.signInWithPassword({
                email: args.email, password,
              });
              if (signErr) throw new Error(`Account exists but couldn't auto-sign-in. Use sign_in tool with your password, then call headless_checkout.`);
              userId = signInData.user.id;
            } else {
              userId = newUser.user.id;
            }
          }

          // If offer_amount provided, place a bid instead of buying outright
          if (args.offer_amount) {
            if (listing.seller_id === userId) throw new Error("Cannot bid on your own listing");
            const minOffer = Math.ceil(listing.price * 0.25);
            if (args.offer_amount < minOffer) throw new Error(`Minimum offer is $${(minOffer / 100).toFixed(2)}`);

            const { data: offer, error: offerErr } = await admin.from("offers").insert({
              listing_id: args.listing_id, buyer_id: userId, seller_id: listing.seller_id,
              offer_amount: args.offer_amount, original_price: listing.price,
              message: args.message?.slice(0, 500) || "Placed via quick_purchase",
            }).select("id,offer_amount,status").single();
            if (offerErr) throw new Error(offerErr.message);

            // Generate API key for ongoing interaction
            const rawKey = generateApiKey();
            const keyHash = await hashKey(rawKey);
            await admin.from("agent_api_keys").insert({
              user_id: userId, key_hash: keyHash, key_prefix: rawKey.slice(0, 10),
              name: "quick_purchase_auto", scopes: ["read", "write", "purchase"],
            });

            return c.json({
              jsonrpc: "2.0", id: body.id,
              result: { content: [{ type: "text", text: JSON.stringify({
                action: "bid_placed",
                offer_id: offer.id,
                your_offer: `$${(args.offer_amount / 100).toFixed(2)}`,
                listing_price: `$${(listing.price / 100).toFixed(2)}`,
                api_key: rawKey,
                message: "Bid placed and API key generated in one call. Save the api_key — use it for all future requests. Use get_my_offers to track status.",
              }, null, 2) }] },
            }, 200, { "Access-Control-Allow-Origin": "*" });
          }

          // Buy at asking price — create checkout session
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          // Check duplicate purchase
          const { data: existingPurchase } = await admin.from("purchases")
            .select("id").eq("listing_id", args.listing_id).eq("buyer_id", userId).maybeSingle();
          if (existingPurchase) throw new Error("Already purchased this listing");

          // Get seller stripe info
          const { data: sellerProfile } = await admin.from("profiles")
            .select("stripe_account_id,stripe_onboarded").eq("user_id", listing.seller_id).single();

          const stripeKey = (await import("../_shared/sanitize-stripe-key.ts")).sanitizeStripeKey(Deno.env.get("STRIPE_SECRET_KEY")!);
          const Stripe = (await import("npm:stripe@17.7.0")).default;
          const stripe = new Stripe(stripeKey);

          const isSubscription = listing.pricing_type === "monthly";
          const feePercent = 0.2;
          const sessionParams: any = {
            payment_method_types: ["card"],
            line_items: [{
              price_data: {
                currency: "usd",
                product_data: { name: listing.title },
                unit_amount: listing.price,
                ...(isSubscription ? { recurring: { interval: "month" } } : {}),
              },
              quantity: 1,
            }],
            mode: isSubscription ? "subscription" : "payment",
            success_url: `https://opendraft.co/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://opendraft.co/listing/${listing.id}`,
            metadata: { listing_id: listing.id, buyer_id: userId, seller_id: listing.seller_id, price: String(listing.price) },
          };

          const sellerAccount = sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded ? sellerProfile.stripe_account_id : null;
          if (sellerAccount) {
            if (isSubscription) {
              sessionParams.subscription_data = { application_fee_percent: feePercent * 100, transfer_data: { destination: sellerAccount }, metadata: sessionParams.metadata };
            } else {
              sessionParams.payment_intent_data = { application_fee_amount: Math.round(listing.price * feePercent), transfer_data: { destination: sellerAccount } };
            }
          }

          const session = await stripe.checkout.sessions.create(sessionParams);

          // Generate API key
          const rawKey = generateApiKey();
          const keyHash = await hashKey(rawKey);
          await admin.from("agent_api_keys").insert({
            user_id: userId, key_hash: keyHash, key_prefix: rawKey.slice(0, 10),
            name: "quick_purchase_auto", scopes: ["read", "write", "purchase"],
          });

          return c.json({
            jsonrpc: "2.0", id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify({
              action: "checkout_ready",
              checkout_url: session.url,
              listing_title: listing.title,
              price: `$${(listing.price / 100).toFixed(2)}`,
              api_key: rawKey,
              message: "Payment link ready. Save the api_key for future requests. Open checkout_url to complete payment.",
            }, null, 2) }] },
          }, 200, { "Access-Control-Allow-Origin": "*" });
        } catch (err: any) {
          return c.json({
            jsonrpc: "2.0", id: body.id,
            result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true },
          }, 200, { "Access-Control-Allow-Origin": "*" });
        }
      }

      const auth = await resolveAuth(authHeader);

      if (!auth.userId) {
        return c.json({
          jsonrpc: "2.0", id: body.id,
          result: { content: [{ type: "text", text: "Error: Authentication required. Use sign_in to get a Bearer token, or use an API key (od_xxx)." }], isError: true },
        }, 200, { "Access-Control-Allow-Origin": "*" });
      }

      try {
        let result: any;

        if (toolName === "generate_api_key") {
          const rawKey = generateApiKey();
          const keyHash = await hashKey(rawKey);
          const sb = getAdmin();
          const { data, error } = await sb.from("agent_api_keys").insert({
            user_id: auth.userId,
            key_hash: keyHash,
            key_prefix: rawKey.slice(0, 10),
            name: args.name || "Default",
            scopes: args.scopes || ["read"],
          }).select("id,key_prefix,name,scopes,created_at").single();
          if (error) throw new Error(error.message);

          result = {
            api_key: rawKey,
            key_id: data.id,
            name: data.name,
            scopes: data.scopes,
            message: "⚠️ Save this key now — it won't be shown again. Use as: Authorization: Bearer od_xxx",
          };
        } else if (toolName === "register_webhook") {
          if (!args.url) throw new Error("url is required");
          const secret = generateApiKey().slice(0, 32);
          const sb = getAnon(`Bearer ${authHeader?.replace("Bearer ", "")}`);
          // Use admin to insert since we validated auth
          const admin = getAdmin();
          const { data, error } = await admin.from("agent_webhooks").insert({
            user_id: auth.userId,
            url: args.url,
            events: args.events || ["new_listing"],
            filters: args.filters || {},
            secret,
          }).select("id,url,events,filters,created_at").single();
          if (error) throw new Error(error.message);

          result = {
            webhook_id: data.id,
            url: data.url,
            events: data.events,
            filters: data.filters,
            signing_secret: secret,
            message: "Webhook registered. Events will be POSTed with an X-Webhook-Signature header.",
          };
        } else if (toolName === "create_listing") {
          if (!args.title || args.title.length > 100) throw new Error("Title required (max 100 chars)");
          if (!args.description || args.description.length > 5000) throw new Error("Description required (max 5000 chars)");

          const sb = auth.source === "apikey" ? getAdmin() : getAnon(authHeader);
          const insertData: any = {
            seller_id: auth.userId,
            title: args.title.trim(), description: args.description.trim(),
            price: args.price || 0, pricing_type: args.pricing_type || "one_time",
            category: args.category || "other", completeness_badge: args.completeness_badge || "prototype",
            tech_stack: args.tech_stack || [], screenshots: args.screenshots || [],
            demo_url: args.demo_url || null, github_url: args.github_url || null,
          };

          // For API key auth, use admin client to bypass RLS
          let data, error;
          if (auth.source === "apikey") {
            ({ data, error } = await getAdmin().from("listings").insert(insertData).select("id").single());
          } else {
            ({ data, error } = await getAnon(authHeader).from("listings").insert(insertData).select("id").single());
          }
          if (error) throw new Error(error.message);

          result = { listing_id: data.id, status: "pending", url: `https://opendraft.lovable.app/listing/${data.id}`, message: "Listing created. Visible after admin approval." };
        } else if (toolName === "submit_to_bounty") {
          const admin = getAdmin();
          const { data, error } = await admin.from("bounty_submissions").insert({
            bounty_id: args.bounty_id, listing_id: args.listing_id,
            seller_id: auth.userId, message: args.message || null,
          }).select("id").single();
          if (error) throw new Error(error.message);
          result = { submission_id: data.id, message: "Submission sent to bounty poster." };
        } else if (toolName === "initiate_purchase") {
          const sb = getAnon(authHeader);
          const { data, error } = await sb.functions.invoke("create-checkout-session", { body: { listingId: args.listing_id } });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);
          result = { checkout_url: data.url, message: "Redirect user to this URL to complete payment." };

        } else if (toolName === "place_offer") {
          if (!args.listing_id) throw new Error("listing_id is required");
          if (!args.offer_amount || args.offer_amount < 1) throw new Error("offer_amount must be positive (in cents)");

          const admin = getAdmin();
          // Get listing details
          const { data: listing, error: listErr } = await admin.from("listings")
            .select("id,price,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
          if (listErr || !listing) throw new Error("Listing not found or not live");
          if (listing.seller_id === auth.userId) throw new Error("Cannot bid on your own listing");

          // Enforce 25% minimum
          const minOffer = Math.ceil(listing.price * 0.25);
          if (args.offer_amount < minOffer) throw new Error(`Minimum offer is $${(minOffer / 100).toFixed(2)} (25% of listing price)`);

          // Check for existing pending offer
          const { data: existing } = await admin.from("offers")
            .select("id,status")
            .eq("listing_id", args.listing_id)
            .eq("buyer_id", auth.userId)
            .in("status", ["pending", "countered"])
            .maybeSingle();
          if (existing) throw new Error(`You already have an active offer (${existing.status}) on this listing. Use respond_to_counter or withdraw_offer first.`);

          const { data: offer, error: offerErr } = await admin.from("offers").insert({
            listing_id: args.listing_id,
            buyer_id: auth.userId,
            seller_id: listing.seller_id,
            offer_amount: args.offer_amount,
            original_price: listing.price,
            message: args.message?.slice(0, 500) || null,
          }).select("id,offer_amount,original_price,status,created_at").single();
          if (offerErr) throw new Error(offerErr.message);

          // Notify seller
          await admin.from("notifications").insert({
            user_id: listing.seller_id,
            type: "offer",
            title: "New offer received",
            message: `An agent offered $${(args.offer_amount / 100).toFixed(2)} for "${listing.title}"`,
            link: `/dashboard?tab=offers`,
          });

          result = {
            offer_id: offer.id,
            listing_title: listing.title,
            your_offer: `$${(offer.offer_amount / 100).toFixed(2)}`,
            listing_price: `$${(offer.original_price / 100).toFixed(2)}`,
            status: offer.status,
            message: "Offer placed. The seller will be notified. Use get_my_offers to check status, or respond_to_counter if the seller makes a counter-offer.",
          };

        } else if (toolName === "get_my_offers") {
          const admin = getAdmin();
          let q = admin.from("offers")
            .select("id,listing_id,offer_amount,original_price,counter_amount,status,message,seller_message,created_at,updated_at")
            .eq("buyer_id", auth.userId)
            .order("updated_at", { ascending: false })
            .limit(Math.min(args.limit || 20, 50));

          if (args.status && args.status !== "all") q = q.eq("status", args.status);

          const { data: offers, error: offErr } = await q;
          if (offErr) throw new Error(offErr.message);

          // Get listing titles
          const listingIds = [...new Set((offers || []).map((o: any) => o.listing_id))];
          let titleMap: Record<string, string> = {};
          if (listingIds.length > 0) {
            const { data: listings } = await admin.from("listings").select("id,title").in("id", listingIds);
            titleMap = Object.fromEntries((listings || []).map((l: any) => [l.id, l.title]));
          }

          result = {
            offers: (offers || []).map((o: any) => ({
              offer_id: o.id,
              listing_title: titleMap[o.listing_id] || "Unknown",
              your_offer: `$${(o.offer_amount / 100).toFixed(2)}`,
              listing_price: `$${(o.original_price / 100).toFixed(2)}`,
              counter_offer: o.counter_amount ? `$${(o.counter_amount / 100).toFixed(2)}` : null,
              status: o.status,
              your_message: o.message,
              seller_message: o.seller_message,
              created_at: o.created_at,
              updated_at: o.updated_at,
              actions: o.status === "countered"
                ? "Use respond_to_counter with this offer_id to accept, reject, or counter-bid"
                : o.status === "pending"
                ? "Waiting for seller. Use withdraw_offer to cancel."
                : o.status === "accepted"
                ? "Offer accepted! Use initiate_purchase to complete the transaction."
                : "No action needed.",
            })),
            total: (offers || []).length,
          };

        } else if (toolName === "respond_to_counter") {
          if (!args.offer_id) throw new Error("offer_id is required");
          if (!args.action) throw new Error("action is required (accept, reject, or counter)");

          const admin = getAdmin();
          const { data: offer, error: getErr } = await admin.from("offers")
            .select("id,listing_id,buyer_id,seller_id,offer_amount,original_price,counter_amount,status")
            .eq("id", args.offer_id).single();
          if (getErr || !offer) throw new Error("Offer not found");
          if (offer.buyer_id !== auth.userId) throw new Error("This is not your offer");
          if (offer.status !== "countered") throw new Error(`Offer status is '${offer.status}' — can only respond to countered offers`);

          if (args.action === "accept") {
            // Accept the counter-offer
            const { error: upErr } = await admin.from("offers")
              .update({ status: "accepted", updated_at: new Date().toISOString() })
              .eq("id", args.offer_id);
            if (upErr) throw new Error(upErr.message);

            // Notify seller
            await admin.from("notifications").insert({
              user_id: offer.seller_id,
              type: "offer_accepted",
              title: "Counter-offer accepted",
              message: `Your counter-offer of $${((offer.counter_amount || offer.offer_amount) / 100).toFixed(2)} was accepted`,
              link: `/dashboard?tab=offers`,
            });

            result = {
              offer_id: offer.id,
              action: "accepted",
              accepted_price: `$${((offer.counter_amount || offer.offer_amount) / 100).toFixed(2)}`,
              message: "Counter-offer accepted! Use initiate_purchase to complete the transaction.",
              next_step: "Call initiate_purchase with the listing_id to pay.",
            };

          } else if (args.action === "reject") {
            const { error: upErr } = await admin.from("offers")
              .update({ status: "rejected", updated_at: new Date().toISOString() })
              .eq("id", args.offer_id);
            if (upErr) throw new Error(upErr.message);

            result = {
              offer_id: offer.id,
              action: "rejected",
              message: "Counter-offer rejected. You can place a new offer on this listing.",
            };

          } else if (args.action === "counter") {
            if (!args.new_amount || args.new_amount < 1) throw new Error("new_amount required for counter-bid (in cents)");
            const minOffer = Math.ceil(offer.original_price * 0.25);
            if (args.new_amount < minOffer) throw new Error(`Minimum offer is $${(minOffer / 100).toFixed(2)} (25% of listing price)`);

            // Update the offer with new amount, reset status to pending
            const { error: upErr } = await admin.from("offers")
              .update({
                offer_amount: args.new_amount,
                counter_amount: null,
                status: "pending",
                message: args.message?.slice(0, 500) || null,
                seller_message: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", args.offer_id);
            if (upErr) throw new Error(upErr.message);

            // Notify seller
            await admin.from("notifications").insert({
              user_id: offer.seller_id,
              type: "offer",
              title: "New counter-bid received",
              message: `Agent counter-bid: $${(args.new_amount / 100).toFixed(2)}`,
              link: `/dashboard?tab=offers`,
            });

            result = {
              offer_id: offer.id,
              action: "counter",
              new_offer: `$${(args.new_amount / 100).toFixed(2)}`,
              message: "Counter-bid placed. Seller will be notified.",
            };
          } else {
            throw new Error("action must be 'accept', 'reject', or 'counter'");
          }

        } else if (toolName === "withdraw_offer") {
          if (!args.offer_id) throw new Error("offer_id is required");

          const admin = getAdmin();
          const { data: offer, error: getErr } = await admin.from("offers")
            .select("id,buyer_id,status")
            .eq("id", args.offer_id).single();
          if (getErr || !offer) throw new Error("Offer not found");
          if (offer.buyer_id !== auth.userId) throw new Error("This is not your offer");
          if (!["pending", "countered"].includes(offer.status)) throw new Error(`Cannot withdraw an offer with status '${offer.status}'`);

          const { error: upErr } = await admin.from("offers")
            .update({ status: "rejected", updated_at: new Date().toISOString() })
            .eq("id", args.offer_id);
          if (upErr) throw new Error(upErr.message);

          result = {
            offer_id: offer.id,
            action: "withdrawn",
            message: "Offer withdrawn successfully.",
          };
        } else if (toolName === "headless_checkout") {
          if (!args.listing_id) throw new Error("listing_id is required");

          const admin = getAdmin();
          const { data: listing, error: listErr } = await admin.from("listings")
            .select("id,price,pricing_type,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
          if (listErr || !listing) throw new Error("Listing not found");

          let unitAmount = listing.price;

          // Check for accepted offer pricing
          if (args.offer_id) {
            const { data: offer } = await admin.from("offers")
              .select("offer_amount,counter_amount,status")
              .eq("id", args.offer_id).eq("buyer_id", auth.userId).eq("status", "accepted").single();
            if (offer) unitAmount = offer.counter_amount || offer.offer_amount;
          }

          const { data: sellerProfile } = await admin.from("profiles")
            .select("stripe_account_id,stripe_onboarded").eq("user_id", listing.seller_id).single();

          const stripeKey = (await import("../_shared/sanitize-stripe-key.ts")).sanitizeStripeKey(Deno.env.get("STRIPE_SECRET_KEY")!);
          const Stripe = (await import("npm:stripe@17.7.0")).default;
          const stripe = new Stripe(stripeKey);

          const isSubscription = listing.pricing_type === "monthly";
          const feePercent = 0.2;
          const sessionParams: any = {
            payment_method_types: ["card"],
            line_items: [{
              price_data: {
                currency: "usd",
                product_data: { name: listing.title },
                unit_amount: unitAmount,
                ...(isSubscription ? { recurring: { interval: "month" } } : {}),
              },
              quantity: 1,
            }],
            mode: isSubscription ? "subscription" : "payment",
            success_url: `https://opendraft.co/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://opendraft.co/listing/${listing.id}`,
            metadata: { listing_id: listing.id, buyer_id: auth.userId, seller_id: listing.seller_id, price: String(unitAmount) },
          };

          const sellerAccount = sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded ? sellerProfile.stripe_account_id : null;
          if (sellerAccount) {
            if (isSubscription) {
              sessionParams.subscription_data = { application_fee_percent: feePercent * 100, transfer_data: { destination: sellerAccount }, metadata: sessionParams.metadata };
            } else {
              sessionParams.payment_intent_data = { application_fee_amount: Math.round(unitAmount * feePercent), transfer_data: { destination: sellerAccount } };
            }
          }

          const session = await stripe.checkout.sessions.create(sessionParams);

          result = {
            checkout_url: session.url,
            listing_title: listing.title,
            price: `$${(unitAmount / 100).toFixed(2)}`,
            pricing_type: listing.pricing_type,
            message: "Payment link ready. No browser redirect needed — open this URL or share it to complete payment.",
          };
        }

        return c.json({
          jsonrpc: "2.0", id: body.id,
          result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
        }, 200, { "Access-Control-Allow-Origin": "*" });
      } catch (err: any) {
        return c.json({
          jsonrpc: "2.0", id: body.id,
          result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true },
        }, 200, { "Access-Control-Allow-Origin": "*" });
      }
    }
  }

  // Delegate to mcp-lite
  const response = await transport.handleRequest(
    new Request(c.req.url, { method: "POST", headers: c.req.raw.headers, body: JSON.stringify(body) }),
    mcpServer
  );
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, { status: response.status, headers: newHeaders });
});

Deno.serve(app.fetch);
