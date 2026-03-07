import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple hash function for deterministic color generation
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Generate HSL color from hash
function hashColor(s: string, offset = 0): [number, number, number] {
  const h = hashStr(s + offset.toString());
  const hue = h % 360;
  const sat = 55 + (h % 30); // 55-85%
  const lit = 45 + ((h >> 8) % 20); // 45-65%
  return [hue, sat, lit];
}

// Category-specific UI element generators
const CATEGORY_LAYOUTS: Record<string, (name: string, h: number, desc: string) => string> = {
  saas_tool: generateSaaSLayout,
  ai_app: generateAILayout,
  utility: generateUtilityLayout,
  landing_page: generateLandingLayout,
  game: generateGameLayout,
  other: generateOtherLayout,
};

function generateSaaSLayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const hue2 = (hue + 30) % 360;
  const bgHue = (hue + 180) % 360;
  const seed = hashStr(name);
  // Generate unique chart data
  const bars = Array.from({ length: 7 }, (_, i) => 30 + ((seed * (i + 1) * 7) % 70));
  const linePoints = Array.from({ length: 8 }, (_, i) => {
    const x = 20 + i * 45;
    const y = 200 - ((seed * (i + 3) * 11) % 100) - 40;
    return `${x},${y}`;
  }).join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue},15%,12%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue},20%,8%)"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${lit - 10}%)"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <!-- Sidebar -->
    <rect x="0" y="0" width="180" height="450" fill="hsl(${bgHue},18%,10%)" opacity="0.9"/>
    <rect x="15" y="18" width="150" height="28" rx="6" fill="url(#accent)" opacity="0.9"/>
    <text x="90" y="37" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">${name.slice(0, 14)}</text>
    ${[70, 100, 130, 160, 200, 230, 260].map((y, i) => `
      <rect x="20" y="${y}" width="${80 + ((seed * (i + 1)) % 60)}" height="10" rx="3" fill="hsl(${bgHue},10%,${i < 3 ? 35 : 25}%)" opacity="${i === 0 ? 1 : 0.6}"/>
      ${i === 0 ? `<rect x="12" y="${y - 2}" width="3" height="14" rx="1.5" fill="hsl(${hue},${sat}%,${lit}%)"/>` : ""}
    `).join("")}
    <!-- Main area -->
    <!-- Stat cards -->
    ${[0, 1, 2, 3].map(i => {
      const cx = 200 + i * 150;
      const val = ((seed * (i + 7)) % 900) + 100;
      return `<rect x="${cx}" y="20" width="130" height="65" rx="8" fill="hsl(${bgHue},15%,14%)" stroke="hsl(${bgHue},15%,20%)" stroke-width="1"/>
        <text x="${cx + 15}" y="44" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bgHue},10%,55%)">${["Revenue", "Users", "Orders", "Growth"][i]}</text>
        <text x="${cx + 15}" y="68" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">${i === 3 ? `+${val % 99}%` : i === 0 ? `$${(val * 10).toLocaleString()}` : val.toLocaleString()}</text>`;
    }).join("")}
    <!-- Chart area -->
    <rect x="200" y="100" width="370" height="180" rx="8" fill="hsl(${bgHue},15%,14%)" stroke="hsl(${bgHue},15%,20%)" stroke-width="1"/>
    <text x="215" y="125" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Analytics Overview</text>
    <!-- Bars -->
    ${bars.map((h2, i) => `<rect x="${225 + i * 45}" y="${260 - h2}" width="25" height="${h2}" rx="3" fill="url(#accent)" opacity="${0.5 + (i % 3) * 0.2}"/>`).join("")}
    <!-- Line -->
    <polyline points="${linePoints}" fill="none" stroke="hsl(${hue},${sat}%,${lit}%)" stroke-width="2" opacity="0.8"/>
    <!-- Right panel / table -->
    <rect x="585" y="100" width="200" height="180" rx="8" fill="hsl(${bgHue},15%,14%)" stroke="hsl(${bgHue},15%,20%)" stroke-width="1"/>
    <text x="600" y="125" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Recent Activity</text>
    ${[0, 1, 2, 3, 4].map(i => `
      <rect x="600" y="${140 + i * 27}" width="${120 + ((seed * i) % 50)}" height="8" rx="3" fill="hsl(${bgHue},10%,22%)"/>
      <circle cx="770" cy="${144 + i * 27}" r="4" fill="hsl(${(hue + i * 40) % 360},${sat}%,${lit}%)"/>
    `).join("")}
    <!-- Bottom cards -->
    ${[0, 1].map(i => {
      const bx = 200 + i * 295;
      return `<rect x="${bx}" y="295" width="280" height="140" rx="8" fill="hsl(${bgHue},15%,14%)" stroke="hsl(${bgHue},15%,20%)" stroke-width="1"/>
        <text x="${bx + 15}" y="320" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">${i === 0 ? "Performance" : "Breakdown"}</text>
        ${i === 0 ? `
          <rect x="${bx + 15}" y="335" width="250" height="6" rx="3" fill="hsl(${bgHue},10%,20%)"/>
          <rect x="${bx + 15}" y="335" width="${80 + (seed % 120)}" height="6" rx="3" fill="url(#accent)"/>
          <rect x="${bx + 15}" y="355" width="250" height="6" rx="3" fill="hsl(${bgHue},10%,20%)"/>
          <rect x="${bx + 15}" y="355" width="${60 + (seed % 140)}" height="6" rx="3" fill="hsl(${hue2},${sat}%,${lit}%)"/>
          <rect x="${bx + 15}" y="375" width="250" height="6" rx="3" fill="hsl(${bgHue},10%,20%)"/>
          <rect x="${bx + 15}" y="375" width="${100 + (seed % 100)}" height="6" rx="3" fill="hsl(${(hue + 60) % 360},${sat}%,${lit}%)"/>
        ` : `
          <circle cx="${bx + 80}" cy="${380}" r="40" fill="none" stroke="url(#accent)" stroke-width="12" stroke-dasharray="${60 + seed % 40} 200"/>
          <circle cx="${bx + 80}" cy="${380}" r="40" fill="none" stroke="hsl(${hue2},${sat}%,${lit}%)" stroke-width="12" stroke-dasharray="${30 + seed % 30} 200" stroke-dashoffset="-${60 + seed % 40}"/>
          <rect x="${bx + 150}" y="340" width="100" height="8" rx="3" fill="hsl(${bgHue},10%,22%)"/>
          <rect x="${bx + 150}" y="360" width="80" height="8" rx="3" fill="hsl(${bgHue},10%,22%)"/>
          <rect x="${bx + 150}" y="380" width="90" height="8" rx="3" fill="hsl(${bgHue},10%,22%)"/>
        `}`;
    }).join("")}
  </svg>`;
}

function generateAILayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const hue2 = (hue + 40) % 360;
  const bgHue = (hue + 200) % 360;
  const seed = hashStr(name);

  // Chat messages
  const msgs = [
    { role: "user", text: "Analyze this data and summarize", y: 80 },
    { role: "ai", text: "Here's what I found in your dataset...", y: 140 },
    { role: "ai", text: "Key insight: Growth rate increased 42%", y: 195 },
    { role: "user", text: "Generate a report from this", y: 265 },
    { role: "ai", text: "Creating your detailed report now...", y: 320 },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue},20%,8%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue},25%,5%)"/>
      </linearGradient>
      <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${lit - 10}%)"/>
      </linearGradient>
      <radialGradient id="orb" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <circle cx="${300 + seed % 200}" cy="${100 + seed % 150}" r="200" fill="url(#orb)"/>
    <!-- Header -->
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bgHue},20%,10%)" opacity="0.8"/>
    <circle cx="30" cy="25" r="12" fill="url(#glow)" opacity="0.9"/>
    <text x="50" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${name.slice(0, 16)}</text>
    <rect x="600" y="15" width="80" height="22" rx="6" fill="url(#glow)" opacity="0.8"/>
    <text x="640" y="30" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">New Chat</text>
    <!-- Sidebar conversations -->
    <rect x="0" y="50" width="180" height="400" fill="hsl(${bgHue},18%,9%)"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `
      <rect x="12" y="${65 + i * 42}" width="156" height="32" rx="6" fill="hsl(${bgHue},15%,${i === 0 ? 18 : 12}%)" ${i === 0 ? `stroke="hsl(${hue},${sat}%,${lit}%)" stroke-width="1" opacity="1"` : `opacity="0.7"`}/>
      <rect x="22" y="${73 + i * 42}" width="${80 + ((seed * (i + 1)) % 60)}" height="7" rx="2" fill="hsl(${bgHue},10%,${i === 0 ? 40 : 28}%)"/>
      <rect x="22" y="${84 + i * 42}" width="${50 + ((seed * (i + 3)) % 40)}" height="5" rx="2" fill="hsl(${bgHue},10%,20%)"/>
    `).join("")}
    <!-- Chat area -->
    ${msgs.map((m, i) => {
      const isAI = m.role === "ai";
      const x = isAI ? 200 : 400;
      const w = isAI ? 360 : 280;
      return `<rect x="${x}" y="${m.y}" width="${w}" height="${isAI ? 40 : 32}" rx="12" fill="${isAI ? `hsl(${bgHue},15%,15%)` : `hsl(${hue},${sat - 20}%,${lit - 10}%)`}" opacity="0.9"/>
        ${isAI ? `<circle cx="${210}" cy="${m.y + 20}" r="10" fill="url(#glow)" opacity="0.7"/>` : ""}
        <text x="${isAI ? 228 : x + 15}" y="${m.y + (isAI ? 24 : 20)}" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bgHue},10%,${isAI ? 70 : 90}%)">${m.text}</text>`;
    }).join("")}
    <!-- Typing indicator -->
    ${[0, 1, 2].map(i => `<circle cx="${220 + i * 14}" cy="385" r="4" fill="hsl(${hue},${sat}%,${lit}%)" opacity="${0.3 + i * 0.2}"/>`).join("")}
    <!-- Input bar -->
    <rect x="195" y="405" width="590" height="35" rx="18" fill="hsl(${bgHue},15%,15%)" stroke="hsl(${bgHue},15%,25%)" stroke-width="1"/>
    <text x="215" y="427" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bgHue},10%,35%)">Type a message...</text>
    <circle cx="760" cy="422" r="12" fill="url(#glow)" opacity="0.7"/>
  </svg>`;
}

function generateUtilityLayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const bgHue = (hue + 160) % 360;
  const seed = hashStr(name);

  // Generate fake code lines
  const codeLines = [
    `<tspan fill="hsl(${hue},70%,65%)">import</tspan> { useState } <tspan fill="hsl(${hue},70%,65%)">from</tspan> <tspan fill="hsl(30,80%,60%)">'react'</tspan>;`,
    `<tspan fill="hsl(${hue},70%,65%)">const</tspan> App = () =&gt; {`,
    `  <tspan fill="hsl(${hue},70%,65%)">const</tspan> [data, setData] = useState([]);`,
    `  <tspan fill="hsl(280,60%,65%)">// Process and transform</tspan>`,
    `  <tspan fill="hsl(${hue},70%,65%)">return</tspan> &lt;<tspan fill="hsl(180,60%,65%)">div</tspan>&gt;...&lt;/<tspan fill="hsl(180,60%,65%)">div</tspan>&gt;;`,
    `};`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue},15%,10%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue},18%,6%)"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <!-- Tab bar -->
    <rect x="0" y="0" width="800" height="36" fill="hsl(${bgHue},15%,12%)"/>
    <rect x="0" y="0" width="140" height="36" fill="hsl(${bgHue},15%,16%)"/>
    <text x="70" y="22" font-family="monospace" font-size="10" fill="white" text-anchor="middle">${name.slice(0, 12)}.tsx</text>
    <rect x="140" y="0" width="100" height="36" fill="hsl(${bgHue},15%,13%)"/>
    <text x="190" y="22" font-family="monospace" font-size="10" fill="hsl(${bgHue},10%,45%)" text-anchor="middle">config.ts</text>
    <!-- Line numbers + code -->
    <rect x="0" y="36" width="40" height="414" fill="hsl(${bgHue},15%,9%)"/>
    ${codeLines.map((_, i) => `<text x="28" y="${62 + i * 22}" font-family="monospace" font-size="11" fill="hsl(${bgHue},10%,30%)" text-anchor="end">${i + 1}</text>`).join("")}
    ${codeLines.map((line, i) => `<text x="50" y="${62 + i * 22}" font-family="monospace" font-size="11" fill="hsl(${bgHue},10%,65%)">${line}</text>`).join("")}
    <!-- Right panel: output/preview -->
    <rect x="420" y="36" width="380" height="414" fill="hsl(${bgHue},12%,8%)" stroke="hsl(${bgHue},15%,18%)" stroke-width="1"/>
    <rect x="420" y="36" width="380" height="30" fill="hsl(${bgHue},15%,11%)"/>
    <text x="440" y="55" font-family="monospace" font-size="10" fill="hsl(${hue},${sat}%,${lit}%)">▶ Output</text>
    <!-- Fake output -->
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `
      <rect x="435" y="${80 + i * 30}" width="${150 + ((seed * (i + 1)) % 180)}" height="10" rx="3" fill="hsl(${bgHue},10%,${15 + ((i * 3) % 10)}%)"/>
    `).join("")}
    <!-- Status bar -->
    <rect x="0" y="430" width="800" height="20" fill="hsl(${hue},${sat}%,${lit - 5}%)"/>
    <text x="15" y="443" font-family="monospace" font-size="9" fill="white">${name} — Ready</text>
    <text x="700" y="443" font-family="monospace" font-size="9" fill="white">UTF-8  TypeScript</text>
  </svg>`;
}

function generateLandingLayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const hue2 = (hue + 50) % 360;
  const seed = hashStr(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},30%,8%)"/>
        <stop offset="50%" stop-color="hsl(${hue},25%,5%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},20%,8%)"/>
      </linearGradient>
      <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${lit}%)"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <ellipse cx="400" cy="150" rx="400" ry="200" fill="url(#glow)"/>
    <!-- Nav -->
    <rect x="30" y="15" width="20" height="20" rx="5" fill="url(#btn)"/>
    <text x="60" y="30" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="white">${name.slice(0, 14)}</text>
    ${["Features", "Pricing", "About"].map((t, i) => `<text x="${400 + i * 90}" y="30" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${hue},10%,55%)">${t}</text>`).join("")}
    <rect x="690" y="15" width="80" height="26" rx="13" fill="url(#btn)"/>
    <text x="730" y="32" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="white" text-anchor="middle">Sign Up</text>
    <!-- Hero -->
    <text x="400" y="120" font-family="system-ui,sans-serif" font-size="32" font-weight="800" fill="white" text-anchor="middle">${name}</text>
    <rect x="200" y="140" width="400" height="10" rx="4" fill="hsl(${hue},10%,30%)"/>
    <rect x="250" y="160" width="300" height="8" rx="3" fill="hsl(${hue},10%,22%)"/>
    <!-- CTA buttons -->
    <rect x="280" y="190" width="120" height="36" rx="18" fill="url(#btn)"/>
    <text x="340" y="213" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">Get Started</text>
    <rect x="420" y="190" width="120" height="36" rx="18" fill="transparent" stroke="hsl(${hue},10%,40%)" stroke-width="1"/>
    <text x="480" y="213" font-family="system-ui,sans-serif" font-size="11" fill="hsl(${hue},10%,60%)" text-anchor="middle">Learn More</text>
    <!-- Feature cards -->
    ${[0, 1, 2].map(i => {
      const cx = 130 + i * 230;
      return `<rect x="${cx}" y="260" width="200" height="130" rx="12" fill="hsl(${hue},15%,10%)" stroke="hsl(${hue},15%,18%)" stroke-width="1"/>
        <circle cx="${cx + 30}" cy="290" r="14" fill="hsl(${(hue + i * 60) % 360},${sat}%,${lit}%)" opacity="0.7"/>
        <rect x="${cx + 20}" y="315" width="${100 + (seed * (i + 1)) % 60}" height="8" rx="3" fill="hsl(${hue},10%,35%)"/>
        <rect x="${cx + 20}" y="335" width="${130 + (seed * i) % 40}" height="6" rx="3" fill="hsl(${hue},10%,22%)"/>
        <rect x="${cx + 20}" y="350" width="${80 + (seed * (i + 2)) % 70}" height="6" rx="3" fill="hsl(${hue},10%,22%)"/>`;
    }).join("")}
    <!-- Floating shapes -->
    <circle cx="${50 + seed % 100}" cy="${300 + seed % 80}" r="4" fill="hsl(${hue},${sat}%,${lit}%)" opacity="0.3"/>
    <circle cx="${650 + seed % 100}" cy="${80 + seed % 60}" r="6" fill="hsl(${hue2},${sat}%,${lit}%)" opacity="0.2"/>
  </svg>`;
}

function generateGameLayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const hue2 = (hue + 120) % 360;
  const hue3 = (hue + 240) % 360;
  const seed = hashStr(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},25%,15%)"/>
        <stop offset="100%" stop-color="hsl(${hue},30%,5%)"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${lit}%)"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <!-- Scattered game elements -->
    ${Array.from({ length: 12 }, (_, i) => {
      const x = 50 + ((seed * (i + 1) * 73) % 700);
      const y = 50 + ((seed * (i + 3) * 41) % 350);
      const size = 15 + ((seed * (i + 5)) % 30);
      const shape = i % 3;
      if (shape === 0) return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="hsl(${(hue + i * 30) % 360},${sat}%,${lit}%)" opacity="0.3" transform="rotate(${(seed * i) % 45} ${x + size / 2} ${y + size / 2})"/>`;
      if (shape === 1) return `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="hsl(${(hue2 + i * 25) % 360},${sat}%,${lit}%)" opacity="0.25"/>`;
      return `<polygon points="${x},${y - size / 2} ${x + size / 2},${y + size / 2} ${x - size / 2},${y + size / 2}" fill="hsl(${(hue3 + i * 35) % 360},${sat}%,${lit}%)" opacity="0.2"/>`;
    }).join("")}
    <!-- Game title -->
    <text x="400" y="100" font-family="system-ui,sans-serif" font-size="42" font-weight="900" fill="url(#accent)" text-anchor="middle" letter-spacing="-1">${name.slice(0, 12).toUpperCase()}</text>
    <text x="400" y="125" font-family="system-ui,sans-serif" font-size="12" fill="hsl(${hue},10%,55%)" text-anchor="middle" letter-spacing="4">PLAY NOW</text>
    <!-- Score display -->
    <rect x="300" y="160" width="200" height="50" rx="12" fill="hsl(${hue},20%,12%)" stroke="url(#accent)" stroke-width="2"/>
    <text x="400" y="180" font-family="monospace" font-size="9" fill="hsl(${hue},10%,55%)" text-anchor="middle">HIGH SCORE</text>
    <text x="400" y="200" font-family="monospace" font-size="22" font-weight="700" fill="white" text-anchor="middle">${((seed % 9000) + 1000).toLocaleString()}</text>
    <!-- Game grid/board -->
    <rect x="200" y="230" width="400" height="160" rx="10" fill="hsl(${hue},20%,10%)" stroke="hsl(${hue},15%,20%)" stroke-width="1"/>
    ${Array.from({ length: 20 }, (_, i) => {
      const gx = 215 + (i % 5) * 78;
      const gy = 245 + Math.floor(i / 5) * 37;
      const filled = ((seed * (i + 7)) % 3) !== 0;
      return `<rect x="${gx}" y="${gy}" width="65" height="28" rx="6" fill="hsl(${(hue + i * 18) % 360},${filled ? sat : 10}%,${filled ? lit - 15 : 12}%)" opacity="${filled ? 0.7 : 0.3}"/>`;
    }).join("")}
    <!-- Bottom controls -->
    <rect x="280" y="405" width="100" height="32" rx="16" fill="hsl(${hue},20%,15%)" stroke="hsl(${hue},15%,25%)" stroke-width="1"/>
    <rect x="400" y="405" width="120" height="32" rx="16" fill="url(#accent)"/>
    <text x="460" y="425" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">Start Game</text>
  </svg>`;
}

function generateOtherLayout(name: string, h: number, desc: string): string {
  const [hue, sat, lit] = hashColor(name);
  const hue2 = (hue + 45) % 360;
  const bgHue = (hue + 170) % 360;
  const seed = hashStr(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${bgHue},18%,10%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue},22%,6%)"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},${sat}%,${lit}%)"/>
        <stop offset="100%" stop-color="hsl(${hue2},${sat}%,${lit - 5}%)"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <!-- Header -->
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bgHue},18%,11%)"/>
    <text x="30" y="32" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="white">${name.slice(0, 16)}</text>
    <rect x="680" y="14" width="90" height="24" rx="12" fill="url(#accent)" opacity="0.8"/>
    <text x="725" y="30" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">+ New</text>
    <!-- Card grid -->
    ${[0, 1, 2, 3, 4, 5].map(i => {
      const cx = 25 + (i % 3) * 260;
      const cy = 70 + Math.floor(i / 3) * 195;
      return `<rect x="${cx}" y="${cy}" width="240" height="175" rx="12" fill="hsl(${bgHue},15%,13%)" stroke="hsl(${bgHue},15%,20%)" stroke-width="1"/>
        <rect x="${cx + 15}" y="${cy + 15}" width="210" height="70" rx="8" fill="hsl(${(hue + i * 30) % 360},${sat - 20}%,${lit - 15}%)" opacity="0.3"/>
        <circle cx="${cx + 40}" cy="${cy + 50}" r="15" fill="hsl(${(hue + i * 30) % 360},${sat}%,${lit}%)" opacity="0.6"/>
        <rect x="${cx + 15}" y="${cy + 100}" width="${120 + ((seed * (i + 1)) % 80)}" height="9" rx="3" fill="hsl(${bgHue},10%,30%)"/>
        <rect x="${cx + 15}" y="${cy + 118}" width="${80 + ((seed * (i + 3)) % 100)}" height="7" rx="3" fill="hsl(${bgHue},10%,20%)"/>
        <rect x="${cx + 15}" y="${cy + 145}" width="55" height="18" rx="9" fill="url(#accent)" opacity="0.6"/>
        <text x="${cx + 42}" y="${cy + 158}" font-family="system-ui,sans-serif" font-size="8" fill="white" text-anchor="middle">Open</text>
        <rect x="${cx + 175}" y="${cy + 145}" width="45" height="18" rx="9" fill="hsl(${bgHue},12%,18%)" stroke="hsl(${bgHue},12%,25%)" stroke-width="1"/>`;
    }).join("")}
  </svg>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 50, 200);
    const offset = body.offset || 0;

    // Fetch listings that have pool screenshots or empty screenshots
    const { data: listings, error: fetchErr } = await supabase
      .from("listings")
      .select("id, title, category, description")
      .eq("status", "live")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) throw fetchErr;
    if (!listings?.length) {
      return new Response(JSON.stringify({ message: "No more listings", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    let errors = 0;

    for (const listing of listings) {
      try {
        const layoutFn = CATEGORY_LAYOUTS[listing.category] || CATEGORY_LAYOUTS.other;
        const svgContent = layoutFn(listing.title, hashStr(listing.title), listing.description || "");

        // Generate a second variant with modified name for variety
        const svgContent2 = layoutFn(listing.title + "-v2", hashStr(listing.title + "-v2"), listing.description || "");

        const safeName = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
        const ts = Date.now();

        // Upload both SVGs
        const screenshots: string[] = [];
        for (let i = 0; i < 2; i++) {
          const svg = i === 0 ? svgContent : svgContent2;
          const filePath = `unique/${safeName}-${i + 1}-${ts}.svg`;
          const encoder = new TextEncoder();
          const svgBytes = encoder.encode(svg);

          const { error: uploadErr } = await supabase.storage
            .from("listing-screenshots")
            .upload(filePath, svgBytes, {
              contentType: "image/svg+xml",
              upsert: false,
            });

          if (uploadErr) {
            console.error(`Upload error for ${listing.title}:`, uploadErr);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("listing-screenshots")
            .getPublicUrl(filePath);
          screenshots.push(urlData.publicUrl);
        }

        if (screenshots.length > 0) {
          const { error: updateErr } = await supabase
            .from("listings")
            .update({ screenshots })
            .eq("id", listing.id);

          if (updateErr) {
            console.error(`Update error for ${listing.title}:`, updateErr);
            errors++;
          } else {
            updated++;
          }
        } else {
          errors++;
        }
      } catch (e) {
        console.error(`Error processing ${listing.title}:`, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${listings.length} listings: ${updated} updated, ${errors} errors`,
      processed: listings.length,
      updated,
      errors,
      next_offset: offset + batchSize,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-unique-screenshots error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
