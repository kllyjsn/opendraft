const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BADGE_LABELS: Record<string, string> = {
  prototype: "Prototype",
  mvp: "MVP",
  production_ready: "Production Ready",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const listingId = url.searchParams.get("id");
    if (!listingId) return new Response("Missing id", { status: 400, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=title,price,completeness_badge,tech_stack,screenshots,pricing_type&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const [listing] = await res.json();
    if (!listing) return new Response("Not found", { status: 404, headers: corsHeaders });

    const price = listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(2)}${listing.pricing_type === "monthly" ? "/mo" : ""}`;
    const badge = BADGE_LABELS[listing.completeness_badge] ?? listing.completeness_badge;
    const techStack = (listing.tech_stack || []).slice(0, 4).join(" · ");
    const screenshot = listing.screenshots?.[0] || null;

    // Generate SVG-based OG image (1200x630)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <clipPath id="imgClip"><rect x="680" y="60" width="460" height="510" rx="20"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${screenshot ? `<image href="${screenshot}" x="680" y="60" width="460" height="510" clip-path="url(#imgClip)" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="680" y="60" width="460" height="510" rx="20" fill="rgba(255,255,255,0.1)"/><text x="910" y="330" text-anchor="middle" font-size="80" fill="rgba(255,255,255,0.3)">⚡</text>`}
  <text x="60" y="120" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="rgba(255,255,255,0.7)" letter-spacing="2">OPENDRAFT</text>
  <text x="60" y="240" font-family="system-ui,sans-serif" font-size="52" font-weight="900" fill="white" textLength="580" lengthAdjust="spacingAndGlyphs">${escapeXml(listing.title.slice(0, 40))}</text>
  ${listing.title.length > 40 ? `<text x="60" y="300" font-family="system-ui,sans-serif" font-size="42" font-weight="800" fill="white">${escapeXml(listing.title.slice(40, 70))}</text>` : ""}
  <rect x="60" y="340" width="auto" height="36" rx="18" fill="rgba(255,255,255,0.15)"/>
  <text x="80" y="364" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="white">${badge}</text>
  <text x="60" y="440" font-family="system-ui,sans-serif" font-size="56" font-weight="900" fill="white">${price}</text>
  ${techStack ? `<text x="60" y="500" font-family="system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">${escapeXml(techStack)}</text>` : ""}
  <text x="60" y="570" font-family="system-ui,sans-serif" font-size="16" fill="rgba(255,255,255,0.5)">opendraft.co</text>
</svg>`;

    return new Response(svg, {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
