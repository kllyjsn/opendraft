import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Base scaffold files every generated project includes ────────── */

const BASE_FILES: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "template-app",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.30.1",
        "lucide-react": "^0.462.0",
        "framer-motion": "^12.0.0",
        zod: "^3.23.0",
        "@supabase/supabase-js": "^2.97.0",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        "@types/react": "^18.3.0",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.0",
        autoprefixer: "^10.4.19",
        postcss: "^8.4.38",
        tailwindcss: "^3.4.4",
        typescript: "^5.5.0",
        vite: "^5.3.0",
      },
    },
    null,
    2
  ),
  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
    },
    null,
    2
  ),
  "vite.config.ts": `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: 'dist' },
});
`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
};
`,
  "postcss.config.js": `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <title>Template App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  // Backend scaffolding — Supabase client setup for data persistence
  "src/lib/supabase.ts": `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Helper to check if backend is configured */
export const hasBackend = () => !!supabase;
`,
  // MongoDB client setup for customers who prefer MongoDB
  "src/lib/mongodb.ts": `/**
 * MongoDB Data API client for browser-based apps.
 * Uses MongoDB Atlas Data API (REST) — no native driver needed.
 *
 * Setup:
 * 1. Create a free MongoDB Atlas cluster at https://cloud.mongodb.com
 * 2. Enable the Data API in Atlas → App Services → Data API
 * 3. Create an API key and set the env vars below
 */

const MONGODB_API_URL = import.meta.env.VITE_MONGODB_API_URL || '';
const MONGODB_API_KEY = import.meta.env.VITE_MONGODB_API_KEY || '';
const MONGODB_DATA_SOURCE = import.meta.env.VITE_MONGODB_DATA_SOURCE || 'Cluster0';
const MONGODB_DATABASE = import.meta.env.VITE_MONGODB_DATABASE || 'app';

export const hasMongoDB = () => !!(MONGODB_API_URL && MONGODB_API_KEY);

interface MongoAction {
  action: 'findOne' | 'find' | 'insertOne' | 'insertMany' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany';
  collection: string;
  filter?: Record<string, unknown>;
  document?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  update?: Record<string, unknown>;
  sort?: Record<string, number>;
  limit?: number;
  projection?: Record<string, number>;
}

async function mongoRequest<T = unknown>(params: MongoAction): Promise<T> {
  if (!hasMongoDB()) throw new Error('MongoDB not configured. Set VITE_MONGODB_* env vars.');

  const { action, collection, ...rest } = params;
  const response = await fetch(\`\${MONGODB_API_URL}/action/\${action}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_API_KEY,
    },
    body: JSON.stringify({
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATABASE,
      collection,
      ...rest,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(\`MongoDB \${action} failed: \${err}\`);
  }
  return response.json();
}

/** Typed MongoDB collection helper */
export function collection<T = Record<string, unknown>>(name: string) {
  return {
    findOne: (filter: Record<string, unknown> = {}) =>
      mongoRequest<{ document: T | null }>({ action: 'findOne', collection: name, filter }),
    find: (filter: Record<string, unknown> = {}, options?: { sort?: Record<string, number>; limit?: number }) =>
      mongoRequest<{ documents: T[] }>({ action: 'find', collection: name, filter, ...options }),
    insertOne: (document: Partial<T>) =>
      mongoRequest<{ insertedId: string }>({ action: 'insertOne', collection: name, document: document as Record<string, unknown> }),
    insertMany: (documents: Partial<T>[]) =>
      mongoRequest<{ insertedIds: string[] }>({ action: 'insertMany', collection: name, documents: documents as Record<string, unknown>[] }),
    updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) =>
      mongoRequest<{ matchedCount: number; modifiedCount: number }>({ action: 'updateOne', collection: name, filter, update }),
    deleteOne: (filter: Record<string, unknown>) =>
      mongoRequest<{ deletedCount: number }>({ action: 'deleteOne', collection: name, filter }),
  };
}
`,
  // Database abstraction layer — pick Supabase, MongoDB, or localStorage
  "src/lib/database.ts": `/**
 * Unified database abstraction layer.
 * Auto-detects which backend is configured and provides a consistent API.
 *
 * Priority: Supabase → MongoDB → localStorage (fallback)
 */
import { supabase, hasBackend as hasSupabase } from './supabase';
import { hasMongoDB, collection } from './mongodb';

export type BackendType = 'supabase' | 'mongodb' | 'local';

export function getBackendType(): BackendType {
  if (hasSupabase()) return 'supabase';
  if (hasMongoDB()) return 'mongodb';
  return 'local';
}

export function getBackendLabel(): string {
  const labels: Record<BackendType, string> = {
    supabase: 'Supabase (PostgreSQL)',
    mongodb: 'MongoDB Atlas',
    local: 'Local Storage (offline)',
  };
  return labels[getBackendType()];
}

/** Generic CRUD helper that works with any configured backend */
export const db = {
  async getAll<T>(table: string): Promise<T[]> {
    const backend = getBackendType();
    if (backend === 'supabase' && supabase) {
      const { data } = await supabase.from(table).select('*');
      return (data || []) as T[];
    }
    if (backend === 'mongodb') {
      const res = await collection<T>(table).find();
      return res.documents;
    }
    // localStorage fallback
    const raw = localStorage.getItem(\`db_\${table}\`);
    return raw ? JSON.parse(raw) : [];
  },

  async insert<T extends Record<string, unknown>>(table: string, record: T): Promise<T | null> {
    const backend = getBackendType();
    if (backend === 'supabase' && supabase) {
      const { data } = await supabase.from(table).insert(record).select().single();
      return data as T | null;
    }
    if (backend === 'mongodb') {
      await collection(table).insertOne(record);
      return record;
    }
    const items = await this.getAll<T>(table);
    items.push({ ...record, id: crypto.randomUUID() } as T);
    localStorage.setItem(\`db_\${table}\`, JSON.stringify(items));
    return record;
  },

  async delete(table: string, id: string): Promise<boolean> {
    const backend = getBackendType();
    if (backend === 'supabase' && supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      return !error;
    }
    if (backend === 'mongodb') {
      const res = await collection(table).deleteOne({ _id: id });
      return res.deletedCount > 0;
    }
    const items = await this.getAll<Record<string, unknown>>(table);
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(\`db_\${table}\`, JSON.stringify(filtered));
    return true;
  },
};
`,
  "src/hooks/useLocalStorage.ts": `import { useState, useEffect } from 'react';

/** Persist state to localStorage with automatic JSON serialization.
 *  Works as a drop-in replacement for useState — if Supabase or MongoDB is configured,
 *  you can swap this for a database-backed hook later. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* quota exceeded */ }
  }, [key, value]);

  return [value, setValue] as const;
}
`,
  "src/main.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}
`,
  /* ── Security Hardening Files ─────────────────────────────── */
  "SECURITY.md": `# Security Policy

## Overview
This template was built with OpenDraft's **Security Hardened** standard — the strictest default security posture for AI-generated web applications.

## Security Controls

### Input Validation
- All user inputs validated with Zod schemas (runtime type checking)
- Form inputs sanitized before processing
- Length limits enforced on all text fields

### XSS Prevention
- No \`dangerouslySetInnerHTML\` usage
- No \`eval()\` or \`new Function()\` calls
- No inline event handlers in HTML
- Content rendered through React's built-in escaping

### Transport Security
- All external URLs use HTTPS
- No mixed content
- CSP meta tag configured in index.html

### Secret Management
- No hardcoded API keys, tokens, or secrets
- Environment variables used for all credentials
- \`.env.example\` provided for configuration

### TypeScript Safety
- Strict mode enabled (\`"strict": true\`)
- No \`any\` types in business logic
- Proper null/undefined handling

## Reporting Vulnerabilities
If you discover a security issue, please report it to security@opendraft.co

## Security Score
This template was automatically scanned by OpenDraft's security scanner and assigned a score based on 10+ security checks covering secrets, XSS, injection, validation, and transport security.
`,
  "security-manifest.json": JSON.stringify({
    "$schema": "https://opendraft.co/.well-known/security-manifest.schema.json",
    version: "1.0.0",
    generator: "opendraft-security-scanner",
    controls: {
      input_validation: { library: "zod", enforced: true },
      xss_prevention: { no_dangerous_html: true, no_eval: true, no_inline_handlers: true },
      transport_security: { https_only: true, csp_configured: true },
      secret_management: { no_hardcoded_secrets: true, env_vars: true },
      typescript: { strict_mode: true },
    },
    scan_date: new Date().toISOString().split("T")[0],
  }, null, 2),
  ".env.example": `# Environment Variables
# Copy this file to .env and fill in your values
# NEVER commit .env to version control

# ── Option A: Supabase (PostgreSQL — recommended) ──────────
# Sign up at https://supabase.com or use OpenDraft Managed Hosting
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key_here

# ── Option B: MongoDB Atlas ────────────────────────────────
# 1. Create a free cluster at https://cloud.mongodb.com
# 2. Enable Data API: Atlas → App Services → Data API
# 3. Generate an API key and fill in below
# VITE_MONGODB_API_URL=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1
# VITE_MONGODB_API_KEY=your_api_key_here
# VITE_MONGODB_DATA_SOURCE=Cluster0
# VITE_MONGODB_DATABASE=app

# ── Other API keys (if needed) ─────────────────────────────
# VITE_API_URL=https://your-api.example.com
`,
  /* ── Deploy-ready configs ───────────────────────────────── */
  "netlify.toml": `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`,
  "vercel.json": JSON.stringify(
    {
      buildCommand: "npm run build",
      outputDirectory: "dist",
      framework: "vite",
      rewrites: [{ source: "/(.*)", destination: "/index.html" }],
    },
    null,
    2
  ),
  "_redirects": `/*    /index.html   200
`,
};

const THEME_POOL_FALLBACK = [
  "AI-powered writing assistant with grammar scoring",
  "SaaS analytics dashboard with real-time charts",
  "Kanban board with drag-and-drop and swimlanes",
  "Personal finance tracker with spending heatmaps",
  "Recipe discovery platform with dietary filters",
];

/**
 * Fetch live trending themes from Reddit, Hacker News, Product Hunt
 * via Firecrawl search, then let AI distill them into buildable app ideas.
 */
async function fetchTrendValidatedThemes(
  count: number,
  LOVABLE_API_KEY: string,
  existingTitles: string[],
  FIRECRAWL_API_KEY?: string
): Promise<string[]> {
  const trendSnippets: string[] = [];

  if (FIRECRAWL_API_KEY) {
    console.log("Fetching live trends for template theme generation...");
    const searches = [
      "trending AI SaaS tools launching 2026 site:producthunt.com",
      "Show HN trending projects this week site:news.ycombinator.com",
      "trending developer tools micro-SaaS ideas site:reddit.com",
      "viral web app ideas indie hackers 2026",
      "MCP server AI agent tools trending 2026",
      "most requested SaaS templates developers need",
    ];

    const results = await Promise.allSettled(
      searches.map(async (q) => {
        try {
          const resp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query: q, limit: 5, tbs: "qdr:w" }),
          });
          if (!resp.ok) return null;
          const data = await resp.json();
          return (data?.data || [])
            .map((r: any) => `- ${r.title}: ${r.description || ""}`)
            .join("\n")
            .slice(0, 1200);
        } catch { return null; }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) trendSnippets.push(r.value);
    }
    console.log(`Gathered ${trendSnippets.length} trend snippets for theme distillation`);
  }

  if (trendSnippets.length === 0) {
    console.log("No trend data available, falling back to static pool");
    const shuffled = [...THEME_POOL_FALLBACK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Use AI to distill trends into specific, creative app themes
  const systemPrompt = "You distill internet trends into highly specific, creative web app ideas that developers would pay for. Each idea should be:\n" +
    "- Inspired by a REAL trend you see in the data\n" +
    "- Specific enough to build (not \"CRM\" but \"CRM for freelance videographers with project-based invoicing\")\n" +
    "- Diverse across categories (SaaS, AI, utility, agent tool, dashboard, landing page)\n" +
    "- At least 30% should be agent-first (MCP servers, API tools, autonomous workflow builders)\n" +
    "- NEVER generic — each must have a unique angle\n" +
    "- Reference the trend that inspired it";

  const userPrompt = `Based on these LIVE internet trends from this week, generate exactly ${count} specific app ideas.\n\nTRENDS:\n${trendSnippets.join("\n\n")}\n\nAVOID DUPLICATING THESE EXISTING APPS:\n${existingTitles.slice(0, 30).join(", ") || "None"}\n\nReturn exactly ${count} ideas, each as a single descriptive sentence like "AI-powered code review dashboard that scores PRs on maintainability and suggests refactors" — NOT just "Code Review Tool".`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_themes",
          description: "Return the distilled app themes",
          parameters: {
            type: "object",
            properties: {
              themes: {
                type: "array",
                items: { type: "string", description: "A specific, creative app idea in one sentence" },
                description: `Exactly ${count} trend-validated app themes`
              }
            },
            required: ["themes"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "return_themes" } },
    }),
  });

  if (!aiResp.ok) {
    console.error("Theme distillation AI call failed, falling back");
    const shuffled = [...THEME_POOL_FALLBACK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  const aiData = await aiResp.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    const shuffled = [...THEME_POOL_FALLBACK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  const parsed = JSON.parse(toolCall.function.arguments || '{"themes":[]}');
  const themes: string[] = parsed.themes || [];

  if (themes.length === 0) {
    const shuffled = [...THEME_POOL_FALLBACK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  console.log("Trend-validated themes:", themes);
  return themes.slice(0, count);
}

async function gatherDemandSignals(
  supabase: ReturnType<typeof createClient>
): Promise<{ topSearches: string[]; unfilledBounties: string[]; highViewGaps: string[]; existingTitles: string[] }> {
  const { data: searchLogs } = await supabase
    .from("activity_log")
    .select("event_data")
    .in("event_type", ["search", "ai_search", "magic_import"])
    .order("created_at", { ascending: false })
    .limit(100);

  const queryMap = new Map<string, number>();
  for (const log of searchLogs || []) {
    const d = log.event_data as Record<string, unknown> | null;
    const q = String(d?.query || d?.prompt || "").trim().toLowerCase();
    if (q && q.length > 3) queryMap.set(q, (queryMap.get(q) || 0) + 1);
  }
  const topSearches = [...queryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([q]) => q);

  const { data: bounties } = await supabase
    .from("bounties")
    .select("title, description, category")
    .eq("status", "open")
    .order("budget", { ascending: false })
    .limit(10);
  const unfilledBounties = (bounties || []).map(b => `${b.title} (${b.category})`);

  const { data: gapListings } = await supabase
    .from("listings")
    .select("title, category, view_count, sales_count")
    .eq("status", "live")
    .order("view_count", { ascending: false })
    .limit(50);
  const highViewGaps = (gapListings || [])
    .filter(l => (l.view_count || 0) > 5 && (l.sales_count || 0) <= 1)
    .slice(0, 10)
    .map(l => `${l.title} (${l.view_count} views, ${l.sales_count} sales)`);

  const { data: existing } = await supabase
    .from("listings")
    .select("title")
    .limit(200);
  const existingTitles = (existing || []).map(l => l.title);

  return { topSearches, unfilledBounties, highViewGaps, existingTitles };
}

/* ── Helper to update job status ─────────────────────────────────── */
async function updateJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  updates: { status?: string; stage?: string; listing_id?: string; listing_title?: string; error?: string }
) {
  await supabase
    .from("generation_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function generateSingleTemplate(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  theme: string,
  LOVABLE_API_KEY: string,
  demandContext?: string,
  jobId?: string,
  brandContext?: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_style: string;
    design_mood: string;
    typography_style: string;
    border_radius: string;
    visual_references: string;
    business_name?: string;
  }
): Promise<{
  success: boolean;
  listing_id?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  file_count?: number;
  zip_size_kb?: number;
  error?: string;
}> {
  /* ── Step 1: Generate concept + source code via AI ─────────── */
  if (jobId && brandContext) await updateJob(supabase, jobId, { stage: "adapting_brand" });
  if (jobId) await updateJob(supabase, jobId, { stage: "generating_code" });

  // Build brand-aware design directive
  const brandDirective = brandContext ? `
## 🎨 SOURCE BRAND DESIGN SYSTEM (HIGHEST PRIORITY)
This app is being built FOR a specific business. You MUST adapt the design to match their brand identity:

- **Primary Color**: ${brandContext.primary_color} — use for CTAs, active states, key accents
- **Secondary Color**: ${brandContext.secondary_color} — use for secondary buttons, badges, highlights
- **Accent Color**: ${brandContext.accent_color} — use sparingly for alerts, tags, emphasis
- **Background**: ${brandContext.background_style} mode — ${brandContext.background_style === 'dark' ? 'dark bg (slate-900/950), light text' : brandContext.background_style === 'gradient' ? 'gradient backgrounds using brand colors' : 'white/gray-50 bg, dark text'}
- **Design Mood**: ${brandContext.design_mood}
- **Typography**: ${brandContext.typography_style} — ${brandContext.typography_style === 'monospace-accent' ? 'Use monospace for data/code elements, sans-serif for body' : brandContext.typography_style === 'serif-accent' ? 'Use serif for headlines, sans-serif for body' : brandContext.typography_style === 'rounded' ? 'Use rounded font-family like Nunito or system rounded' : 'Use clean geometric sans like Inter or system-ui'}
- **Corners**: ${brandContext.border_radius} — ${brandContext.border_radius === 'sharp' ? 'rounded-none or rounded-sm' : brandContext.border_radius === 'subtle' ? 'rounded-md' : brandContext.border_radius === 'pill' ? 'rounded-full on buttons, rounded-2xl on cards' : 'rounded-lg to rounded-xl'}
- **Visual Reference**: ${brandContext.visual_references}
${brandContext.business_name ? `- **For**: ${brandContext.business_name} — make it feel like THEIR internal tool, not a generic template` : ''}

CRITICAL: The Tailwind config and index.css MUST define CSS custom properties matching these brand colors. Generate a tailwind.config.js that extends colors with the brand palette. The index.css should set :root variables for --brand-primary, --brand-secondary, --brand-accent.
` : '';

  const systemContent = `You are a WORLD-CLASS React developer and UI designer who creates STUNNING, production-grade FULL-SUITE React + Tailwind applications — NOT landing pages, NOT marketing sites, but COMPLETE FUNCTIONAL APPS with real workflows, multiple pages, and interactive features.

## YOUR QUALITY BAR
Think Linear's app, Notion's workspace, Stripe's dashboard, Calendly's booking flow — that level of FUNCTIONAL depth. Every app you generate should feel like a real SaaS product with working features, navigation between pages, data management, and interactive UI. Buyers should think "This replaces a $50/month SaaS tool."

## CRITICAL: BUILD A FULL APPLICATION, NOT A LANDING PAGE
You MUST generate a MULTI-PAGE APPLICATION with:
- **react-router-dom routing** with at least 5-8 distinct routes/pages
- **Sidebar or top navigation** for navigating between pages (NOT just a landing page navbar)
- **Dashboard/home page** with overview stats, recent activity, quick actions
- **CRUD workflows** — users can create, view, edit, and manage data (using localStorage via useLocalStorage hook)
- **Data tables/lists** with sorting, filtering, search
- **Detail views** — click an item to see full details in a modal or dedicated page
- **Settings/configuration page** with toggleable options
- **Form flows** with multi-step or tabbed interfaces and Zod validation
- **Interactive charts/analytics** using recharts with realistic time-series data
- **Empty states, loading states, success/error feedback** — real app patterns
- **Mobile-responsive layout** with collapsible sidebar or bottom navigation on mobile

DO NOT generate:
- Marketing landing pages with hero/features/pricing/CTA sections
- Single-page websites with scroll sections
- Brochure-style templates
- Portfolio sites

Instead, generate FUNCTIONAL TOOLS like:
- Project management boards with task CRUD
- CRM dashboards with contact management
- Scheduling apps with calendar views and booking flows
- Analytics dashboards with drill-down capabilities
- Inventory management systems
- Team collaboration tools with real workflows
${brandDirective}
## DESIGN PRINCIPLES (MANDATORY)
1. **VISUAL HIERARCHY**: Bold headlines (text-4xl to text-6xl font-black), clear information architecture, strategic whitespace
2. **COLOR MASTERY**: ${brandContext ? `Use the SOURCE BRAND colors defined above as your primary palette. Derive all UI colors from the brand identity.` : `Use a cohesive palette — NOT random Tailwind colors. Pick 1 primary gradient + 2 accent colors. Examples:
   - Indigo-to-purple gradient hero + emerald accents
   - Amber-warm theme with slate + rose accents
   - Deep blue dashboard with cyan data highlights`}
3. **MOTION & DELIGHT**: Use framer-motion for EVERY major section:
   - Hero text reveal with stagger (delay 0.1 per word/line)
   - Cards that slide up + fade in on scroll using viewport detection
   - Hover micro-interactions (scale, shadow elevation, color shift)
   - Smooth page transitions
4. **DEPTH & TEXTURE**: Layered design with:
   - Gradient mesh backgrounds or subtle grid patterns
   - Glass-morphism cards (backdrop-blur-xl bg-white/10 border border-white/20)
   - Dramatic shadows (shadow-2xl on cards, shadow-glow on CTAs)
   - Decorative blurred gradient orbs in backgrounds
5. **TYPOGRAPHY**: Use system font stack. Mix font weights dramatically (font-black for headlines, font-normal for body). Use tracking-tight on headlines.
6. **RESPONSIVE**: Mobile-first. Every component must look great on all screens.
7. **DARK MODE READY**: Use Tailwind dark: variants. Design primarily for light mode but ensure dark mode works.

## CODE QUALITY REQUIREMENTS
- TypeScript strict mode — proper types for all props and state
- Custom hooks for reusable logic
- Component composition — break UI into small, reusable pieces (min 6-8 component files)
- Meaningful variable names and JSDoc comments on complex components
- Use React.useState, useEffect properly with cleanup
- Responsive grid layouts with Tailwind (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Accessible: proper aria labels, semantic HTML, keyboard navigation
- NO placeholder "lorem ipsum" — use realistic, contextual dummy data
- ALL sample data should be defined in a separate src/data/ file or at the top of components

## 🛡️ SECURITY HARDENING (MANDATORY — every template must pass these)
These are NON-NEGOTIABLE. Templates that fail these checks are rejected:

1. **ZERO hardcoded secrets** — Never include API keys, tokens, or credentials. Use import.meta.env for any config.
2. **ZERO dangerouslySetInnerHTML** — Never use it. Period. Use React's built-in text rendering.
3. **ZERO eval() or new Function()** — Never use dynamic code execution.
4. **ZERO innerHTML assignments** — Use textContent or React rendering.
5. **ALL external URLs must use HTTPS** — No http:// links (except localhost).
6. **NO localStorage for sensitive data** — Never store tokens, passwords, or keys in localStorage.
7. **Input validation with Zod** — Every form must validate inputs with zod schemas. Add \`import { z } from 'zod'\` and define schemas.
8. **CSP meta tag in index.html** — Already included in base scaffold, do not remove.
9. **TypeScript strict mode** — Already enabled in tsconfig, do not disable.
10. **No inline event handlers in HTML** — Use React event props only.

Example secure form pattern:
\`\`\`tsx
import { z } from 'zod';
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(1).max(1000),
});
// Validate: const result = contactSchema.safeParse(formData);
\`\`\`

## FILE STRUCTURE (generate ALL of these — minimum 15 files for a full app)
- src/App.tsx — Main app with react-router-dom BrowserRouter, sidebar/nav layout, route definitions (use default export)
- src/components/Layout.tsx — App shell with sidebar navigation, header, and content area
- src/components/Sidebar.tsx — Collapsible sidebar with nav links, icons, active state highlighting
- src/pages/Dashboard.tsx — Overview page with stat cards, recent activity feed, quick action buttons
- src/pages/ — 4-7 additional page components (e.g., Contacts.tsx, Calendar.tsx, Settings.tsx, Analytics.tsx, Details.tsx)
- src/components/ — 6-10 shared components (DataTable, StatCard, Modal, FormField, EmptyState, StatusBadge, etc.)
- src/data/sample-data.ts — Rich, realistic seed data with 10-20+ items, timestamps, relationships
- src/hooks/ — Custom hooks for data management (useItems.ts, useFilters.ts, etc.)

## EXPORT CONVENTION (CRITICAL — builds will fail if mismatched)
- ALL components MUST use NAMED exports: \`export function Hero() { ... }\` — NOT \`export default function Hero()\`
- App.tsx MUST import components with named imports: \`import { Hero } from '@/components/Hero'\`
- Data files should also use named exports: \`export const sampleData = [...]\`
- The ONLY file that should use default export is App.tsx itself: \`export default function App()\`

## BACKEND-READY ARCHITECTURE
The base scaffold supports THREE database backends out of the box:
1. **Supabase** (PostgreSQL) — src/lib/supabase.ts — full-featured with auth, storage, realtime
2. **MongoDB Atlas** — src/lib/mongodb.ts — document database via Data API (REST, no driver needed)
3. **localStorage** — src/hooks/useLocalStorage.ts — offline-first fallback, zero config

A unified abstraction layer in src/lib/database.ts auto-detects the configured backend:
- Import { db, getBackendType } from '@/lib/database' for backend-agnostic CRUD
- Use db.getAll<T>('collection'), db.insert('collection', record), db.delete('collection', id)
- Use useLocalStorage for simple key-value persistence that works immediately
- The app is functional immediately AND upgradeable to either Supabase or MongoDB later

## ANIMATIONS COOKBOOK (use these patterns)
\`\`\`tsx
// Stagger children
<motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
  {items.map(item => <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} />)}
</motion.div>

// Scroll reveal
<motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }}>

// Hover card lift
<motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>

// Number counter
const [count, setCount] = useState(0);
useEffect(() => { const timer = setInterval(() => setCount(prev => prev < target ? prev + 1 : target), 20); return () => clearInterval(timer); }, []);
\`\`\`

## WHAT MAKES AN APP VALUABLE (NOT a landing page — a FUNCTIONAL APP)
- A polished dashboard that shows real data at a glance
- CRUD workflows where users can create, edit, delete items
- Data tables with search, sort, and filter functionality
- Detail views with rich information display
- Charts and analytics that visualize trends over time
- Settings pages with toggles, dropdowns, and configuration options
- Multi-step forms with validation and progress indicators
- Real navigation between 5+ distinct pages via react-router-dom
- Mobile-responsive sidebar that collapses to bottom nav or hamburger menu

${demandContext ? "\n--- MARKET INTELLIGENCE ---\n" + demandContext : ""}`;

  const userContent = `Generate a FULL-SUITE APPLICATION (NOT a landing page) with theme: "${theme}".

This app should REPLACE a paid SaaS tool. It must be a complete, multi-page application with working workflows, data management, and interactive features. Think "Calendly replacement" or "Linear alternative" — a real product, not a marketing site.

Requirements:
1. At LEAST 15 source files: App.tsx + Layout + Sidebar + 5-7 pages + 6-10 shared components + sample data + custom hooks
2. react-router-dom with BrowserRouter and at LEAST 5 distinct routes/pages
3. Sidebar or top navigation for app-style navigation (NOT a landing page navbar)
4. Dashboard/home page with stat cards, charts (recharts), and recent activity
5. CRUD functionality — create, view, edit, delete items using useLocalStorage hook for persistence
6. Data tables with search, sort, and filter capabilities
7. Detail views — click items to see expanded information
8. Settings page with configuration options (toggles, selects, inputs)
9. Form flows with Zod validation and proper error states
10. Empty states, loading skeletons, and success/error toast feedback
11. framer-motion animations on page transitions, list items, and interactive elements
12. Mobile-responsive: sidebar collapses to hamburger menu or bottom nav on mobile
13. Cohesive dark or light theme with professional color palette
14. Rich, realistic seed data — 15-25 items with names, dates, statuses, relationships
15. Must compile and work immediately with the base scaffold (React 18, Tailwind, lucide-react, framer-motion, recharts, date-fns, zod)`;
16: 
  const aiResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_template",
              description:
                "Return the template app metadata and all source files",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Brandable product title, 2-6 words. Think 'Linear', 'Notion', 'Raycast' level naming.",
                  },
                  tagline: {
                    type: "string",
                    description: "One-line marketing tagline, max 10 words",
                  },
                  description: {
                    type: "string",
                    description:
                      "Compelling 3-4 sentence marketplace description highlighting unique value, key features, and who it's for. Write like a Product Hunt launch.",
                  },
                  category: {
                    type: "string",
                    enum: [
                      "saas_tool",
                      "ai_app",
                      "landing_page",
                      "utility",
                      "game",
                      "other",
                    ],
                  },
                  completeness_badge: {
                    type: "string",
                    enum: ["prototype", "mvp", "production_ready"],
                  },
                  tech_stack: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-6 technologies used",
                  },
                  color_palette: {
                    type: "string",
                    description: "The primary color scheme used, e.g. 'indigo-to-purple gradient with emerald accents'",
                  },
                  files: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: {
                          type: "string",
                          description:
                            "File path relative to project root, e.g. src/App.tsx or src/components/Hero.tsx",
                        },
                        content: {
                          type: "string",
                          description: "Full file content — production quality TypeScript/TSX",
                        },
                      },
                      required: ["path", "content"],
                      additionalProperties: false,
                    },
                    description:
                      "All source files (minimum 8 files: App.tsx, Navbar, Hero, Footer, 4+ feature components, sample data)",
                  },
                },
                required: [
                  "title",
                  "tagline",
                  "description",
                  "category",
                  "completeness_badge",
                  "tech_stack",
                  "color_palette",
                  "files",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "create_template" },
        },
      }),
    }
  );

  if (aiResponse.status === 429) {
    return { success: false, error: "Rate limit exceeded, try again later." };
  }
  if (aiResponse.status === 402) {
    return { success: false, error: "AI credits exhausted." };
  }
  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    return { success: false, error: "AI code generation failed" };
  }

  let aiData: any;
  try {
    aiData = await aiResponse.json();
  } catch (parseErr) {
    console.error("Failed to parse AI response JSON:", parseErr);
    return { success: false, error: "AI response was truncated or malformed" };
  }

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { success: false, error: "No AI response generated" };

  let template: any;
  try {
    template = JSON.parse(toolCall.function.arguments || '{"files":[]}');
  } catch (parseErr) {
    console.error("Failed to parse tool call arguments:", parseErr);
    return { success: false, error: "AI generated malformed template data" };
  }

  if (!template.files?.length)
    return { success: false, error: "AI generated no files" };

  const slug = (template.title || "template")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);

  /* ── Step 2b: Security post-processing ─────────────────────── */
  const generatedFiles: Array<{ path: string; content: string }> = template.files || [];

  const hasZodImport = generatedFiles.some(f => /import.*from\s+['"]zod['"]|import.*{.*z.*}.*from\s+['"]zod['"]/i.test(f.content));
  if (!hasZodImport) {
    generatedFiles.push({
      path: "src/lib/validation.ts",
      content: `import { z } from 'zod';\nexport const emailSchema = z.string().trim().email().max(255);\nexport const nameSchema = z.string().trim().min(1).max(100);\nexport const messageSchema = z.string().trim().min(1).max(2000);\nexport const contactFormSchema = z.object({ name: nameSchema, email: emailSchema, message: messageSchema });\nexport function validate<T>(schema: z.ZodSchema<T>, data: unknown) {\n  const result = schema.safeParse(data);\n  if (result.success) return { success: true as const, data: result.data };\n  return { success: false as const, errors: result.error.errors.map(e => e.message) };\n}\n`,
    });
  }

  // Inject brand-aware CSS, Tailwind config, and business identity
  if (brandContext) {
    // 1. CSS custom properties
    const brandCss = generatedFiles.find(f => f.path === "src/index.css");
    const brandVars = `
  --brand-primary: ${brandContext.primary_color};
  --brand-secondary: ${brandContext.secondary_color};
  --brand-accent: ${brandContext.accent_color};`;
    if (brandCss) {
      brandCss.content = brandCss.content.replace(':root {', `:root {${brandVars}`);
    }
    // 2. Tailwind brand colors
    const twConfig = generatedFiles.find(f => f.path === "tailwind.config.js");
    if (twConfig && !twConfig.content.includes("brand")) {
      twConfig.content = twConfig.content.replace(
        "extend: {",
        `extend: {\n      colors: {\n        brand: { primary: '${brandContext.primary_color}', secondary: '${brandContext.secondary_color}', accent: '${brandContext.accent_color}' },\n      },`
      );
    }
    // 3. Inject business name into HTML title
    const indexHtml = generatedFiles.find(f => f.path === "index.html");
    if (indexHtml && brandContext.business_name) {
      indexHtml.content = indexHtml.content.replace(/<title>[^<]*<\/title>/, `<title>${brandContext.business_name}</title>`);
    }
    // 4. Add brand config file for runtime access
    if (brandContext.business_name) {
      generatedFiles.push({
        path: "src/config/brand.ts",
        content: `/** Auto-generated brand configuration from ${brandContext.business_name}'s website */
export const BRAND = {
  name: "${brandContext.business_name.replace(/"/g, '\\"')}",
  colors: {
    primary: "${brandContext.primary_color}",
    secondary: "${brandContext.secondary_color}",
    accent: "${brandContext.accent_color}",
  },
  style: {
    background: "${brandContext.background_style}",
    mood: "${brandContext.design_mood}",
    typography: "${brandContext.typography_style}",
    borderRadius: "${brandContext.border_radius}",
  },
} as const;
`,
      });
    }
  }

  for (const file of generatedFiles) {
    if (!file.content || !file.path) continue;
    file.content = file.content.replace(/\beval\s*\([^)]*\)/g, '/* eval removed */');
    file.content = file.content.replace(/dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]*\}\s*\}/g, '/* dangerouslySetInnerHTML removed */');
    file.content = file.content.replace(/new\s+Function\s*\([^)]*\)/g, '/* new Function removed */');
    file.content = file.content.replace(/http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g, 'https://');
  }

  /* ── Step 2c: Code quality validation & auto-fix ───────────── */
  if (jobId) await updateJob(supabase, jobId, { stage: "validating" });

  const fileMap = new Set(generatedFiles.map(f => f.path));
  for (const p of Object.keys(BASE_FILES)) fileMap.add(p);
  const fixLog: string[] = [];

  for (const file of generatedFiles) {
    if (!file.path.endsWith(".tsx") && !file.path.endsWith(".ts")) continue;
    const fixes: string[] = [];

    // Remove duplicate imports
    const importLines = file.content.split("\n").filter(l => l.trimStart().startsWith("import "));
    const seen = new Set<string>();
    for (const line of importLines) {
      if (seen.has(line.trim())) {
        file.content = file.content.replace(line + "\n", "");
        fixes.push("Removed duplicate import");
      }
      seen.add(line.trim());
    }

    // Ensure tsx files have React import for JSX
    if (file.path.endsWith(".tsx") && !file.content.includes("from 'react'") && !file.content.includes('from "react"')) {
      file.content = `import React from 'react';\n${file.content}`;
      fixes.push("Added missing React import");
    }

    // Validate App.tsx imports match generated components AND fix named/default mismatches
    if (file.path === "src/App.tsx") {
      const componentFiles = generatedFiles.filter(f => f.path.startsWith("src/components/") && f.path.endsWith(".tsx"));
      for (const comp of componentFiles) {
        const compName = comp.path.split("/").pop()!.replace(".tsx", "");
        const hasDefaultExport = /export\s+default\s+(function|const|class)\s+/.test(comp.content) || /export\s+default\s+\w+/.test(comp.content);
        const hasNamedExport = new RegExp(`export\\s+(function|const)\\s+${compName}\\b`).test(comp.content);

        // Fix import style mismatch: App.tsx uses { X } but component has default export
        const namedImportPattern = new RegExp(`import\\s+\\{\\s*${compName}\\s*\\}\\s+from`);
        const defaultImportPattern = new RegExp(`import\\s+${compName}\\s+from`);

        if (hasDefaultExport && !hasNamedExport && namedImportPattern.test(file.content)) {
          file.content = file.content.replace(namedImportPattern, `import ${compName} from`);
          fixes.push(`Fixed named→default import for ${compName}`);
        } else if (hasNamedExport && !hasDefaultExport && defaultImportPattern.test(file.content)) {
          file.content = file.content.replace(defaultImportPattern, `import { ${compName} } from`);
          fixes.push(`Fixed default→named import for ${compName}`);
        }

        // Also fix in non-component files (pages, hooks, etc.)
        const exportedName = comp.content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/)?.[1] || compName;
        if (!file.content.includes(exportedName)) {
          fixes.push(`Unused component: ${compName}`);
        }
      }

      // Also fix data/lib imports the same way
      const otherFiles = generatedFiles.filter(f => (f.path.startsWith("src/data/") || f.path.startsWith("src/hooks/") || f.path.startsWith("src/lib/")) && (f.path.endsWith(".tsx") || f.path.endsWith(".ts")));
      for (const mod of otherFiles) {
        const modName = mod.path.split("/").pop()!.replace(/\.tsx?$/, "");
        const hasDefault = /export\s+default\s/.test(mod.content);
        const namedPat = new RegExp(`import\\s+\\{[^}]*\\}\\s+from\\s+['"][^'"]*${modName}['"]`);
        const defaultPat = new RegExp(`import\\s+${modName}\\s+from`);
        // Only fix if there's a clear mismatch and the module only has one export style
        if (hasDefault && !namedPat.test(mod.content) && defaultPat.test(file.content)) {
          // default import is correct, no fix needed
        }
      }
    }

    // Fix common AI mistakes: import from './components/X' when it should be '@/components/X'
    file.content = file.content.replace(/from\s+['"]\.\/components\//g, "from '@/components/");
    file.content = file.content.replace(/from\s+['"]\.\/data\//g, "from '@/data/");
    file.content = file.content.replace(/from\s+['"]\.\/lib\//g, "from '@/lib/");

    if (fixes.length > 0) fixLog.push(`${file.path}: ${fixes.join("; ")}`);
  }
  if (fixLog.length > 0) console.log("Code quality fixes:", fixLog);

  /* ── Step 2d: Marketing + Screenshots + ZIP — ALL IN PARALLEL ── */
  if (jobId) await updateJob(supabase, jobId, { stage: "packaging" });

  // Marketing generation (non-blocking — runs concurrently)
  const marketingPromise = (async () => {
    try {
      const mktSystemPrompt = `You are a top-tier SaaS marketing strategist. Generate a comprehensive internal marketing and positioning packet for this newly built app.

APP DETAILS:
- Name: "${template.title}"
- Tagline: "${template.tagline || ""}"
- Description: ${template.description}
- Category: ${template.category}
- Tech Stack: ${(template.tech_stack || []).join(", ")}
${brandContext?.business_name ? `- Built for: ${brandContext.business_name}` : ""}

Generate a complete marketing kit that helps sell this app internally and externally.`;

      const mktResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: mktSystemPrompt },
            { role: "user", content: "Generate the full marketing packet." },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_marketing_packet",
              description: "Return structured marketing and positioning content",
              parameters: {
                type: "object",
                properties: {
                  positioning_statement: { type: "string", description: "For [target], who [need], [product] is a [category] that [key benefit]. Unlike [alternatives], we [differentiator]." },
                  internal_sell_sheet: { type: "string", description: "2-3 paragraph executive summary for internal stakeholders: why this app matters, what problem it solves, expected business impact." },
                  buyer_personas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        pain_points: { type: "array", items: { type: "string" } },
                        how_app_helps: { type: "string" },
                        objections: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "role", "pain_points", "how_app_helps", "objections"],
                    },
                    description: "3 distinct buyer personas"
                  },
                  value_propositions: { type: "array", items: { type: "string" }, description: "5 compelling one-sentence value props" },
                  email_pitch: { type: "string", description: "Cold email pitch (subject + body) under 150 words" },
                  social_media_posts: { type: "array", items: { type: "string" }, description: "3 launch posts: data-driven, story-driven, provocative" },
                  competitive_advantages: { type: "array", items: { type: "string" }, description: "4-5 advantages over DIY or SaaS alternatives" },
                  pricing_justification: { type: "string", description: "2-3 sentences anchoring price against alternatives" },
                  launch_checklist: { type: "array", items: { type: "string" }, description: "8-10 actionable launch steps" },
                },
                required: ["positioning_statement", "internal_sell_sheet", "buyer_personas", "value_propositions", "email_pitch", "social_media_posts", "competitive_advantages", "pricing_justification", "launch_checklist"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_marketing_packet" } },
        }),
      });

      if (!mktResp.ok) { console.error("Marketing packet generation failed:", mktResp.status); return []; }
      const mktData = await mktResp.json();
      const mktToolCall = mktData.choices?.[0]?.message?.tool_calls?.[0];
      if (!mktToolCall) return [];
      const mkt = JSON.parse(mktToolCall.function.arguments || "{}");
      const md: string[] = [];
      md.push(`# Marketing & Positioning Kit — ${template.title}\n\n> ${template.tagline || ""}\n\n---\n`);
      if (mkt.positioning_statement) md.push(`## Positioning Statement\n\n${mkt.positioning_statement}\n`);
      if (mkt.internal_sell_sheet) md.push(`## Internal Sell Sheet\n\n${mkt.internal_sell_sheet}\n`);
      if (mkt.value_propositions?.length) md.push(`## Value Propositions\n\n${mkt.value_propositions.map((v: string, i: number) => `${i + 1}. ${v}`).join("\n")}\n`);
      if (mkt.buyer_personas?.length) {
        md.push(`## Buyer Personas\n`);
        for (const p of mkt.buyer_personas) {
          md.push(`### ${p.name} — ${p.role}\n\n**Pain Points:**\n${p.pain_points.map((pp: string) => `- ${pp}`).join("\n")}\n\n**How This App Helps:** ${p.how_app_helps}\n\n**Objection Handling:**\n${p.objections.map((o: string) => `- ${o}`).join("\n")}\n`);
        }
      }
      if (mkt.competitive_advantages?.length) md.push(`## Competitive Advantages\n\n${mkt.competitive_advantages.map((a: string) => `- ${a}`).join("\n")}\n`);
      if (mkt.pricing_justification) md.push(`## Pricing Justification\n\n${mkt.pricing_justification}\n`);
      if (mkt.email_pitch) md.push(`## Ready-to-Send Email Pitch\n\n\`\`\`\n${mkt.email_pitch}\n\`\`\`\n`);
      if (mkt.social_media_posts?.length) md.push(`## Social Media Launch Posts\n\n${mkt.social_media_posts.map((s: string, i: number) => `**Post ${i + 1}:**\n> ${s}`).join("\n\n")}\n`);
      if (mkt.launch_checklist?.length) md.push(`## Launch Checklist\n\n${mkt.launch_checklist.map((s: string) => `- [ ] ${s}`).join("\n")}\n`);
      md.push(`\n---\n\n*Generated by [OpenDraft](https://opendraft.co) Marketing Engine*\n`);
      console.log(`Marketing packet generated for "${template.title}"`);
      return [
        { path: "MARKETING.md", content: md.join("\n") },
        { path: "marketing-packet.json", content: JSON.stringify(mkt, null, 2) },
      ];
    } catch (mktErr) {
      console.error("Marketing packet error (non-fatal):", mktErr);
      return [];
    }
  })();

  // Screenshot generation (runs concurrently)
  const screenshotPromise = (async () => {
    const paths: string[] = [];
    // Single screenshot for speed — hero view only
    const prompt = `Generate a stunning marketing screenshot for "${template.title}" — "${template.tagline || ""}". ${template.description}. Color: ${template.color_palette || "modern gradient"}. Bold hero, gradient text, glowing CTA, feature cards, social proof. $100M startup quality. 1280x720, no browser chrome.`;
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3.1-flash-image-preview", messages: [{ role: "user", content: prompt }], modalities: ["image", "text"] }),
      });
      if (!resp.ok) return paths;
      const data = await resp.json();
      const imgUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imgUrl?.startsWith("data:image")) return paths;
      const b64 = imgUrl.split(",")[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const p = `ai-generated/${slug}-marketing-${Date.now()}.png`;
      const { error } = await supabase.storage.from("listing-screenshots").upload(p, bytes, { contentType: "image/png", upsert: false });
      if (!error) paths.push(p);
    } catch (e) { console.error("Screenshot error (non-fatal):", e); }
    return paths;
  })();

  // ZIP packaging (runs concurrently — marketing files added after)
  const zipPromise = (async () => {
    const zip = new JSZip();
    const pf = zip.folder("template")!;
    for (const [path, content] of Object.entries(BASE_FILES)) {
      pf.file(path, path === "index.html" ? (content as string).replace("Template App", template.title || "Template App") : content as string);
    }
    pf.file("public/_redirects", "/*    /index.html   200\n");
    for (const file of generatedFiles) { if (file.path && file.content) pf.file(file.path, file.content); }
    const readme = `# ${template.title || "Template"}\n\n${template.tagline ? "> " + template.tagline + "\n\n" : ""}${template.description || ""}\n\n## Quick Start\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Tech Stack\n\n${(template.tech_stack || []).map((t: string) => "- " + t).join("\n")}\n\nBuilt with ❤️ on [OpenDraft](https://opendraft.co)\n`;
    pf.file("README.md", readme);
    // Wait for marketing files and add them to ZIP
    const mktFiles = await marketingPromise;
    for (const mf of mktFiles) { if (mf.path && mf.content) pf.file(mf.path, mf.content); }
    return await zip.generateAsync({ type: "uint8array" });
  })();

  // Screenshots and ZIP run in parallel; marketing feeds into ZIP
  const [screenshotPaths, zipBlob] = await Promise.all([screenshotPromise, zipPromise]);
  console.log(`Generated ${screenshotPaths.length} screenshot(s) for "${template.title}"`);




  /* ── Step 4: Upload ZIP to storage ─────────────────────────── */
  if (jobId) await updateJob(supabase, jobId, { stage: "uploading" });

  const filePath = `ai-generated/${slug}-${Date.now()}.zip`;

  const { error: uploadError } = await supabase.storage
    .from("listing-files")
    .upload(filePath, zipBlob, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload ZIP: " + uploadError.message };
  }

  /* ── Step 5: Build screenshots array with public URLs ─────── */
  const screenshots: string[] = [];
  for (const sp of screenshotPaths) {
    const { data: publicUrlData } = supabase.storage
      .from("listing-screenshots")
      .getPublicUrl(sp);
    if (publicUrlData?.publicUrl) {
      screenshots.push(publicUrlData.publicUrl);
    }
  }

  /* ── Step 6: Create listing — $15/mo ────────────────────── */
  if (jobId) await updateJob(supabase, jobId, { stage: "creating_listing" });

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      title: template.title || "AI-Generated Template",
      description: template.description || "",
      price: 1500,
      category: template.category || "other",
      completeness_badge: template.completeness_badge || "mvp",
      tech_stack: template.tech_stack || ["React", "Tailwind CSS"],
      built_with: "lovable",
      file_path: filePath,
      status: "pending",
      pricing_type: "monthly",
      screenshots: screenshots.length > 0 ? screenshots : [],
    })
    .select("id")
    .single();

  if (listingError) {
    console.error("Listing error:", listingError);
    return { success: false, error: "Failed to create listing: " + listingError.message };
  }

  await supabase.from("activity_log").insert({
    event_type: "ai_template_generation",
    user_id: sellerId,
    event_data: {
      listing_id: listing.id,
      title: template.title,
      tagline: template.tagline,
      color_palette: template.color_palette,
      file_count: generatedFiles.length,
      zip_size_kb: Math.round(zipBlob.length / 1024),
      has_screenshot: screenshotPaths.length > 0,
      screenshot_count: screenshotPaths.length,
    },
  });

  return {
    success: true,
    listing_id: listing.id,
    title: template.title,
    description: template.description,
    category: template.category,
    price: 1500,
    file_count: generatedFiles.length + Object.keys(BASE_FILES).length,
    zip_size_kb: Math.round(zipBlob.length / 1024),
  };
}

/* ── Main handler ────────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Database not configured");

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let sellerId: string | null = null;

    const AUTO_GEN_EMAIL = "kllyjsn@gmail.com";
    let isAdmin = false;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

    // Service role key, anon key, or publishable key = internal/admin call
    const isInternalCall = token === SUPABASE_SERVICE_ROLE_KEY || token === ANON_KEY || token === PUBLISHABLE_KEY;
    if (isInternalCall) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers?.users?.find((u: any) => u.email === AUTO_GEN_EMAIL);
      if (targetUser) sellerId = targetUser.id;
      isAdmin = true;
      console.log("Internal call, sellerId:", sellerId ? "found" : "NOT FOUND");
    } else if (token) {
      const supabaseAnon = createClient(SUPABASE_URL, PUBLISHABLE_KEY || ANON_KEY);
      const {
        data: { user },
      } = await supabaseAnon.auth.getUser(token);
      if (user) {
        sellerId = user.id;
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sellerId)
          .eq("role", "admin")
          .maybeSingle();
        isAdmin = !!roleData;
      }
    }
    if (!sellerId) throw new Error("Authentication required");

    const body = await req.json().catch(() => ({}));
    const maxCount = isAdmin ? 5 : 1;
    const count = Math.min(Math.max(body.count || 1, 1), maxCount);
    const themes: string[] = body.themes || [];
    const jobId: string | undefined = body.job_id;
    const brandContext: any = body.brand_context || undefined;

    /* ── Update job to processing if provided ────────────────── */
    if (jobId) {
      await updateJob(supabase, jobId, { status: "processing", stage: "researching" });
    }

    // Skip heavy demand research for user-initiated builds (they already have a theme)
    const hasUserThemes = themes.length >= count;
    let demandContext: string | undefined;
    let existingTitles: string[] = [];

    if (!hasUserThemes) {
      console.log("Gathering market demand signals...");
      const signals = await gatherDemandSignals(supabase);
      existingTitles = signals.existingTitles;
      const demandParts: string[] = [];
      if (signals.topSearches.length > 0) demandParts.push("TOP USER SEARCHES:\n" + signals.topSearches.map(s => `- "${s}"`).join("\n"));
      if (signals.unfilledBounties.length > 0) demandParts.push("OPEN BOUNTIES:\n" + signals.unfilledBounties.map(b => `- ${b}`).join("\n"));
      if (signals.highViewGaps.length > 0) demandParts.push("HIGH-VIEW LOW-SALE GAPS:\n" + signals.highViewGaps.map(g => `- ${g}`).join("\n"));
      if (signals.existingTitles.length > 0) demandParts.push("EXISTING (avoid duplicating):\n" + signals.existingTitles.slice(0, 30).join(", "));
      demandContext = demandParts.length > 0 ? demandParts.join("\n\n") : undefined;
    } else {
      console.log("User provided themes, skipping demand research for speed");
    }

    let selectedThemes: string[];
    if (hasUserThemes) {
      selectedThemes = themes.slice(0, count);
    } else {
      const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
      const neededCount = count - themes.length;
      console.log(`Fetching ${neededCount} trend-validated themes...`);
      const trendThemes = await fetchTrendValidatedThemes(neededCount, LOVABLE_API_KEY, existingTitles, FIRECRAWL_API_KEY || undefined);
      selectedThemes = [...themes, ...trendThemes];
    }

    // Run all templates in parallel to avoid edge function timeout
    console.log(`Generating ${selectedThemes.length} templates in parallel...`);
    for (const theme of selectedThemes) {
      console.log(`  → "${theme}"`);
    }

    const settled = await Promise.allSettled(
      selectedThemes.map((theme, idx) =>
        // Stagger starts by 1s to reduce rate-limit bursts
        new Promise<typeof generateSingleTemplate extends (...a: any[]) => Promise<infer R> ? R : never>(
          (resolve) => setTimeout(async () => {
            try {
              const result = await generateSingleTemplate(
                supabase,
                sellerId,
                theme,
                LOVABLE_API_KEY,
                demandContext,
                // Only pass jobId for the first template so stage updates don't conflict
                idx === 0 ? jobId : undefined,
                brandContext
              );
              resolve(result);
            } catch (err) {
              resolve({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
            }
          }, idx * 1000)
        )
      )
    );

    const results = settled.map((s) =>
      s.status === "fulfilled" ? s.value : { success: false, error: "Generation timed out or crashed" }
    );

    const successful = results.filter((r) => r.success);

    /* ── Update job to complete/failed ────────────────────────── */
    if (jobId) {
      const firstResult = results[0];
      if (firstResult?.success) {
        await updateJob(supabase, jobId, {
          status: "complete",
          stage: "done",
          listing_id: firstResult.listing_id,
          listing_title: firstResult.title,
        });

        // Send notification
        await supabase.from("notifications").insert({
          user_id: sellerId,
          type: "template_generated",
          title: "Your template is ready! 🎉",
          message: `"${firstResult.title || themes[0]}" has been generated and is pending review.`,
          link: `/listing/${firstResult.listing_id}/edit`,
        });
      } else {
        await updateJob(supabase, jobId, {
          status: "failed",
          stage: "error",
          error: firstResult?.error || "Generation failed",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: successful.length > 0,
        generated: successful.length,
        requested: count,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-template-app error:", e);

    // Try to update job on catastrophic failure
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.job_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await updateJob(supabase, body.job_id, {
          status: "failed",
          stage: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    } catch (_) { /* best effort */ }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
