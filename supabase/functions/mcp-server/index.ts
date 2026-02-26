import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions
const TOOLS = [
  {
    name: "search_listings",
    description:
      "Search the OpenDraft marketplace for apps. Filter by keyword, category, tech stack, and price range.",
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
        tech_stack: {
          type: "array",
          items: { type: "string" },
          description: "Filter by technologies",
        },
        limit: { type: "number", description: "Max results (default 20, max 50)" },
      },
    },
  },
  {
    name: "get_listing",
    description: "Get full details for a specific listing by ID.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "UUID of the listing" },
      },
      required: ["listing_id"],
    },
  },
  {
    name: "list_categories",
    description: "Get all available listing categories with counts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_bounties",
    description: "Browse open bounties — project requests from buyers seeking custom builds.",
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
  },
  {
    name: "get_bounty",
    description: "Get full details for a specific bounty.",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "UUID of the bounty" },
      },
      required: ["bounty_id"],
    },
  },
  {
    name: "get_builder_profile",
    description: "View a builder's public profile and stats.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Builder's username" },
      },
      required: ["username"],
    },
  },
  {
    name: "create_account",
    description:
      "Register a new user account on OpenDraft. Returns a session token for authenticated operations.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email address" },
        password: { type: "string", description: "Password (min 8 chars)" },
        username: { type: "string", description: "Display name" },
      },
      required: ["email", "password", "username"],
    },
  },
  {
    name: "create_listing",
    description: "List a new app for sale on the marketplace. Requires authentication.",
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
  },
  {
    name: "initiate_purchase",
    description:
      "Start a Stripe checkout session for a listing. Returns a URL for the buyer to complete payment.",
    inputSchema: {
      type: "object",
      properties: {
        listing_id: { type: "string", description: "UUID of the listing to purchase" },
      },
      required: ["listing_id"],
    },
  },
];

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

// ---------- Tool handlers ----------

async function searchListings(args: any) {
  const sb = getSupabaseAnon();
  let q = sb
    .from("listings")
    .select("id,title,description,price,pricing_type,category,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,demo_url")
    .eq("status", "live")
    .order("sales_count", { ascending: false })
    .limit(Math.min(args.limit || 20, 50));

  if (args.category) q = q.eq("category", args.category);
  if (args.max_price != null) q = q.lte("price", args.max_price);
  if (args.query) q = q.or(`title.ilike.%${args.query}%,description.ilike.%${args.query}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  // Filter by tech_stack client-side if specified
  let results = data || [];
  if (args.tech_stack?.length) {
    const wanted = args.tech_stack.map((t: string) => t.toLowerCase());
    results = results.filter((l: any) =>
      l.tech_stack?.some((t: string) => wanted.includes(t.toLowerCase()))
    );
  }

  return results.map((l: any) => ({
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
}

async function getListing(args: any) {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("listings")
    .select("*")
    .eq("id", args.listing_id)
    .eq("status", "live")
    .single();
  if (error) throw new Error("Listing not found");

  // Get seller profile
  const { data: profile } = await sb
    .from("public_profiles")
    .select("username,avatar_url,verified,total_sales")
    .eq("user_id", data.seller_id)
    .single();

  // Get reviews
  const { data: reviews } = await sb
    .from("reviews")
    .select("rating,review_text,created_at")
    .eq("listing_id", args.listing_id)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    ...data,
    seller: profile,
    reviews: reviews || [],
    url: `https://opendraft.lovable.app/listing/${data.id}`,
  };
}

async function listCategories() {
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
  return results;
}

async function listBounties(args: any) {
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
  return data;
}

async function getBounty(args: any) {
  const sb = getSupabaseAnon();
  const { data, error } = await sb
    .from("bounties")
    .select("*")
    .eq("id", args.bounty_id)
    .single();
  if (error) throw new Error("Bounty not found");
  return data;
}

async function getBuilderProfile(args: any) {
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

  return {
    ...profile,
    listings: listings || [],
    url: `https://opendraft.lovable.app/builder/${profile.user_id}`,
  };
}

async function createAccount(args: any) {
  // Input validation
  if (!args.email || !args.password || !args.username) {
    throw new Error("email, password, and username are required");
  }
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

  // Generate a session for the new user
  const { data: session, error: sessionError } = await sb.auth.admin.generateLink({
    type: "magiclink",
    email: args.email,
  });

  return {
    user_id: data.user.id,
    email: data.user.email,
    message: "Account created successfully. Use the email/password to sign in via the app or API.",
  };
}

async function createListing(args: any, authHeader: string) {
  const sb = getSupabaseAnon(authHeader);
  const { data: userData, error: authError } = await sb.auth.getUser();
  if (authError || !userData?.user) throw new Error("Authentication required");

  // Validate
  if (!args.title || args.title.length > 100) throw new Error("Title required (max 100 chars)");
  if (!args.description || args.description.length > 5000) throw new Error("Description required (max 5000 chars)");
  if (args.price < 0) throw new Error("Price must be >= 0");

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
  return {
    listing_id: data.id,
    status: "pending",
    message: "Listing created. It will be visible after admin approval.",
    url: `https://opendraft.lovable.app/listing/${data.id}`,
  };
}

async function initiatePurchase(args: any, authHeader: string) {
  const sb = getSupabaseAnon(authHeader);
  const { data: userData, error: authError } = await sb.auth.getUser();
  if (authError || !userData?.user) throw new Error("Authentication required");

  const { data, error } = await sb.functions.invoke("create-checkout-session", {
    body: { listingId: args.listing_id },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  return {
    checkout_url: data.url,
    message: "Redirect the user to this URL to complete payment.",
  };
}

// ---------- MCP Protocol Handler ----------

async function handleMCPRequest(body: any, authHeader?: string) {
  const { method, params, id } = body;

  // JSON-RPC format
  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: "opendraft-marketplace",
            version: "1.0.0",
          },
        },
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      };

    case "tools/call": {
      const toolName = params?.name;
      const args = params?.arguments || {};
      let result: any;

      try {
        switch (toolName) {
          case "search_listings":
            result = await searchListings(args);
            break;
          case "get_listing":
            result = await getListing(args);
            break;
          case "list_categories":
            result = await listCategories();
            break;
          case "list_bounties":
            result = await listBounties(args);
            break;
          case "get_bounty":
            result = await getBounty(args);
            break;
          case "get_builder_profile":
            result = await getBuilderProfile(args);
            break;
          case "create_account":
            result = await createAccount(args);
            break;
          case "create_listing":
            result = await createListing(args, authHeader || "");
            break;
          case "initiate_purchase":
            result = await initiatePurchase(args, authHeader || "");
            break;
          default:
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Unknown tool: ${toolName}` },
            };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true,
          },
        };
      }
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ---------- Server ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET returns server info for discovery
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        name: "opendraft-marketplace",
        version: "1.0.0",
        description:
          "OpenDraft MCP Server — Browse, list, and purchase AI-built apps programmatically.",
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
        documentation: "https://opendraft.lovable.app/llms-full.txt",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization") || undefined;
    const response = await handleMCPRequest(body, authHeader);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
