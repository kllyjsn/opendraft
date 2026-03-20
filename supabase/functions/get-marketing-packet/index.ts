import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { listingId } = await req.json();
    if (!listingId) throw new Error("listingId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: listing } = await supabase
      .from("listings")
      .select("file_path, title")
      .eq("id", listingId)
      .single();

    if (!listing?.file_path) {
      return new Response(JSON.stringify({ packet: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: fileData, error: dlErr } = await supabase.storage
      .from("listing-files")
      .download(listing.file_path);

    if (dlErr || !fileData) {
      console.error("Download error:", dlErr);
      return new Response(JSON.stringify({ packet: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zip = new JSZip();
    await zip.loadAsync(await fileData.arrayBuffer());

    // Look for marketing-packet.json at any nesting level
    let packetContent: string | null = null;
    for (const [path, file] of Object.entries(zip.files)) {
      if (path.endsWith("marketing-packet.json") && !file.dir) {
        packetContent = await file.async("string");
        break;
      }
    }

    if (!packetContent) {
      return new Response(JSON.stringify({ packet: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const packet = JSON.parse(packetContent);

    return new Response(JSON.stringify({ packet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-marketing-packet error:", err);
    return new Response(JSON.stringify({ error: String(err), packet: null }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
