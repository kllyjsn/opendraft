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

    /* ── Auth ──────────────────────────────────────────────────── */
    const authHeader = req.headers.get("Authorization");
    const supabaseAnon = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    let sellerId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabaseAnon.auth.getUser(token);
      if (user) sellerId = user.id;
    }
    if (!sellerId) throw new Error("Authentication required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sellerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized — admin only");

    const body = await req.json().catch(() => ({}));
    const theme = body.theme || "modern SaaS";

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
              content: `You are an expert React developer who generates complete, production-quality React + Tailwind template apps. Generate a self-contained React template project. The code should be clean, modern, well-commented, and immediately usable. Use only React 18, Tailwind CSS, lucide-react for icons, and framer-motion for animations — no other dependencies. Generate ONLY the src/ files (App.tsx and any component files). Use relative imports within src/. Every component file should be in src/components/. The app should look polished with a cohesive color scheme and responsive layout.`,
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
                    price_cents: {
                      type: "number",
                      description: "Price in cents, $5-$99 range",
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
                    "price_cents",
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
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI code generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response generated");

    const template = JSON.parse(
      toolCall.function.arguments || '{"files":[]}'
    );

    if (!template.files?.length) throw new Error("AI generated no files");

    /* ── Step 2: Build ZIP ────────────────────────────────────── */
    const zip = new JSZip();
    const projectFolder = zip.folder("template")!;

    // Add base scaffold
    for (const [path, content] of Object.entries(BASE_FILES)) {
      // Update index.html title
      if (path === "index.html") {
        projectFolder.file(
          path,
          (content as string).replace("Template App", template.title || "Template App")
        );
      } else {
        projectFolder.file(path, content as string);
      }
    }

    // Add AI-generated files
    for (const file of template.files) {
      if (file.path && file.content) {
        projectFolder.file(file.path, file.content);
      }
    }

    // Add a README
    projectFolder.file(
      "README.md",
      `# ${template.title}\n\n${template.description}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Tech Stack\n\n${(template.tech_stack || []).map((t: string) => `- ${t}`).join("\n")}\n\nBuilt with ❤️ and listed on [OpenDraft](https://opendraft.lovable.app)\n`
    );

    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    /* ── Step 3: Upload ZIP to storage ─────────────────────────── */
    const slug = (template.title || "template")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const filePath = `ai-generated/${slug}-${Date.now()}.zip`;

    const { error: uploadError } = await supabase.storage
      .from("listing-files")
      .upload(filePath, zipBlob, {
        contentType: "application/zip",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload ZIP: " + uploadError.message);
    }

    /* ── Step 4: Create listing ────────────────────────────────── */
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        seller_id: sellerId,
        title: template.title || "AI-Generated Template",
        description: template.description || "",
        price: template.price_cents || 1900,
        category: template.category || "other",
        completeness_badge: template.completeness_badge || "mvp",
        tech_stack: template.tech_stack || ["React", "Tailwind CSS"],
        built_with: "lovable",
        file_path: filePath,
        status: "pending",
        pricing_type: "one_time",
      })
      .select("id")
      .single();

    if (listingError) {
      console.error("Listing error:", listingError);
      throw new Error("Failed to create listing: " + listingError.message);
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
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        listing_id: listing.id,
        title: template.title,
        description: template.description,
        category: template.category,
        price: template.price_cents,
        file_count: template.files.length + Object.keys(BASE_FILES).length,
        zip_size_kb: Math.round(zipBlob.length / 1024),
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
