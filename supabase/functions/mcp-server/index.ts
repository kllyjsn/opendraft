import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase helpers ──────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getSupabaseAnon(authHeader?: string) {
  const opts: any = {};
  if (authHeader) {
    opts.global = { headers: { Authorization: authHeader } };
  }
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    opts
  );
}

// ── MCP Server ────────────────────────────────────────────────────

const mcpServer = new McpServer({
  name: "opendraft-marketplace",
  version: "2.0.0",
});

// ── Tool: search_listings ─────────────────────────────────────────

mcpServer.tool({
  name: "search_listings",
  description:
    "Search the OpenDraft marketplace for AI-built apps. Filter by keyword, category, tech stack, price range, and completeness level.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword" },
      category: {
        type: "string",
        enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"],
        description: "Filter by category",
      },
      max_price: { type: "number", description: "Max price in cents" },
      tech_stack: { type: "array", items: { type: "string" }, description: "Filter by technologies" },
      completeness: {
        type: "string",
        enum: ["prototype", "mvp", "production_ready"],
        description: "Filter by completeness level",
      },
      limit: { type: "number", description: "Max results (default 20, max 50)" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    let q = sb
      .from("listings")
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
      results = results.filter((l: any) =>
        l.tech_stack?.some((t: string) => wanted.includes(t.toLowerCase()))
      );
    }

    const mapped = results.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description?.slice(0, 200),
      price_cents: l.price,
      pricing_type: l.pricing_type,
      category: l.category,
      completeness: l.completeness_badge,
      tech_stack: l.tech_stack,
      sales: l.sales_count,
      views: l.view_count,
      demo_url: l.demo_url,
      url: `https://opendraft.lovable.app/listing/${l.id}`,
    }));

    return { content: [{ type: "text", text: JSON.stringify(mapped, null, 2) }] };
  },
});

// ── Tool: get_listing ─────────────────────────────────────────────

mcpServer.tool({
  name: "get_listing",
  description: "Get full details for a specific listing by ID, including seller profile and reviews.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing" },
    },
    required: ["listing_id"],
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    const { data, error } = await sb
      .from("listings")
      .select("*")
      .eq("id", args.listing_id)
      .eq("status", "live")
      .single();
    if (error) throw new Error("Listing not found");

    const { data: profile } = await sb
      .from("public_profiles")
      .select("username,avatar_url,verified,total_sales")
      .eq("user_id", data.seller_id)
      .single();

    const { data: reviews } = await sb
      .from("reviews")
      .select("rating,review_text,created_at")
      .eq("listing_id", args.listing_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const result = {
      ...data,
      seller: profile,
      reviews: reviews || [],
      url: `https://opendraft.lovable.app/listing/${data.id}`,
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});

// ── Tool: list_categories ─────────────────────────────────────────

mcpServer.tool({
  name: "list_categories",
  description: "Get all available listing categories with counts of live listings.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const sb = getSupabaseAnon();
    const categories = ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"];
    const results = [];
    for (const cat of categories) {
      const { count } = await sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "live")
        .eq("category", cat);
      results.push({ category: cat, count: count || 0 });
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
});

// ── Tool: get_trending ────────────────────────────────────────────

mcpServer.tool({
  name: "get_trending",
  description: "Get trending listings and categories on OpenDraft right now. Shows what's hot based on recent views, sales, and momentum.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Max results (default 10)" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    const limit = Math.min(args.limit || 10, 30);

    // Top by recent sales
    const { data: topSales } = await sb
      .from("listings")
      .select("id,title,category,completeness_badge,price,pricing_type,sales_count,view_count,tech_stack,demo_url")
      .eq("status", "live")
      .order("sales_count", { ascending: false })
      .limit(limit);

    // Top by views (demand signal)
    const { data: topViews } = await sb
      .from("listings")
      .select("id,title,category,view_count,sales_count")
      .eq("status", "live")
      .order("view_count", { ascending: false })
      .limit(limit);

    // Recent bounties (what buyers want)
    const { data: hotBounties } = await sb
      .from("bounties")
      .select("title,category,budget,submissions_count")
      .eq("status", "open")
      .order("budget", { ascending: false })
      .limit(5);

    // Category breakdown
    const categories = ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"];
    const catCounts: Record<string, number> = {};
    for (const cat of categories) {
      const { count } = await sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "live")
        .eq("category", cat);
      catCounts[cat] = count || 0;
    }

    const result = {
      trending_by_sales: (topSales || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        price_cents: l.price,
        sales: l.sales_count,
        views: l.view_count,
        url: `https://opendraft.lovable.app/listing/${l.id}`,
      })),
      trending_by_views: (topViews || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        views: l.view_count,
        sales: l.sales_count,
      })),
      hot_bounties: hotBounties || [],
      category_distribution: catCounts,
      marketplace_url: "https://opendraft.lovable.app",
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});

// ── Tool: list_bounties ───────────────────────────────────────────

mcpServer.tool({
  name: "list_bounties",
  description: "Browse open bounties — project requests from buyers seeking custom builds. Great for finding paid work.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"],
      },
      limit: { type: "number", description: "Max results (default 20)" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    let q = sb
      .from("bounties")
      .select("id,title,description,budget,category,tech_stack,submissions_count,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit || 20, 50));

    if (args.category) q = q.eq("category", args.category);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ── Tool: get_bounty ──────────────────────────────────────────────

mcpServer.tool({
  name: "get_bounty",
  description: "Get full details for a specific bounty including requirements and submission count.",
  inputSchema: {
    type: "object",
    properties: {
      bounty_id: { type: "string", description: "UUID of the bounty" },
    },
    required: ["bounty_id"],
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    const { data, error } = await sb.from("bounties").select("*").eq("id", args.bounty_id).single();
    if (error) throw new Error("Bounty not found");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});

// ── Tool: search_builders ─────────────────────────────────────────

mcpServer.tool({
  name: "search_builders",
  description: "Search for builders on OpenDraft by username or browse top builders by sales.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search by username (optional)" },
      limit: { type: "number", description: "Max results (default 20)" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    let q = sb
      .from("public_profiles")
      .select("user_id,username,avatar_url,bio,verified,total_sales,followers_count")
      .order("total_sales", { ascending: false })
      .limit(Math.min(args.limit || 20, 50));

    if (args.query) q = q.ilike("username", `%${args.query}%`);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const results = (data || []).map((p: any) => ({
      ...p,
      profile_url: `https://opendraft.lovable.app/builder/${p.user_id}`,
    }));

    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
});

// ── Tool: get_builder_profile ─────────────────────────────────────

mcpServer.tool({
  name: "get_builder_profile",
  description: "View a builder's full public profile, stats, and their listings.",
  inputSchema: {
    type: "object",
    properties: {
      username: { type: "string", description: "Builder's username" },
    },
    required: ["username"],
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    const { data: profile, error } = await sb
      .from("public_profiles")
      .select("*")
      .eq("username", args.username)
      .single();
    if (error) throw new Error("Builder not found");

    const { data: listings } = await sb
      .from("listings")
      .select("id,title,price,pricing_type,category,completeness_badge,sales_count")
      .eq("seller_id", profile.user_id)
      .eq("status", "live")
      .order("sales_count", { ascending: false })
      .limit(20);

    const result = {
      ...profile,
      listings: listings || [],
      url: `https://opendraft.lovable.app/builder/${profile.user_id}`,
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});

// ── Tool: get_reviews ─────────────────────────────────────────────

mcpServer.tool({
  name: "get_reviews",
  description: "Get reviews and ratings for a specific listing.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing" },
      limit: { type: "number", description: "Max results (default 20)" },
    },
    required: ["listing_id"],
  },
  handler: async (args: any) => {
    const sb = getSupabaseAnon();
    const { data, error } = await sb
      .from("reviews")
      .select("rating,review_text,created_at,buyer_id")
      .eq("listing_id", args.listing_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit || 20, 50));
    if (error) throw new Error(error.message);

    // Get average rating
    const ratings = (data || []).map((r: any) => r.rating);
    const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ average_rating: avg, total_reviews: ratings.length, reviews: data }, null, 2),
      }],
    };
  },
});

// ── Tool: create_account ──────────────────────────────────────────

mcpServer.tool({
  name: "create_account",
  description:
    "Register a new user account on OpenDraft. Returns user ID. Use sign_in to get an auth token for write operations.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email address" },
      password: { type: "string", description: "Password (min 8 chars)" },
      username: { type: "string", description: "Display name" },
    },
    required: ["email", "password", "username"],
  },
  handler: async (args: any) => {
    if (!args.email || !args.password || !args.username) throw new Error("email, password, and username required");
    if (args.password.length < 8) throw new Error("Password must be at least 8 characters");
    if (args.username.length > 50) throw new Error("Username must be under 50 characters");

    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: { name: args.username },
    });
    if (error) throw new Error(error.message);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          user_id: data.user.id,
          email: data.user.email,
          message: "Account created. Use sign_in tool to get an auth token.",
        }, null, 2),
      }],
    };
  },
});

// ── Tool: sign_in ─────────────────────────────────────────────────

mcpServer.tool({
  name: "sign_in",
  description:
    "Sign in to an existing OpenDraft account. Returns an access token for authenticated operations like create_listing and initiate_purchase.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email address" },
      password: { type: "string", description: "Password" },
    },
    required: ["email", "password"],
  },
  handler: async (args: any) => {
    if (!args.email || !args.password) throw new Error("email and password required");

    const sb = getSupabaseAnon();
    const { data, error } = await sb.auth.signInWithPassword({
      email: args.email,
      password: args.password,
    });
    if (error) throw new Error(error.message);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          user_id: data.user.id,
          message: "Use this access_token as Bearer token in Authorization header for authenticated tools.",
        }, null, 2),
      }],
    };
  },
});

// ── Tool: create_listing ──────────────────────────────────────────

mcpServer.tool({
  name: "create_listing",
  description: "List a new app for sale on the marketplace. Requires authentication (pass Bearer token in Authorization header).",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "App name (max 100 chars)" },
      description: { type: "string", description: "App description (max 5000 chars)" },
      price: { type: "number", description: "Price in cents (0 = free)" },
      pricing_type: { type: "string", enum: ["one_time", "monthly"] },
      category: {
        type: "string",
        enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"],
      },
      tech_stack: { type: "array", items: { type: "string" }, description: "Technologies used" },
      demo_url: { type: "string", description: "Live demo URL (optional)" },
      github_url: { type: "string", description: "GitHub repo URL (optional)" },
      screenshots: { type: "array", items: { type: "string" }, description: "Screenshot URLs" },
      completeness_badge: { type: "string", enum: ["prototype", "mvp", "production_ready"] },
    },
    required: ["title", "description", "price", "category"],
  },
  handler: async (args: any, _extra: any) => {
    // Auth is handled via the request header — we need to get it from context
    // For mcp-lite, auth is passed through the transport layer
    throw new Error("Authentication required. Include Authorization: Bearer <token> header. Get a token via sign_in tool.");
  },
});

// ── Tool: submit_to_bounty ────────────────────────────────────────

mcpServer.tool({
  name: "submit_to_bounty",
  description: "Submit an existing listing as a solution to an open bounty. Requires authentication.",
  inputSchema: {
    type: "object",
    properties: {
      bounty_id: { type: "string", description: "UUID of the bounty" },
      listing_id: { type: "string", description: "UUID of your listing to submit" },
      message: { type: "string", description: "Cover message explaining why your listing fits (optional)" },
    },
    required: ["bounty_id", "listing_id"],
  },
  handler: async (args: any) => {
    throw new Error("Authentication required. Include Authorization: Bearer <token> header. Get a token via sign_in tool.");
  },
});

// ── Tool: initiate_purchase ───────────────────────────────────────

mcpServer.tool({
  name: "initiate_purchase",
  description:
    "Start a Stripe checkout session for a listing. Returns a URL for the buyer to complete payment. Requires authentication.",
  inputSchema: {
    type: "object",
    properties: {
      listing_id: { type: "string", description: "UUID of the listing to purchase" },
    },
    required: ["listing_id"],
  },
  handler: async (args: any) => {
    throw new Error("Authentication required. Include Authorization: Bearer <token> header. Get a token via sign_in tool.");
  },
});

// ── Hono app with Streamable HTTP transport ───────────────────────

const app = new Hono();
const transport = new StreamableHttpTransport();

// CORS preflight
app.options("/*", (c) => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
});

// GET — discovery endpoint
app.get("/*", (c) => {
  const toolSummary = [
    "search_listings", "get_listing", "list_categories", "get_trending",
    "list_bounties", "get_bounty", "search_builders", "get_builder_profile",
    "get_reviews", "create_account", "sign_in", "create_listing",
    "submit_to_bounty", "initiate_purchase",
  ];

  return c.json({
    name: "opendraft-marketplace",
    version: "2.0.0",
    protocol: "MCP (Model Context Protocol)",
    transport: "Streamable HTTP",
    description: "OpenDraft MCP Server — Browse, list, and purchase AI-built apps programmatically. 14 tools available.",
    tools: toolSummary,
    documentation: "https://opendraft.lovable.app/developers",
    llms_txt: "https://opendraft.lovable.app/llms.txt",
    mcp_discovery: "https://opendraft.lovable.app/.well-known/mcp.json",
    openapi: "https://opendraft.lovable.app/.well-known/openapi.json",
  });
});

// POST — MCP protocol handler via mcp-lite StreamableHttpTransport
app.post("/*", async (c) => {
  // For authenticated tools, we handle auth at the tool level
  // The auth header is available in the request context
  const authHeader = c.req.header("Authorization");

  // If it's an authenticated tool call, we need to inject auth
  // We do this by intercepting the request before mcp-lite handles it
  const body = await c.req.json();

  // Check if this is a tools/call for an auth-requiring tool
  if (body.method === "tools/call") {
    const toolName = body.params?.name;
    const authTools = ["create_listing", "initiate_purchase", "submit_to_bounty"];

    if (authTools.includes(toolName) && authHeader) {
      const sb = getSupabaseAnon(authHeader);
      const { data: userData, error: authError } = await sb.auth.getUser();

      if (!authError && userData?.user) {
        const args = body.params?.arguments || {};
        let result: any;

        try {
          if (toolName === "create_listing") {
            if (!args.title || args.title.length > 100) throw new Error("Title required (max 100 chars)");
            if (!args.description || args.description.length > 5000) throw new Error("Description required (max 5000 chars)");

            const { data, error } = await sb.from("listings").insert({
              seller_id: userData.user.id,
              title: args.title.trim(),
              description: args.description.trim(),
              price: args.price || 0,
              pricing_type: args.pricing_type || "one_time",
              category: args.category || "other",
              completeness_badge: args.completeness_badge || "prototype",
              tech_stack: args.tech_stack || [],
              screenshots: args.screenshots || [],
              demo_url: args.demo_url || null,
              github_url: args.github_url || null,
            }).select("id").single();
            if (error) throw new Error(error.message);

            result = {
              listing_id: data.id,
              status: "pending",
              message: "Listing created. It will be visible after admin approval.",
              url: `https://opendraft.lovable.app/listing/${data.id}`,
            };
          } else if (toolName === "initiate_purchase") {
            const { data, error } = await sb.functions.invoke("create-checkout-session", {
              body: { listingId: args.listing_id },
            });
            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);
            result = { checkout_url: data.url, message: "Redirect user to this URL to complete payment." };
          } else if (toolName === "submit_to_bounty") {
            const { data, error } = await sb.from("bounty_submissions").insert({
              bounty_id: args.bounty_id,
              listing_id: args.listing_id,
              seller_id: userData.user.id,
              message: args.message || null,
            }).select("id").single();
            if (error) throw new Error(error.message);
            result = { submission_id: data.id, message: "Submission sent to bounty poster." };
          }

          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
          }, 200, {
            "Access-Control-Allow-Origin": "*",
          });
        } catch (err: any) {
          return c.json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true },
          }, 200, { "Access-Control-Allow-Origin": "*" });
        }
      }
    }
  }

  // For non-auth tools, let mcp-lite handle it natively
  const response = await transport.handleRequest(
    new Request(c.req.url, {
      method: "POST",
      headers: c.req.raw.headers,
      body: JSON.stringify(body),
    }),
    mcpServer
  );

  // Add CORS headers to mcp-lite's response
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
});

Deno.serve(app.fetch);
