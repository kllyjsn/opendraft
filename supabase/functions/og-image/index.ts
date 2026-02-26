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

    // Mascot SVG inline (simplified version of BrandMascot)
    const mascotSvg = `
      <g transform="translate(60, 440) scale(0.8)">
        <!-- Body -->
        <circle cx="50" cy="50" r="40" fill="#a78bfa"/>
        <circle cx="50" cy="50" r="40" fill="#7c3aed"/>
        <!-- Belly -->
        <ellipse cx="50" cy="56" rx="22" ry="20" fill="#a78bfa" opacity="0.5"/>
        <!-- Left ear -->
        <ellipse cx="28" cy="18" rx="9" ry="14" fill="#7c3aed" transform="rotate(-15 28 18)"/>
        <ellipse cx="28" cy="18" rx="5" ry="9" fill="#ec4899" opacity="0.6" transform="rotate(-15 28 18)"/>
        <!-- Right ear -->
        <ellipse cx="72" cy="18" rx="9" ry="14" fill="#7c3aed" transform="rotate(15 72 18)"/>
        <ellipse cx="72" cy="18" rx="5" ry="9" fill="#ec4899" opacity="0.6" transform="rotate(15 72 18)"/>
        <!-- Left eye -->
        <ellipse cx="38" cy="44" rx="9" ry="10" fill="white"/>
        <circle cx="40" cy="46" r="5" fill="#1a1a2e"/>
        <circle cx="42" cy="43" r="2" fill="white"/>
        <!-- Right eye -->
        <ellipse cx="62" cy="44" rx="9" ry="10" fill="white"/>
        <circle cx="64" cy="46" r="5" fill="#1a1a2e"/>
        <circle cx="66" cy="43" r="2" fill="white"/>
        <!-- Smile -->
        <path d="M42 62 Q50 72 58 62" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Cheeks -->
        <circle cx="28" cy="54" r="5" fill="#ec4899" opacity="0.35"/>
        <circle cx="72" cy="54" r="5" fill="#ec4899" opacity="0.35"/>
        <!-- Antenna -->
        <line x1="50" y1="14" x2="50" y2="6" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="50" cy="4" r="3.5" fill="#22d3ee"/>
        <!-- Feet -->
        <ellipse cx="38" cy="84" rx="7" ry="4" fill="#6d28d9"/>
        <ellipse cx="62" cy="84" rx="7" ry="4" fill="#6d28d9"/>
      </g>`;

    // Generate SVG-based OG image (1200x630)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0a1e"/>
      <stop offset="50%" stop-color="#1a1035"/>
      <stop offset="100%" stop-color="#0d0820"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <clipPath id="imgClip"><rect x="680" y="60" width="460" height="510" rx="24"/></clipPath>
    <filter id="glow"><feGaussianBlur stdDeviation="40" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Ambient glow orbs -->
  <circle cx="200" cy="500" r="200" fill="#7c3aed" opacity="0.08" filter="url(#glow)"/>
  <circle cx="900" cy="150" r="250" fill="#ec4899" opacity="0.06" filter="url(#glow)"/>

  <!-- Grid pattern -->
  <g opacity="0.04" stroke="white" stroke-width="0.5">
    ${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="630"/>`).join("")}
    ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="1200" y2="${i * 60}"/>`).join("")}
  </g>

  <!-- Screenshot area -->
  ${screenshot ? `<rect x="678" y="58" width="464" height="514" rx="26" fill="rgba(124,58,237,0.3)"/><image href="${screenshot}" x="680" y="60" width="460" height="510" clip-path="url(#imgClip)" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="680" y="60" width="460" height="510" rx="24" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><text x="910" y="330" text-anchor="middle" font-size="80" fill="rgba(255,255,255,0.15)">🚀</text>`}

  <!-- Accent line -->
  <rect x="60" y="160" width="60" height="4" rx="2" fill="url(#accent)"/>

  <!-- Title -->
  <text x="60" y="220" font-family="system-ui,-apple-system,sans-serif" font-size="54" font-weight="900" fill="white" letter-spacing="-1">${escapeXml(listing.title.slice(0, 28))}</text>
  ${listing.title.length > 28 ? `<text x="60" y="278" font-family="system-ui,-apple-system,sans-serif" font-size="46" font-weight="800" fill="rgba(255,255,255,0.9)" letter-spacing="-0.5">${escapeXml(listing.title.slice(28, 58))}</text>` : ""}

  <!-- Badge -->
  <rect x="60" y="310" width="${badge.length * 11 + 28}" height="32" rx="16" fill="rgba(124,58,237,0.25)" stroke="rgba(124,58,237,0.4)" stroke-width="1"/>
  <text x="74" y="331" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="700" fill="#a78bfa">${badge}</text>

  <!-- Price -->
  <text x="60" y="400" font-family="system-ui,-apple-system,sans-serif" font-size="60" font-weight="900" fill="white">${price}</text>

  <!-- Tech stack -->
  ${techStack ? `<text x="60" y="435" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" letter-spacing="0.5">${escapeXml(techStack)}</text>` : ""}

  <!-- Mascot -->
  ${mascotSvg}

  <!-- Brand -->
  <text x="180" y="495" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="900" fill="white" letter-spacing="-0.5">OpenDraft</text>
  <text x="180" y="515" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">opendraft.co</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="622" width="1200" height="8" fill="url(#accent)"/>
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
