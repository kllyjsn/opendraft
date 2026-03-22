import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Expanded target industries for maximum coverage
const TARGET_INDUSTRIES = [
  { name: "Home Services", niches: ["cleaning service", "plumber", "HVAC contractor", "landscaping", "roofing contractor", "electrician", "handyman", "pest control", "moving company", "pressure washing"] },
  { name: "Food & Beverage", niches: ["restaurant", "cafe", "bakery", "catering", "food truck", "bar", "pizzeria", "juice bar", "ice cream shop", "brewery"] },
  { name: "Health & Wellness", niches: ["dental office", "medical clinic", "gym", "spa", "chiropractic", "physical therapy", "yoga studio", "pilates studio", "acupuncture", "massage therapy"] },
  { name: "Professional Services", niches: ["law firm", "accounting firm", "photographer", "consulting", "real estate agent", "insurance agency", "financial advisor", "architect", "interior designer", "marketing agency"] },
  { name: "Automotive", niches: ["auto repair shop", "car wash", "auto detailing", "tire shop", "body shop", "oil change", "auto parts store", "motorcycle repair", "RV repair", "boat repair"] },
  { name: "Beauty & Personal Care", niches: ["hair salon", "barbershop", "nail salon", "tattoo shop", "esthetician", "makeup artist", "lash studio", "tanning salon", "waxing studio", "med spa"] },
  { name: "Retail & Local Shops", niches: ["boutique", "florist", "pet store", "gift shop", "hardware store", "jewelry store", "antique shop", "bike shop", "craft store", "furniture store"] },
  { name: "Education & Childcare", niches: ["daycare center", "tutoring center", "music lessons", "martial arts school", "dance studio", "preschool", "driving school", "art classes", "swim lessons", "coding bootcamp"] },
  { name: "Events & Entertainment", niches: ["wedding venue", "event planner", "DJ service", "photographer", "party rental", "escape room", "bowling alley", "mini golf", "arcade", "trampoline park"] },
  { name: "Pet Services", niches: ["veterinary clinic", "pet grooming", "dog training", "pet boarding", "dog walking", "pet sitting", "pet store", "animal hospital", "pet daycare", "mobile vet"] },
  { name: "Construction & Trades", niches: ["general contractor", "painter", "flooring company", "kitchen remodel", "bathroom remodel", "fence company", "deck builder", "concrete contractor", "masonry", "drywall"] },
  { name: "Real Estate & Property", niches: ["property management", "real estate agency", "home staging", "home inspection", "mortgage broker", "title company", "appraisal", "commercial real estate", "vacation rental", "storage facility"] },
];

// Comprehensive services we offer
const SERVICES_OFFERED = [
  { name: "Custom Website", description: "Modern, mobile-first website with booking/contact forms", price_range: "$500-2000", ideal_for: ["all"] },
  { name: "Online Booking System", description: "Let customers book appointments 24/7", price_range: "$300-800", ideal_for: ["Health & Wellness", "Beauty & Personal Care", "Professional Services"] },
  { name: "Online Ordering", description: "Full ecommerce or food ordering system", price_range: "$800-2500", ideal_for: ["Food & Beverage", "Retail & Local Shops"] },
  { name: "Customer Portal", description: "Client login area for invoices, documents, status updates", price_range: "$600-1500", ideal_for: ["Professional Services", "Construction & Trades"] },
  { name: "Review Management", description: "Automated review requests and reputation dashboard", price_range: "$200-500", ideal_for: ["all"] },
  { name: "Landing Page", description: "High-converting single page for ads/promotions", price_range: "$200-600", ideal_for: ["all"] },
  { name: "Quote Calculator", description: "Interactive pricing tool for services", price_range: "$400-1000", ideal_for: ["Home Services", "Construction & Trades", "Automotive"] },
  { name: "Gallery & Portfolio", description: "Showcase work with beautiful image galleries", price_range: "$300-700", ideal_for: ["Professional Services", "Beauty & Personal Care", "Construction & Trades"] },
  { name: "Email Marketing Setup", description: "Newsletter templates and automation", price_range: "$200-500", ideal_for: ["all"] },
  { name: "Google Business Optimization", description: "Local SEO and GMB profile optimization", price_range: "$150-400", ideal_for: ["all"] },
];

// Email templates for different scenarios
const EMAIL_TEMPLATES = {
  initial: "initial_outreach",
  follow_up_1: "follow_up_gentle",
  follow_up_2: "follow_up_value",
  follow_up_3: "follow_up_final",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full_cycle";
    const targetIndustry = body.industry || null;
    const targetRegion = body.region || "United States";
    const campaignId = body.campaign_id || null;

    // Create task record
    const { data: task } = await supabase.from("swarm_tasks").insert({
      agent_type: "b2b_outreach",
      action,
      status: "running",
      input: body,
      triggered_by: body.triggered_by || "manual",
    }).select().single();

    const taskId = task?.id;

    try {
      let result: any = {};

      switch (action) {
        case "discover_businesses":
          result = await discoverBusinesses(supabase, FIRECRAWL_API_KEY, targetIndustry, targetRegion, campaignId);
          break;
        case "evaluate_leads":
          result = await evaluateLeads(supabase, LOVABLE_API_KEY, FIRECRAWL_API_KEY, campaignId);
          break;
        case "generate_outreach":
          result = await generateOutreachMessages(supabase, LOVABLE_API_KEY, campaignId);
          break;
        case "generate_demos":
          result = await generateDemosForLeads(supabase, LOVABLE_API_KEY, campaignId);
          break;
        case "send_emails":
          result = await sendOutreachEmails(supabase, RESEND_API_KEY, campaignId);
          break;
        case "send_single":
          result = await sendSingleEmail(supabase, RESEND_API_KEY, body.message_id);
          break;
        case "reply_to_lead":
          result = await replyToLead(supabase, RESEND_API_KEY, body.lead_id, body.campaign_id, body.subject, body.body);
          break;
        case "send_follow_ups":
          result = await sendFollowUpEmails(supabase, LOVABLE_API_KEY, RESEND_API_KEY, campaignId);
          break;
        case "full_cycle":
        default:
          // Run full pipeline
          const discovered = await discoverBusinesses(supabase, FIRECRAWL_API_KEY, targetIndustry, targetRegion, campaignId);
          const evaluated = await evaluateLeads(supabase, LOVABLE_API_KEY, FIRECRAWL_API_KEY, campaignId);
          const demos = await generateDemosForLeads(supabase, LOVABLE_API_KEY, campaignId);
          const messages = await generateOutreachMessages(supabase, LOVABLE_API_KEY, campaignId);
          result = {
            discovered,
            evaluated,
            demos,
            messages,
            summary: {
              businesses_found: discovered.leads_created || 0,
              leads_scored: evaluated.leads_scored || 0,
              messages_drafted: messages.messages_drafted || 0,
            }
          };
          break;
      }

      await supabase.from("swarm_tasks").update({
        status: "completed",
        output: result,
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);

      return new Response(JSON.stringify({ success: true, task_id: taskId, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (agentError) {
      await supabase.from("swarm_tasks").update({
        status: "failed",
        error: agentError instanceof Error ? agentError.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("id", taskId);

      throw agentError;
    }

  } catch (e) {
    console.error("B2B outreach agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Discover REAL businesses using Firecrawl search + website scraping
async function discoverBusinesses(
  supabase: any,
  firecrawlKey: string | undefined,
  targetIndustry: string | null,
  region: string,
  campaignId: string | null
): Promise<any> {
  const leads: any[] = [];

  if (!firecrawlKey) {
    return { leads_created: 0, error: "FIRECRAWL_API_KEY required for real business discovery" };
  }

  // Pick industries to search
  const industries = targetIndustry
    ? TARGET_INDUSTRIES.filter(i => i.name.toLowerCase().includes(targetIndustry.toLowerCase()))
    : TARGET_INDUSTRIES.slice(0, 2);

  // Get or create a campaign
  let activeCampaignId = campaignId;
  if (!activeCampaignId) {
    const { data: existingCampaign } = await supabase
      .from("outreach_campaigns")
      .select("id")
      .eq("status", "active")
      .single();

    if (existingCampaign) {
      activeCampaignId = existingCampaign.id;
    } else {
      const { data: newCampaign } = await supabase
        .from("outreach_campaigns")
        .insert({
          name: `Real Leads - ${new Date().toLocaleDateString()}`,
          niche: "small_business",
          industries: industries.map(i => i.name),
          target_regions: [region],
          services: SERVICES_OFFERED,
          goals: { target_leads_per_week: 25, target_response_rate: 0.08 }
        })
        .select()
        .single();
      activeCampaignId = newCampaign?.id;
    }
  }

  // US cities to target for local businesses
  const targetCities = [
    "Austin TX", "Denver CO", "Nashville TN", "Charlotte NC", "Tampa FL",
    "Phoenix AZ", "Portland OR", "San Antonio TX", "Columbus OH", "Indianapolis IN",
    "Raleigh NC", "Salt Lake City UT", "Boise ID", "Jacksonville FL", "Oklahoma City OK"
  ];

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  for (const industry of industries) {
    const niches = industry.niches.sort(() => Math.random() - 0.5).slice(0, 2);
    const cities = targetCities.sort(() => Math.random() - 0.5).slice(0, 2);

    for (const niche of niches) {
      for (const city of cities) {
        // Search for real businesses via Yelp/Google results
        const searchQueries = [
          `best ${niche} in ${city}`,
          `${niche} near ${city} reviews`,
        ];
        const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];

        try {
          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 5,
              scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
            }),
          });

          if (!searchResp.ok) {
            console.warn(`Search failed (${searchResp.status}) for: ${query}`);
            continue;
          }

          const searchData = await searchResp.json();
          if (!searchData.data) continue;

          // Skip aggregator sites — we want direct business websites
          const aggregatorDomains = [
            "yelp.com", "facebook.com", "yellowpages.com", "google.com",
            "mapquest.com", "bbb.org", "angi.com", "thumbtack.com",
            "homeadvisor.com", "nextdoor.com", "tripadvisor.com",
            "instagram.com", "twitter.com", "linkedin.com", "pinterest.com",
            "tiktok.com", "youtube.com", "reddit.com", "wikipedia.org",
          ];

          for (const result of searchData.data) {
            if (!result.url) continue;
            const urlLower = result.url.toLowerCase();
            if (aggregatorDomains.some(d => urlLower.includes(d))) continue;

            // Check for duplicate
            const domain = new URL(result.url).hostname.replace(/^www\./, "");
            const { data: existing } = await supabase
              .from("outreach_leads")
              .select("id")
              .or(`website_url.ilike.%${domain}%`)
              .limit(1);

            if (existing && existing.length > 0) continue;

            // Extract contact info from the page content
            const pageContent = result.markdown || result.description || "";

            // Try to extract email from page content directly
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const foundEmails = pageContent.match(emailRegex) || [];
            // Filter out generic/spam emails
            const validEmails = foundEmails.filter((e: string) => {
              const lower = e.toLowerCase();
              return !lower.includes("example.com") &&
                !lower.includes("sentry.io") &&
                !lower.includes("wixpress") &&
                !lower.includes("googleapis") &&
                !lower.startsWith("noreply") &&
                !lower.startsWith("no-reply");
            });

            let contactEmail = validEmails[0] || null;
            let contactName: string | null = null;
            let businessName = result.title?.split(" - ")[0]?.split(" | ")[0]?.trim() || domain;

            // If no email found in search content, scrape the business website directly
            if (!contactEmail) {
              try {
                const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${firecrawlKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url: result.url,
                    formats: ["markdown", "links"],
                    onlyMainContent: false, // Need footer/contact sections
                  }),
                });

                if (scrapeResp.ok) {
                  const scrapeData = await scrapeResp.json();
                  const fullContent = scrapeData.data?.markdown || scrapeData.markdown || "";
                  const allEmails = fullContent.match(emailRegex) || [];
                  const realEmails = allEmails.filter((e: string) => {
                    const lower = e.toLowerCase();
                    return !lower.includes("example.com") &&
                      !lower.includes("sentry") &&
                      !lower.includes("wixpress") &&
                      !lower.startsWith("noreply") &&
                      !lower.startsWith("no-reply");
                  });
                  contactEmail = realEmails[0] || null;

                  // Also check for contact/about pages in links
                  if (!contactEmail && scrapeData.data?.links) {
                    const contactPages = scrapeData.data.links.filter((l: string) =>
                      /contact|about|team/i.test(l)
                    ).slice(0, 1);

                    for (const contactUrl of contactPages) {
                      try {
                        const contactResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${firecrawlKey}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            url: contactUrl,
                            formats: ["markdown"],
                            onlyMainContent: false,
                          }),
                        });

                        if (contactResp.ok) {
                          const contactData = await contactResp.json();
                          const contactContent = contactData.data?.markdown || contactData.markdown || "";
                          const contactEmails = contactContent.match(emailRegex) || [];
                          const filteredContactEmails = contactEmails.filter((e: string) => {
                            const lower = e.toLowerCase();
                            return !lower.includes("example.com") &&
                              !lower.includes("sentry") &&
                              !lower.startsWith("noreply");
                          });
                          contactEmail = filteredContactEmails[0] || null;

                          // Try to extract owner/contact name with AI
                          if (contactEmail && LOVABLE_API_KEY && contactContent.length > 50) {
                            try {
                              const nameResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  model: "google/gemini-2.5-flash-lite",
                                  messages: [{
                                    role: "user",
                                    content: `Extract the business owner or primary contact person's name from this page content. Return ONLY the name, or "unknown" if not found. No explanation.\n\n${contactContent.slice(0, 1500)}`
                                  }],
                                }),
                              });
                              if (nameResp.ok) {
                                const nameData = await nameResp.json();
                                const name = nameData.choices?.[0]?.message?.content?.trim();
                                if (name && name.toLowerCase() !== "unknown" && name.length < 50) {
                                  contactName = name;
                                }
                              }
                            } catch {}
                          }
                        }
                      } catch {}
                    }
                  }
                }
              } catch (e) {
                console.warn(`Failed to scrape ${result.url}:`, e);
              }
            }

            // ONLY create lead if we found a real email
            if (!contactEmail) {
              console.log(`Skipping ${businessName} — no email found`);
              continue;
            }

            // Parse city/state from the search query
            const [cityName, stateCode] = city.split(" ");

            leads.push({
              campaign_id: activeCampaignId,
              business_name: businessName,
              industry: industry.name,
              website_url: domain,
              contact_email: contactEmail.toLowerCase(),
              contact_name: contactName,
              city: cityName,
              state: stateCode,
              country: "US",
              source: "firecrawl_verified",
              metadata: {
                search_query: query,
                niche,
                snippet: (result.description || "").slice(0, 300),
                discovery_method: "real_scrape",
                email_source: "website_scrape",
              }
            });

            // Limit per batch to conserve Firecrawl credits
            if (leads.length >= 15) break;
          }

          if (leads.length >= 15) break;
        } catch (e) {
          console.warn(`Search failed for ${niche} in ${city}:`, e);
        }
      }
      if (leads.length >= 15) break;
    }
    if (leads.length >= 15) break;
  }

  // Insert leads
  if (leads.length > 0) {
    const { error: insertError } = await supabase.from("outreach_leads").insert(leads);
    if (insertError) {
      console.error("Failed to insert leads:", insertError);
    }
  }

  return {
    campaign_id: activeCampaignId,
    industries_searched: industries.map(i => i.name),
    leads_created: leads.length,
    discovery_method: "firecrawl_verified",
    leads_with_email: leads.length,
    leads: leads.slice(0, 10).map(l => ({
      business_name: l.business_name,
      email: l.contact_email,
      website: l.website_url,
      city: l.city,
    })),
  };
}

// Evaluate and score leads
async function evaluateLeads(
  supabase: any,
  lovableKey: string,
  firecrawlKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  // Get unscored leads
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .eq("score", 0)
    .limit(5);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads } = await query;

  if (!leads || leads.length === 0) {
    return { leads_scored: 0, message: "No unscored leads found" };
  }

  const scoredLeads: any[] = [];

  for (const lead of leads) {
    let websiteAnalysis = "";

    // Only scrape real websites (not AI-generated ones)
    const isAiGenerated = lead.metadata?.discovery_method === "ai_generated";
    if (firecrawlKey && lead.website_url && !isAiGenerated) {
      try {
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            url: lead.website_url, 
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          websiteAnalysis = scrapeData.data?.markdown?.slice(0, 2000) || "";
        }
      } catch (e) {
        console.warn(`Failed to scrape ${lead.website_url}:`, e);
      }
    }

    // Use AI to score the lead
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a lead scoring expert for a web development agency. Score leads 0-100 based on their likelihood to need a new/better website. Consider:
- Website quality (modern, mobile-friendly, fast)
- Business type fit
- Signs of growth (hiring, expanding)
- Current online presence gaps

Services we offer: ${SERVICES_OFFERED.map(s => s.name).join(", ")}`
          },
          {
            role: "user",
            content: `Score this lead:
Business: ${lead.business_name}
Industry: ${lead.industry}
Website: ${lead.website_url}

Website content (if available):
${websiteAnalysis || "Could not scrape website"}

Return JSON with: score (0-100), reasoning (1 sentence), recommended_service (one from our list), pain_points (array of 2-3), website_issues (array of 2-3 if applicable)`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_lead",
            description: "Score the lead",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", minimum: 0, maximum: 100 },
                reasoning: { type: "string" },
                recommended_service: { type: "string" },
                pain_points: { type: "array", items: { type: "string" } },
                website_issues: { type: "array", items: { type: "string" } },
              },
              required: ["score", "reasoning", "recommended_service", "pain_points"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "score_lead" } }
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall) {
        const scoring = JSON.parse(toolCall.function.arguments);
        
        await supabase
          .from("outreach_leads")
          .update({
            score: scoring.score,
            lead_status: scoring.score >= 70 ? "qualified" : scoring.score >= 40 ? "nurture" : "low_priority",
            metadata: {
              ...lead.metadata,
              scoring,
              website_preview: websiteAnalysis.slice(0, 500),
            }
          })
          .eq("id", lead.id);

        scoredLeads.push({
          id: lead.id,
          business_name: lead.business_name,
          ...scoring
        });
      }
    }
  }

  return {
    leads_scored: scoredLeads.length,
    high_quality_leads: scoredLeads.filter(l => l.score >= 70).length,
    scored_leads: scoredLeads,
  };
}

// Generate live demo apps for qualified leads
async function generateDemosForLeads(
  supabase: any,
  lovableKey: string,
  campaignId: string | null
): Promise<any> {
  // Get qualified leads without demo links
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .in("lead_status", ["qualified", "nurture"])
    .gte("score", 50)
    .limit(5); // Limit to 5 at a time to avoid overloading

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads } = await query;
  if (!leads || leads.length === 0) {
    return { demos_generated: 0, message: "No qualified leads without demos" };
  }

  // Filter out leads that already have demo URLs
  const leadsNeedingDemos = leads.filter(
    (l: any) => !l.metadata?.demo_url && !l.metadata?.demo_generation_failed
  );

  if (leadsNeedingDemos.length === 0) {
    return { demos_generated: 0, message: "All qualified leads already have demos" };
  }

  const demosGenerated: any[] = [];
  const demosFailed: any[] = [];

  for (const lead of leadsNeedingDemos) {
    const scoring = lead.metadata?.scoring || {};
    const recommendedService = scoring.recommended_service || "Custom Website";
    const painPoints = scoring.pain_points?.join(", ") || "website improvement";

    // Build a specific prompt for this business
    const prompt = `${recommendedService} for ${lead.business_name} - a ${lead.industry} business. Include: online booking/contact form, service showcase, customer testimonials section, mobile-responsive design. Pain points to address: ${painPoints}. Use a professional color scheme appropriate for ${lead.industry}.`;

    try {
      // Create generation job
      const { data: jobRow, error: jobErr } = await supabase
        .from("generation_jobs")
        .insert({
          // Use a system user ID for automated generation
          user_id: "00000000-0000-0000-0000-000000000000",
          prompt,
          status: "pending",
          stage: "queued",
        })
        .select("id, status, stage, listing_id, listing_title, error")
        .single();

      if (jobErr || !jobRow) {
        console.warn(`Failed to create generation job for ${lead.business_name}:`, jobErr);
        demosFailed.push({ lead_id: lead.id, business_name: lead.business_name, error: "Job creation failed" });
        continue;
      }

      // Trigger the generation
      const genResp = await supabase.functions.invoke("generate-template-app", {
        body: {
          count: 1,
          themes: [prompt],
          job_id: jobRow.id,
        },
      });

      if (genResp.error) {
        console.warn(`Generation invoke failed for ${lead.business_name}:`, genResp.error);
      }

      // Poll for completion (max 120 seconds)
      let completed = false;
      let listingId: string | null = null;
      let listingTitle: string | null = null;

      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const { data: job } = await supabase
          .from("generation_jobs")
          .select("status, listing_id, listing_title, error")
          .eq("id", jobRow.id)
          .single();

        if (!job) break;

        if (job.status === "complete" && job.listing_id) {
          completed = true;
          listingId = job.listing_id;
          listingTitle = job.listing_title;
          break;
        }

        if (job.status === "failed") {
          console.warn(`Generation failed for ${lead.business_name}: ${job.error}`);
          break;
        }
      }

      if (completed && listingId) {
        const demoUrl = `https://opendraft.lovable.app/listing/${listingId}`;

        // Store demo URL in lead metadata
        await supabase
          .from("outreach_leads")
          .update({
            metadata: {
              ...lead.metadata,
              demo_url: demoUrl,
              demo_listing_id: listingId,
              demo_title: listingTitle,
              demo_generated_at: new Date().toISOString(),
            },
          })
          .eq("id", lead.id);

        demosGenerated.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          demo_url: demoUrl,
          listing_title: listingTitle,
        });
      } else {
        // Mark as failed so we don't retry endlessly
        await supabase
          .from("outreach_leads")
          .update({
            metadata: {
              ...lead.metadata,
              demo_generation_failed: true,
              demo_failed_at: new Date().toISOString(),
            },
          })
          .eq("id", lead.id);

        demosFailed.push({ lead_id: lead.id, business_name: lead.business_name, error: "Generation timed out or failed" });
      }
    } catch (e) {
      console.error(`Demo generation error for ${lead.business_name}:`, e);
      demosFailed.push({
        lead_id: lead.id,
        business_name: lead.business_name,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return {
    demos_generated: demosGenerated.length,
    demos_failed: demosFailed.length,
    demos: demosGenerated,
    failures: demosFailed,
  };
}

// Generate personalized outreach messages
async function generateOutreachMessages(
  supabase: any,
  lovableKey: string,
  campaignId: string | null
): Promise<any> {
  // Get qualified leads that don't already have a drafted message waiting
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .in("lead_status", ["qualified", "nurture"])
    .gte("score", 50)
    .limit(20);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads } = await query;

  if (!leads || leads.length === 0) {
    return { messages_drafted: 0, message: "No qualified leads found" };
  }

  const messagesCreated: any[] = [];

  for (const lead of leads) {
    // Skip leads that already have a drafted (unsent) message
    const { data: existingDraft } = await supabase
      .from("outreach_messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("message_status", "drafted")
      .eq("direction", "outbound")
      .maybeSingle();

    if (existingDraft) continue;

    const scoring = lead.metadata?.scoring || {};
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert at writing personalized, non-spammy outreach emails for a web development agency called OpenDraft.

TONE: Friendly, helpful, not salesy. Focus on helping them, not selling.
LENGTH: Keep emails under 150 words.
PERSONALIZATION: Reference specific things about their business/website.
SIGNATURE: Always sign emails as "Jason" (not [Your Name] or any placeholder). Use "Jason" as the sender name. Example sign-off: "Best,\nJason\nOpenDraft"

Our services: ${SERVICES_OFFERED.map(s => `${s.name} (${s.price_range})`).join(", ")}`
          },
          {
            role: "user",
            content: `Write an outreach email for:
Business: ${lead.business_name}
Industry: ${lead.industry}
Website: ${lead.website_url}
Pain points identified: ${scoring.pain_points?.join(", ") || "general website improvement"}
Website issues: ${scoring.website_issues?.join(", ") || "N/A"}
Recommended service: ${scoring.recommended_service || "Custom Website"}

Return JSON with: subject (compelling, not spammy), body (the email text), follow_up_days (when to follow up, 3-7)`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "draft_email",
            description: "Draft the outreach email",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                follow_up_days: { type: "number" },
              },
              required: ["subject", "body", "follow_up_days"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "draft_email" } }
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall) {
        const email = JSON.parse(toolCall.function.arguments);
        
        const { data: msg } = await supabase
          .from("outreach_messages")
          .insert({
            campaign_id: lead.campaign_id,
            lead_id: lead.id,
            channel: "email",
            subject: email.subject,
            body: email.body,
            message_status: "drafted",
            ai_generated: true,
            metadata: {
              follow_up_days: email.follow_up_days,
              recommended_service: scoring.recommended_service,
            }
          })
          .select()
          .single();

        // Set next follow-up date
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + email.follow_up_days);
        
        await supabase
          .from("outreach_leads")
          .update({ next_follow_up_at: followUpDate.toISOString() })
          .eq("id", lead.id);

        messagesCreated.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          subject: email.subject,
          body_preview: email.body.slice(0, 100) + "...",
        });
      }
    }
  }

  return {
    messages_drafted: messagesCreated.length,
    messages: messagesCreated,
  };
}

// Send outreach emails via Resend
async function sendOutreachEmails(
  supabase: any,
  resendKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  if (!resendKey) {
    return { error: "RESEND_API_KEY not configured", emails_sent: 0 };
  }

  // Get drafted messages that haven't been sent
  let query = supabase
    .from("outreach_messages")
    .select("*, outreach_leads!inner(*)")
    .eq("message_status", "drafted")
    .eq("channel", "email")
    .not("outreach_leads.contact_email", "is", null)
    .limit(10);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: messages } = await query;

  if (!messages || messages.length === 0) {
    return { emails_sent: 0, message: "No drafted emails with contact emails found" };
  }

  const sentEmails: any[] = [];
  const failedEmails: any[] = [];

  for (const msg of messages) {
    const lead = msg.outreach_leads;
    
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "OpenDraft <outreach@opendraft.co>",
          to: [lead.contact_email],
          subject: msg.subject,
          html: formatEmailHtml(msg.body, lead),
          tags: [
            { name: "campaign_id", value: msg.campaign_id },
            { name: "lead_id", value: msg.lead_id },
          ],
        }),
      });

      if (response.ok) {
        const emailData = await response.json();
        
        await supabase
          .from("outreach_messages")
          .update({
            message_status: "sent",
            sent_at: new Date().toISOString(),
            metadata: { ...msg.metadata, resend_id: emailData.id }
          })
          .eq("id", msg.id);

        await supabase
          .from("outreach_leads")
          .update({ 
            last_contacted_at: new Date().toISOString(),
            lead_status: "contacted"
          })
          .eq("id", lead.id);

        sentEmails.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          email: lead.contact_email,
          subject: msg.subject,
        });
      } else {
        const errorData = await response.json();
        failedEmails.push({
          lead_id: lead.id,
          business_name: lead.business_name,
          error: errorData.message || "Send failed",
        });
      }
    } catch (e) {
      failedEmails.push({
        lead_id: lead.id,
        business_name: lead.business_name,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return {
    emails_sent: sentEmails.length,
    emails_failed: failedEmails.length,
    sent: sentEmails,
    failed: failedEmails,
  };
}

// Send follow-up emails
async function sendFollowUpEmails(
  supabase: any,
  lovableKey: string,
  resendKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  if (!resendKey) {
    return { error: "RESEND_API_KEY not configured", follow_ups_sent: 0 };
  }

  // Get leads that need follow-up
  const now = new Date().toISOString();
  
  let query = supabase
    .from("outreach_leads")
    .select("*, outreach_messages(*)")
    .eq("lead_status", "contacted")
    .lte("next_follow_up_at", now)
    .not("contact_email", "is", null)
    .limit(5);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads } = await query;

  if (!leads || leads.length === 0) {
    return { follow_ups_sent: 0, message: "No leads ready for follow-up" };
  }

  const followUpsSent: any[] = [];

  for (const lead of leads) {
    const existingMessages = lead.outreach_messages || [];
    const followUpCount = existingMessages.filter((m: any) => m.metadata?.is_follow_up).length;
    
    // Max 3 follow-ups
    if (followUpCount >= 3) {
      await supabase
        .from("outreach_leads")
        .update({ lead_status: "no_response" })
        .eq("id", lead.id);
      continue;
    }

    // Generate follow-up with AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You write friendly follow-up emails for a web dev agency called OpenDraft. Keep it SHORT (under 80 words). Be helpful, not pushy. This is follow-up #${followUpCount + 1}. Always sign off as "Jason" (never use [Your Name] or placeholders).`
          },
          {
            role: "user",
            content: `Write follow-up #${followUpCount + 1} for:
Business: ${lead.business_name}
Industry: ${lead.industry}
Original pain points: ${lead.metadata?.scoring?.pain_points?.join(", ") || "website improvement"}
Previous subject: ${existingMessages[0]?.subject || "N/A"}

Return JSON: { "subject": "...", "body": "..." }`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      
      if (content) {
        const followUp = JSON.parse(content);
        
        // Send via Resend
        const sendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "OpenDraft <outreach@opendraft.co>",
            to: [lead.contact_email],
            subject: followUp.subject,
            html: formatEmailHtml(followUp.body, lead),
          }),
        });

        if (sendResponse.ok) {
          // Save follow-up message
          await supabase.from("outreach_messages").insert({
            campaign_id: lead.campaign_id,
            lead_id: lead.id,
            channel: "email",
            subject: followUp.subject,
            body: followUp.body,
            message_status: "sent",
            sent_at: new Date().toISOString(),
            ai_generated: true,
            metadata: { is_follow_up: true, follow_up_number: followUpCount + 1 }
          });

          // Schedule next follow-up
          const nextFollowUp = new Date();
          nextFollowUp.setDate(nextFollowUp.getDate() + (followUpCount + 1) * 3);
          
          await supabase
            .from("outreach_leads")
            .update({ 
              last_contacted_at: new Date().toISOString(),
              next_follow_up_at: nextFollowUp.toISOString()
            })
            .eq("id", lead.id);

          followUpsSent.push({
            lead_id: lead.id,
            business_name: lead.business_name,
            follow_up_number: followUpCount + 1,
          });
        }
      }
    }
  }

  return {
    follow_ups_sent: followUpsSent.length,
    follow_ups: followUpsSent,
  };
}

// Send a single drafted email by message ID
async function sendSingleEmail(
  supabase: any,
  resendKey: string | undefined,
  messageId: string
): Promise<any> {
  if (!resendKey) return { error: "RESEND_API_KEY not configured" };
  if (!messageId) return { error: "message_id required" };

  const { data: msg } = await supabase
    .from("outreach_messages")
    .select("*, outreach_leads!inner(*)")
    .eq("id", messageId)
    .single();

  if (!msg) return { error: "Message not found" };
  if (msg.message_status !== "drafted") return { error: "Message already sent" };

  const lead = msg.outreach_leads;
  if (!lead?.contact_email) return { error: "Lead has no contact email" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OpenDraft <outreach@opendraft.co>",
      to: [lead.contact_email],
      subject: msg.subject,
      html: formatEmailHtml(msg.body, lead),
      tags: [
        { name: "campaign_id", value: msg.campaign_id },
        { name: "lead_id", value: msg.lead_id },
      ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    return { error: errData.message || "Send failed" };
  }

  const emailData = await response.json();

  await supabase
    .from("outreach_messages")
    .update({
      message_status: "sent",
      sent_at: new Date().toISOString(),
      metadata: { ...msg.metadata, resend_id: emailData.id },
    })
    .eq("id", msg.id);

  await supabase
    .from("outreach_leads")
    .update({ last_contacted_at: new Date().toISOString(), lead_status: "contacted" })
    .eq("id", lead.id);

  return { success: true, email: lead.contact_email, subject: msg.subject };
}

// Reply to a lead from the admin dashboard
async function replyToLead(
  supabase: any,
  resendKey: string | undefined,
  leadId: string,
  campaignId: string,
  subject: string,
  body: string
): Promise<any> {
  if (!resendKey) return { error: "RESEND_API_KEY not configured" };
  if (!leadId || !subject || !body) return { error: "lead_id, subject, and body are required" };

  const { data: lead } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead not found" };
  if (!lead.contact_email) return { error: "Lead has no contact email" };

  // Send via Resend
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OpenDraft <outreach@opendraft.co>",
      to: [lead.contact_email],
      subject,
      html: formatEmailHtml(body, lead),
      tags: [
        { name: "campaign_id", value: campaignId || lead.campaign_id },
        { name: "lead_id", value: leadId },
        { name: "type", value: "admin_reply" },
      ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    return { error: errData.message || "Send failed" };
  }

  const emailData = await response.json();

  // Store the reply as an outreach message
  const { data: newMsg } = await supabase
    .from("outreach_messages")
    .insert({
      campaign_id: campaignId || lead.campaign_id,
      lead_id: leadId,
      channel: "email",
      subject,
      body,
      message_status: "sent",
      sent_at: new Date().toISOString(),
      ai_generated: false,
      direction: "outbound",
      metadata: { resend_id: emailData.id, type: "admin_reply" },
    })
    .select()
    .single();

  await supabase
    .from("outreach_leads")
    .update({ last_contacted_at: new Date().toISOString(), lead_status: "in_conversation" })
    .eq("id", leadId);

  return { success: true, message_id: newMsg?.id, email: lead.contact_email };
}

// Format email as HTML
function formatEmailHtml(body: string, lead: any): string {
  // Replace any AI placeholder names with Jason
  const cleanedBody = body
    .replace(/\[Your Name\]/gi, "Jason")
    .replace(/\[your name\]/gi, "Jason")
    .replace(/\[Name\]/gi, "Jason")
    .replace(/\[Sender Name\]/gi, "Jason")
    .replace(/\[sender\]/gi, "Jason");
  const paragraphs = cleanedBody.split('\n\n').map(p => `<p style="margin-bottom: 16px; line-height: 1.6;">${p}</p>`).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 20px; max-width: 600px; margin: 0 auto;">
  ${paragraphs}
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
  <p style="font-size: 12px; color: #666;">
    Sent by OpenDraft · <a href="https://opendraft.lovable.app" style="color: #666;">opendraft.lovable.app</a>
    <br>
    <a href="https://opendraft.lovable.app/unsubscribe?email=${encodeURIComponent(lead.contact_email || '')}" style="color: #666;">Unsubscribe</a>
  </p>
</body>
</html>`;
}
