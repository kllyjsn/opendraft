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
        "lucide-react": "^0.462.0",
        "framer-motion": "^12.0.0",
      },
      devDependencies: {
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
        noUnusedLocals: true,
        noUnusedParameters: true,
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
});
`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
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
    <title>Template App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
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
`,
};

/* ── Themes pool for daily auto-generation ─────────────────────── */
const THEME_POOL = [
  "AI-powered writing assistant",
  "SaaS analytics dashboard",
  "Project management kanban board",
  "Personal finance tracker",
  "Recipe discovery platform",
  "Fitness workout planner",
  "Social media scheduler",
  "Customer support ticketing system",
  "E-learning course platform",
  "Real estate listing browser",
  "Podcast player and discovery app",
  "Job board and applicant tracker",
  "Habit tracker with streaks",
  "Team collaboration whiteboard",
  "Invoice and billing manager",
  "Weather dashboard with forecasts",
  "Travel itinerary planner",
  "Cryptocurrency portfolio tracker",
  "Restaurant reservation system",
  "Event management platform",
  "AI chatbot builder interface",
  "Email newsletter manager",
  "Inventory management system",
  "Code snippet library",
  "Video conferencing landing page",
  "Music streaming player UI",
  "Online marketplace storefront",
  "Health and wellness tracker",
  "Task automation workflow builder",
  "Blog and CMS admin panel",
];

/* ── Deep market research: gather demand signals ────────────────── */
async function gatherDemandSignals(
  supabase: ReturnType<typeof createClient>
): Promise<{ topSearches: string[]; unfilledBounties: string[]; highViewGaps: string[]; existingTitles: string[] }> {
  // 1. Top search queries — what people are looking for
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

  // 2. Open bounties with low submissions — explicit unmet demand
  const { data: bounties } = await supabase
    .from("bounties")
    .select("title, description, category")
    .eq("status", "open")
    .order("budget", { ascending: false })
    .limit(10);
  const unfilledBounties = (bounties || []).map(b => `${b.title} (${b.category})`);

  // 3. High-view, low-sale listings — interest but no conversion (price/quality gap)
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

  // 4. Existing titles — avoid duplication
  const { data: existing } = await supabase
    .from("listings")
    .select("title")
    .limit(200);
  const existingTitles = (existing || []).map(l => l.title);

  return { topSearches, unfilledBounties, highViewGaps, existingTitles };
}

/* ── Generate a single template app ─────────────────────────────── */
async function generateSingleTemplate(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  theme: string,
  LOVABLE_API_KEY: string,
  demandContext?: string
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
          {
            role: "system",
            content: `You are an expert React developer who generates complete, production-quality React + Tailwind template apps. Generate a self-contained React template project. The code should be clean, modern, well-commented, and immediately usable. Use only React 18, Tailwind CSS, lucide-react for icons, and framer-motion for animations — no other dependencies. Generate ONLY the src/ files (App.tsx and any component files). Use relative imports within src/. Every component file should be in src/components/. The app should look polished with a cohesive color scheme and responsive layout.

IMPORTANT: You must build products people actually want. Use the market research data below to inform your design decisions — prioritize features and UX patterns that align with proven demand signals.${demandContext ? `\n\n--- MARKET RESEARCH ---\n${demandContext}` : ""}`,
          },
          {
            role: "user",
            content: `Generate a complete template app with theme: "${theme}". Make it visually impressive, functional, and immediately useful as a starter template. Include at least 3-4 component files plus App.tsx.`,
          },
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
                    description: "Product title, 3-8 words",
                  },
                  description: {
                    type: "string",
                    description:
                      "Compelling 2-3 sentence marketplace description",
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
                    description: "3-6 technologies used",
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
                          description: "Full file content",
                        },
                      },
                      required: ["path", "content"],
                      additionalProperties: false,
                    },
                    description:
                      "All source files to include (src/App.tsx + components)",
                  },
                },
                required: [
                  "title",
                  "description",
                  "category",
                  "completeness_badge",
                  "tech_stack",
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

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { success: false, error: "No AI response generated" };

  const template = JSON.parse(
    toolCall.function.arguments || '{"files":[]}'
  );

  if (!template.files?.length)
    return { success: false, error: "AI generated no files" };

  /* ── Step 2: Generate TWO preview screenshots via AI ────── */
  const screenshotPaths: string[] = [];
  const slug = (template.title || "template")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);

  const screenshotPrompts = [
    // 1. Marketing / landing page hero view
    `Generate a stunning, high-fidelity marketing landing page screenshot for a web application called "${template.title}". Description: "${template.description}". Show a hero section with a bold headline, subheadline, a prominent CTA button, feature highlights, and social proof elements. Use a modern gradient background, professional typography, and vibrant accent colors. The design should look like a polished Product Hunt-ready landing page. 1280x720 resolution, browser chrome NOT visible — just the page content.`,
    // 2. App dashboard / interface view
    `Generate a realistic, detailed app interface screenshot for a web application called "${template.title}". Description: "${template.description}". Show the main functional dashboard/workspace view with navigation sidebar or top nav, data cards, tables or content areas, and interactive UI elements populated with realistic sample data. Use a clean light theme with subtle shadows and a cohesive color palette. It should look like a real working application, NOT a landing page. 1280x720 resolution, browser chrome NOT visible — just the app UI.`,
  ];

  // Generate both screenshots in parallel for speed
  const imgResults = await Promise.allSettled(
    screenshotPrompts.map(async (prompt, idx) => {
      const imgResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!imgResponse.ok) return null;
      const imgData = await imgResponse.json();
      const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl?.startsWith("data:image")) return null;

      const base64Data = imageUrl.split(",")[1];
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const label = idx === 0 ? "marketing" : "app";
      const path = `ai-generated/${slug}-${label}-${Date.now()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("listing-screenshots")
        .upload(path, bytes, { contentType: "image/png", upsert: false });

      if (uploadErr) {
        console.error(`Screenshot ${label} upload error:`, uploadErr);
        return null;
      }
      return path;
    })
  );

  for (const r of imgResults) {
    if (r.status === "fulfilled" && r.value) {
      screenshotPaths.push(r.value);
    }
  }
  console.log(`Generated ${screenshotPaths.length}/2 screenshots for "${template.title}"`);

  /* ── Step 3: Build ZIP ────────────────────────────────────── */
  const zip = new JSZip();
  const projectFolder = zip.folder("template")!;

  for (const [path, content] of Object.entries(BASE_FILES)) {
    if (path === "index.html") {
      projectFolder.file(
        path,
        (content as string).replace(
          "Template App",
          template.title || "Template App"
        )
      );
    } else {
      projectFolder.file(path, content as string);
    }
  }

  for (const file of template.files) {
    if (file.path && file.content) {
      projectFolder.file(file.path, file.content);
    }
  }

  projectFolder.file(
    "README.md",
    `# ${template.title}\n\n${template.description}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Tech Stack\n\n${(template.tech_stack || []).map((t: string) => `- ${t}`).join("\n")}\n\nBuilt with ❤️ and listed on [OpenDraft](https://opendraft.lovable.app)\n`
  );

  const zipBlob = await zip.generateAsync({ type: "uint8array" });

  /* ── Step 4: Upload ZIP to storage ─────────────────────────── */
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

  // Log the generation
  await supabase.from("activity_log").insert({
    event_type: "ai_template_generation",
    user_id: sellerId,
    event_data: {
      listing_id: listing.id,
      title: template.title,
      file_count: template.files.length,
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
    file_count: template.files.length + Object.keys(BASE_FILES).length,
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

    /* ── Auth — support both user session & service-role (cron) ── */
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let sellerId: string | null = null;

    // Check if this is a service-role call (cron job)
    const AUTO_GEN_EMAIL = "kllyjsn@gmail.com";
    let isAdmin = false;
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      // Cron/service-role bypass — use Jason Kelley as the seller
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUser = authUsers?.users?.find((u: any) => u.email === AUTO_GEN_EMAIL);
      if (targetUser) sellerId = targetUser.id;
      isAdmin = true;
    } else if (token) {
      const supabaseAnon = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_ANON_KEY") || ""
      );
      const {
        data: { user },
      } = await supabaseAnon.auth.getUser(token);
      if (user) {
        sellerId = user.id;
        // Check if admin (for higher limits)
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
    // Non-admins limited to 1 template at a time
    const maxCount = isAdmin ? 5 : 1;
    const count = Math.min(Math.max(body.count || 1, 1), maxCount);
    const themes: string[] = body.themes || [];

    /* ── Deep research: gather demand signals ────────────────── */
    console.log("Gathering market demand signals...");
    const signals = await gatherDemandSignals(supabase);

    // Build demand context string for AI
    const demandParts: string[] = [];
    if (signals.topSearches.length > 0) {
      demandParts.push(`TOP USER SEARCHES (what people are actively looking for):\n${signals.topSearches.map(s => `- "${s}"`).join("\n")}`);
    }
    if (signals.unfilledBounties.length > 0) {
      demandParts.push(`OPEN BOUNTIES (explicit paid demand):\n${signals.unfilledBounties.map(b => `- ${b}`).join("\n")}`);
    }
    if (signals.highViewGaps.length > 0) {
      demandParts.push(`HIGH-VIEW LOW-SALE GAPS (interest but no conversion — opportunity to build better versions):\n${signals.highViewGaps.map(g => `- ${g}`).join("\n")}`);
    }
    if (signals.existingTitles.length > 0) {
      demandParts.push(`EXISTING LISTINGS (avoid duplicating these):\n${signals.existingTitles.slice(0, 30).join(", ")}`);
    }
    const demandContext = demandParts.length > 0 ? demandParts.join("\n\n") : undefined;

    /* ── Pick themes (use provided or random from pool) ──────── */
    const selectedThemes: string[] = [];
    const usedIndices = new Set<number>();
    for (let i = 0; i < count; i++) {
      if (themes[i]) {
        selectedThemes.push(themes[i]);
      } else {
        let idx: number;
        do {
          idx = Math.floor(Math.random() * THEME_POOL.length);
        } while (usedIndices.has(idx) && usedIndices.size < THEME_POOL.length);
        usedIndices.add(idx);
        selectedThemes.push(THEME_POOL[idx]);
      }
    }

    /* ── Generate templates sequentially (to avoid rate limits) ─ */
    const results: Array<{
      success: boolean;
      title?: string;
      listing_id?: string;
      error?: string;
      file_count?: number;
      zip_size_kb?: number;
    }> = [];

    for (const theme of selectedThemes) {
      console.log(`Generating template: "${theme}" (with ${signals.topSearches.length} demand signals)...`);
      const result = await generateSingleTemplate(
        supabase,
        sellerId,
        theme,
        LOVABLE_API_KEY,
        demandContext
      );
      results.push(result);

      // Brief pause between generations to be nice to the AI API
      if (selectedThemes.indexOf(theme) < selectedThemes.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const successful = results.filter((r) => r.success);

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
