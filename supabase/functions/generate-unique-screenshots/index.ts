import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hc(s: string, off = 0): [number, number, number] {
  const h = hashStr(s + String(off));
  return [h % 360, 55 + (h % 30), 45 + ((h >> 8) % 20)];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Extract keywords from description for contextual content
function keywords(desc: string, title: string): string[] {
  const words = (desc + " " + title).toLowerCase().split(/\W+/).filter(w => w.length > 3 && w.length < 15);
  const unique = [...new Set(words)];
  return unique.slice(0, 20);
}

// Generate contextual menu/feature names from title
function featureNames(title: string, seed: number): string[] {
  const bases = [
    ["Dashboard", "Analytics", "Reports", "Settings", "Users", "Projects", "Teams", "Billing"],
    ["Overview", "Insights", "Campaigns", "Templates", "Integrations", "Logs", "Alerts", "API"],
    ["Home", "Explore", "Library", "Favorites", "History", "Search", "Profile", "Help"],
    ["Workspace", "Documents", "Calendar", "Tasks", "Notes", "Files", "Chat", "Activity"],
  ];
  return bases[seed % bases.length];
}

// Generate contextual metric names
function metricNames(title: string, seed: number): string[][] {
  const sets = [
    [["Revenue", "$"], ["Users", ""], ["Orders", ""], ["Growth", "%"]],
    [["MRR", "$"], ["Churn", "%"], ["NPS", ""], ["LTV", "$"]],
    [["Visitors", ""], ["Signups", ""], ["Conversion", "%"], ["Retention", "%"]],
    [["Downloads", ""], ["Active", ""], ["Sessions", ""], ["Rating", "★"]],
    [["Requests", ""], ["Latency", "ms"], ["Uptime", "%"], ["Errors", ""]],
  ];
  return sets[seed % sets.length];
}

function metricVal(seed: number, i: number, prefix: string, suffix: string): string {
  const v = ((seed * (i + 7) * 13) % 9000) + 100;
  if (suffix === "%") return `${(v % 98) + 1}%`;
  if (suffix === "★") return `${(v % 4) + 1}.${v % 10}`;
  if (suffix === "ms") return `${v % 500}ms`;
  if (prefix === "$") return `$${(v * 10).toLocaleString()}`;
  return v.toLocaleString();
}

// ===== SAAS LAYOUTS (5 variants) =====

function saas_dashboard(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const h2 = (h + 30) % 360; const bg = (h + 180) % 360;
  const features = featureNames(name, seed);
  const metrics = metricNames(name, seed);
  const bars = Array.from({ length: 7 }, (_, i) => 30 + ((seed * (i + 1) * 7) % 70));
  const sideW = 160 + (seed % 40);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${bg},15%,12%)"/><stop offset="100%" stop-color="hsl(${bg},20%,8%)"/></linearGradient>
      <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)"/><stop offset="100%" stop-color="hsl(${h2},${s}%,${l - 10}%)"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <rect x="0" y="0" width="${sideW}" height="450" fill="hsl(${bg},18%,10%)"/>
    <rect x="12" y="15" width="${sideW - 24}" height="28" rx="6" fill="url(#ac)" opacity="0.9"/>
    <text x="${sideW / 2}" y="34" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="white" text-anchor="middle">${esc(name.slice(0, 14))}</text>
    ${features.slice(0, 7).map((f, i) => `
      <rect x="16" y="${60 + i * 32}" width="${60 + ((seed * (i + 1)) % 70)}" height="10" rx="3" fill="hsl(${bg},10%,${i === seed % 7 ? 40 : 25}%)"/>
      ${i === seed % 7 ? `<rect x="8" y="${58 + i * 32}" width="3" height="14" rx="1.5" fill="hsl(${h},${s}%,${l}%)"/>` : ""}
      <text x="16" y="${71 + i * 32}" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,${i === seed % 7 ? 55 : 35}%)">${f}</text>
    `).join("")}
    ${metrics.map(([label, pfx], i) => {
      const cx = sideW + 10 + i * ((800 - sideW - 20) / 4);
      const w = (800 - sideW - 20) / 4 - 10;
      return `<rect x="${cx}" y="15" width="${w}" height="60" rx="8" fill="hsl(${bg},15%,14%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
        <text x="${cx + 12}" y="36" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,50%)">${label}</text>
        <text x="${cx + 12}" y="60" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="white">${metricVal(seed, i, pfx, pfx)}</text>`;
    }).join("")}
    <rect x="${sideW + 10}" y="90" width="${(800 - sideW - 20) * 0.6}" height="170" rx="8" fill="hsl(${bg},15%,14%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
    <text x="${sideW + 25}" y="115" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">${esc(name)} Overview</text>
    ${bars.map((bh, i) => `<rect x="${sideW + 30 + i * 48}" y="${240 - bh}" width="28" height="${bh}" rx="4" fill="url(#ac)" opacity="${0.4 + (i % 4) * 0.15}"/>`).join("")}
    <rect x="${sideW + 10 + (800 - sideW - 20) * 0.62}" y="90" width="${(800 - sideW - 20) * 0.38 - 10}" height="170" rx="8" fill="hsl(${bg},15%,14%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
    <text x="${sideW + 15 + (800 - sideW - 20) * 0.62}" y="115" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Activity</text>
    ${[0,1,2,3,4].map(i => `<rect x="${sideW + 15 + (800 - sideW - 20) * 0.62}" y="${130 + i * 25}" width="${80 + ((seed * i) % 80)}" height="8" rx="3" fill="hsl(${bg},10%,22%)"/>
      <circle cx="${sideW + (800 - sideW - 20) - 15}" cy="${134 + i * 25}" r="4" fill="hsl(${(h + i * 50) % 360},${s}%,${l}%)"/>`).join("")}
    ${[0,1].map(i => {
      const bx = sideW + 10 + i * ((800 - sideW - 20) / 2);
      const bw = (800 - sideW - 20) / 2 - 10;
      return `<rect x="${bx}" y="275" width="${bw}" height="160" rx="8" fill="hsl(${bg},15%,14%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
        <text x="${bx + 15}" y="300" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="white">${i === 0 ? "Performance" : "Distribution"}</text>
        ${i === 0 ? [0,1,2].map(j => `<rect x="${bx + 15}" y="${315 + j * 22}" width="${bw - 30}" height="6" rx="3" fill="hsl(${bg},10%,20%)"/>
          <rect x="${bx + 15}" y="${315 + j * 22}" width="${(bw - 30) * (0.3 + ((seed * (j + 1)) % 60) / 100)}" height="6" rx="3" fill="hsl(${(h + j * 40) % 360},${s}%,${l}%)"/>`).join("") :
        `<circle cx="${bx + bw / 3}" cy="380" r="45" fill="none" stroke="url(#ac)" stroke-width="14" stroke-dasharray="${55 + seed % 45} 250" opacity="0.8"/>
         <circle cx="${bx + bw / 3}" cy="380" r="45" fill="none" stroke="hsl(${h2},${s}%,${l}%)" stroke-width="14" stroke-dasharray="${30 + seed % 30} 250" stroke-dashoffset="-${55 + seed % 45}" opacity="0.6"/>
         ${[0,1,2].map(j => `<rect x="${bx + bw * 0.55}" y="${345 + j * 22}" width="${50 + seed % 40}" height="7" rx="3" fill="hsl(${bg},10%,22%)"/>`).join("")}`}`;
    }).join("")}
  </svg>`;
}

function saas_kanban(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 190) % 360;
  const cols = ["To Do", "In Progress", "Review", "Done"];
  const cardCounts = [3, 2, 2, 1];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${bg},15%,11%)"/><stop offset="100%" stop-color="hsl(${bg},18%,7%)"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,13%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <rect x="650" y="12" width="70" height="24" rx="6" fill="hsl(${h},${s}%,${l}%)" opacity="0.85"/>
    <text x="685" y="28" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="white" text-anchor="middle">+ Task</text>
    <rect x="730" y="12" width="50" height="24" rx="6" fill="hsl(${bg},12%,20%)"/>
    <text x="755" y="28" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,55%)" text-anchor="middle">Filter</text>
    ${cols.map((col, ci) => {
      const cx = 15 + ci * 195;
      const cards = cardCounts[ci];
      const colColor = ci === 3 ? `hsl(${(h + 120) % 360},${s}%,${l}%)` : ci === 1 ? `hsl(${h},${s}%,${l}%)` : ci === 2 ? `hsl(${(h + 40) % 360},${s}%,${l}%)` : `hsl(${bg},10%,40%)`;
      return `<rect x="${cx}" y="58" width="180" height="382" rx="10" fill="hsl(${bg},14%,10%)" stroke="hsl(${bg},14%,18%)" stroke-width="1"/>
        <rect x="${cx + 10}" y="68" width="6" height="6" rx="3" fill="${colColor}"/>
        <text x="${cx + 22}" y="76" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="hsl(${bg},10%,60%)">${col}</text>
        <text x="${cx + 160}" y="76" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,35%)">${cards}</text>
        ${Array.from({ length: cards }, (_, ki) => {
          const cy = 90 + ki * 95;
          const tagHue = (h + (ci * 30 + ki * 60)) % 360;
          return `<rect x="${cx + 10}" y="${cy}" width="160" height="80" rx="8" fill="hsl(${bg},14%,15%)" stroke="hsl(${bg},14%,22%)" stroke-width="1"/>
            <rect x="${cx + 18}" y="${cy + 10}" width="${60 + ((seed * (ci + ki + 1)) % 50)}" height="7" rx="2" fill="hsl(${bg},10%,40%)"/>
            <rect x="${cx + 18}" y="${cy + 24}" width="${80 + ((seed * (ci + ki + 3)) % 60)}" height="6" rx="2" fill="hsl(${bg},10%,25%)"/>
            <rect x="${cx + 18}" y="${cy + 36}" width="${40 + ((seed * ci) % 60)}" height="6" rx="2" fill="hsl(${bg},10%,22%)"/>
            <rect x="${cx + 18}" y="${cy + 55}" width="40" height="14" rx="4" fill="hsl(${tagHue},${s - 20}%,${l - 15}%)" opacity="0.5"/>
            <text x="${cx + 38}" y="${cy + 65}" font-family="system-ui,sans-serif" font-size="7" fill="hsl(${tagHue},${s}%,${l + 10}%)" text-anchor="middle">${["Bug", "Feature", "UX", "API", "Ops", "Docs"][(seed * ci + ki) % 6]}</text>
            <circle cx="${cx + 150}" cy="${cy + 62}" r="8" fill="hsl(${(tagHue + 90) % 360},${s - 10}%,${l - 5}%)" opacity="0.5"/>`;
        }).join("")}`;
    }).join("")}
  </svg>`;
}

function saas_table(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 185) % 360;
  const colHeaders = [["Name", "Status", "Date", "Revenue", "Actions"], ["Email", "Plan", "Created", "Usage", ""], ["Title", "Priority", "Assignee", "Due", ""], ["Endpoint", "Method", "Calls", "Latency", "Status"]][seed % 4];
  const statuses = ["Active", "Pending", "Paused", "Trial", "Error"];
  const statusColors = [120, h, 40, 200, 0];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},15%,9%)"/>
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bg},16%,12%)"/>
    <text x="25" y="32" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 20))}</text>
    <rect x="550" y="14" width="120" height="24" rx="12" fill="hsl(${bg},12%,18%)" stroke="hsl(${bg},12%,28%)" stroke-width="1"/>
    <text x="580" y="30" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,45%)">🔍 Search...</text>
    <rect x="690" y="14" width="85" height="24" rx="6" fill="hsl(${h},${s}%,${l}%)"/>
    <text x="732" y="30" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="white" text-anchor="middle">+ Add New</text>
    <!-- Table header -->
    <rect x="20" y="60" width="760" height="32" rx="6" fill="hsl(${bg},14%,14%)"/>
    ${colHeaders.map((ch, i) => `<text x="${40 + i * 155}" y="81" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="hsl(${bg},10%,50%)">${ch}</text>`).join("")}
    <!-- Rows -->
    ${Array.from({ length: 8 }, (_, ri) => {
      const ry = 98 + ri * 42;
      const si = (seed + ri) % statuses.length;
      return `<rect x="20" y="${ry}" width="760" height="38" rx="0" fill="hsl(${bg},14%,${ri % 2 === 0 ? 11 : 10}%)" ${ri === seed % 8 ? `stroke="hsl(${h},${s}%,${l}%)" stroke-width="1" opacity="1"` : ""}/>
        <rect x="40" y="${ry + 12}" width="${60 + ((seed * (ri + 1)) % 60)}" height="8" rx="3" fill="hsl(${bg},10%,28%)"/>
        <rect x="${40 + 155}" y="${ry + 10}" width="50" height="16" rx="8" fill="hsl(${statusColors[si]},${s - 20}%,${l - 20}%)" opacity="0.4"/>
        <text x="${65 + 155}" y="${ry + 22}" font-family="system-ui,sans-serif" font-size="7" fill="hsl(${statusColors[si]},${s}%,${l + 5}%)" text-anchor="middle">${statuses[si]}</text>
        <rect x="${40 + 310}" y="${ry + 14}" width="${40 + ((seed * ri) % 40)}" height="6" rx="3" fill="hsl(${bg},10%,22%)"/>
        <rect x="${40 + 465}" y="${ry + 14}" width="${50 + ((seed * (ri + 3)) % 50)}" height="6" rx="3" fill="hsl(${bg},10%,22%)"/>
        <circle cx="${40 + 635}" cy="${ry + 18}" r="3" fill="hsl(${bg},10%,30%)"/>`;
    }).join("")}
    <rect x="20" y="430" width="760" height="1" fill="hsl(${bg},10%,18%)"/>
  </svg>`;
}

function saas_settings(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 175) % 360;
  const tabs = ["General", "Team", "Billing", "Security", "Integrations"];
  const activeTab = seed % tabs.length;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},15%,9%)"/>
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bg},16%,12%)"/>
    <text x="25" y="32" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 16))} Settings</text>
    <!-- Sidebar tabs -->
    <rect x="0" y="50" width="180" height="400" fill="hsl(${bg},16%,10%)"/>
    ${tabs.map((t, i) => `
      <rect x="0" y="${60 + i * 38}" width="180" height="34" fill="${i === activeTab ? `hsl(${bg},14%,15%)` : "transparent"}"/>
      ${i === activeTab ? `<rect x="0" y="${60 + i * 38}" width="3" height="34" fill="hsl(${h},${s}%,${l}%)"/>` : ""}
      <text x="20" y="${82 + i * 38}" font-family="system-ui,sans-serif" font-size="11" fill="hsl(${bg},10%,${i === activeTab ? 70 : 40}%)">${t}</text>
    `).join("")}
    <!-- Content area with form fields -->
    <text x="210" y="85" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="white">${tabs[activeTab]}</text>
    <text x="210" y="105" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bg},10%,45%)">Manage your ${tabs[activeTab].toLowerCase()} preferences</text>
    ${[0,1,2,3].map(i => {
      const fy = 130 + i * 75;
      const labels = [["Display Name", name], ["Email", "team@company.com"], ["Timezone", "UTC-5 Eastern"], ["Language", "English (US)"]][i];
      return `<text x="210" y="${fy + 5}" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="hsl(${bg},10%,55%)">${labels[0]}</text>
        <rect x="210" y="${fy + 12}" width="360" height="34" rx="6" fill="hsl(${bg},14%,13%)" stroke="hsl(${bg},14%,22%)" stroke-width="1"/>
        <text x="222" y="${fy + 34}" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bg},10%,50%)">${esc(labels[1])}</text>`;
    }).join("")}
    <!-- Toggle switches -->
    ${[0,1].map(i => {
      const ty = 140 + i * 40;
      const on = (seed + i) % 2 === 0;
      return `<rect x="610" y="${ty}" width="150" height="30" rx="6" fill="hsl(${bg},14%,13%)"/>
        <text x="620" y="${ty + 19}" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,50%)">${["Notifications", "Dark Mode"][i]}</text>
        <rect x="${720}" y="${ty + 7}" width="28" height="16" rx="8" fill="${on ? `hsl(${h},${s}%,${l}%)` : `hsl(${bg},10%,25%)`}"/>
        <circle cx="${on ? 740 : 728}" cy="${ty + 15}" r="6" fill="white"/>`;
    }).join("")}
    <rect x="210" y="400" width="100" height="32" rx="6" fill="hsl(${h},${s}%,${l}%)"/>
    <text x="260" y="420" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">Save</text>
  </svg>`;
}

function saas_analytics(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 195) % 360;
  const linePoints = Array.from({ length: 12 }, (_, i) => {
    const x = 50 + i * 58; const y = 220 - ((seed * (i + 3) * 11) % 120) - 30;
    return `${x},${y}`;
  }).join(" ");
  const linePoints2 = Array.from({ length: 12 }, (_, i) => {
    const x = 50 + i * 58; const y = 240 - ((seed * (i + 7) * 9) % 100) - 20;
    return `${x},${y}`;
  }).join(" ");
  const metrics = metricNames(name, seed + 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${bg},14%,11%)"/><stop offset="100%" stop-color="hsl(${bg},18%,7%)"/></linearGradient>
      <linearGradient id="fill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0.3"/><stop offset="100%" stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bg},15%,12%)"/>
    <text x="25" y="32" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 16))} Analytics</text>
    ${["7d", "30d", "90d", "1y"].map((p, i) => `<rect x="${550 + i * 55}" y="16" width="45" height="20" rx="4" fill="hsl(${bg},12%,${i === 1 ? 22 : 16}%)" ${i === 1 ? `stroke="hsl(${h},${s}%,${l}%)" stroke-width="1"` : ""}/>
      <text x="${572 + i * 55}" y="30" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,${i === 1 ? 70 : 40}%)" text-anchor="middle">${p}</text>`).join("")}
    ${metrics.map(([label, pfx], i) => {
      const cx = 20 + i * 195;
      return `<rect x="${cx}" y="60" width="180" height="60" rx="8" fill="hsl(${bg},14%,13%)" stroke="hsl(${bg},14%,19%)" stroke-width="1"/>
        <text x="${cx + 14}" y="82" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,48%)">${label}</text>
        <text x="${cx + 14}" y="106" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">${metricVal(seed + 2, i, pfx, pfx)}</text>`;
    }).join("")}
    <!-- Line chart -->
    <rect x="20" y="135" width="520" height="200" rx="8" fill="hsl(${bg},14%,12%)" stroke="hsl(${bg},14%,18%)" stroke-width="1"/>
    <text x="35" y="158" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Trend</text>
    <polygon points="${linePoints},${50 + 11 * 58},320 50,320" fill="url(#fill1)"/>
    <polyline points="${linePoints}" fill="none" stroke="hsl(${h},${s}%,${l}%)" stroke-width="2.5"/>
    <polyline points="${linePoints2}" fill="none" stroke="hsl(${(h + 60) % 360},${s - 10}%,${l}%)" stroke-width="1.5" stroke-dasharray="4 3"/>
    <!-- Heatmap / bar chart right -->
    <rect x="555" y="135" width="225" height="200" rx="8" fill="hsl(${bg},14%,12%)" stroke="hsl(${bg},14%,18%)" stroke-width="1"/>
    <text x="570" y="158" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Breakdown</text>
    ${Array.from({ length: 6 }, (_, i) => {
      const bw = 30 + ((seed * (i + 2)) % 150);
      return `<rect x="570" y="${170 + i * 26}" width="${bw}" height="14" rx="4" fill="hsl(${(h + i * 20) % 360},${s - 10}%,${l - 10}%)" opacity="0.6"/>`;
    }).join("")}
    <!-- Bottom row -->
    ${[0,1,2].map(i => {
      const bx = 20 + i * 260;
      return `<rect x="${bx}" y="350" width="240" height="85" rx="8" fill="hsl(${bg},14%,12%)" stroke="hsl(${bg},14%,18%)" stroke-width="1"/>
        <rect x="${bx + 12}" y="${365}" width="${60 + (seed * (i + 1)) % 50}" height="8" rx="3" fill="hsl(${bg},10%,28%)"/>
        <rect x="${bx + 12}" y="${380}" width="${100 + (seed * i) % 80}" height="6" rx="3" fill="hsl(${bg},10%,20%)"/>
        <rect x="${bx + 12}" y="${392}" width="${70 + (seed * (i + 2)) % 60}" height="6" rx="3" fill="hsl(${bg},10%,18%)"/>
        <rect x="${bx + 12}" y="${412}" width="45" height="14" rx="4" fill="hsl(${(h + i * 45) % 360},${s - 15}%,${l - 10}%)" opacity="0.5"/>`;
    }).join("")}
  </svg>`;
}

// ===== AI LAYOUTS (5 variants) =====

function ai_chat(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 200) % 360;
  const kw = keywords(desc, name);
  const topics = [
    [`Help me with ${kw[0] || "this task"}`, `Here's my analysis of ${kw[0] || "your request"}...`, `The key findings show a ${(seed % 40) + 10}% improvement`],
    [`Summarize the ${kw[1] || "document"}`, `Based on the content, here are the main points:`, `1. ${kw[2] || "Important"} trend detected`],
    [`Create a ${kw[0] || "report"} for Q${(seed % 4) + 1}`, `I've generated your ${kw[0] || "report"} with ${seed % 12 + 3} sections`, `Would you like me to export as PDF?`],
    [`What's the best approach for ${kw[1] || "optimization"}?`, `I recommend ${seed % 2 === 0 ? "a phased" : "an iterative"} approach:`, `Step 1: Analyze current ${kw[0] || "metrics"}`],
  ];
  const convo = topics[seed % topics.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${bg},20%,8%)"/><stop offset="100%" stop-color="hsl(${bg},25%,5%)"/></linearGradient>
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)"/><stop offset="100%" stop-color="hsl(${(h + 40) % 360},${s}%,${l - 10}%)"/></linearGradient>
      <radialGradient id="orb"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0.12"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <circle cx="${300 + seed % 200}" cy="${80 + seed % 120}" r="180" fill="url(#orb)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},20%,10%)" opacity="0.9"/>
    <circle cx="28" cy="24" r="10" fill="url(#gl)"/>
    <text x="46" y="28" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <rect x="680" y="12" width="28" height="24" rx="6" fill="hsl(${bg},15%,18%)"/>
    <rect x="715" y="12" width="60" height="24" rx="6" fill="url(#gl)" opacity="0.7"/>
    <text x="745" y="28" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">New</text>
    <!-- Sidebar -->
    <rect x="0" y="48" width="170" height="402" fill="hsl(${bg},18%,8%)"/>
    ${Array.from({ length: 5 }, (_, i) => `
      <rect x="10" y="${60 + i * 40}" width="150" height="30" rx="6" fill="hsl(${bg},15%,${i === 0 ? 16 : 11}%)" ${i === 0 ? `stroke="hsl(${h},${s}%,${l}%)" stroke-width="1"` : ""}/>
      <rect x="20" y="${68 + i * 40}" width="${60 + ((seed * (i + 1)) % 70)}" height="6" rx="2" fill="hsl(${bg},10%,${i === 0 ? 40 : 25}%)"/>
      <rect x="20" y="${78 + i * 40}" width="${40 + ((seed * (i + 3)) % 40)}" height="4" rx="2" fill="hsl(${bg},10%,18%)"/>
    `).join("")}
    <!-- Chat messages -->
    <rect x="350" y="70" width="280" height="35" rx="14" fill="hsl(${h},${s - 25}%,${l - 15}%)" opacity="0.8"/>
    <text x="365" y="92" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${h},10%,88%)">${esc(convo[0].slice(0, 40))}</text>
    <circle cx="195" y="120" r="12" fill="url(#gl)" opacity="0.6"/>
    <rect x="195" y="110" width="380" height="55" rx="14" fill="hsl(${bg},15%,14%)"/>
    <text x="215" y="132" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bg},10%,70%)">${esc(convo[1].slice(0, 50))}</text>
    <text x="215" y="150" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,50%)">${esc(convo[2].slice(0, 45))}</text>
    <rect x="380" y="185" width="250" height="30" rx="14" fill="hsl(${h},${s - 25}%,${l - 15}%)" opacity="0.8"/>
    <rect x="195" y="235" width="400" height="80" rx="14" fill="hsl(${bg},15%,14%)"/>
    <circle cx="208" cy="252" r="10" fill="url(#gl)" opacity="0.5"/>
    ${[0,1,2].map(i => `<rect x="225" y="${250 + i * 20}" width="${180 + (seed * (i + 1)) % 150}" height="7" rx="3" fill="hsl(${bg},10%,${25 - i * 3}%)"/>`).join("")}
    ${[0,1,2].map(i => `<circle cx="${208 + i * 16}" cy="345" r="4" fill="hsl(${h},${s}%,${l}%)" opacity="${0.3 + i * 0.25}"/>`).join("")}
    <rect x="185" y="400" width="590" height="38" rx="19" fill="hsl(${bg},15%,14%)" stroke="hsl(${bg},15%,22%)" stroke-width="1"/>
    <text x="210" y="424" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${bg},10%,35%)">Ask ${esc(name.slice(0, 12))} anything...</text>
    <circle cx="755" cy="419" r="14" fill="url(#gl)" opacity="0.6"/>
  </svg>`;
}

function ai_pipeline(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 210) % 360;
  const steps = [["Input", "📄"], ["Process", "⚙️"], ["Analyze", "🧠"], ["Output", "📊"]][0];
  const pipeSteps = ["Ingest", "Clean", "Transform", "Enrich", "Classify", "Export"];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},18%,7%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,11%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <rect x="600" y="12" width="80" height="24" rx="6" fill="hsl(${h},${s}%,${l}%)" opacity="0.8"/>
    <text x="640" y="28" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">Run All</text>
    <!-- Pipeline flow -->
    ${pipeSteps.map((step, i) => {
      const cx = 50 + i * 125;
      const active = i <= (seed % pipeSteps.length);
      return `<rect x="${cx}" y="70" width="105" height="55" rx="10" fill="hsl(${bg},15%,${active ? 16 : 11}%)" stroke="hsl(${active ? h : bg},${active ? s : 12}%,${active ? l : 20}%)" stroke-width="${active ? 2 : 1}"/>
        <text x="${cx + 52}" y="95" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="hsl(${bg},10%,${active ? 70 : 40}%)" text-anchor="middle">${step}</text>
        <text x="${cx + 52}" y="112" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,${active ? 45 : 25}%)" text-anchor="middle">${active ? "✓ Done" : "Waiting"}</text>
        ${i < pipeSteps.length - 1 ? `<line x1="${cx + 110}" y1="97" x2="${cx + 125}" y2="97" stroke="hsl(${active ? h : bg},${active ? s - 20 : 10}%,${active ? l : 25}%)" stroke-width="2"/>` : ""}`;
    }).join("")}
    <!-- Data preview -->
    <rect x="20" y="145" width="480" height="280" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="35" y="170" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Data Preview</text>
    <rect x="35" y="185" width="450" height="22" fill="hsl(${bg},14%,14%)"/>
    ${["ID", "Input", "Score", "Label", "Confidence"].map((col, i) => `<text x="${50 + i * 92}" y="200" font-family="monospace" font-size="8" fill="hsl(${bg},10%,45%)">${col}</text>`).join("")}
    ${Array.from({ length: 8 }, (_, r) => `
      <rect x="35" y="${210 + r * 24}" width="450" height="22" fill="hsl(${bg},14%,${r % 2 === 0 ? 12 : 11}%)"/>
      ${[0,1,2,3,4].map(c => `<rect x="${50 + c * 92}" y="${216 + r * 24}" width="${30 + ((seed * (r + c + 1)) % 50)}" height="6" rx="2" fill="hsl(${bg},10%,22%)"/>`).join("")}
    `).join("")}
    <!-- Metrics panel -->
    <rect x="520" y="145" width="260" height="130" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="535" y="170" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Model Metrics</text>
    ${[["Accuracy", 85 + seed % 14], ["Precision", 78 + seed % 20], ["Recall", 80 + seed % 18], ["F1 Score", 82 + seed % 16]].map(([label, val], i) => `
      <text x="535" y="${195 + i * 24}" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,45%)">${label}</text>
      <rect x="610" y="${188 + i * 24}" width="150" height="8" rx="4" fill="hsl(${bg},10%,18%)"/>
      <rect x="610" y="${188 + i * 24}" width="${(val as number) * 1.5}" height="8" rx="4" fill="hsl(${(h + i * 30) % 360},${s}%,${l}%)"/>
      <text x="770" y="${196 + i * 24}" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,55%)" text-anchor="end">${val}%</text>
    `).join("")}
    <!-- Logs -->
    <rect x="520" y="290" width="260" height="135" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="535" y="315" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Logs</text>
    ${Array.from({ length: 5 }, (_, i) => `
      <text x="535" y="${335 + i * 18}" font-family="monospace" font-size="7" fill="hsl(${i === 4 ? 50 : bg},${i === 4 ? 70 : 10}%,${i === 4 ? 60 : 35}%)">[${`0${i}`.slice(-2)}:${seed % 60}] ${["Processing batch...", "Tokens: " + (seed * (i + 1) % 5000), "Embedding complete", "Classification done", "⚠ Rate limit near"][i]}</text>
    `).join("")}
  </svg>`;
}

function ai_image_tool(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 205) % 360;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)"/><stop offset="100%" stop-color="hsl(${(h + 50) % 360},${s}%,${l}%)"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="hsl(${bg},18%,7%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,11%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <!-- Tools sidebar -->
    <rect x="0" y="48" width="55" height="402" fill="hsl(${bg},16%,9%)"/>
    ${["🖌", "✂", "🔲", "📐", "🎨", "💡", "↩"].map((icon, i) => `
      <rect x="8" y="${58 + i * 50}" width="38" height="38" rx="8" fill="hsl(${bg},14%,${i === seed % 7 ? 20 : 12}%)" ${i === seed % 7 ? `stroke="hsl(${h},${s}%,${l}%)" stroke-width="1"` : ""}/>
      <text x="27" y="${82 + i * 50}" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">${icon}</text>
    `).join("")}
    <!-- Canvas -->
    <rect x="70" y="60" width="500" height="340" rx="8" fill="hsl(${bg},12%,12%)" stroke="hsl(${bg},12%,22%)" stroke-width="1"/>
    <!-- Generated image placeholder with abstract shapes -->
    <rect x="90" y="80" width="460" height="300" rx="6" fill="hsl(${bg},14%,10%)"/>
    ${Array.from({ length: 8 }, (_, i) => {
      const x = 120 + ((seed * (i + 1) * 37) % 380);
      const y = 100 + ((seed * (i + 3) * 23) % 240);
      const sz = 30 + ((seed * (i + 5)) % 60);
      return i % 3 === 0 ? `<circle cx="${x}" cy="${y}" r="${sz / 2}" fill="hsl(${(h + i * 40) % 360},${s - 10}%,${l - 5}%)" opacity="0.4"/>` :
        i % 3 === 1 ? `<rect x="${x}" y="${y}" width="${sz}" height="${sz * 0.7}" rx="8" fill="hsl(${(h + i * 50) % 360},${s}%,${l}%)" opacity="0.3" transform="rotate(${(seed * i) % 30} ${x} ${y})"/>` :
        `<ellipse cx="${x}" cy="${y}" rx="${sz}" ry="${sz / 2}" fill="hsl(${(h + i * 35) % 360},${s - 15}%,${l + 5}%)" opacity="0.25"/>`;
    }).join("")}
    <!-- Right panel -->
    <rect x="585" y="60" width="200" height="340" rx="8" fill="hsl(${bg},14%,10%)" stroke="hsl(${bg},14%,18%)" stroke-width="1"/>
    <text x="600" y="85" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Prompt</text>
    <rect x="600" y="95" width="170" height="60" rx="6" fill="hsl(${bg},14%,14%)" stroke="hsl(${bg},14%,22%)" stroke-width="1"/>
    <text x="610" y="112" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,45%)">A professional ${esc(name.slice(0, 10))}</text>
    <text x="610" y="125" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,40%)">design with modern...</text>
    <text x="600" y="180" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="hsl(${bg},10%,55%)">Style</text>
    ${["Realistic", "Abstract", "Minimal"].map((st, i) => `<rect x="${600 + i * 58}" y="188" width="52" height="22" rx="6" fill="hsl(${bg},14%,${i === seed % 3 ? 22 : 14}%)" ${i === seed % 3 ? `stroke="hsl(${h},${s}%,${l}%)" stroke-width="1"` : ""}/>
      <text x="${626 + i * 58}" y="203" font-family="system-ui,sans-serif" font-size="7" fill="hsl(${bg},10%,${i === seed % 3 ? 70 : 40}%)" text-anchor="middle">${st}</text>`).join("")}
    <rect x="600" y="360" width="170" height="28" rx="6" fill="url(#gl)"/>
    <text x="685" y="378" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="white" text-anchor="middle">Generate</text>
    <!-- Bottom bar -->
    <rect x="70" y="410" width="500" height="30" fill="hsl(${bg},14%,10%)" rx="0 0 8 8"/>
    <text x="85" y="430" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,35%)">1024 × 1024  •  ${seed % 4 + 1} variations  •  Ready</text>
  </svg>`;
}

function ai_dashboard(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 195) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},18%,7%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,11%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <!-- Model cards -->
    ${["GPT-5", "Claude 4", "Gemini", "Llama"][seed % 4 === 0 ? 0 : 1] /* just for variety */}
    ${[0,1,2].map(i => {
      const cx = 20 + i * 260;
      const modelNames = [["Text Gen", "v2.1"], ["Vision", "v1.4"], ["Embed", "v3.0"], ["Code", "v2.0"]];
      const [mn, mv] = modelNames[(seed + i) % modelNames.length];
      return `<rect x="${cx}" y="60" width="240" height="80" rx="10" fill="hsl(${bg},15%,12%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
        <circle cx="${cx + 25}" cy="90" r="15" fill="hsl(${(h + i * 50) % 360},${s}%,${l}%)" opacity="0.5"/>
        <text x="${cx + 50}" y="88" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="white">${mn}</text>
        <text x="${cx + 50}" y="104" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,45%)">${mv} • ${((seed * (i + 1)) % 99) + 1}k calls today</text>
        <rect x="${cx + 180}" y="80" width="42" height="18" rx="9" fill="hsl(120,50%,25%)" opacity="0.5"/>
        <text x="${cx + 201}" y="93" font-family="system-ui,sans-serif" font-size="7" fill="hsl(120,70%,65%)" text-anchor="middle">Live</text>`;
    }).join("")}
    <!-- Usage chart -->
    <rect x="20" y="155" width="500" height="200" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="35" y="180" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">API Usage (24h)</text>
    ${Array.from({ length: 24 }, (_, i) => {
      const bh = 10 + ((seed * (i + 1) * 7) % 120);
      return `<rect x="${45 + i * 19}" y="${330 - bh}" width="12" height="${bh}" rx="2" fill="hsl(${h},${s}%,${l}%)" opacity="${0.3 + (bh / 130) * 0.7}"/>`;
    }).join("")}
    <!-- Right side stats -->
    <rect x="535" y="155" width="245" height="200" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="550" y="180" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Performance</text>
    ${[["Avg Latency", `${120 + seed % 400}ms`], ["Tokens/sec", `${40 + seed % 60}`], ["Error Rate", `${(seed % 5) / 10}%`], ["Queue Depth", `${seed % 50}`]].map(([label, val], i) => `
      <text x="550" y="${205 + i * 35}" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,45%)">${label}</text>
      <text x="760" y="${205 + i * 35}" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="white" text-anchor="end">${val}</text>
    `).join("")}
    <!-- Recent requests -->
    <rect x="20" y="370" width="760" height="65" rx="10" fill="hsl(${bg},15%,11%)" stroke="hsl(${bg},15%,18%)" stroke-width="1"/>
    <text x="35" y="395" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white">Recent Requests</text>
    ${[0,1,2,3].map(i => `<rect x="${35 + i * 185}" y="405" width="${90 + (seed * i) % 70}" height="7" rx="3" fill="hsl(${bg},10%,20%)"/>`).join("")}
  </svg>`;
}

function ai_workflow(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 190) % 360;
  const nodes = ["Start", "Parse", "AI Model", "Filter", "Notify", "Store"];
  const nodePositions = [[80, 200], [220, 120], [380, 200], [380, 330], [550, 150], [700, 250]];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},18%,7%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,11%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 16))} Workflow</text>
    <rect x="650" y="12" width="55" height="24" rx="6" fill="hsl(${h},${s}%,${l}%)"/>
    <text x="677" y="28" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">Deploy</text>
    <rect x="715" y="12" width="60" height="24" rx="6" fill="hsl(${bg},12%,20%)"/>
    <text x="745" y="28" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,50%)" text-anchor="middle">History</text>
    <!-- Grid background -->
    <g opacity="0.06" stroke="hsl(${bg},10%,40%)" stroke-width="0.5">
      ${Array.from({ length: 17 }, (_, i) => `<line x1="${i * 50}" y1="48" x2="${i * 50}" y2="450"/>`).join("")}
      ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${48 + i * 50}" x2="800" y2="${48 + i * 50}"/>`).join("")}
    </g>
    <!-- Connections -->
    <line x1="130" y1="210" x2="200" y2="145" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.5"/>
    <line x1="270" y1="145" x2="360" y2="210" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.5"/>
    <line x1="430" y1="210" x2="530" y2="165" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.5"/>
    <line x1="380" y1="240" x2="380" y2="310" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.5"/>
    <line x1="600" y1="165" x2="680" y2="240" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.5"/>
    <!-- Nodes -->
    ${nodes.map((n, i) => {
      const [x, y] = nodePositions[i];
      const active = i <= (seed % 4 + 1);
      return `<rect x="${x - 45}" y="${y - 25}" width="90" height="50" rx="12" fill="hsl(${bg},15%,${active ? 16 : 11}%)" stroke="hsl(${active ? (h + i * 30) % 360 : bg},${active ? s - 10 : 12}%,${active ? l : 20}%)" stroke-width="${active ? 2 : 1}"/>
        <text x="${x}" y="${y + 4}" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="hsl(${bg},10%,${active ? 75 : 40}%)" text-anchor="middle">${n}</text>
        ${active ? `<circle cx="${x + 35}" cy="${y - 18}" r="5" fill="hsl(120,60%,50%)" opacity="0.7"/>` : ""}`;
    }).join("")}
    <!-- Bottom panel -->
    <rect x="20" y="380" width="760" height="55" rx="10" fill="hsl(${bg},15%,10%)" stroke="hsl(${bg},15%,16%)" stroke-width="1"/>
    <text x="35" y="403" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="hsl(${bg},10%,55%)">Execution Log</text>
    <text x="35" y="420" font-family="monospace" font-size="8" fill="hsl(120,50%,50%)">✓ ${esc(name.slice(0, 10))} pipeline completed in ${(seed % 900) + 100}ms — ${seed % 500 + 50} items processed</text>
  </svg>`;
}

// ===== UTILITY LAYOUTS =====

function util_editor(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 160) % 360;
  const kw = keywords(desc, name);
  const codeVariants = [
    [`const ${kw[0] || "app"} = create${name.slice(0,8)}();`, `  .configure({ mode: "${kw[1] || "auto"}" })`, `  .addPlugin(${kw[2] || "core"})`, `  .build();`, "", `export default ${kw[0] || "app"};`],
    [`function process(input: string) {`, `  const result = transform(input);`, `  if (validate(result)) {`, `    return { ok: true, data: result };`, `  }`, `  return { ok: false, error: "Invalid" };`],
    [`import { ${name.slice(0,6)} } from './core';`, ``, `const config = {`, `  name: "${esc(name.slice(0,12))}"`, `  version: "${seed % 9}.${seed % 10}.0",`, `  features: ["${kw[0] || "core"}", "${kw[1] || "utils"}"]`],
  ];
  const code = codeVariants[seed % codeVariants.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},15%,8%)"/>
    <rect x="0" y="0" width="800" height="34" fill="hsl(${bg},15%,12%)"/>
    <rect x="0" y="0" width="130" height="34" fill="hsl(${bg},15%,16%)"/>
    <text x="65" y="21" font-family="monospace" font-size="10" fill="white" text-anchor="middle">${esc(name.slice(0, 12))}.ts</text>
    <rect x="130" y="0" width="100" height="34" fill="hsl(${bg},15%,13%)"/>
    <text x="180" y="21" font-family="monospace" font-size="10" fill="hsl(${bg},10%,40%)" text-anchor="middle">types.ts</text>
    <rect x="230" y="0" width="90" height="34" fill="hsl(${bg},15%,11%)"/>
    <text x="275" y="21" font-family="monospace" font-size="10" fill="hsl(${bg},10%,35%)" text-anchor="middle">test.ts</text>
    <rect x="0" y="34" width="38" height="396" fill="hsl(${bg},15%,9%)"/>
    ${code.map((_, i) => `<text x="26" y="${56 + i * 20}" font-family="monospace" font-size="10" fill="hsl(${bg},10%,28%)" text-anchor="end">${i + 1}</text>`).join("")}
    ${code.map((line, i) => `<text x="48" y="${56 + i * 20}" font-family="monospace" font-size="10" fill="hsl(${bg},10%,65%)">${esc(line)}</text>`).join("")}
    <rect x="420" y="34" width="380" height="396" fill="hsl(${bg},12%,7%)" stroke="hsl(${bg},15%,16%)" stroke-width="1"/>
    <rect x="420" y="34" width="380" height="28" fill="hsl(${bg},15%,10%)"/>
    <text x="438" y="52" font-family="monospace" font-size="10" fill="hsl(${h},${s}%,${l}%)">▶ Terminal</text>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="435" y="${75 + i * 28}" width="${100 + ((seed * (i + 1)) % 220)}" height="8" rx="3" fill="hsl(${bg},10%,${14 + (i % 3) * 3}%)"/>`).join("")}
    <text x="435" y="${75 + 8 * 28 + 15}" font-family="monospace" font-size="9" fill="hsl(120,50%,50%)">✓ Build successful — ${(seed % 90) + 10}ms</text>
    <rect x="0" y="430" width="800" height="20" fill="hsl(${h},${s}%,${l - 5}%)"/>
    <text x="12" y="443" font-family="monospace" font-size="9" fill="white">${esc(name)} — Ready</text>
    <text x="700" y="443" font-family="monospace" font-size="9" fill="white">UTF-8  TS</text>
  </svg>`;
}

function util_converter(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 170) % 360;
  const formats = [["JSON", "YAML"], ["CSV", "JSON"], ["Markdown", "HTML"], ["XML", "JSON"], ["PNG", "WebP"]][seed % 5];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},15%,8%)"/>
    <rect x="0" y="0" width="800" height="50" fill="hsl(${bg},16%,12%)"/>
    <text x="25" y="32" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="white">${esc(name.slice(0, 20))}</text>
    <!-- Left panel - Input -->
    <rect x="20" y="65" width="365" height="320" rx="10" fill="hsl(${bg},14%,11%)" stroke="hsl(${bg},14%,20%)" stroke-width="1"/>
    <rect x="20" y="65" width="365" height="30" rx="10 10 0 0" fill="hsl(${bg},14%,14%)"/>
    <text x="35" y="85" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="hsl(${bg},10%,55%)">Input (${formats[0]})</text>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="35" y="${105 + i * 25}" width="${80 + ((seed * (i + 1)) % 240)}" height="8" rx="3" fill="hsl(${bg},10%,${16 + (i % 3) * 2}%)"/>`).join("")}
    <!-- Arrow -->
    <rect x="388" y="195" width="24" height="40" rx="6" fill="hsl(${h},${s}%,${l}%)" opacity="0.8"/>
    <text x="400" y="221" font-family="system-ui,sans-serif" font-size="16" fill="white" text-anchor="middle">→</text>
    <!-- Right panel - Output -->
    <rect x="415" y="65" width="365" height="320" rx="10" fill="hsl(${bg},14%,11%)" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="1"/>
    <rect x="415" y="65" width="365" height="30" rx="10 10 0 0" fill="hsl(${bg},14%,14%)"/>
    <text x="430" y="85" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="hsl(${h},${s}%,${l}%)">Output (${formats[1]})</text>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="430" y="${105 + i * 25}" width="${60 + ((seed * (i + 3)) % 260)}" height="8" rx="3" fill="hsl(${bg},10%,${16 + (i % 4) * 2}%)"/>`).join("")}
    <!-- Bottom actions -->
    <rect x="20" y="400" width="120" height="35" rx="8" fill="hsl(${h},${s}%,${l}%)"/>
    <text x="80" y="422" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">Convert</text>
    <rect x="155" y="400" width="100" height="35" rx="8" fill="hsl(${bg},14%,16%)" stroke="hsl(${bg},14%,25%)" stroke-width="1"/>
    <text x="205" y="422" font-family="system-ui,sans-serif" font-size="11" fill="hsl(${bg},10%,55%)" text-anchor="middle">Copy</text>
    <text x="680" y="422" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${bg},10%,35%)">Processed: ${seed % 500 + 50} lines</text>
  </svg>`;
}

// ===== LANDING LAYOUTS =====

function landing_hero(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const h2 = (h + 50) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${h},30%,8%)"/><stop offset="50%" stop-color="hsl(${h},25%,5%)"/><stop offset="100%" stop-color="hsl(${h2},20%,8%)"/></linearGradient>
      <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)"/><stop offset="100%" stop-color="hsl(${h2},${s}%,${l}%)"/></linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)" stop-opacity="0.12"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <ellipse cx="400" cy="150" rx="400" ry="200" fill="url(#glow)"/>
    <rect x="30" y="15" width="20" height="20" rx="5" fill="url(#btn)"/>
    <text x="58" y="30" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="white">${esc(name.slice(0, 14))}</text>
    ${["Features", "Pricing", "About"].map((t, i) => `<text x="${400 + i * 90}" y="30" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${h},10%,55%)">${t}</text>`).join("")}
    <rect x="690" y="15" width="80" height="26" rx="13" fill="url(#btn)"/>
    <text x="730" y="32" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="white" text-anchor="middle">Sign Up</text>
    <text x="400" y="130" font-family="system-ui,sans-serif" font-size="34" font-weight="800" fill="white" text-anchor="middle">${esc(name)}</text>
    <rect x="200" y="145" width="400" height="10" rx="4" fill="hsl(${h},10%,28%)"/>
    <rect x="250" y="165" width="300" height="8" rx="3" fill="hsl(${h},10%,20%)"/>
    <rect x="280" y="195" width="120" height="38" rx="19" fill="url(#btn)"/>
    <text x="340" y="218" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">Get Started</text>
    <rect x="420" y="195" width="120" height="38" rx="19" fill="transparent" stroke="hsl(${h},10%,40%)" stroke-width="1"/>
    <text x="480" y="218" font-family="system-ui,sans-serif" font-size="11" fill="hsl(${h},10%,60%)" text-anchor="middle">Learn More</text>
    ${[0,1,2].map(i => {
      const cx = 100 + i * 220;
      return `<rect x="${cx}" y="265" width="200" height="140" rx="14" fill="hsl(${h},15%,10%)" stroke="hsl(${h},15%,18%)" stroke-width="1"/>
        <circle cx="${cx + 30}" cy="298" r="16" fill="hsl(${(h + i * 70) % 360},${s}%,${l}%)" opacity="0.6"/>
        <rect x="${cx + 20}" y="325" width="${80 + (seed * (i + 1)) % 80}" height="9" rx="3" fill="hsl(${h},10%,32%)"/>
        <rect x="${cx + 20}" y="345" width="${120 + (seed * i) % 50}" height="6" rx="3" fill="hsl(${h},10%,22%)"/>
        <rect x="${cx + 20}" y="360" width="${70 + (seed * (i + 2)) % 80}" height="6" rx="3" fill="hsl(${h},10%,18%)"/>`;
    }).join("")}
  </svg>`;
}

function landing_pricing(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const h2 = (h + 45) % 360;
  const tiers = [["Free", "$0", "3"], ["Pro", `$${9 + seed % 40}`, "10"], ["Team", `$${29 + seed % 70}`, "∞"]];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${h},20%,6%)"/>
    <text x="400" y="50" font-family="system-ui,sans-serif" font-size="24" font-weight="800" fill="white" text-anchor="middle">${esc(name)} Pricing</text>
    <text x="400" y="75" font-family="system-ui,sans-serif" font-size="11" fill="hsl(${h},10%,45%)" text-anchor="middle">Choose the plan that works for you</text>
    ${tiers.map(([tier, price, limit], i) => {
      const cx = 80 + i * 230;
      const featured = i === 1;
      return `<rect x="${cx}" y="${featured ? 95 : 110}" width="200" height="${featured ? 320 : 290}" rx="16" fill="hsl(${h},15%,${featured ? 12 : 9}%)" stroke="hsl(${featured ? h : h},${featured ? s : 12}%,${featured ? l : 18}%)" stroke-width="${featured ? 2 : 1}"/>
        ${featured ? `<rect x="${cx}" y="95" width="200" height="40" rx="16 16 0 0" fill="hsl(${h},${s}%,${l}%)" opacity="0.15"/>
        <text x="${cx + 100}" y="120" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="hsl(${h},${s}%,${l}%)" text-anchor="middle">MOST POPULAR</text>` : ""}
        <text x="${cx + 100}" y="${featured ? 160 : 155}" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle">${tier}</text>
        <text x="${cx + 100}" y="${featured ? 200 : 190}" font-family="system-ui,sans-serif" font-size="32" font-weight="800" fill="white" text-anchor="middle">${price}</text>
        <text x="${cx + 100}" y="${featured ? 220 : 208}" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${h},10%,40%)" text-anchor="middle">/month</text>
        ${[0,1,2,3].map(j => `
          <circle cx="${cx + 25}" cy="${(featured ? 245 : 230) + j * 25}" r="4" fill="hsl(${h},${s}%,${l}%)" opacity="0.5"/>
          <rect x="${cx + 38}" y="${(featured ? 241 : 226) + j * 25}" width="${80 + ((seed * (j + i)) % 60)}" height="7" rx="3" fill="hsl(${h},10%,25%)"/>
        `).join("")}
        <rect x="${cx + 20}" y="${featured ? 365 : 360}" width="160" height="30" rx="8" fill="${featured ? `hsl(${h},${s}%,${l}%)` : `hsl(${h},12%,18%)`}" ${!featured ? `stroke="hsl(${h},12%,28%)" stroke-width="1"` : ""}/>
        <text x="${cx + 100}" y="${featured ? 384 : 379}" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="${featured ? "white" : `hsl(${h},10%,55%)`}" text-anchor="middle">${i === 0 ? "Start Free" : "Get Started"}</text>`;
    }).join("")}
  </svg>`;
}

// ===== GAME LAYOUTS =====

function game_board(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const h2 = (h + 120) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${h},25%,15%)"/><stop offset="100%" stop-color="hsl(${h},30%,5%)"/></linearGradient>
      <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${h},${s}%,${l}%)"/><stop offset="100%" stop-color="hsl(${h2},${s}%,${l}%)"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    ${Array.from({ length: 15 }, (_, i) => {
      const x = 30 + ((seed * (i + 1) * 73) % 740);
      const y = 30 + ((seed * (i + 3) * 41) % 390);
      const sz = 10 + ((seed * (i + 5)) % 25);
      return `<circle cx="${x}" cy="${y}" r="${sz / 2}" fill="hsl(${(h + i * 25) % 360},${s - 10}%,${l}%)" opacity="0.15"/>`;
    }).join("")}
    <text x="400" y="80" font-family="system-ui,sans-serif" font-size="36" font-weight="900" fill="url(#ac)" text-anchor="middle" letter-spacing="-1">${esc(name.slice(0, 14).toUpperCase())}</text>
    <rect x="250" y="100" width="300" height="50" rx="14" fill="hsl(${h},20%,12%)" stroke="url(#ac)" stroke-width="2"/>
    <text x="400" y="120" font-family="monospace" font-size="9" fill="hsl(${h},10%,50%)" text-anchor="middle">SCORE</text>
    <text x="400" y="140" font-family="monospace" font-size="20" font-weight="700" fill="white" text-anchor="middle">${((seed % 90000) + 10000).toLocaleString()}</text>
    <rect x="100" y="170" width="600" height="220" rx="14" fill="hsl(${h},18%,9%)" stroke="hsl(${h},15%,18%)" stroke-width="1"/>
    ${Array.from({ length: 30 }, (_, i) => {
      const gx = 120 + (i % 6) * 96;
      const gy = 185 + Math.floor(i / 6) * 40;
      const filled = ((seed * (i + 7)) % 4) !== 0;
      const colorIdx = (seed * (i + 2)) % 5;
      return `<rect x="${gx}" y="${gy}" width="80" height="30" rx="6" fill="hsl(${(h + colorIdx * 60) % 360},${filled ? s - 5 : 10}%,${filled ? l - 15 : 10}%)" opacity="${filled ? 0.65 : 0.2}"/>`;
    }).join("")}
    <rect x="250" y="405" width="130" height="32" rx="16" fill="url(#ac)"/>
    <text x="315" y="425" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">Play Again</text>
    <rect x="400" y="405" width="100" height="32" rx="16" fill="hsl(${h},18%,14%)" stroke="hsl(${h},15%,25%)" stroke-width="1"/>
    <text x="450" y="425" font-family="system-ui,sans-serif" font-size="10" fill="hsl(${h},10%,55%)" text-anchor="middle">Leaderboard</text>
  </svg>`;
}

function game_platformer(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name);
  const sky1 = (h + 180) % 360; const sky2 = (h + 200) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(${sky1},40%,20%)"/><stop offset="100%" stop-color="hsl(${sky2},30%,10%)"/></linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#sky)"/>
    <!-- Stars -->
    ${Array.from({ length: 20 }, (_, i) => `<circle cx="${(seed * (i + 1) * 37) % 800}" cy="${(seed * (i + 3) * 19) % 200}" r="${1 + i % 2}" fill="white" opacity="${0.2 + (i % 5) * 0.1}"/>`).join("")}
    <!-- HUD -->
    <text x="30" y="35" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 14))}</text>
    <text x="400" y="30" font-family="monospace" font-size="12" fill="white" text-anchor="middle">★ ${seed % 999 + 100}</text>
    <text x="770" y="30" font-family="monospace" font-size="11" fill="hsl(0,80%,65%)" text-anchor="end">♥♥♥</text>
    <!-- Ground -->
    <rect x="0" y="350" width="800" height="100" fill="hsl(${(h + 90) % 360},30%,18%)"/>
    <rect x="0" y="350" width="800" height="8" fill="hsl(${(h + 90) % 360},40%,30%)"/>
    <!-- Platforms -->
    ${[[100, 280, 150], [350, 230, 120], [550, 180, 140], [200, 160, 100]].map(([x, y, w], i) => `
      <rect x="${x}" y="${y}" width="${w}" height="14" rx="4" fill="hsl(${(h + 60 + i * 20) % 360},35%,25%)" stroke="hsl(${(h + 60 + i * 20) % 360},40%,35%)" stroke-width="1"/>
    `).join("")}
    <!-- Character -->
    <rect x="${250 + seed % 200}" y="310" width="22" height="35" rx="6" fill="hsl(${h},${s}%,${l}%)"/>
    <circle cx="${261 + seed % 200}" cy="305" r="10" fill="hsl(${h},${s}%,${l + 10}%)"/>
    <!-- Collectibles -->
    ${Array.from({ length: 5 }, (_, i) => `<circle cx="${120 + i * 140 + (seed * i) % 30}" cy="${260 - (seed * (i + 1)) % 80}" r="8" fill="hsl(50,90%,55%)" opacity="0.8"/>`).join("")}
    <!-- Enemies -->
    ${Array.from({ length: 2 }, (_, i) => `<rect x="${400 + i * 200 + seed % 50}" y="320" width="24" height="28" rx="5" fill="hsl(0,60%,45%)" opacity="0.7"/>`).join("")}
    <!-- Controls hint -->
    <rect x="300" y="410" width="200" height="25" rx="8" fill="hsl(${h},15%,15%)" opacity="0.6"/>
    <text x="400" y="427" font-family="system-ui,sans-serif" font-size="9" fill="hsl(${h},10%,50%)" text-anchor="middle">← → Move   ↑ Jump   Space Attack</text>
  </svg>`;
}

// ===== OTHER LAYOUTS =====

function other_cards(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 170) % 360; const h2 = (h + 45) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},18%,8%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},18%,11%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <rect x="680" y="12" width="90" height="24" rx="12" fill="hsl(${h},${s}%,${l}%)" opacity="0.8"/>
    <text x="725" y="28" font-family="system-ui,sans-serif" font-size="9" fill="white" text-anchor="middle">+ Create</text>
    ${[0,1,2,3,4,5].map(i => {
      const cx = 20 + (i % 3) * 260;
      const cy = 65 + Math.floor(i / 3) * 195;
      const cardH = (h + i * 35) % 360;
      return `<rect x="${cx}" y="${cy}" width="240" height="175" rx="12" fill="hsl(${bg},15%,12%)" stroke="hsl(${bg},15%,20%)" stroke-width="1"/>
        <rect x="${cx + 12}" y="${cy + 12}" width="216" height="65" rx="8" fill="hsl(${cardH},${s - 25}%,${l - 20}%)" opacity="0.3"/>
        <circle cx="${cx + 35}" cy="${cy + 45}" r="14" fill="hsl(${cardH},${s}%,${l}%)" opacity="0.55"/>
        <text x="${cx + 58}" y="${cy + 42}" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="hsl(${bg},10%,70%)">${["Project", "Task", "Note", "Event", "File", "Board"][i]} ${i + 1}</text>
        <rect x="${cx + 12}" y="${cy + 90}" width="${100 + ((seed * (i + 1)) % 90)}" height="8" rx="3" fill="hsl(${bg},10%,28%)"/>
        <rect x="${cx + 12}" y="${cy + 108}" width="${70 + ((seed * (i + 3)) % 100)}" height="6" rx="3" fill="hsl(${bg},10%,20%)"/>
        <rect x="${cx + 12}" y="${cy + 140}" width="50" height="20" rx="6" fill="hsl(${cardH},${s - 15}%,${l - 12}%)" opacity="0.4"/>
        <text x="${cx + 37}" y="${cy + 154}" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${cardH},${s}%,${l + 10}%)" text-anchor="middle">Open</text>`;
    }).join("")}
  </svg>`;
}

function other_timeline(name: string, seed: number, desc: string): string {
  const [h, s, l] = hc(name); const bg = (h + 165) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="hsl(${bg},16%,8%)"/>
    <rect x="0" y="0" width="800" height="48" fill="hsl(${bg},16%,12%)"/>
    <text x="25" y="30" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="white">${esc(name.slice(0, 18))}</text>
    <!-- Timeline line -->
    <line x1="120" y1="70" x2="120" y2="430" stroke="hsl(${h},${s - 20}%,${l - 10}%)" stroke-width="2" opacity="0.4"/>
    ${Array.from({ length: 6 }, (_, i) => {
      const ey = 85 + i * 60;
      const dotH = (h + i * 40) % 360;
      return `<circle cx="120" cy="${ey}" r="8" fill="hsl(${dotH},${s}%,${l}%)" opacity="0.7"/>
        <circle cx="120" cy="${ey}" r="4" fill="hsl(${bg},16%,8%)"/>
        <rect x="145" y="${ey - 18}" width="${350 + ((seed * (i + 1)) % 200)}" height="40" rx="8" fill="hsl(${bg},14%,13%)" stroke="hsl(${bg},14%,20%)" stroke-width="1"/>
        <rect x="160" y="${ey - 8}" width="${80 + ((seed * (i + 2)) % 100)}" height="7" rx="3" fill="hsl(${bg},10%,30%)"/>
        <rect x="160" y="${ey + 5}" width="${150 + ((seed * (i + 4)) % 150)}" height="5" rx="2" fill="hsl(${bg},10%,20%)"/>
        <text x="${145 + 355 + ((seed * (i + 1)) % 200)}" y="${ey}" font-family="system-ui,sans-serif" font-size="8" fill="hsl(${bg},10%,30%)" text-anchor="end">${i + 1}h ago</text>`;
    }).join("")}
  </svg>`;
}

// ===== REGISTRY =====

const LAYOUTS: Record<string, ((name: string, seed: number, desc: string) => string)[]> = {
  saas_tool: [saas_dashboard, saas_kanban, saas_table, saas_settings, saas_analytics],
  ai_app: [ai_chat, ai_pipeline, ai_image_tool, ai_dashboard, ai_workflow],
  utility: [util_editor, util_converter, util_editor, util_converter, util_editor],
  landing_page: [landing_hero, landing_pricing, landing_hero, landing_pricing, landing_hero],
  game: [game_board, game_platformer, game_board, game_platformer, game_board],
  other: [other_cards, other_timeline, other_cards, other_timeline, other_cards],
};

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
        const seed = hashStr(listing.title);
        const variants = LAYOUTS[listing.category] || LAYOUTS.other;
        // Pick layout variant based on seed - gives each listing a structurally different look
        const layoutIdx = seed % variants.length;
        const layoutIdx2 = (seed + 2) % variants.length;

        const svg1 = variants[layoutIdx](listing.title, seed, listing.description || "");
        // Second screenshot uses a DIFFERENT layout variant
        const svg2 = variants[layoutIdx2](listing.title + "-alt", seed + 777, listing.description || "");

        const safeName = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
        const ts = Date.now();
        const screenshots: string[] = [];

        for (let i = 0; i < 2; i++) {
          const svg = i === 0 ? svg1 : svg2;
          const filePath = `unique-v2/${safeName}-${i + 1}-${ts}.svg`;
          const svgBytes = new TextEncoder().encode(svg);

          const { error: uploadErr } = await supabase.storage
            .from("listing-screenshots")
            .upload(filePath, svgBytes, { contentType: "image/svg+xml", upsert: false });

          if (uploadErr) { console.error(`Upload error for ${listing.title}:`, uploadErr); continue; }

          const { data: urlData } = supabase.storage.from("listing-screenshots").getPublicUrl(filePath);
          screenshots.push(urlData.publicUrl);
        }

        if (screenshots.length > 0) {
          const { error: updateErr } = await supabase.from("listings").update({ screenshots }).eq("id", listing.id);
          if (updateErr) { errors++; } else { updated++; }
        } else { errors++; }
      } catch (e) {
        console.error(`Error processing ${listing.title}:`, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${listings.length} listings: ${updated} updated, ${errors} errors`,
      processed: listings.length, updated, errors, next_offset: offset + batchSize,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-unique-screenshots error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
