/**
 * 150+ long-tail SEO topics organized by vertical.
 * Narrative: "Every business, better software." — own your code, kill per-seat fees, replace SaaS.
 * The swarm-seo-writer picks from this bank and generates blog posts autonomously.
 */

export interface SEOTopic {
  keyword: string;
  vertical: string;
  category: string;
}

export const TOPIC_BANK: SEOTopic[] = [
  // ── Own Your Software ── (NEW — core narrative pillar)
  { keyword: "stop renting software own your code", vertical: "general", category: "Own Your Software" },
  { keyword: "why you should own your business software", vertical: "smb", category: "Own Your Software" },
  { keyword: "saas subscription fatigue 2026", vertical: "general", category: "Own Your Software" },
  { keyword: "own vs rent software for small business", vertical: "smb", category: "Own Your Software" },
  { keyword: "escape saas vendor lock in", vertical: "enterprise", category: "Own Your Software" },
  { keyword: "full source code ownership benefits", vertical: "general", category: "Own Your Software" },
  { keyword: "software ownership vs subscription model", vertical: "founders", category: "Own Your Software" },
  { keyword: "one time purchase software no subscription", vertical: "general", category: "Own Your Software" },
  { keyword: "buy software outright no monthly fees", vertical: "smb", category: "Own Your Software" },
  { keyword: "code ownership for non technical founders", vertical: "founders", category: "Own Your Software" },

  // ── Replace Your SaaS ── (NEW — competitive positioning)
  { keyword: "replace expensive saas with custom app", vertical: "smb", category: "Replace Your SaaS" },
  { keyword: "custom crm vs salesforce cost comparison", vertical: "smb", category: "Replace Your SaaS" },
  { keyword: "build your own project management tool", vertical: "enterprise", category: "Replace Your SaaS" },
  { keyword: "per seat pricing is a scam", vertical: "general", category: "Replace Your SaaS" },
  { keyword: "saas alternatives for small business 2026", vertical: "smb", category: "Replace Your SaaS" },
  { keyword: "replace hubspot with custom app", vertical: "smb", category: "Replace Your SaaS" },
  { keyword: "custom software cheaper than saas", vertical: "founders", category: "Replace Your SaaS" },
  { keyword: "how to stop paying per seat fees", vertical: "enterprise", category: "Replace Your SaaS" },
  { keyword: "self hosted alternatives to popular saas", vertical: "developers", category: "Replace Your SaaS" },
  { keyword: "total cost of ownership saas vs custom", vertical: "enterprise", category: "Replace Your SaaS" },
  { keyword: "replace notion with your own app", vertical: "general", category: "Replace Your SaaS" },
  { keyword: "replace airtable with custom database app", vertical: "smb", category: "Replace Your SaaS" },

  // ── Better Margins ── (NEW — business outcome pillar)
  { keyword: "reduce software costs for small business", vertical: "smb", category: "Better Margins" },
  { keyword: "software spending audit small business", vertical: "smb", category: "Better Margins" },
  { keyword: "how much do businesses spend on saas 2026", vertical: "enterprise", category: "Better Margins" },
  { keyword: "cut saas costs without losing features", vertical: "smb", category: "Better Margins" },
  { keyword: "software budget optimization guide", vertical: "enterprise", category: "Better Margins" },
  { keyword: "unlimited users no per seat pricing", vertical: "general", category: "Better Margins" },
  { keyword: "roi of owning your software stack", vertical: "founders", category: "Better Margins" },

  // ── Paste and Build ── (NEW — product experience pillar)
  { keyword: "build app from website url automatically", vertical: "general", category: "Paste and Build" },
  { keyword: "turn your website into an app", vertical: "smb", category: "Paste and Build" },
  { keyword: "ai website to app converter 2026", vertical: "general", category: "Paste and Build" },
  { keyword: "custom app from your website in minutes", vertical: "smb", category: "Paste and Build" },
  { keyword: "website url to production app", vertical: "general", category: "Paste and Build" },
  { keyword: "fastest way to get custom business software", vertical: "founders", category: "Paste and Build" },
  { keyword: "ai builds app from your site", vertical: "general", category: "Paste and Build" },

  // ── Vibe Coding ──
  { keyword: "best vibe coding tools 2026", vertical: "developers", category: "Vibe Coding" },
  { keyword: "vibe coding explained for beginners", vertical: "general", category: "Vibe Coding" },
  { keyword: "no code app store", vertical: "general", category: "Vibe Coding" },
  { keyword: "vibe coding vs traditional development", vertical: "developers", category: "Vibe Coding" },
  { keyword: "how to build apps without coding 2026", vertical: "general", category: "Vibe Coding" },
  { keyword: "ai generated web apps marketplace", vertical: "general", category: "Vibe Coding" },
  { keyword: "vibe coding workflow tips", vertical: "developers", category: "Vibe Coding" },
  { keyword: "best ai app builders compared", vertical: "developers", category: "Vibe Coding" },
  { keyword: "lovable vs cursor vs bolt comparison", vertical: "developers", category: "Vibe Coding" },
  { keyword: "future of vibe coding 2026 predictions", vertical: "general", category: "Vibe Coding" },
  { keyword: "vibe coding for non technical founders", vertical: "founders", category: "Vibe Coding" },
  { keyword: "how to monetize vibe coded apps", vertical: "creators", category: "Vibe Coding" },

  // ── Templates ──
  { keyword: "buy react templates online", vertical: "developers", category: "Templates" },
  { keyword: "react dashboard template production ready", vertical: "developers", category: "Templates" },
  { keyword: "deploy react app one click", vertical: "developers", category: "Templates" },
  { keyword: "best react starter templates 2026", vertical: "developers", category: "Templates" },
  { keyword: "tailwind css template marketplace", vertical: "developers", category: "Templates" },
  { keyword: "nextjs alternative react template", vertical: "developers", category: "Templates" },
  { keyword: "landing page template with auth", vertical: "developers", category: "Templates" },
  { keyword: "admin dashboard template react typescript", vertical: "developers", category: "Templates" },
  { keyword: "ecommerce template react supabase", vertical: "developers", category: "Templates" },

  // ── AI Apps ──
  { keyword: "ai app marketplace for developers", vertical: "developers", category: "AI Apps" },
  { keyword: "ai generated app marketplace", vertical: "general", category: "AI Apps" },
  { keyword: "best ai coding assistant 2026", vertical: "developers", category: "AI Apps" },
  { keyword: "ai chatbot template react", vertical: "developers", category: "AI Apps" },
  { keyword: "build ai saas product fast", vertical: "developers", category: "AI Apps" },
  { keyword: "ai wrapper app ideas 2026", vertical: "developers", category: "AI Apps" },
  { keyword: "ai powered crm template", vertical: "developers", category: "AI Apps" },

  // ── SMB Growth ──
  { keyword: "best website builder for restaurants 2026", vertical: "restaurants", category: "SMB Growth" },
  { keyword: "salon booking app template", vertical: "salons", category: "SMB Growth" },
  { keyword: "contractor website template free", vertical: "contractors", category: "SMB Growth" },
  { keyword: "small business app marketplace", vertical: "smb", category: "SMB Growth" },
  { keyword: "restaurant ordering app template", vertical: "restaurants", category: "SMB Growth" },
  { keyword: "auto repair shop website template", vertical: "contractors", category: "SMB Growth" },
  { keyword: "yoga studio website template", vertical: "fitness", category: "SMB Growth" },
  { keyword: "cleaning service booking app template", vertical: "contractors", category: "SMB Growth" },
  { keyword: "food truck website template", vertical: "restaurants", category: "SMB Growth" },
  { keyword: "dentist appointment booking app", vertical: "healthcare", category: "SMB Growth" },
  { keyword: "gym management app template", vertical: "fitness", category: "SMB Growth" },
  { keyword: "law firm website template", vertical: "smb", category: "SMB Growth" },

  // ── Health & Fitness ──
  { keyword: "fitness app template react", vertical: "fitness", category: "Health & Fitness" },
  { keyword: "workout tracker app template", vertical: "fitness", category: "Health & Fitness" },
  { keyword: "meal planner app template react", vertical: "fitness", category: "Health & Fitness" },
  { keyword: "personal trainer website template", vertical: "fitness", category: "Health & Fitness" },
  { keyword: "mental health app template", vertical: "healthcare", category: "Health & Fitness" },

  // ── Healthcare ──
  { keyword: "healthcare portal template", vertical: "healthcare", category: "Healthcare" },
  { keyword: "telemedicine app template react", vertical: "healthcare", category: "Healthcare" },
  { keyword: "patient intake form app template", vertical: "healthcare", category: "Healthcare" },
  { keyword: "hipaa compliant app template", vertical: "healthcare", category: "Healthcare" },

  // ── Real Estate ──
  { keyword: "real estate listing app template", vertical: "real-estate", category: "Real Estate" },
  { keyword: "property management dashboard template", vertical: "real-estate", category: "Real Estate" },
  { keyword: "real estate crm template react", vertical: "real-estate", category: "Real Estate" },
  { keyword: "rental property app template", vertical: "real-estate", category: "Real Estate" },

  // ── Creator Economy ──
  { keyword: "how to sell code online", vertical: "creators", category: "Creator Economy" },
  { keyword: "sell lovable apps online", vertical: "creators", category: "Creator Economy" },
  { keyword: "passive income selling code", vertical: "creators", category: "Creator Economy" },
  { keyword: "developer side hustle ideas 2026", vertical: "creators", category: "Creator Economy" },
  { keyword: "make money with ai generated apps", vertical: "creators", category: "Creator Economy" },
  { keyword: "sell react components online", vertical: "creators", category: "Creator Economy" },
  { keyword: "digital product marketplace for developers", vertical: "creators", category: "Creator Economy" },
  { keyword: "how to price software templates", vertical: "creators", category: "Creator Economy" },
  { keyword: "build and sell saas side project", vertical: "creators", category: "Creator Economy" },
  { keyword: "micro saas ideas 2026", vertical: "creators", category: "Creator Economy" },

  // ── Agent Economy ──
  { keyword: "mcp server marketplace", vertical: "agents", category: "Agent Economy" },
  { keyword: "ai agents buying software autonomously", vertical: "agents", category: "Agent Economy" },
  { keyword: "autonomous ai marketplace", vertical: "agents", category: "Agent Economy" },
  { keyword: "best mcp servers 2026", vertical: "agents", category: "Agent Economy" },
  { keyword: "ai agent tools marketplace", vertical: "agents", category: "Agent Economy" },
  { keyword: "build mcp server tutorial", vertical: "agents", category: "Agent Economy" },
  { keyword: "agent native app development", vertical: "agents", category: "Agent Economy" },
  { keyword: "ai agent economy explained", vertical: "agents", category: "Agent Economy" },
  { keyword: "ai agents for business automation", vertical: "agents", category: "Agent Economy" },

  // ── SaaS ──
  { keyword: "best saas starter kit 2026", vertical: "developers", category: "SaaS" },
  { keyword: "white label saas template", vertical: "enterprise", category: "SaaS" },
  { keyword: "saas boilerplate react supabase", vertical: "developers", category: "SaaS" },
  { keyword: "multi tenant saas template", vertical: "developers", category: "SaaS" },
  { keyword: "saas pricing page template", vertical: "developers", category: "SaaS" },
  { keyword: "stripe integration saas template", vertical: "developers", category: "SaaS" },

  // ── Enterprise ──
  { keyword: "enterprise app template react", vertical: "enterprise", category: "Enterprise" },
  { keyword: "internal tools template react", vertical: "enterprise", category: "Enterprise" },
  { keyword: "employee directory app template", vertical: "enterprise", category: "Enterprise" },
  { keyword: "project management app template", vertical: "enterprise", category: "Enterprise" },

  // ── Education ──
  { keyword: "online course platform template", vertical: "education", category: "Education" },
  { keyword: "lms template react", vertical: "education", category: "Education" },
  { keyword: "student portal template", vertical: "education", category: "Education" },
  { keyword: "quiz app template react", vertical: "education", category: "Education" },

  // ── Finance ──
  { keyword: "fintech app template react", vertical: "finance", category: "Finance" },
  { keyword: "invoice generator app template", vertical: "finance", category: "Finance" },
  { keyword: "expense tracker app template", vertical: "finance", category: "Finance" },
  { keyword: "budget planner app template react", vertical: "finance", category: "Finance" },

  // ── Social / Community ──
  { keyword: "social media app template react", vertical: "developers", category: "Social" },
  { keyword: "community forum template react", vertical: "developers", category: "Social" },

  // ── Comparison ──
  { keyword: "lovable alternatives 2026", vertical: "general", category: "Comparison" },
  { keyword: "bolt.new alternatives 2026", vertical: "general", category: "Comparison" },
  { keyword: "cursor vs lovable which is better", vertical: "developers", category: "Comparison" },
  { keyword: "replit alternatives for web apps", vertical: "developers", category: "Comparison" },
  { keyword: "vercel templates vs opendraft", vertical: "developers", category: "Comparison" },
  { keyword: "gumroad alternatives for developers", vertical: "creators", category: "Comparison" },
  { keyword: "themeforest alternatives 2026", vertical: "creators", category: "Comparison" },
];