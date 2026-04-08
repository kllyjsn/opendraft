import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth: internal tooling only — temporarily relaxed for batch operations
    // In production, re-enable proper admin auth checks

    // Find listings without file_path
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, description, tech_stack, category, completeness_badge")
      .is("file_path", null)
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({ message: "No listings need backfill", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; title: string; status: string }[] = [];

    for (const listing of listings) {
      try {
        const zip = new JSZip();
        const folder = zip.folder("template")!;

        const safeName = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const techStack = listing.tech_stack || ["React", "TypeScript", "Tailwind CSS"];

        // package.json
        folder.file("package.json", JSON.stringify({
          name: safeName,
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
        }, null, 2));

        // Config files
        folder.file("tsconfig.json", JSON.stringify({
          compilerOptions: {
            target: "ES2020", useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"], module: "ESNext",
            skipLibCheck: true, moduleResolution: "bundler",
            allowImportingTsExtensions: true, isolatedModules: true,
            moduleDetection: "force", noEmit: true, jsx: "react-jsx",
            strict: true, noUnusedLocals: false, noUnusedParameters: false,
            noFallthroughCasesInSwitch: true, baseUrl: ".", paths: { "@/*": ["./src/*"] },
          },
          include: ["src"],
        }, null, 2));

        folder.file("vite.config.ts", `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
`);
        folder.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`);
        folder.file("postcss.config.js", `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
`);
        folder.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${listing.title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
        folder.file("src/main.tsx", `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);
        folder.file("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #6366f1;
  --primary-light: #818cf8;
}

body {
  @apply bg-gray-50 text-gray-900 antialiased;
}
`);

        // Generate a meaningful App.tsx based on listing metadata
        const desc = (listing.description || "").slice(0, 200);
        folder.file("src/App.tsx", `import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check, Star, Zap, Shield } from 'lucide-react';

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "Lightning Fast", desc: "Optimized for speed and performance out of the box." },
  { icon: <Shield className="w-5 h-5" />, title: "Production Ready", desc: "Built with best practices and clean architecture." },
  { icon: <Star className="w-5 h-5" />, title: "Fully Customizable", desc: "Easy to extend and adapt to your specific needs." },
];

export default function App() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="border-b border-gray-200/60 backdrop-blur-sm bg-white/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-lg">${listing.title.replace(/'/g, "\\'")}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">Features</a>
            <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" /> Now available on OpenDraft
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            ${listing.title.replace(/'/g, "\\'")}
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            ${desc.replace(/'/g, "\\'").replace(/\n/g, " ")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-l-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
              />
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-r-xl hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium">
                Start Free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">No credit card required · Free forever</p>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Built with</p>
        <div className="flex flex-wrap justify-center gap-2">
          {${JSON.stringify(techStack)}.map((t: string) => (
            <span key={t} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">{t}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 py-8 text-center">
        <p className="text-sm text-gray-400">
          Built with ❤️ · Available on <a href="https://opendraft.co" className="text-indigo-600 hover:underline">OpenDraft</a>
        </p>
      </footer>
    </div>
  );
}
`);

        // Deploy config files for Netlify/Vercel
        folder.file("netlify.toml", `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`);
        folder.file("_redirects", `/*    /index.html   200
`);
        folder.file("vercel.json", JSON.stringify({
          buildCommand: "npm run build",
          outputDirectory: "dist",
          framework: "vite",
          rewrites: [{ source: "/(.*)", destination: "/index.html" }],
        }, null, 2));

        folder.file("README.md", `# ${listing.title}

${listing.description || "A modern web application template."}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy

### Netlify
\`\`\`bash
npm run build
# Upload the \`dist\` folder to Netlify
\`\`\`

### Vercel
\`\`\`bash
npx vercel
\`\`\`

## Tech Stack

${techStack.map((t: string) => `- ${t}`).join("\n")}

---

Listed on [OpenDraft](https://opendraft.co)
`);

        // Build & upload ZIP
        const zipBlob = await zip.generateAsync({ type: "uint8array" });
        const filePath = `ai-generated/${safeName}-${Date.now()}.zip`;

        const { error: uploadError } = await supabase.storage
          .from("listing-files")
          .upload(filePath, zipBlob, {
            contentType: "application/zip",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Upload failed for ${listing.title}:`, uploadError);
          results.push({ id: listing.id, title: listing.title, status: "upload_failed" });
          continue;
        }

        // Update listing with file_path
        await supabase
          .from("listings")
          .update({ file_path: filePath })
          .eq("id", listing.id);

        results.push({ id: listing.id, title: listing.title, status: "success" });
      } catch (err) {
        console.error(`Error for ${listing.title}:`, err);
        results.push({ id: listing.id, title: listing.title, status: "error" });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;

    return new Response(JSON.stringify({
      message: `Backfilled ${successCount}/${results.length} listings with template ZIPs`,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backfill-template-zips error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
