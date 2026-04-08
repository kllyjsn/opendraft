import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const DEPLOY_FILES: Record<string, string> = {
  "netlify.toml": `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`,
  "_redirects": `/*    /index.html   200
`,
  "public/_redirects": `/*    /index.html   200
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
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth: admin only
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;

    // Get last N listings with file_path
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, file_path")
      .not("file_path", "is", null)
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({ message: "No listings with ZIPs found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; title: string; status: string; details?: string }[] = [];

    for (const listing of listings) {
      try {
        // Download existing ZIP
        const { data: fileData, error: dlError } = await supabase.storage
          .from("listing-files")
          .download(listing.file_path);

        if (dlError || !fileData) {
          results.push({ id: listing.id, title: listing.title, status: "download_failed", details: dlError?.message });
          continue;
        }

        const zipBuffer = await fileData.arrayBuffer();
        const zip = await JSZip.loadAsync(zipBuffer);

        // Find the root folder (could be "template/" or flat)
        const allPaths = Object.keys(zip.files);
        let prefix = "";
        
        // Check if files are in a subfolder
        const firstFile = allPaths.find(p => !zip.files[p].dir);
        if (firstFile && firstFile.includes("/")) {
          const parts = firstFile.split("/");
          if (parts.length > 1) {
            // Check if all files share the same root folder
            const potentialPrefix = parts[0] + "/";
            const allSharePrefix = allPaths.every(p => p.startsWith(potentialPrefix) || p === parts[0]);
            if (allSharePrefix) prefix = potentialPrefix;
          }
        }

        // Add deploy config files
        let filesAdded = 0;
        for (const [filename, content] of Object.entries(DEPLOY_FILES)) {
          const fullPath = prefix + filename;
          if (!zip.files[fullPath]) {
            zip.file(fullPath, content);
            filesAdded++;
          }
        }

        if (filesAdded === 0) {
          results.push({ id: listing.id, title: listing.title, status: "already_patched" });
          continue;
        }

        // Re-upload patched ZIP
        const patchedZip = await zip.generateAsync({ type: "uint8array" });

        // Delete old file and upload new one at same path
        await supabase.storage.from("listing-files").remove([listing.file_path]);
        
        const { error: uploadError } = await supabase.storage
          .from("listing-files")
          .upload(listing.file_path, patchedZip, {
            contentType: "application/zip",
            upsert: true,
          });

        if (uploadError) {
          results.push({ id: listing.id, title: listing.title, status: "upload_failed", details: uploadError.message });
          continue;
        }

        results.push({ id: listing.id, title: listing.title, status: "patched", details: `Added ${filesAdded} deploy config files` });
      } catch (err) {
        console.error(`Error patching ${listing.title}:`, err);
        results.push({ id: listing.id, title: listing.title, status: "error", details: err instanceof Error ? err.message : "Unknown" });
      }
    }

    const patchedCount = results.filter(r => r.status === "patched").length;
    const alreadyGood = results.filter(r => r.status === "already_patched").length;

    return new Response(JSON.stringify({
      message: `Patched ${patchedCount} ZIPs, ${alreadyGood} already had deploy configs`,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("patch-deploy-configs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
