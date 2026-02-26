import { Hono } from "hono";
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

async function resolveAuth(authHeader?: string): Promise<{ userId: string | null; source: "bearer" | "apikey" | "none" }> {
  if (!authHeader) return { userId: null, source: "none" };
  if (authHeader.startsWith("Bearer od_")) {
    const apiKey = authHeader.replace("Bearer ", "");
    const keyHash = await hashKey(apiKey);
    const sb = getAdmin();
    const { data } = await sb.from("agent_api_keys").select("user_id").eq("key_hash", keyHash).is("revoked_at", null).single();
    if (data) {
      await sb.from("agent_api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
      return { userId: data.user_id, source: "apikey" };
    }
    return { userId: null, source: "none" };
  }
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

async function captureDemandSignal(query: string, category?: string, techStack?: string[], maxPrice?: number, agentId?: string) {
  try {
    const sb = getAdmin();
    await sb.from("agent_demand_signals").insert({
      query: query?.slice(0, 500) || "browsing", category: category || null,
      tech_stack: techStack || null, max_price: maxPrice || null, source: "mcp", agent_id: agentId || null,
    });
  } catch { /* non-fatal */ }
}

// ── Tool definitions (JSON Schema) ────────────────────────────────

const categoryEnum = ["saas_tool","ai_app","landing_page","utility","game","other"];
const completenessEnum = ["prototype","mvp","production_ready"];

const TOOLS: Record<string, { description: string; inputSchema: any }> = {
  search_listings: {
    description: "Search the OpenDraft marketplace for AI-built apps. If no results match, your search is logged as a demand signal.",
    inputSchema: { type: "object", properties: {
      query: { type: "string" }, category: { type: "string", enum: categoryEnum },
      max_price: { type: "number" }, tech_stack: { type: "array", items: { type: "string" } },
      completeness: { type: "string", enum: completenessEnum }, limit: { type: "number" },
    }},
  },
  get_listing: {
    description: "Get full details for a listing including seller profile, reviews, and decision factors.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" } }, required: ["listing_id"] },
  },
  list_categories: {
    description: "Get all listing categories with counts.",
    inputSchema: { type: "object", properties: {} },
  },
  get_trending: {
    description: "Get trending listings, hot bounties, and market intelligence.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  list_bounties: {
    description: "Browse open bounties — paid project requests from buyers.",
    inputSchema: { type: "object", properties: { category: { type: "string", enum: categoryEnum }, limit: { type: "number" } } },
  },
  get_bounty: {
    description: "Get full details for a specific bounty.",
    inputSchema: { type: "object", properties: { bounty_id: { type: "string" } }, required: ["bounty_id"] },
  },
  search_builders: {
    description: "Search for builders by username or browse top builders.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } } },
  },
  get_builder_profile: {
    description: "View a builder's full profile and listings.",
    inputSchema: { type: "object", properties: { username: { type: "string" } }, required: ["username"] },
  },
  get_reviews: {
    description: "Get reviews and ratings for a listing.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" }, limit: { type: "number" } }, required: ["listing_id"] },
  },
  get_demand_signals: {
    description: "See what agents are searching for but can't find. Great for discovering unmet market needs.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  create_account: {
    description: "Register a new user account.",
    inputSchema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" }, username: { type: "string" } }, required: ["email","password","username"] },
  },
  sign_in: {
    description: "Sign in and get an access token.",
    inputSchema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email","password"] },
  },
  generate_api_key: {
    description: "Generate a persistent API key (od_ prefix). Requires auth.",
    inputSchema: { type: "object", properties: { name: { type: "string" }, scopes: { type: "array", items: { type: "string", enum: ["read","write","purchase"] } } }, required: ["name"] },
  },
  register_webhook: {
    description: "Subscribe to real-time events via webhook. Requires auth.",
    inputSchema: { type: "object", properties: { url: { type: "string" }, events: { type: "array", items: { type: "string", enum: ["new_listing","price_drop","new_bounty"] } }, filters: { type: "object" } }, required: ["url","events"] },
  },
  create_listing: {
    description: "List a new app for sale. Requires auth.",
    inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, price: { type: "number" }, pricing_type: { type: "string", enum: ["one_time","monthly"] }, category: { type: "string", enum: categoryEnum }, tech_stack: { type: "array", items: { type: "string" } }, demo_url: { type: "string" }, completeness_badge: { type: "string", enum: completenessEnum } }, required: ["title","description","price","category"] },
  },
  submit_to_bounty: {
    description: "Submit a listing as a bounty solution. Requires auth.",
    inputSchema: { type: "object", properties: { bounty_id: { type: "string" }, listing_id: { type: "string" }, message: { type: "string" } }, required: ["bounty_id","listing_id"] },
  },
  initiate_purchase: {
    description: "Start Stripe checkout for a listing. Requires auth.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" } }, required: ["listing_id"] },
  },
  place_offer: {
    description: "Place a bid/offer on a listing. Min 25% of listing price. Requires auth.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" }, offer_amount: { type: "number" }, message: { type: "string" } }, required: ["listing_id","offer_amount"] },
  },
  get_my_offers: {
    description: "View your active offers/bids. Requires auth.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["pending","accepted","rejected","countered","all"] }, limit: { type: "number" } } },
  },
  respond_to_counter: {
    description: "Accept, reject, or counter a seller's counter-offer. Requires auth.",
    inputSchema: { type: "object", properties: { offer_id: { type: "string" }, action: { type: "string", enum: ["accept","reject","counter"] }, new_amount: { type: "number" }, message: { type: "string" } }, required: ["offer_id","action"] },
  },
  withdraw_offer: {
    description: "Withdraw a pending or countered offer. Requires auth.",
    inputSchema: { type: "object", properties: { offer_id: { type: "string" } }, required: ["offer_id"] },
  },
  quick_purchase: {
    description: "One-call frictionless purchase: auto-creates account, generates API key, returns payment link. No onboarding required.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" }, email: { type: "string" }, offer_amount: { type: "number" }, message: { type: "string" } }, required: ["listing_id","email"] },
  },
  headless_checkout: {
    description: "Get a payment link without browser redirects. Requires auth.",
    inputSchema: { type: "object", properties: { listing_id: { type: "string" }, offer_id: { type: "string" } }, required: ["listing_id"] },
  },
};

// ── Tool handlers ─────────────────────────────────────────────────

async function handlePublicTool(toolName: string, args: any): Promise<any> {
  const sb = getAnon();

  if (toolName === "search_listings") {
    let q = sb.from("listings")
      .select("id,title,description,price,pricing_type,category,completeness_badge,tech_stack,screenshots,sales_count,view_count,demo_url")
      .eq("status", "live").order("sales_count", { ascending: false }).limit(Math.min(args.limit || 20, 50));
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
    if (results.length === 0 && (args.query || args.category || args.tech_stack?.length))
      await captureDemandSignal(args.query || "", args.category, args.tech_stack, args.max_price);
    const mapped = results.map((l: any) => ({
      id: l.id, title: l.title, description: l.description?.slice(0, 200), price_cents: l.price,
      pricing_type: l.pricing_type, category: l.category, completeness: l.completeness_badge,
      tech_stack: l.tech_stack, sales: l.sales_count, views: l.view_count, demo_url: l.demo_url,
      url: `https://opendraft.lovable.app/listing/${l.id}`,
    }));
    const response: any = { listings: mapped, total: mapped.length };
    if (results.length === 0) { response.demand_captured = true; response.message = "No results. Search logged as demand signal."; }
    return response;
  }

  if (toolName === "get_listing") {
    const { data, error } = await sb.from("listings").select("*").eq("id", args.listing_id).eq("status", "live").single();
    if (error) throw new Error("Listing not found");
    const { data: profile } = await sb.from("public_profiles").select("username,avatar_url,verified,total_sales").eq("user_id", data.seller_id).single();
    const { data: reviews } = await sb.from("reviews").select("rating,review_text,created_at").eq("listing_id", args.listing_id).order("created_at", { ascending: false }).limit(5);
    const ratings = (reviews || []).map((r: any) => r.rating);
    const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;
    return { ...data, seller: profile, reviews: reviews || [], average_rating: avgRating, review_count: ratings.length,
      url: `https://opendraft.lovable.app/listing/${data.id}`,
      decision_factors: { has_demo: !!data.demo_url, has_source_code: !!data.file_path, has_screenshots: (data.screenshots?.length || 0) > 0, seller_verified: profile?.verified || false, seller_total_sales: profile?.total_sales || 0 },
    };
  }

  if (toolName === "list_categories") {
    const cats = ["saas_tool","ai_app","landing_page","utility","game","other"];
    const results = [];
    for (const cat of cats) {
      const { count } = await sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "live").eq("category", cat);
      results.push({ category: cat, count: count || 0 });
    }
    return results;
  }

  if (toolName === "get_trending") {
    const admin = getAdmin();
    const limit = Math.min(args.limit || 10, 30);
    const { data: topSales } = await sb.from("listings").select("id,title,category,price,sales_count,view_count")
      .eq("status", "live").order("sales_count", { ascending: false }).limit(limit);
    const { data: hotBounties } = await sb.from("bounties").select("id,title,category,budget,submissions_count")
      .eq("status", "open").order("budget", { ascending: false }).limit(5);
    const { data: demandSignals } = await admin.from("agent_demand_signals").select("query,category,tech_stack,created_at")
      .order("created_at", { ascending: false }).limit(10);
    return { trending_listings: (topSales || []).map((l: any) => ({ id: l.id, title: l.title, category: l.category, price_cents: l.price, sales: l.sales_count, views: l.view_count, url: `https://opendraft.lovable.app/listing/${l.id}` })), hot_bounties: hotBounties || [], agent_demand_signals: demandSignals || [] };
  }

  if (toolName === "list_bounties") {
    let q = sb.from("bounties").select("id,title,description,budget,category,tech_stack,submissions_count,created_at")
      .eq("status", "open").order("created_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (args.category) q = q.eq("category", args.category);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  if (toolName === "get_bounty") {
    const { data, error } = await sb.from("bounties").select("*").eq("id", args.bounty_id).single();
    if (error) throw new Error("Bounty not found");
    return data;
  }

  if (toolName === "search_builders") {
    let q = sb.from("public_profiles").select("user_id,username,avatar_url,bio,verified,total_sales,followers_count")
      .order("total_sales", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (args.query) q = q.ilike("username", `%${args.query}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map((p: any) => ({ ...p, profile_url: `https://opendraft.lovable.app/builder/${p.user_id}` }));
  }

  if (toolName === "get_builder_profile") {
    const { data: profile, error } = await sb.from("public_profiles").select("*").eq("username", args.username).single();
    if (error) throw new Error("Builder not found");
    const { data: listings } = await sb.from("listings").select("id,title,price,pricing_type,category,completeness_badge,sales_count")
      .eq("seller_id", profile.user_id).eq("status", "live").order("sales_count", { ascending: false }).limit(20);
    return { ...profile, listings: listings || [] };
  }

  if (toolName === "get_reviews") {
    const { data, error } = await sb.from("reviews").select("rating,review_text,created_at,buyer_id")
      .eq("listing_id", args.listing_id).order("created_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (error) throw new Error(error.message);
    const ratings = (data || []).map((r: any) => r.rating);
    const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;
    return { average_rating: avg, total_reviews: ratings.length, reviews: data };
  }

  if (toolName === "get_demand_signals") {
    const admin = getAdmin();
    const { data, error } = await admin.from("agent_demand_signals").select("query,category,tech_stack,max_price,created_at")
      .order("created_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (error) throw new Error(error.message);
    const queryMap = new Map<string, number>();
    (data || []).forEach((d: any) => { const q = d.query.toLowerCase().trim(); if (q) queryMap.set(q, (queryMap.get(q) || 0) + 1); });
    const topQueries = [...queryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { recent_signals: data || [], top_unmet_queries: topQueries.map(([q, count]) => ({ query: q, search_count: count })) };
  }

  if (toolName === "create_account") {
    if (!args.email || !args.password || !args.username) throw new Error("email, password, and username required");
    if (args.password.length < 8) throw new Error("Password must be at least 8 characters");
    const admin = getAdmin();
    const { data, error } = await admin.auth.admin.createUser({ email: args.email, password: args.password, email_confirm: true, user_metadata: { name: args.username } });
    if (error) throw new Error(error.message);
    return { user_id: data.user.id, email: data.user.email, message: "Account created. Use sign_in to get a token." };
  }

  if (toolName === "sign_in") {
    if (!args.email || !args.password) throw new Error("email and password required");
    const sb2 = getAnon();
    const { data, error } = await sb2.auth.signInWithPassword({ email: args.email, password: args.password });
    if (error) throw new Error(error.message);
    return { access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_in: data.session.expires_in, user_id: data.user.id, message: "Use this as Bearer auth. Call generate_api_key for persistent auth." };
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

async function handleAuthTool(toolName: string, args: any, authHeader?: string): Promise<any> {
  // quick_purchase has special auth — auto-creates accounts
  if (toolName === "quick_purchase") {
    const admin = getAdmin();
    if (!args.listing_id || !args.email) throw new Error("listing_id and email are required");
    const { data: listing, error: listErr } = await admin.from("listings").select("id,price,pricing_type,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
    if (listErr || !listing) throw new Error("Listing not found or not live");

    let userId: string;
    const auth = await resolveAuth(authHeader);
    if (auth.userId) { userId = auth.userId; } else {
      const password = generateApiKey().slice(0, 24);
      const username = args.email.split("@")[0].slice(0, 30) + "_agent";
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({ email: args.email, password, email_confirm: true, user_metadata: { name: username } });
      if (createErr) {
        const sb = getAnon();
        const { data: signInData, error: signErr } = await sb.auth.signInWithPassword({ email: args.email, password });
        if (signErr) throw new Error("Account exists but couldn't auto-sign-in. Use sign_in tool.");
        userId = signInData.user.id;
      } else { userId = newUser.user.id; }
    }

    if (args.offer_amount) {
      if (listing.seller_id === userId) throw new Error("Cannot bid on your own listing");
      const minOffer = Math.ceil(listing.price * 0.25);
      if (args.offer_amount < minOffer) throw new Error(`Minimum offer is $${(minOffer / 100).toFixed(2)}`);
      const { data: offer, error: offerErr } = await admin.from("offers").insert({ listing_id: args.listing_id, buyer_id: userId, seller_id: listing.seller_id, offer_amount: args.offer_amount, original_price: listing.price, message: args.message?.slice(0, 500) || "Placed via quick_purchase" }).select("id,offer_amount,status").single();
      if (offerErr) throw new Error(offerErr.message);
      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      await admin.from("agent_api_keys").insert({ user_id: userId, key_hash: keyHash, key_prefix: rawKey.slice(0, 10), name: "quick_purchase_auto", scopes: ["read","write","purchase"] });
      return { action: "bid_placed", offer_id: offer.id, your_offer: `$${(args.offer_amount / 100).toFixed(2)}`, listing_price: `$${(listing.price / 100).toFixed(2)}`, api_key: rawKey, message: "Bid placed and API key generated. Save the api_key." };
    }

    const { data: existingPurchase } = await admin.from("purchases").select("id").eq("listing_id", args.listing_id).eq("buyer_id", userId).maybeSingle();
    if (existingPurchase) throw new Error("Already purchased this listing");
    const { data: sellerProfile } = await admin.from("profiles").select("stripe_account_id,stripe_onboarded").eq("user_id", listing.seller_id).single();
    const stripeKey = (await import("../_shared/sanitize-stripe-key.ts")).sanitizeStripeKey(Deno.env.get("STRIPE_SECRET_KEY")!);
    const Stripe = (await import("npm:stripe@17.7.0")).default;
    const stripe = new Stripe(stripeKey);
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    await admin.from("agent_api_keys").insert({ user_id: userId, key_hash: keyHash, key_prefix: rawKey.slice(0, 10), name: "quick_purchase_auto", scopes: ["read","write","purchase"] });
    const isSubscription = listing.pricing_type === "monthly";
    const feePercent = 0.2;
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "usd", product_data: { name: listing.title }, unit_amount: listing.price, ...(isSubscription ? { recurring: { interval: "month" } } : {}) }, quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `https://opendraft.co/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://opendraft.co/listing/${listing.id}`,
      metadata: { listing_id: listing.id, buyer_id: userId, seller_id: listing.seller_id, price: String(listing.price) },
    };
    const sellerAccount = sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded ? sellerProfile.stripe_account_id : null;
    if (sellerAccount) {
      if (isSubscription) { sessionParams.subscription_data = { application_fee_percent: feePercent * 100, transfer_data: { destination: sellerAccount }, metadata: sessionParams.metadata }; }
      else { sessionParams.payment_intent_data = { application_fee_amount: Math.round(listing.price * feePercent), transfer_data: { destination: sellerAccount } }; }
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { action: "checkout_ready", checkout_url: session.url, api_key: rawKey, listing_title: listing.title, price: `$${(listing.price / 100).toFixed(2)}`, message: "Payment link + API key generated in one call." };
  }

  // All other auth tools require authentication
  const auth = await resolveAuth(authHeader);
  if (!auth.userId) throw new Error("Authentication required. Use sign_in or quick_purchase.");

  if (toolName === "generate_api_key") {
    if (!args.name) throw new Error("name is required");
    const rawKey = generateApiKey(); const keyHash = await hashKey(rawKey); const admin = getAdmin();
    const { data, error } = await admin.from("agent_api_keys").insert({ user_id: auth.userId, key_hash: keyHash, key_prefix: rawKey.slice(0, 10), name: args.name.slice(0, 50), scopes: args.scopes || ["read"] }).select("id,key_prefix,name,scopes,created_at").single();
    if (error) throw new Error(error.message);
    return { api_key: rawKey, key_id: data.id, name: data.name, scopes: data.scopes, message: "Save this key now — it won't be shown again." };
  }

  if (toolName === "register_webhook") {
    if (!args.url) throw new Error("url is required");
    const secret = generateApiKey().slice(0, 32); const admin = getAdmin();
    const { data, error } = await admin.from("agent_webhooks").insert({ user_id: auth.userId, url: args.url, events: args.events || ["new_listing"], filters: args.filters || {}, secret }).select("id,url,events,filters,created_at").single();
    if (error) throw new Error(error.message);
    return { webhook_id: data.id, url: data.url, events: data.events, signing_secret: secret };
  }

  if (toolName === "create_listing") {
    if (!args.title || args.title.length > 100) throw new Error("Title required (max 100 chars)");
    if (!args.description || args.description.length > 5000) throw new Error("Description required (max 5000 chars)");
    const insertData: any = { seller_id: auth.userId, title: args.title.trim(), description: args.description.trim(), price: args.price || 0, pricing_type: args.pricing_type || "one_time", category: args.category || "other", completeness_badge: args.completeness_badge || "prototype", tech_stack: args.tech_stack || [], screenshots: args.screenshots || [], demo_url: args.demo_url || null, github_url: args.github_url || null };
    let data, error;
    if (auth.source === "apikey") { ({ data, error } = await getAdmin().from("listings").insert(insertData).select("id").single()); }
    else { ({ data, error } = await getAnon(authHeader).from("listings").insert(insertData).select("id").single()); }
    if (error) throw new Error(error.message);
    return { listing_id: data.id, status: "pending", url: `https://opendraft.lovable.app/listing/${data.id}` };
  }

  if (toolName === "submit_to_bounty") {
    const admin = getAdmin();
    const { data, error } = await admin.from("bounty_submissions").insert({ bounty_id: args.bounty_id, listing_id: args.listing_id, seller_id: auth.userId, message: args.message || null }).select("id").single();
    if (error) throw new Error(error.message);
    return { submission_id: data.id, message: "Submission sent." };
  }

  if (toolName === "initiate_purchase") {
    const sb = getAnon(authHeader);
    const { data, error } = await sb.functions.invoke("create-checkout-session", { body: { listingId: args.listing_id } });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return { checkout_url: data.url };
  }

  if (toolName === "place_offer") {
    if (!args.listing_id) throw new Error("listing_id required");
    if (!args.offer_amount || args.offer_amount < 1) throw new Error("offer_amount must be positive");
    const admin = getAdmin();
    const { data: listing, error: listErr } = await admin.from("listings").select("id,price,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
    if (listErr || !listing) throw new Error("Listing not found");
    if (listing.seller_id === auth.userId) throw new Error("Cannot bid on your own listing");
    const minOffer = Math.ceil(listing.price * 0.25);
    if (args.offer_amount < minOffer) throw new Error(`Minimum offer is $${(minOffer / 100).toFixed(2)}`);
    const { data: existing } = await admin.from("offers").select("id,status").eq("listing_id", args.listing_id).eq("buyer_id", auth.userId).in("status", ["pending","countered"]).maybeSingle();
    if (existing) throw new Error("You already have an active offer on this listing.");
    const { data: offer, error: offerErr } = await admin.from("offers").insert({ listing_id: args.listing_id, buyer_id: auth.userId, seller_id: listing.seller_id, offer_amount: args.offer_amount, original_price: listing.price, message: args.message?.slice(0, 500) || null }).select("id,offer_amount,original_price,status").single();
    if (offerErr) throw new Error(offerErr.message);
    await admin.from("notifications").insert({ user_id: listing.seller_id, type: "offer", title: "New offer received", message: `Offer: $${(args.offer_amount / 100).toFixed(2)} for "${listing.title}"`, link: `/dashboard?tab=offers` });
    return { offer_id: offer.id, listing_title: listing.title, your_offer: `$${(offer.offer_amount / 100).toFixed(2)}`, listing_price: `$${(offer.original_price / 100).toFixed(2)}`, status: offer.status };
  }

  if (toolName === "get_my_offers") {
    const admin = getAdmin();
    let q = admin.from("offers").select("id,listing_id,offer_amount,original_price,counter_amount,status,message,seller_message,created_at,updated_at").eq("buyer_id", auth.userId).order("updated_at", { ascending: false }).limit(Math.min(args.limit || 20, 50));
    if (args.status && args.status !== "all") q = q.eq("status", args.status);
    const { data: offers, error: offErr } = await q;
    if (offErr) throw new Error(offErr.message);
    const listingIds = [...new Set((offers || []).map((o: any) => o.listing_id))];
    let titleMap: Record<string, string> = {};
    if (listingIds.length > 0) { const { data: listings } = await admin.from("listings").select("id,title").in("id", listingIds); titleMap = Object.fromEntries((listings || []).map((l: any) => [l.id, l.title])); }
    return { offers: (offers || []).map((o: any) => ({ offer_id: o.id, listing_title: titleMap[o.listing_id] || "Unknown", your_offer: `$${(o.offer_amount / 100).toFixed(2)}`, listing_price: `$${(o.original_price / 100).toFixed(2)}`, counter_offer: o.counter_amount ? `$${(o.counter_amount / 100).toFixed(2)}` : null, status: o.status })), total: (offers || []).length };
  }

  if (toolName === "respond_to_counter") {
    if (!args.offer_id) throw new Error("offer_id required");
    if (!args.action) throw new Error("action required");
    const admin = getAdmin();
    const { data: offer, error: getErr } = await admin.from("offers").select("id,listing_id,buyer_id,seller_id,offer_amount,original_price,counter_amount,status").eq("id", args.offer_id).single();
    if (getErr || !offer) throw new Error("Offer not found");
    if (offer.buyer_id !== auth.userId) throw new Error("Not your offer");
    if (offer.status !== "countered") throw new Error(`Status is '${offer.status}'`);
    if (args.action === "accept") {
      await admin.from("offers").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", args.offer_id);
      await admin.from("notifications").insert({ user_id: offer.seller_id, type: "offer_accepted", title: "Counter-offer accepted", message: `Accepted at $${((offer.counter_amount || offer.offer_amount) / 100).toFixed(2)}`, link: `/dashboard?tab=offers` });
      return { offer_id: offer.id, action: "accepted", accepted_price: `$${((offer.counter_amount || offer.offer_amount) / 100).toFixed(2)}` };
    } else if (args.action === "reject") {
      await admin.from("offers").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", args.offer_id);
      return { offer_id: offer.id, action: "rejected" };
    } else if (args.action === "counter") {
      if (!args.new_amount) throw new Error("new_amount required");
      const minOffer = Math.ceil(offer.original_price * 0.25);
      if (args.new_amount < minOffer) throw new Error(`Minimum: $${(minOffer / 100).toFixed(2)}`);
      await admin.from("offers").update({ offer_amount: args.new_amount, counter_amount: null, status: "pending", message: args.message?.slice(0, 500) || null, seller_message: null, updated_at: new Date().toISOString() }).eq("id", args.offer_id);
      await admin.from("notifications").insert({ user_id: offer.seller_id, type: "offer", title: "Counter-bid", message: `$${(args.new_amount / 100).toFixed(2)}`, link: `/dashboard?tab=offers` });
      return { offer_id: offer.id, action: "counter", new_offer: `$${(args.new_amount / 100).toFixed(2)}` };
    }
    throw new Error("action must be 'accept', 'reject', or 'counter'");
  }

  if (toolName === "withdraw_offer") {
    if (!args.offer_id) throw new Error("offer_id required");
    const admin = getAdmin();
    const { data: offer, error: getErr } = await admin.from("offers").select("id,buyer_id,status").eq("id", args.offer_id).single();
    if (getErr || !offer) throw new Error("Offer not found");
    if (offer.buyer_id !== auth.userId) throw new Error("Not your offer");
    if (!["pending","countered"].includes(offer.status)) throw new Error(`Cannot withdraw '${offer.status}'`);
    await admin.from("offers").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", args.offer_id);
    return { offer_id: offer.id, action: "withdrawn" };
  }

  if (toolName === "headless_checkout") {
    if (!args.listing_id) throw new Error("listing_id required");
    const admin = getAdmin();
    const { data: listing, error: listErr } = await admin.from("listings").select("id,price,pricing_type,seller_id,title").eq("id", args.listing_id).eq("status", "live").single();
    if (listErr || !listing) throw new Error("Listing not found");
    let unitAmount = listing.price;
    if (args.offer_id) { const { data: offer } = await admin.from("offers").select("offer_amount,counter_amount,status").eq("id", args.offer_id).eq("buyer_id", auth.userId).eq("status", "accepted").single(); if (offer) unitAmount = offer.counter_amount || offer.offer_amount; }
    const { data: sellerProfile } = await admin.from("profiles").select("stripe_account_id,stripe_onboarded").eq("user_id", listing.seller_id).single();
    const stripeKey = (await import("../_shared/sanitize-stripe-key.ts")).sanitizeStripeKey(Deno.env.get("STRIPE_SECRET_KEY")!);
    const Stripe = (await import("npm:stripe@17.7.0")).default;
    const stripe = new Stripe(stripeKey);
    const isSubscription = listing.pricing_type === "monthly";
    const feePercent = 0.2;
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "usd", product_data: { name: listing.title }, unit_amount: unitAmount, ...(isSubscription ? { recurring: { interval: "month" } } : {}) }, quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `https://opendraft.co/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://opendraft.co/listing/${listing.id}`,
      metadata: { listing_id: listing.id, buyer_id: auth.userId, seller_id: listing.seller_id, price: String(unitAmount) },
    };
    const sellerAccount = sellerProfile?.stripe_account_id && sellerProfile?.stripe_onboarded ? sellerProfile.stripe_account_id : null;
    if (sellerAccount) {
      if (isSubscription) { sessionParams.subscription_data = { application_fee_percent: feePercent * 100, transfer_data: { destination: sellerAccount }, metadata: sessionParams.metadata }; }
      else { sessionParams.payment_intent_data = { application_fee_amount: Math.round(unitAmount * feePercent), transfer_data: { destination: sellerAccount } }; }
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { checkout_url: session.url, listing_title: listing.title, price: `$${(unitAmount / 100).toFixed(2)}`, pricing_type: listing.pricing_type };
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

// ── Hono app (pure JSON-RPC MCP implementation) ───────────────────

const app = new Hono();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

app.options("/*", (c) => new Response(null, { headers: CORS }));

app.get("/*", (c) => c.json({
  name: "opendraft-marketplace", version: "3.1.0", protocol: "MCP", transport: "Streamable HTTP",
  description: "OpenDraft — the #1 app store for AI agents. 23 tools.",
  tools: Object.keys(TOOLS),
  documentation: "https://opendraft.co/developers",
}, 200, CORS));

app.post("/*", async (c) => {
  const authHeader = c.req.header("Authorization");
  const body = await c.req.json();

  // Handle initialize
  if (body.method === "initialize") {
    return c.json({
      jsonrpc: "2.0", id: body.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "opendraft-marketplace", version: "3.1.0" },
      },
    }, 200, CORS);
  }

  // Handle notifications/initialized
  if (body.method === "notifications/initialized") {
    return c.json({ jsonrpc: "2.0", id: body.id, result: {} }, 200, CORS);
  }

  // Handle tools/list
  if (body.method === "tools/list") {
    const tools = Object.entries(TOOLS).map(([name, def]) => ({
      name, description: def.description, inputSchema: def.inputSchema,
    }));
    return c.json({ jsonrpc: "2.0", id: body.id, result: { tools } }, 200, CORS);
  }

  // Handle tools/call
  if (body.method === "tools/call") {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};

    if (!TOOLS[toolName]) {
      return c.json({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: `Unknown tool: ${toolName}` } }, 200, CORS);
    }

    try {
      const publicTools = ["search_listings","get_listing","list_categories","get_trending","list_bounties","get_bounty","search_builders","get_builder_profile","get_reviews","get_demand_signals","create_account","sign_in"];
      let result: any;

      if (publicTools.includes(toolName)) {
        result = await handlePublicTool(toolName, args);
      } else {
        result = await handleAuthTool(toolName, args, authHeader);
      }

      return c.json({
        jsonrpc: "2.0", id: body.id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      }, 200, CORS);
    } catch (err: any) {
      return c.json({
        jsonrpc: "2.0", id: body.id,
        result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true },
      }, 200, CORS);
    }
  }

  // Unknown method
  return c.json({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: `Method not found: ${body.method}` } }, 200, CORS);
});

Deno.serve(app.fetch);
