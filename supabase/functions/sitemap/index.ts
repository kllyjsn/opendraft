import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const CATEGORIES = ["saas-tool", "ai-app", "landing-page", "utility", "game", "other"];
const TOOLS = ["lovable", "cursor", "claude-code", "bolt", "replit"];

const STATIC_BLOG_SLUGS = [
  "autonomous-revenue-zero-employees",
  "ai-agents-buying-software",
  "site-doctor-self-healing-deploys",
  "mcp-servers-complete-guide-2026",
  "what-is-vibe-coding",
  "best-ai-coding-tools-2026",
  "monetize-side-project",
  "rise-of-ai-agent-marketplace",
  "vibe-coding-multi-agent-workflows",
  "vibe-coding-state-of-the-market",
];

const PERSONAS = [
  "founders", "developers", "designers", "product-managers", "agencies",
  "freelancers", "indie-hackers", "students", "startups", "enterprise",
];

const LIFESTYLE_CATEGORIES = [
  "productivity", "health-fitness", "personal-finance", "home-kitchen", "built-for-agents",
];

const APP_VERTICALS = [
  "restaurants", "fitness", "real-estate", "ecommerce", "healthcare",
  "education", "legal", "marketing", "finance", "saas",
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const base = "https://opendraft.co";
  const now = new Date().toISOString().split("T")[0];

  let urls: string[] = [];

  // ── Core pages ──
  const corePages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/blog", changefreq: "daily", priority: "0.9" },
    { loc: "/sell", changefreq: "weekly", priority: "0.8" },
    { loc: "/faq", changefreq: "weekly", priority: "0.7" },
    { loc: "/builders", changefreq: "daily", priority: "0.8" },
    { loc: "/bounties", changefreq: "daily", priority: "0.7" },
    { loc: "/agents", changefreq: "weekly", priority: "0.7" },
    { loc: "/developers", changefreq: "weekly", priority: "0.7" },
    { loc: "/openclaw", changefreq: "weekly", priority: "0.6" },
    { loc: "/cloud", changefreq: "monthly", priority: "0.5" },
    { loc: "/founders", changefreq: "monthly", priority: "0.6" },
    { loc: "/security", changefreq: "monthly", priority: "0.5" },
    { loc: "/terms", changefreq: "monthly", priority: "0.3" },
    { loc: "/privacy", changefreq: "monthly", priority: "0.3" },
    { loc: "/guides/sell", changefreq: "weekly", priority: "0.7" },
    { loc: "/guides/creators", changefreq: "weekly", priority: "0.7" },
    { loc: "/credits", changefreq: "monthly", priority: "0.5" },
  ];

  for (const page of corePages) {
    urls.push(`<url><loc>${base}${page.loc}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`);
  }

  // ── Static blog posts ──
  const staticBlogSlugs = new Set(STATIC_BLOG_SLUGS);
  for (const slug of STATIC_BLOG_SLUGS) {
    urls.push(`<url><loc>${base}/blog/${slug}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }

  // ── Dynamic blog posts from database ──
  const { data: dbPosts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  for (const post of dbPosts ?? []) {
    if (!staticBlogSlugs.has(post.slug)) {
      const lastmod = post.updated_at?.split("T")[0] ?? now;
      urls.push(`<url><loc>${base}/blog/${post.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
    }
  }

  // ── Category pages ──
  for (const cat of CATEGORIES) {
    urls.push(`<url><loc>${base}/category/${cat}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
  }

  // ── Built-with pages ──
  for (const tool of TOOLS) {
    urls.push(`<url><loc>${base}/built-with/${tool}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
  }

  // ── Persona pages ──
  for (const persona of PERSONAS) {
    urls.push(`<url><loc>${base}/for/${persona}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  // ── Lifestyle category pages ──
  for (const cat of LIFESTYLE_CATEGORIES) {
    urls.push(`<url><loc>${base}/lifestyle/${cat}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  // ── App vertical pages ──
  for (const vertical of APP_VERTICALS) {
    urls.push(`<url><loc>${base}/apps/${vertical}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  // ── Live listings ──
  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("status", "live")
    .order("updated_at", { ascending: false })
    .limit(1000);

  for (const l of listings ?? []) {
    const lastmod = l.updated_at?.split("T")[0] ?? now;
    urls.push(`<url><loc>${base}/listing/${l.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`);
  }

  // ── Builder profiles ──
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, updated_at")
    .limit(1000);

  for (const p of profiles ?? []) {
    const lastmod = p.updated_at?.split("T")[0] ?? now;
    urls.push(`<url><loc>${base}/builder/${p.user_id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
  }

  // ── Open bounties ──
  const { data: bounties } = await supabase
    .from("bounties")
    .select("id, updated_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(500);

  for (const b of bounties ?? []) {
    const lastmod = b.updated_at?.split("T")[0] ?? now;
    urls.push(`<url><loc>${base}/bounty/${b.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
});
