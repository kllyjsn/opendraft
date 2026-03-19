/**
 * blog-og-image — generates a branded SVG OG image for blog posts
 * Query params: ?slug=xxx&title=xxx&category=xxx
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  "Behind the Build": { bg: "#7c3aed", fg: "#e9d5ff" },
  "Agent Economy": { bg: "#06b6d4", fg: "#cffafe" },
  "Engineering": { bg: "#10b981", fg: "#d1fae5" },
  "Technical Deep Dive": { bg: "#f59e0b", fg: "#fef3c7" },
  "Guides": { bg: "#ec4899", fg: "#fce7f3" },
  "Own Your Software": { bg: "#8b5cf6", fg: "#ede9fe" },
  "Replace Your SaaS": { bg: "#ef4444", fg: "#fee2e2" },
  "Better Margins": { bg: "#14b8a6", fg: "#ccfbf1" },
  "Paste and Build": { bg: "#f97316", fg: "#fff7ed" },
  "Vibe Coding": { bg: "#a855f7", fg: "#f3e8ff" },
  "Templates": { bg: "#6366f1", fg: "#e0e7ff" },
  "AI Apps": { bg: "#06b6d4", fg: "#cffafe" },
  "SMB Growth": { bg: "#22c55e", fg: "#dcfce7" },
  "Health & Fitness": { bg: "#10b981", fg: "#d1fae5" },
  "Healthcare": { bg: "#0ea5e9", fg: "#e0f2fe" },
  "Real Estate": { bg: "#eab308", fg: "#fef9c3" },
  "Creator Economy": { bg: "#ec4899", fg: "#fce7f3" },
  "SaaS": { bg: "#8b5cf6", fg: "#ede9fe" },
  "Enterprise": { bg: "#64748b", fg: "#f1f5f9" },
  "Education": { bg: "#0891b2", fg: "#cffafe" },
  "Finance": { bg: "#059669", fg: "#d1fae5" },
  "Social": { bg: "#d946ef", fg: "#fae8ff" },
  "Comparison": { bg: "#f43f5e", fg: "#ffe4e6" },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 3); // max 3 lines
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") || "OpenDraft Blog";
    const category = url.searchParams.get("category") || "Blog";

    const colors = CATEGORY_COLORS[category] || { bg: "#7c3aed", fg: "#e9d5ff" };
    const titleLines = wrapText(title, 28);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0a1e"/>
      <stop offset="40%" stop-color="#1a1035"/>
      <stop offset="100%" stop-color="#0d0820"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${colors.bg}"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="60" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative orbs -->
  <circle cx="900" cy="100" r="300" fill="${colors.bg}" opacity="0.06" filter="url(#glow)"/>
  <circle cx="100" cy="500" r="250" fill="#ec4899" opacity="0.05" filter="url(#glow)"/>
  <circle cx="600" cy="600" r="200" fill="${colors.bg}" opacity="0.04" filter="url(#glow)"/>

  <!-- Grid -->
  <g opacity="0.03" stroke="white" stroke-width="0.5">
    ${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="630"/>`).join("")}
    ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="1200" y2="${i * 60}"/>`).join("")}
  </g>

  <!-- Decorative quote mark -->
  <text x="80" y="200" font-family="Georgia,serif" font-size="200" fill="${colors.bg}" opacity="0.12">"</text>

  <!-- Category badge -->
  <rect x="80" y="220" width="${category.length * 10 + 32}" height="30" rx="15" fill="${colors.bg}" opacity="0.2"/>
  <text x="96" y="240" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="800" fill="${colors.fg}" letter-spacing="1" text-transform="uppercase">${escapeXml(category.toUpperCase())}</text>

  <!-- Title -->
  ${titleLines.map((line, i) => `<text x="80" y="${300 + i * 70}" font-family="system-ui,-apple-system,sans-serif" font-size="${i === 0 ? 58 : 52}" font-weight="900" fill="white" letter-spacing="-1.5">${escapeXml(line)}</text>`).join("\n  ")}

  <!-- Mascot -->
  <g transform="translate(80, 490) scale(0.6)">
    <circle cx="50" cy="50" r="40" fill="#7c3aed"/>
    <ellipse cx="50" cy="56" rx="22" ry="20" fill="#a78bfa" opacity="0.5"/>
    <ellipse cx="38" cy="44" rx="9" ry="10" fill="white"/>
    <circle cx="40" cy="46" r="5" fill="#1a1a2e"/>
    <circle cx="42" cy="43" r="2" fill="white"/>
    <ellipse cx="62" cy="44" rx="9" ry="10" fill="white"/>
    <circle cx="64" cy="46" r="5" fill="#1a1a2e"/>
    <circle cx="66" cy="43" r="2" fill="white"/>
    <path d="M42 62 Q50 72 58 62" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="54" r="5" fill="#ec4899" opacity="0.35"/>
    <circle cx="72" cy="54" r="5" fill="#ec4899" opacity="0.35"/>
    <line x1="50" y1="14" x2="50" y2="6" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="50" cy="4" r="3.5" fill="#22d3ee"/>
  </g>

  <!-- Brand text -->
  <text x="150" y="520" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="-0.5">OpenDraft</text>
  <text x="150" y="542" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">opendraft.co/blog</text>

  <!-- Read time -->
  <text x="1120" y="535" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="rgba(255,255,255,0.3)">📖 Blog</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="622" width="1200" height="8" fill="url(#accent)"/>
</svg>`;

    return new Response(svg, {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
