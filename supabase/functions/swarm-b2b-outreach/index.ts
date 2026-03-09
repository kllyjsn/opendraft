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
        case "send_emails":
          result = await sendOutreachEmails(supabase, RESEND_API_KEY, campaignId);
          break;
        case "send_follow_ups":
          result = await sendFollowUpEmails(supabase, LOVABLE_API_KEY, RESEND_API_KEY, campaignId);
          break;
        case "full_cycle":
        default:
          // Run full pipeline
          const discovered = await discoverBusinesses(supabase, FIRECRAWL_API_KEY, targetIndustry, targetRegion, campaignId);
          const evaluated = await evaluateLeads(supabase, LOVABLE_API_KEY, FIRECRAWL_API_KEY, campaignId);
          const messages = await generateOutreachMessages(supabase, LOVABLE_API_KEY, campaignId);
          result = {
            discovered,
            evaluated,
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

// Discover businesses using Firecrawl
async function discoverBusinesses(
  supabase: any,
  firecrawlKey: string | undefined,
  targetIndustry: string | null,
  region: string,
  campaignId: string | null
): Promise<any> {
  const leads: any[] = [];

  // Pick industries to search
  const industries = targetIndustry 
    ? TARGET_INDUSTRIES.filter(i => i.name.toLowerCase().includes(targetIndustry.toLowerCase()))
    : TARGET_INDUSTRIES.slice(0, 3); // Limit to 3 industries per run

  if (!firecrawlKey) {
    return { error: "FIRECRAWL_API_KEY not configured", leads_created: 0 };
  }

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
          name: `Auto Discovery - ${new Date().toLocaleDateString()}`,
          niche: "small_business",
          industries: industries.map(i => i.name),
          target_regions: [region],
          services: SERVICES_OFFERED,
          goals: {
            target_leads_per_week: 50,
            target_response_rate: 0.05,
          }
        })
        .select()
        .single();
      activeCampaignId = newCampaign?.id;
    }
  }

  for (const industry of industries) {
    // Pick 2 random niches from each industry
    const niches = industry.niches.sort(() => Math.random() - 0.5).slice(0, 2);

    for (const niche of niches) {
      const searchQuery = `${niche} near me ${region} -yelp -yellowpages -facebook`;
      
      try {
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery, limit: 5 }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data) {
            for (const result of searchData.data) {
              // Skip if already in database
              const { data: existing } = await supabase
                .from("outreach_leads")
                .select("id")
                .eq("website_url", result.url)
                .single();

              if (!existing && result.url && !result.url.includes("yelp") && !result.url.includes("facebook")) {
                const lead = {
                  campaign_id: activeCampaignId,
                  business_name: result.title?.split(" - ")[0]?.split(" | ")[0] || "Unknown Business",
                  industry: industry.name,
                  website_url: result.url,
                  source: "firecrawl_discovery",
                  metadata: {
                    search_query: searchQuery,
                    niche,
                    snippet: result.description,
                  }
                };
                leads.push(lead);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Search failed for ${niche}:`, e);
      }
    }
  }

  // Insert leads
  if (leads.length > 0) {
    await supabase.from("outreach_leads").insert(leads);
  }

  return {
    campaign_id: activeCampaignId,
    industries_searched: industries.map(i => i.name),
    leads_created: leads.length,
    leads: leads.slice(0, 10), // Return sample
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
    .limit(10);

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

    // Scrape website if Firecrawl is available
    if (firecrawlKey && lead.website_url) {
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

// Generate personalized outreach messages
async function generateOutreachMessages(
  supabase: any,
  lovableKey: string,
  campaignId: string | null
): Promise<any> {
  // Get qualified leads without messages
  let query = supabase
    .from("outreach_leads")
    .select("*")
    .in("lead_status", ["qualified", "nurture"])
    .gte("score", 50)
    .limit(5);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads } = await query;

  if (!leads || leads.length === 0) {
    return { messages_drafted: 0, message: "No qualified leads without messages" };
  }

  const messagesCreated: any[] = [];

  for (const lead of leads) {
    // Check if message already exists
    const { data: existingMsg } = await supabase
      .from("outreach_messages")
      .select("id")
      .eq("lead_id", lead.id)
      .single();

    if (existingMsg) continue;

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
