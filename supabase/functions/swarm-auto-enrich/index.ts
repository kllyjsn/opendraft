import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * swarm-auto-enrich — Autonomous listing quality booster
 * 
 * Runs on ALL live listings (no goals or deploy required).
 * Actions per listing:
 *  1. Rewrite weak titles/descriptions with AI
 *  2. Infer missing tech_stack tags
 *  3. Trigger screenshot capture for listings with demo_url but no screenshots
 *  4. Auto-set completeness_badge based on signals
 *  5. Flag low-quality listings for review
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 50;
    const dryRun = body.dry_run || false;

    // Track this run
    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "auto_enrich",
      action: "enrich_listings",
      status: "running",
      input: { batch_size: batchSize, dry_run: dryRun },
      triggered_by: body.triggered_by || "cron",
    }).select().single();

    const results = {
      checked: 0,
      enriched: 0,
      screenshots_triggered: 0,
      descriptions_improved: 0,
      tech_stack_added: 0,
      badges_updated: 0,
      zip_audits_triggered: 0,
      details: [] as any[],
    };

    // ── 1. Find listings that need enrichment ──
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, description, tech_stack, screenshots, demo_url, github_url, file_path, completeness_badge, category, price, sales_count, built_with, seller_id")
      .eq("status", "live")
      .order("updated_at", { ascending: true }) // oldest-updated first
      .limit(batchSize);

    if (!listings?.length) {
      await supabase.from("swarm_tasks").update({
        status: "completed", output: { message: "No listings to enrich" },
        completed_at: new Date().toISOString(),
      }).eq("id", task?.id);

      return new Response(JSON.stringify({ success: true, message: "No listings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    results.checked = listings.length;

    // ── 2. Score each listing's quality and identify gaps ──
    const needsWork: typeof listings = [];

    for (const l of listings) {
      const gaps: string[] = [];
      const hasScreenshot = l.screenshots?.length > 0 && l.screenshots[0] !== "" && !l.screenshots[0].endsWith(".svg");
      const weakTitle = !l.title || l.title.length < 15 || /^(my |test |untitled)/i.test(l.title);
      const weakDesc = !l.description || l.description.length < 50;
      const noTechStack = !l.tech_stack || l.tech_stack.length === 0;
      const hasDemoButNoScreenshot = l.demo_url && !hasScreenshot;

      if (weakTitle) gaps.push("weak_title");
      if (weakDesc) gaps.push("weak_description");
      if (noTechStack) gaps.push("no_tech_stack");
      if (hasDemoButNoScreenshot) gaps.push("missing_screenshot");
      if (!l.file_path && !l.github_url) gaps.push("no_deliverable");

      if (gaps.length > 0) {
        (l as any)._gaps = gaps;
        needsWork.push(l);
      }
    }

    if (needsWork.length === 0) {
      await supabase.from("swarm_tasks").update({
        status: "completed", output: { ...results, message: "All listings healthy" },
        completed_at: new Date().toISOString(),
      }).eq("id", task?.id);

      return new Response(JSON.stringify({ success: true, ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Batch AI enrichment for titles/descriptions/tech_stack ──
    const textNeedsWork = needsWork.filter((l: any) =>
      l._gaps?.includes("weak_title") || l._gaps?.includes("weak_description") || l._gaps?.includes("no_tech_stack")
    );

    if (textNeedsWork.length > 0) {
      const listingSummaries = textNeedsWork.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description?.substring(0, 300) || "",
        category: l.category,
        tech_stack: l.tech_stack || [],
        price: l.price,
        gaps: l._gaps,
        built_with: l.built_with,
      }));

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert product copywriter for OpenDraft, a marketplace for production-ready apps. Your job is to enrich listing metadata to maximize appeal and conversions.

Rules:
- Titles: 20-60 chars, specific & compelling. Include the app type. Never generic.
- Descriptions: 80-200 chars, benefit-focused. What does this app DO for the buyer?
- Tech stack: Infer from title, description, and built_with field. Common stacks: React, TypeScript, Tailwind CSS, Vite, Supabase, Node.js, Python, Next.js, etc.
- Only improve fields that are actually weak (check the gaps array).
- Keep the original meaning — enhance, don't reinvent.
- For tech_stack, always include at minimum: ["React", "TypeScript", "Tailwind CSS"] for Lovable-built apps.`
            },
            {
              role: "user",
              content: `Improve these ${listingSummaries.length} listings. Return enrichments for ONLY the gaps identified:\n\n${JSON.stringify(listingSummaries, null, 2)}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "enrich_listings",
              description: "Return enriched metadata for listings",
              parameters: {
                type: "object",
                properties: {
                  enrichments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Listing UUID" },
                        new_title: { type: "string" },
                        new_description: { type: "string" },
                        tech_stack: { type: "array", items: { type: "string" } },
                      },
                      required: ["id"]
                    }
                  }
                },
                required: ["enrichments"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "enrich_listings" } },
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const { enrichments } = JSON.parse(toolCall.function.arguments);

          for (const e of (enrichments || [])) {
            if (!e.id) continue;

            const original = textNeedsWork.find(l => l.id === e.id);
            if (!original) continue;

            const gaps = (original as any)._gaps || [];
            const updates: Record<string, any> = { updated_at: new Date().toISOString() };

            if (gaps.includes("weak_title") && e.new_title && e.new_title.length > 10) {
              updates.title = e.new_title;
              results.descriptions_improved++;
            }
            if (gaps.includes("weak_description") && e.new_description && e.new_description.length > 30) {
              updates.description = e.new_description;
              results.descriptions_improved++;
            }
            if (gaps.includes("no_tech_stack") && e.tech_stack?.length > 0) {
              updates.tech_stack = e.tech_stack;
              results.tech_stack_added++;
            }

            if (Object.keys(updates).length > 1 && !dryRun) {
              await supabase.from("listings").update(updates).eq("id", e.id);
              results.enriched++;
              results.details.push({ id: e.id, action: "text_enriched", updates: Object.keys(updates) });
            }
          }
        }
      }
    }

    // ── 4. Trigger screenshot capture for listings with demo_url but no screenshots ──
    const needScreenshot = needsWork.filter((l: any) => l._gaps?.includes("missing_screenshot"));

    for (const l of needScreenshot.slice(0, 15)) { // Max 15 at a time
      if (dryRun) {
        results.details.push({ id: l.id, action: "screenshot_skipped_dry_run" });
        continue;
      }

      if (!FIRECRAWL_API_KEY || !l.demo_url) continue;

      try {
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: l.demo_url,
            formats: ["screenshot"],
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const base64 = scrapeData.data?.screenshot || scrapeData.screenshot;

          if (base64) {
            const binaryStr = atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

            const path = `auto-enrich/${l.id}/${Date.now()}.png`;
            await supabase.storage.from("listing-screenshots").upload(path, bytes, {
              contentType: "image/png", upsert: true,
            });
            const { data: urlData } = supabase.storage.from("listing-screenshots").getPublicUrl(path);

            await supabase.from("listings").update({
              screenshots: [urlData.publicUrl],
              updated_at: new Date().toISOString(),
            }).eq("id", l.id);

            results.screenshots_triggered++;
            results.enriched++;
            results.details.push({ id: l.id, action: "screenshot_captured" });
          }
        }
      } catch (e) {
        console.error(`Screenshot failed for ${l.id}:`, e);
        results.details.push({ id: l.id, action: "screenshot_failed", error: String(e) });
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    }

    // ── 5. Auto-upgrade completeness badges based on signals ──
    for (const l of listings) {
      const hasFile = !!l.file_path || !!l.github_url;
      const hasScreenshot = l.screenshots?.length > 0 && l.screenshots[0] !== "";
      const hasDemo = !!l.demo_url;
      const hasSales = (l.sales_count || 0) > 0;

      let suggestedBadge = l.completeness_badge;

      if (hasFile && hasScreenshot && hasDemo && hasSales && l.completeness_badge === "prototype") {
        suggestedBadge = "mvp";
      } else if (hasFile && hasScreenshot && hasDemo && (l.sales_count || 0) >= 5 && l.completeness_badge !== "production_ready") {
        suggestedBadge = "production_ready";
      }

      if (suggestedBadge !== l.completeness_badge && !dryRun) {
        await supabase.from("listings").update({
          completeness_badge: suggestedBadge,
          updated_at: new Date().toISOString(),
        }).eq("id", l.id);
        results.badges_updated++;
        results.enriched++;
        results.details.push({ id: l.id, action: "badge_upgraded", from: l.completeness_badge, to: suggestedBadge });
      }
    }

    // ── 6. Auto-trigger ZIP audits for listings with file_path ──
    const auditable = listings.filter(l => l.file_path);
    let zip_audits_triggered = 0;

    for (const l of auditable.slice(0, 10)) {
      // Check if recently audited (7-day cooldown for ZIP audits)
      const { data: recentAudit } = await supabase
        .from("improvement_cycles")
        .select("id")
        .eq("listing_id", l.id)
        .eq("trigger", "zip_audit")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentAudit?.length) continue;

      if (!dryRun) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/swarm-zip-auditor`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              listing_id: l.id,
              file_path: l.file_path,
              seller_id: l.seller_id,
              title: l.title,
              description: l.description,
              triggered_by: "auto_enrich",
            }),
          });
          zip_audits_triggered++;
          results.details.push({ id: l.id, action: "zip_audit_triggered" });
        } catch (e) {
          console.error(`ZIP audit failed for ${l.id}:`, e);
          results.details.push({ id: l.id, action: "zip_audit_failed", error: String(e) });
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // ── 7. Auto-trigger app analyzer for listings with demo_url ──
    const analyzable = listings.filter(l => (l.demo_url || l.github_url) && !needsWork.some((n: any) => n.id === l.id && n._gaps?.includes("weak_description")));

    for (const l of analyzable.slice(0, 10)) {
      const { data: recentCycle } = await supabase
        .from("improvement_cycles")
        .select("id")
        .eq("listing_id", l.id)
        .gte("created_at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentCycle?.length) continue;

      if (!dryRun) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/swarm-app-analyzer`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              listing_id: l.id,
              trigger: "auto_enrich",
              user_id: l.seller_id,
            }),
          });
          results.details.push({ id: l.id, action: "analysis_triggered" });
        } catch (e) {
          console.error(`Analysis trigger failed for ${l.id}:`, e);
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // ── 8. Notify sellers about improvements ──
    const enrichedByOwner = new Map<string, string[]>();
    for (const l of listings) {
      const detail = results.details.find(d => d.id === l.id && d.action !== "screenshot_failed");
      if (detail) {
        const titles = enrichedByOwner.get(l.seller_id) || [];
        titles.push(l.title);
        enrichedByOwner.set(l.seller_id, titles);
      }
    }

    if (!dryRun) {
      for (const [sellerId, titles] of enrichedByOwner) {
        await supabase.from("notifications").insert({
          user_id: sellerId,
          type: "auto_enrichment",
          title: "🛠️ Gremlins improved your listings!",
          message: `Auto-enriched ${titles.length} listing${titles.length > 1 ? "s" : ""}: ${titles.slice(0, 3).join(", ")}${titles.length > 3 ? ` +${titles.length - 3} more` : ""}. Check your Dashboard for details.`,
          link: "/dashboard",
        });
      }
    }

    // Update task
    await supabase.from("swarm_tasks").update({
      status: "completed",
      output: results,
      completed_at: new Date().toISOString(),
    }).eq("id", task?.id);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Auto-enrich error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
