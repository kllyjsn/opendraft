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
          result = await discoverBusinesses(supabase, FIRECRAWL_API_KEY, LOVABLE_API_KEY, targetIndustry, targetRegion, campaignId, body);
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
        case "add_prospect":
          result = await addManualProspect(supabase, FIRECRAWL_API_KEY, LOVABLE_API_KEY, body);
          break;
        case "import_from_url":
          result = await importProspectsFromUrl(supabase, FIRECRAWL_API_KEY, LOVABLE_API_KEY, body);
          break;
        case "full_cycle":
        default:
          const discovered = await discoverBusinesses(supabase, FIRECRAWL_API_KEY, LOVABLE_API_KEY, targetIndustry, targetRegion, campaignId, body);
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

// ─── Helper: extract emails from text ─────────────────────────────────────────
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BLOCKED_EMAIL_PATTERNS = [
  "example.com", "sentry.io", "wixpress", "googleapis", "wix.com",
  "squarespace.com", "godaddy.com", "wordpress.com", "cloudflare",
  "schema.org", "w3.org", "json-ld", "placeholder",
];

function extractEmails(text: string): string[] {
  const found = text.match(emailRegex) || [];
  return found.filter(e => {
    const lower = e.toLowerCase();
    return (
      !BLOCKED_EMAIL_PATTERNS.some(p => lower.includes(p)) &&
      !lower.startsWith("noreply") &&
      !lower.startsWith("no-reply") &&
      !lower.startsWith("support@") &&
      !lower.startsWith("info@")
      ? true : lower.startsWith("info@")
    );
  });
}

function extractAllEmails(text: string): string[] {
  const found = text.match(emailRegex) || [];
  return found.filter(e => {
    const lower = e.toLowerCase();
    return !BLOCKED_EMAIL_PATTERNS.some(p => lower.includes(p)) &&
      !lower.startsWith("noreply") &&
      !lower.startsWith("no-reply");
  });
}

// ─── Helper: guess common email patterns from domain ──────────────────────────
function guessEmailsFromDomain(domain: string): string[] {
  // Skip obviously non-business domains
  const skipDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
  if (skipDomains.includes(domain.toLowerCase())) return [];
  return [
    `info@${domain}`,
    `hello@${domain}`,
    `contact@${domain}`,
    `admin@${domain}`,
  ];
}

// ─── Helper: get or create campaign ───────────────────────────────────────────
async function getOrCreateCampaign(supabase: any, campaignId: string | null, industries: any[], region: string) {
  if (campaignId) return campaignId;
  
  const { data: existing } = await supabase
    .from("outreach_campaigns")
    .select("id")
    .eq("status", "active")
    .single();

  if (existing) return existing.id;

  const { data: newCampaign } = await supabase
    .from("outreach_campaigns")
    .insert({
      name: `Real Leads - ${new Date().toLocaleDateString()}`,
      niche: "small_business",
      industries: industries.map(i => i.name),
      target_regions: [region],
      services: SERVICES_OFFERED,
      goals: { target_leads_per_week: 50, target_response_rate: 0.08 }
    })
    .select()
    .single();
  return newCampaign?.id;
}

// ─── Helper: check duplicate lead by domain ───────────────────────────────────
async function isDuplicate(supabase: any, domain: string): Promise<boolean> {
  const { data } = await supabase
    .from("outreach_leads")
    .select("id")
    .or(`website_url.ilike.%${domain}%`)
    .limit(1);
  return (data && data.length > 0);
}

// ─── Helper: scrape contact info from a URL ───────────────────────────────────
async function scrapeContactFromUrl(
  url: string,
  firecrawlKey: string,
  lovableKey: string | null | undefined,
): Promise<{ email: string | null; name: string | null; businessName: string; content: string }> {
  let email: string | null = null;
  let name: string | null = null;
  let content = "";

  const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  let businessName = domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // Step 1: Scrape homepage with links
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url.startsWith("http") ? url : `https://${url}`,
        formats: ["markdown", "links"],
        onlyMainContent: false,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      content = data.data?.markdown || data.markdown || "";
      const meta = data.data?.metadata || data.metadata || {};
      if (meta.title) {
        businessName = meta.title.split(" - ")[0].split(" | ")[0].trim();
      }

      // Extract emails from homepage
      const emails = extractAllEmails(content);
      email = emails[0] || null;

      // Step 2: If no email, try contact/about pages
      if (!email && data.data?.links) {
        const contactPages = (data.data.links as string[]).filter((l: string) =>
          /contact|about|team|staff/i.test(l)
        ).slice(0, 2);

        for (const contactUrl of contactPages) {
          try {
            const cResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
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

            if (cResp.ok) {
              const cData = await cResp.json();
              const cContent = cData.data?.markdown || cData.markdown || "";
              content += "\n" + cContent;
              const cEmails = extractAllEmails(cContent);
              if (cEmails[0]) {
                email = cEmails[0];

                // Extract contact name via AI
                if (lovableKey && cContent.length > 50) {
                  try {
                    const nameResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${lovableKey}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        model: "google/gemini-2.5-flash-lite",
                        messages: [{
                          role: "user",
                          content: `Extract the business owner or primary contact person's name from this page. Return ONLY the name, or "unknown" if not found.\n\n${cContent.slice(0, 1500)}`
                        }],
                      }),
                    });
                    if (nameResp.ok) {
                      const nData = await nameResp.json();
                      const n = nData.choices?.[0]?.message?.content?.trim();
                      if (n && n.toLowerCase() !== "unknown" && n.length < 50) name = n;
                    }
                  } catch {}
                }
                break;
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn(`Failed to scrape ${url}:`, e);
  }

  return { email, name, businessName, content };
}

// ─── DISCOVER: Enhanced multi-strategy search ─────────────────────────────────
async function discoverBusinesses(
  supabase: any,
  firecrawlKey: string | undefined,
  lovableKey: string | undefined,
  targetIndustry: string | null,
  region: string,
  campaignId: string | null,
  opts: any = {},
): Promise<any> {
  if (!firecrawlKey) {
    return { leads_created: 0, error: "FIRECRAWL_API_KEY required for real business discovery" };
  }

  const leads: any[] = [];

  const industries = targetIndustry
    ? TARGET_INDUSTRIES.filter(i => i.name.toLowerCase().includes(targetIndustry.toLowerCase()))
    : TARGET_INDUSTRIES.sort(() => Math.random() - 0.5).slice(0, 3);

  const activeCampaignId = await getOrCreateCampaign(supabase, campaignId, industries, region);

  // Expanded city pool — tier-2 cities with active SMB markets
  const allCities = [
    "Austin TX", "Denver CO", "Nashville TN", "Charlotte NC", "Tampa FL",
    "Phoenix AZ", "Portland OR", "San Antonio TX", "Columbus OH", "Indianapolis IN",
    "Raleigh NC", "Salt Lake City UT", "Boise ID", "Jacksonville FL", "Oklahoma City OK",
    "Scottsdale AZ", "Boulder CO", "Savannah GA", "Charleston SC", "Greenville SC",
    "Chattanooga TN", "Asheville NC", "Madison WI", "Des Moines IA", "Omaha NE",
    "Spokane WA", "Tucson AZ", "Knoxville TN", "Lexington KY", "Fort Worth TX",
  ];

  const targetCities = allCities.sort(() => Math.random() - 0.5).slice(0, 4);

  // Multi-strategy search queries for better coverage
  const buildSearchQueries = (niche: string, city: string): string[] => [
    `best ${niche} in ${city}`,
    `${niche} near ${city} reviews`,
    `top rated ${niche} ${city}`,
    `${niche} ${city} website`, // finds businesses WITH websites
    `"${niche}" "${city}" email contact`, // targets pages with contact info
  ];

  const aggregatorDomains = [
    "yelp.com", "facebook.com", "yellowpages.com", "google.com",
    "mapquest.com", "bbb.org", "angi.com", "thumbtack.com",
    "homeadvisor.com", "nextdoor.com", "tripadvisor.com",
    "instagram.com", "twitter.com", "linkedin.com", "pinterest.com",
    "tiktok.com", "youtube.com", "reddit.com", "wikipedia.org",
    "apple.com", "bing.com", "foursquare.com",
  ];

  const MAX_LEADS = opts.max_leads || 25;

  for (const industry of industries) {
    const niches = industry.niches.sort(() => Math.random() - 0.5).slice(0, 3);
    const cities = targetCities.slice(0, 3);

    for (const niche of niches) {
      for (const city of cities) {
        if (leads.length >= MAX_LEADS) break;

        const queries = buildSearchQueries(niche, city);
        // Pick 2 random query strategies
        const selectedQueries = queries.sort(() => Math.random() - 0.5).slice(0, 2);

        for (const query of selectedQueries) {
          if (leads.length >= MAX_LEADS) break;

          try {
            const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query,
                limit: 8,
                scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
              }),
            });

            if (!searchResp.ok) continue;

            const searchData = await searchResp.json();
            if (!searchData.data) continue;

            for (const result of searchData.data) {
              if (leads.length >= MAX_LEADS) break;
              if (!result.url) continue;
              const urlLower = result.url.toLowerCase();
              if (aggregatorDomains.some(d => urlLower.includes(d))) continue;

              let domain: string;
              try {
                domain = new URL(result.url).hostname.replace(/^www\./, "");
              } catch { continue; }

              if (await isDuplicate(supabase, domain)) continue;

              // Extract from search content first (cheap)
              const pageContent = result.markdown || result.description || "";
              let emails = extractAllEmails(pageContent);
              let contactEmail = emails[0] || null;
              let contactName: string | null = null;
              let businessName = result.title?.split(" - ")[0]?.split(" | ")[0]?.trim() || domain;

              // Deep scrape if no email found
              if (!contactEmail) {
                const scraped = await scrapeContactFromUrl(result.url, firecrawlKey, lovableKey);
                contactEmail = scraped.email;
                contactName = scraped.name;
                if (scraped.businessName) businessName = scraped.businessName;
              }

              // Only add leads with verified emails
              if (!contactEmail) {
                console.log(`Skipping ${businessName} — no email`);
                continue;
              }

              // Already have this email?
              const { data: emailDup } = await supabase
                .from("outreach_leads")
                .select("id")
                .eq("contact_email", contactEmail.toLowerCase())
                .limit(1);
              if (emailDup && emailDup.length > 0) continue;

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
            }
          } catch (e) {
            console.warn(`Search failed for ${niche} in ${city}:`, e);
          }
        }
      }
      if (leads.length >= MAX_LEADS) break;
    }
    if (leads.length >= MAX_LEADS) break;
  }

  // Batch insert
  if (leads.length > 0) {
    const { error: insertError } = await supabase.from("outreach_leads").insert(leads);
    if (insertError) console.error("Failed to insert leads:", insertError);
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

// ─── ADD MANUAL PROSPECT ──────────────────────────────────────────────────────
async function addManualProspect(
  supabase: any,
  firecrawlKey: string | undefined,
  lovableKey: string | undefined,
  body: any,
): Promise<any> {
  const { business_name, website_url, contact_email, contact_name, industry, city, state, campaign_id } = body;

  if (!business_name) return { error: "business_name required" };

  const activeCampaignId = await getOrCreateCampaign(supabase, campaign_id, [], "United States");

  let enrichedEmail = contact_email || null;
  let enrichedName = contact_name || null;
  let enrichedBizName = business_name;

  // If URL provided but no email, try to scrape
  if (website_url && !enrichedEmail && firecrawlKey) {
    const scraped = await scrapeContactFromUrl(website_url, firecrawlKey, lovableKey || null);
    enrichedEmail = scraped.email || enrichedEmail;
    enrichedName = scraped.name || enrichedName;
    if (!business_name || business_name === website_url) enrichedBizName = scraped.businessName;
  }

  const { data, error } = await supabase.from("outreach_leads").insert({
    campaign_id: activeCampaignId,
    business_name: enrichedBizName,
    industry: industry || "Other",
    website_url: website_url || null,
    contact_email: enrichedEmail?.toLowerCase() || null,
    contact_name: enrichedName,
    city: city || null,
    state: state || null,
    country: "US",
    source: "manual",
    metadata: { discovery_method: "manual_entry", enriched: !!website_url },
  }).select().single();

  if (error) return { error: error.message };
  return { success: true, lead: data };
}

// ─── IMPORT FROM URL: Scrape a directory/list page for multiple prospects ─────
async function importProspectsFromUrl(
  supabase: any,
  firecrawlKey: string | undefined,
  lovableKey: string | undefined,
  body: any,
): Promise<any> {
  const { url, industry, campaign_id } = body;
  if (!url || !firecrawlKey) return { error: "url and FIRECRAWL_API_KEY required" };

  const activeCampaignId = await getOrCreateCampaign(supabase, campaign_id, [], "United States");

  // Scrape the directory/list page
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
    }),
  });

  if (!resp.ok) return { error: `Failed to scrape: ${resp.status}` };

  const data = await resp.json();
  const links = data.data?.links || [];
  const content = data.data?.markdown || "";

  // Use AI to extract business listings from the page
  if (!lovableKey) return { error: "LOVABLE_API_KEY required for AI extraction" };

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `Extract all business listings from this page. For each business, extract: name, website_url, email (if visible), city, state.

Page content:
${content.slice(0, 8000)}

Links found on page:
${links.slice(0, 50).join("\n")}

Return JSON array of businesses found.`
      }],
      tools: [{
        type: "function",
        function: {
          name: "extract_businesses",
          parameters: {
            type: "object",
            properties: {
              businesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    website_url: { type: "string" },
                    email: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                  },
                  required: ["name"],
                },
              },
            },
            required: ["businesses"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_businesses" } },
    }),
  });

  if (!aiResp.ok) return { error: "AI extraction failed" };

  const aiData = await aiResp.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { error: "No businesses extracted" };

  const { businesses } = JSON.parse(toolCall.function.arguments);
  const imported: any[] = [];

  for (const biz of (businesses || []).slice(0, 20)) {
    if (!biz.name) continue;

    // Check duplicates
    if (biz.website_url) {
      try {
        const domain = new URL(biz.website_url.startsWith("http") ? biz.website_url : `https://${biz.website_url}`).hostname.replace(/^www\./, "");
        if (await isDuplicate(supabase, domain)) continue;
      } catch {}
    }

    imported.push({
      campaign_id: activeCampaignId,
      business_name: biz.name,
      industry: industry || "Other",
      website_url: biz.website_url || null,
      contact_email: biz.email?.toLowerCase() || null,
      city: biz.city || null,
      state: biz.state || null,
      country: "US",
      source: "url_import",
      metadata: { discovery_method: "url_import", source_url: url },
    });
  }

  if (imported.length > 0) {
    await supabase.from("outreach_leads").insert(imported);
  }

  return { success: true, imported_count: imported.length, businesses: imported.map(b => b.business_name) };
}

// ─── EVALUATE LEADS ───────────────────────────────────────────────────────────
async function evaluateLeads(
  supabase: any,
  lovableKey: string,
  firecrawlKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .eq("score", 0)
    .limit(10); // Increased batch size

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: leads } = await query;
  if (!leads || leads.length === 0) return { leads_scored: 0, message: "No unscored leads" };

  const scoredLeads: any[] = [];

  // Process in parallel batches of 3
  const batches = [];
  for (let i = 0; i < leads.length; i += 3) {
    batches.push(leads.slice(i, i + 3));
  }

  for (const batch of batches) {
    const promises = batch.map(async (lead: any) => {
      let websiteAnalysis = "";

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
              url: lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`,
              formats: ["markdown"],
              onlyMainContent: true,
            }),
          });

          if (scrapeResp.ok) {
            const d = await scrapeResp.json();
            websiteAnalysis = (d.data?.markdown || "").slice(0, 2000);
          }
        } catch {}
      }

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
              content: `You are a lead scoring expert for OpenDraft (opendraft.co), a marketplace for buying/selling web apps. Score leads 0-100 based on likelihood to buy a custom web app. Consider:
- Website quality (modern, mobile-friendly, fast)
- Business type fit (does this business need better digital tools?)
- Signs of growth
- Current online presence gaps
- Size and revenue potential

Services: ${SERVICES_OFFERED.map(s => s.name).join(", ")}`
            },
            {
              role: "user",
              content: `Score this lead:
Business: ${lead.business_name}
Industry: ${lead.industry}
Website: ${lead.website_url}
City: ${lead.city || "unknown"}, State: ${lead.state || "unknown"}

Website content:
${websiteAnalysis || "Could not scrape"}

Return: score (0-100), reasoning (1 sentence), recommended_service, pain_points (2-3), website_issues (2-3)`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_lead",
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
              metadata: { ...lead.metadata, scoring, website_preview: websiteAnalysis.slice(0, 500) }
            })
            .eq("id", lead.id);

          scoredLeads.push({ id: lead.id, business_name: lead.business_name, ...scoring });
        }
      }
    });

    await Promise.allSettled(promises);
  }

  return { leads_scored: scoredLeads.length, leads: scoredLeads };
}

// ─── GENERATE OUTREACH MESSAGES ───────────────────────────────────────────────
async function generateOutreachMessages(
  supabase: any,
  lovableKey: string,
  campaignId: string | null
): Promise<any> {
  // Get leads that are qualified/nurture with score >= 50 and don't have a drafted message yet
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .gte("score", 50)
    .in("lead_status", ["qualified", "nurture"])
    .limit(10);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: leads } = await query;
  if (!leads || leads.length === 0) return { messages_drafted: 0, message: "No eligible leads" };

  // Check which already have messages
  const leadIds = leads.map((l: any) => l.id);
  const { data: existingMsgs } = await supabase
    .from("outreach_messages")
    .select("lead_id")
    .in("lead_id", leadIds);

  const existingLeadIds = new Set((existingMsgs || []).map((m: any) => m.lead_id));
  const needsMessage = leads.filter((l: any) => !existingLeadIds.has(l.id));

  if (needsMessage.length === 0) return { messages_drafted: 0, message: "All leads already have drafts" };

  const drafted: any[] = [];

  for (const lead of needsMessage) {
    const scoring = lead.metadata?.scoring || {};

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Jason, a friendly web developer who builds custom apps for small businesses. Write a short, warm, personalized cold email.

Rules:
- Max 120 words body
- Reference something specific about THEIR business (from pain points or website issues)
- Pitch ONE specific thing you'd build for them
- End with a casual, no-pressure CTA
- Sound human, not salesy
- Sign as "Jason"
- Include "opendraft.co" as your portfolio link
- Never use brackets or placeholders`
          },
          {
            role: "user",
            content: `Write email for:
Business: ${lead.business_name}
Industry: ${lead.industry}
Website: ${lead.website_url || "none"}
Contact: ${lead.contact_name || "business owner"}
Pain points: ${scoring.pain_points?.join(", ") || "outdated website"}
Recommended: ${scoring.recommended_service || "Custom Website"}
Website issues: ${scoring.website_issues?.join(", ") || "needs modernization"}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "draft_email",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line, max 8 words" },
                body: { type: "string", description: "Email body text" },
              },
              required: ["subject", "body"]
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

        await supabase.from("outreach_messages").insert({
          lead_id: lead.id,
          campaign_id: lead.campaign_id,
          subject: email.subject,
          body: email.body,
          channel: "email",
          direction: "outbound",
          ai_generated: true,
          message_status: "drafted",
          metadata: { template: "initial", recommended_service: scoring.recommended_service },
        });

        drafted.push({ lead: lead.business_name, subject: email.subject });
      }
    }
  }

  return { messages_drafted: drafted.length, drafts: drafted };
}

// ─── GENERATE DEMOS FOR HIGH-INTENT LEADS ─────────────────────────────────────
async function generateDemosForLeads(
  supabase: any,
  lovableKey: string,
  campaignId: string | null
): Promise<any> {
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .gte("score", 50)
    .in("lead_status", ["qualified", "nurture"])
    .limit(3);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: leads } = await query;
  if (!leads || leads.length === 0) return { demos_generated: 0 };

  // Check which already have demo generation in metadata
  const needsDemo = leads.filter((l: any) => !l.metadata?.demo_generated);
  if (needsDemo.length === 0) return { demos_generated: 0, message: "All eligible leads already have demos" };

  const generated: any[] = [];

  for (const lead of needsDemo.slice(0, 2)) {
    const scoring = lead.metadata?.scoring || {};

    try {
      // Generate prompt for the app builder
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{
            role: "user",
            content: `Create a one-paragraph prompt to build a modern web app for this business. It should be a ${scoring.recommended_service || "Custom Website"} for a ${lead.industry} business called "${lead.business_name}".

Key features to include based on their pain points: ${scoring.pain_points?.join(", ") || "online presence"}

Return ONLY the prompt text, no explanation.`
          }],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const prompt = aiData.choices?.[0]?.message?.content?.trim();

        if (prompt) {
          // Trigger the generation pipeline
          const { data: job } = await supabase.from("generation_jobs").insert({
            prompt,
            user_id: "00000000-0000-0000-0000-000000000000", // system user
            status: "pending",
            listing_title: `${lead.business_name} - Custom ${scoring.recommended_service || "Website"}`,
            stage: "outreach_demo",
          }).select().single();

          await supabase
            .from("outreach_leads")
            .update({
              metadata: {
                ...lead.metadata,
                demo_generated: true,
                demo_job_id: job?.id,
                demo_prompt: prompt,
              }
            })
            .eq("id", lead.id);

          generated.push({ lead: lead.business_name, job_id: job?.id });
        }
      }
    } catch (e) {
      console.warn(`Demo generation failed for ${lead.business_name}:`, e);
    }
  }

  return { demos_generated: generated.length, demos: generated };
}

// ─── SEND OUTREACH EMAILS ─────────────────────────────────────────────────────
async function sendOutreachEmails(
  supabase: any,
  resendKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  if (!resendKey) return { sent: 0, error: "RESEND_API_KEY not configured" };

  let query = supabase
    .from("outreach_messages")
    .select("*, outreach_leads!inner(contact_email, contact_name, business_name)")
    .eq("message_status", "drafted")
    .eq("direction", "outbound")
    .limit(10);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: messages } = await query;
  if (!messages || messages.length === 0) return { sent: 0, message: "No drafted emails to send" };

  let sent = 0;

  for (const msg of messages) {
    const lead = msg.outreach_leads;
    if (!lead?.contact_email) continue;

    try {
      const emailResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Jason <jason@opendraft.co>",
          to: lead.contact_email,
          subject: msg.subject,
          text: msg.body,
        }),
      });

      if (emailResp.ok) {
        await supabase.from("outreach_messages").update({
          message_status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", msg.id);

        await supabase.from("outreach_leads").update({
          lead_status: "contacted",
          last_contacted_at: new Date().toISOString(),
        }).eq("id", msg.lead_id);

        sent++;
      } else {
        const errText = await emailResp.text();
        console.error(`Failed to send to ${lead.contact_email}:`, errText);
      }
    } catch (e) {
      console.error(`Email send error:`, e);
    }
  }

  return { sent, total_drafted: messages.length };
}

// ─── SEND SINGLE EMAIL ───────────────────────────────────────────────────────
async function sendSingleEmail(
  supabase: any,
  resendKey: string | undefined,
  messageId: string
): Promise<any> {
  if (!resendKey) return { sent: false, error: "RESEND_API_KEY not configured" };
  if (!messageId) return { sent: false, error: "message_id required" };

  const { data: msg } = await supabase
    .from("outreach_messages")
    .select("*, outreach_leads!inner(contact_email, contact_name, business_name)")
    .eq("id", messageId)
    .single();

  if (!msg) return { sent: false, error: "Message not found" };

  const lead = msg.outreach_leads;
  if (!lead?.contact_email) return { sent: false, error: "No contact email" };

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jason <jason@opendraft.co>",
      to: lead.contact_email,
      subject: msg.subject,
      text: msg.body,
    }),
  });

  if (emailResp.ok) {
    await supabase.from("outreach_messages").update({
      message_status: "sent",
      sent_at: new Date().toISOString(),
    }).eq("id", msg.id);

    await supabase.from("outreach_leads").update({
      lead_status: "contacted",
      last_contacted_at: new Date().toISOString(),
    }).eq("id", msg.lead_id);

    return { sent: true };
  }

  return { sent: false, error: await emailResp.text() };
}

// ─── REPLY TO LEAD ────────────────────────────────────────────────────────────
async function replyToLead(
  supabase: any,
  resendKey: string | undefined,
  leadId: string,
  campaignId: string,
  subject: string,
  body: string
): Promise<any> {
  if (!resendKey) return { sent: false, error: "RESEND_API_KEY not configured" };

  const { data: lead } = await supabase
    .from("outreach_leads")
    .select("contact_email, business_name")
    .eq("id", leadId)
    .single();

  if (!lead?.contact_email) return { sent: false, error: "No contact email" };

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jason <jason@opendraft.co>",
      to: lead.contact_email,
      subject: subject || `Re: ${lead.business_name}`,
      text: body,
    }),
  });

  if (emailResp.ok) {
    await supabase.from("outreach_messages").insert({
      lead_id: leadId,
      campaign_id: campaignId,
      subject: subject || `Re: ${lead.business_name}`,
      body,
      channel: "email",
      direction: "outbound",
      ai_generated: false,
      message_status: "sent",
      sent_at: new Date().toISOString(),
      metadata: { type: "reply" },
    });

    return { sent: true };
  }

  return { sent: false, error: await emailResp.text() };
}

// ─── SEND FOLLOW-UP EMAILS ───────────────────────────────────────────────────
async function sendFollowUpEmails(
  supabase: any,
  lovableKey: string,
  resendKey: string | undefined,
  campaignId: string | null
): Promise<any> {
  if (!resendKey) return { sent: 0, error: "RESEND_API_KEY not configured" };

  // Find leads contacted > 3 days ago with no response
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("outreach_leads")
    .select("*, outreach_messages(id, subject, body, message_status, sent_at)")
    .eq("lead_status", "contacted")
    .lt("last_contacted_at", threeDaysAgo)
    .limit(5);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: leads } = await query;
  if (!leads || leads.length === 0) return { sent: 0, message: "No leads need follow-up" };

  // Filter to those with < 2 sent messages
  const needsFollowUp = leads.filter((l: any) => {
    const sentMsgs = (l.outreach_messages || []).filter((m: any) => m.message_status === "sent");
    return sentMsgs.length < 2;
  });

  let sent = 0;

  for (const lead of needsFollowUp) {
    const lastMsg = (lead.outreach_messages || [])
      .filter((m: any) => m.message_status === "sent")
      .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

    // AI generates follow-up
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are Jason. Write a very short follow-up email (max 60 words). Be casual, reference your previous email, and add one new piece of value. Sign as Jason.`
          },
          {
            role: "user",
            content: `Follow up with ${lead.business_name} (${lead.industry}).
Previous subject: ${lastMsg?.subject || "website improvement"}
Previous email was about: ${lastMsg?.body?.slice(0, 200) || "custom website"}

Return JSON: { "subject": "...", "body": "..." }`
          }
        ],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      let followUp;
      try {
        const content = aiData.choices?.[0]?.message?.content || "";
        followUp = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      } catch {
        continue;
      }

      if (followUp?.subject && followUp?.body) {
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Jason <jason@opendraft.co>",
            to: lead.contact_email,
            subject: followUp.subject,
            text: followUp.body,
          }),
        });

        if (emailResp.ok) {
          await supabase.from("outreach_messages").insert({
            lead_id: lead.id,
            campaign_id: lead.campaign_id,
            subject: followUp.subject,
            body: followUp.body,
            channel: "email",
            direction: "outbound",
            ai_generated: true,
            message_status: "sent",
            sent_at: new Date().toISOString(),
            metadata: { template: "follow_up" },
          });

          sent++;
        }
      }
    }
  }

  // Mark stale leads
  const { data: staleLeads } = await supabase
    .from("outreach_leads")
    .select("id, outreach_messages(id, message_status)")
    .eq("lead_status", "contacted")
    .lt("last_contacted_at", new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  for (const lead of (staleLeads || [])) {
    const sentCount = (lead.outreach_messages || []).filter((m: any) => m.message_status === "sent").length;
    if (sentCount >= 2) {
      await supabase.from("outreach_leads").update({ lead_status: "no_response" }).eq("id", lead.id);
    }
  }

  return { sent, follow_ups_needed: needsFollowUp.length };
}
