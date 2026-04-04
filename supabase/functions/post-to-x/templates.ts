/**
 * Tweet text templates — Enterprise ICP
 * Brand: "Every business, better software."
 * Voice: Authoritative, measured, strategic — like a respected technology advisor
 * Audience: CIOs, CTOs, VPs of Engineering, CFOs at mid-market and enterprise companies
 */

const SITE_URL = "https://opendraft.co";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const usedIndices: Record<string, Set<number>> = {};
function pickUnique<T>(key: string, arr: T[]): T {
  if (!usedIndices[key]) usedIndices[key] = new Set();
  const available = arr.map((_, i) => i).filter(i => !usedIndices[key].has(i));
  if (available.length === 0) {
    usedIndices[key] = new Set();
    return pick(arr);
  }
  const idx = pick(available);
  usedIndices[key].add(idx);
  return arr[idx];
}

// ═══════════════════════════════════════════════════════════════
// STRATEGIC INSIGHTS — ownership narrative for enterprise
// ═══════════════════════════════════════════════════════════════
export function engagementHookTweet(): string {
  return pickUnique("hook", [
    `Per-seat pricing scales linearly with headcount. Owned software doesn't.\n\nAt 200+ employees, the gap becomes a strategic advantage.\n\n${SITE_URL}`,

    `The most expensive software in your organization isn't the one with the highest license fee.\n\nIt's the one you can't leave.\n\n${SITE_URL}`,

    `Enterprise software strategy is evolving from "which vendor?" to "should we own this?"\n\nThe economics now favor ownership for operational tools.\n\n${SITE_URL}`,

    `A pattern across high-performing organizations: they own their operational software and subscribe only to genuine platforms.\n\nThe distinction matters more than most realize.\n\n${SITE_URL}`,

    `When your SaaS vendor gets acquired — and they will — your roadmap changes overnight.\n\nOwned software gives you continuity your procurement team can plan around.\n\n${SITE_URL}`,

    `The total cost of a SaaS subscription includes more than the invoice.\n\nSecurity reviews. Vendor management. Contract negotiation. Compliance audits.\n\nOwned software eliminates the overhead.\n\n${SITE_URL}`,

    `Organizations spending $500K+/year on SaaS are discovering that 40-60% of those tools have viable owned alternatives.\n\nThe savings compound annually.\n\n${SITE_URL}`,

    `Software ownership isn't about building everything in-house.\n\nIt's about choosing which tools you control — and which vendors you're comfortable depending on.\n\n${SITE_URL}`,

    `The strongest technology foundations are built on tools you govern, not tools governed by your vendors' priorities.\n\n${SITE_URL}`,

    `AI-assisted maintenance has eliminated the primary objection to owned enterprise software.\n\nThe question is no longer "who maintains it?" — it's "why are we still renting?"\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE CASE — measured urgency, data-driven
// ═══════════════════════════════════════════════════════════════
export function fomoTweet(stats: { browsing?: number; signups?: number; apps?: number }): string {
  return pickUnique("fomo", [
    `Enterprise IT teams are quietly building internal app catalogs with governed, owned software.\n\nThe shift from vendor-managed to self-governed is accelerating.\n\n${SITE_URL}`,

    `${stats.apps || 500}+ production-ready apps available to own outright.\n\nFull source code. No per-seat fees. Enterprise-grade compliance tagging.\n\n${SITE_URL}`,

    `The organizations rethinking their software strategy now will have 18-24 months of cost advantage over those who wait.\n\nThe math favors early movers.\n\n${SITE_URL}`,

    `Every quarter you delay evaluating owned alternatives, your SaaS contracts auto-renew — often with built-in price increases.\n\nAt enterprise scale, timing matters.\n\n${SITE_URL}`,

    `More enterprise teams are evaluating software ownership as part of their annual technology reviews.\n\nThe conversation has moved from "if" to "which tools first."\n\n${SITE_URL}`,

    `The ROI on transitioning operational tools from subscription to ownership typically reaches positive within 6-12 months.\n\nAt 500+ seats, it's often within 90 days.\n\n${SITE_URL}`,

    `Enterprise procurement is evolving. The question isn't just "which SaaS?" anymore.\n\nIt's "rent or own?" — and the ownership option just got significantly better.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PAIN POINTS — professional, empathetic, not aggressive
// ═══════════════════════════════════════════════════════════════
export function painPointTweet(): string {
  return pickUnique("pain", [
    `Enterprise software challenges that ownership addresses:\n\n- Per-seat costs that scale with headcount\n- Vendor lock-in limiting strategic flexibility\n- Data portability concerns\n- Feature roadmaps you don't control\n\n${SITE_URL}`,

    `The annual SaaS renewal cycle is a negotiation you shouldn't have to have.\n\nOwned software doesn't send renewal notices.\n\n${SITE_URL}`,

    `At enterprise scale, the administrative burden of managing 200+ SaaS vendors is itself a significant cost center.\n\nSimplifying through ownership reduces overhead and risk.\n\n${SITE_URL}`,

    `The "enterprise tier" pricing model: same product, 3-5x the cost, SSO and audit logs behind a paywall.\n\nOwned software includes these by default because they're in the source code.\n\n${SITE_URL}`,

    `Three compounding problems with per-seat SaaS at scale:\n\n1. Costs grow linearly with hiring\n2. Unused seats are rarely reclaimed\n3. Multi-year contracts reduce negotiating leverage\n\nOwnership breaks all three.\n\n${SITE_URL}`,

    `The real cost of SaaS vendor dependency isn't the subscription.\n\nIt's the switching cost that accumulates over time — making each renewal less optional than the last.\n\n${SITE_URL}`,

    `When a SaaS vendor changes their API, your integrations break on their timeline, not yours.\n\nWith owned software, you control the pace of change.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PLATFORM CAPABILITY — what the AI maintenance layer delivers
// ═══════════════════════════════════════════════════════════════
export function gremlinTweet(activity?: string): string {
  return pickUnique("gremlin", [
    `How we address the "who maintains it?" concern:\n\nAI agents continuously monitor, patch, and optimize every app in the catalog.\n\nSecurity scans. Dependency updates. Performance monitoring. Automated.\n\n${SITE_URL}`,

    `Enterprise software maintenance without a dedicated DevOps team:\n\n- Automated security patching\n- Continuous dependency updates\n- Performance monitoring\n- Screenshot and documentation refresh\n\nAll handled by AI agents, 24/7.\n\n${SITE_URL}`,

    `The operational cost of maintaining owned software used to be the primary argument for SaaS.\n\nAI-assisted maintenance has fundamentally changed that calculus.\n\n${SITE_URL}`,

    `Our AI maintenance layer handles the operational burden that historically made software ownership impractical at scale.\n\nSecurity. Updates. Monitoring. Continuously.\n\n${SITE_URL}`,

    `What separates a marketplace of owned software from "just downloading code":\n\nGoverned catalogs. Compliance tagging. AI-driven maintenance. Enterprise role management.\n\nOwnership with operational maturity.\n\n${SITE_URL}`,

    `The maintenance question, answered:\n\nEvery app in the catalog is monitored by AI agents that handle security patches, dependency updates, and broken deploys automatically.\n\nOwnership without the operational overhead.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS — professional engagement
// ═══════════════════════════════════════════════════════════════
export function questionTweet(): string {
  return pickUnique("question", [
    `For enterprise IT leaders:\n\nWhat percentage of your SaaS portfolio would you own outright if the maintenance burden was solved?\n\nGenuinely interested in how teams think about this.`,

    `Question for CTOs and VPs of Engineering:\n\nDo you evaluate owned alternatives as part of your SaaS renewal process?\n\nIf not, why not? If so, what's the decision framework?`,

    `When did software ownership stop being the default?\n\nAnd when does it become the default again?\n\nCurious about perspectives from enterprise buyers.`,

    `For organizations managing 100+ SaaS subscriptions:\n\nWhat's your biggest challenge — cost, security, vendor management, or data portability?\n\nThe answer shapes the solution.`,

    `Enterprise buyers: if you could own any three tools in your SaaS stack, which would deliver the highest ROI?\n\nCRM, project management, and analytics come up most in our conversations.`,

    `A strategic question for technology leaders:\n\nAt what headcount does per-seat pricing become untenable — and what's your alternative?`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS STORIES — credible, specific, measured
// ═══════════════════════════════════════════════════════════════
export function successStoryTweet(listing?: any): string {
  return pickUnique("success", [
    `An enterprise team evaluated owned alternatives for three SaaS tools during their annual review.\n\nProjected 3-year savings: $420K. Implementation timeline: 6 weeks.\n\n${SITE_URL}`,

    `A mid-market company transitioned their internal CRM from a per-seat SaaS to an owned alternative.\n\n400 users. Zero per-seat fees. Full source code governance.\n\nThe economics are clear.\n\n${SITE_URL}`,

    `Before: $180K/year across 4 operational SaaS tools\nAfter: $2K one-time for owned alternatives\n\nSame functionality. Better data control. Predictable costs.\n\n${SITE_URL}`,

    `A CISO we work with chose owned software specifically for compliance.\n\nFull source code auditing. No third-party data processing. Complete governance.\n\nSometimes ownership is a security decision, not a cost one.\n\n${SITE_URL}`,

    `Pattern we're seeing: organizations start by owning one operational tool.\n\nWithin 12 months, they've transitioned 3-5 more.\n\nThe initial success creates internal momentum.\n\n${SITE_URL}`,

    `A CFO's perspective on the transition:\n\n"We didn't switch to save money — though we did. We switched because predictable costs are easier to plan around than per-seat pricing."\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// STRATEGIC POSITIONING — thought leadership CTAs
// ═══════════════════════════════════════════════════════════════
export function directCtaTweet(): string {
  return pickUnique("cta", [
    `Production-ready apps your team can own, govern, and deploy.\n\nNo per-seat fees. Full source code. Enterprise compliance tagging.\n\n${SITE_URL}`,

    `The enterprise app marketplace for organizations that want to own their operational tools.\n\nGoverned catalogs. Role-based access. AI-maintained.\n\n${SITE_URL}`,

    `What ownership looks like at enterprise scale:\n\n- Full source code access\n- Unlimited users, no seat fees\n- Compliance tagging (SOC2, HIPAA, GDPR)\n- AI-automated maintenance\n- Private team catalogs\n\n${SITE_URL}`,

    `Evaluate the ownership alternative.\n\nBrowse production-ready apps. Review the source code. Calculate your savings.\n\nNo commitment required.\n\n${SITE_URL}`,

    `Your team deserves tools they control.\n\nOwned software with enterprise governance, compliance, and AI maintenance.\n\n${SITE_URL}`,

    `For IT leaders exploring software ownership:\n\nBrowse the catalog. Everything is production-ready, fully documented, and available to own outright.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// DATA DROP — enterprise-relevant metrics
// ═══════════════════════════════════════════════════════════════
export function dataDropTweet(data: {
  totalApps?: number;
  weeklyListings?: number;
  weeklySales?: number;
  topCategory?: string;
  avgPrice?: number;
  topApp?: string;
  builderCount?: number;
}): string {
  return pickUnique("datadrop", [
    `Software ownership by the numbers:\n\n${data.totalApps || 500}+ production-ready apps available\nAverage one-time cost: $${data.avgPrice || 29}\nTop enterprise category: ${data.topCategory || "CRM & dashboards"}\n\nThe owned alternative exists for most operational tools.\n\n${SITE_URL}`,

    `Enterprise adoption metrics:\n\nNew apps added weekly: ${data.weeklyListings || 15}\nOrganizations evaluating ownership: growing\nAvg savings vs. SaaS equivalent: 85-95%\n\nThe shift is measurable.\n\n${SITE_URL}`,

    `One data point that reframes the conversation:\n\nThe average owned app costs $${data.avgPrice || 29} once.\n\nThe average SaaS equivalent costs $99/seat/month.\n\nAt 50 seats, that's $59,400/year vs. $${data.avgPrice || 29}.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// BUILDER SPOTLIGHT — ecosystem credibility
// ═══════════════════════════════════════════════════════════════
export function builderSpotlightTweet(builder: {
  name?: string;
  appCount?: number;
  topApp?: string;
  totalSales?: number;
}): string {
  return pickUnique("spotlight", [
    `Every app in the catalog is built by experienced developers — many with enterprise engineering backgrounds.\n\nProduction-tested code. Real-world architecture. Full source access.\n\n${SITE_URL}`,

    `The quality of owned software available today would have been unimaginable 3 years ago.\n\nEnterprise-grade apps, ready to deploy, at a fraction of SaaS costs.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// HOT TAKES — strategic, not inflammatory
// ═══════════════════════════════════════════════════════════════
export function hotTakeTweet(): string {
  return pickUnique("hottake", [
    `Within 3 years, enterprise IT organizations that still rely entirely on per-seat SaaS will be at a measurable cost disadvantage.\n\nThe ownership alternative is maturing fast.\n\n${SITE_URL}`,

    `The strongest CIOs aren't negotiating better SaaS contracts.\n\nThey're strategically reducing their dependence on them.\n\n${SITE_URL}`,

    `Contrarian take: "best-of-breed SaaS" is often 90% of features at 10x the cost of an owned equivalent.\n\nFor operational tools, "good enough and owned" frequently delivers better ROI.\n\n${SITE_URL}`,

    `The SaaS model optimizes for vendor revenue. The ownership model optimizes for customer economics.\n\nEnterprise procurement is starting to notice the difference.\n\n${SITE_URL}`,

    `Prediction: by 2028, "software ownership strategy" will be a standard component of enterprise IT governance frameworks.\n\nThe groundwork is being laid now.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// MINI-THREADS — strategic depth
// ═══════════════════════════════════════════════════════════════
export function miniThreadTweet(): string[] {
  const threads = [
    [
      `We studied how organizations with 200+ employees approach software ownership decisions.\n\nThe patterns are consistent:`,
      `1/ They start with the highest per-seat cost tools — typically CRM, project management, or analytics.\n\nThese have the fastest ROI because the savings scale directly with headcount.`,
      `2/ They prioritize governance over speed. Every owned tool goes through the same security and compliance review as a SaaS vendor.\n\nOwnership doesn't mean ungoverned.`,
      `3/ The transition is incremental. One tool per quarter. Measured against the SaaS equivalent on cost, capability, and operational overhead.\n\nMethodical, not revolutionary.\n\n${SITE_URL}`,
    ],
    [
      `The enterprise build-vs-buy framework is evolving. Here's what's changing:`,
      `The old framework: build (expensive, slow) vs. buy SaaS (convenient, ongoing cost).\n\nThe new framework: build vs. buy SaaS vs. own (pre-built, one-time cost, full control).`,
      `The "own" option didn't exist at enterprise quality until recently.\n\nAI-assisted development and maintenance changed the economics. Production-ready owned apps are now viable alternatives to SaaS subscriptions.\n\n${SITE_URL}`,
    ],
    [
      `Why enterprise CISOs are looking at software ownership differently:`,
      `With SaaS: your data lives in a vendor's infrastructure. Their security posture is your risk.\n\nWith owned software: you control the deployment, the data flow, and the security model.`,
      `This isn't about SaaS being insecure. It's about the risk concentration of depending on vendors you don't govern.\n\nOwnership gives compliance teams full visibility and control.\n\n${SITE_URL}`,
    ],
  ];
  return pick(threads);
}

// ═══════════════════════════════════════════════════════════════
// LISTING & MILESTONE TEMPLATES
// ═══════════════════════════════════════════════════════════════
export function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(0)}`;
  const badge = listing.completeness_badge === "production_ready" ? "Production-ready" :
    listing.completeness_badge === "mvp" ? "MVP" : "Prototype";
  const url = `${SITE_URL}/listing/${listing.id}`;

  return pickUnique("new_listing", [
    `New in the catalog: "${listing.title}"\n\n${badge}. Full source code. ${price}.\n\nOwn it outright → ${url}`,
    `"${listing.title}" now available — ${badge}, ready to deploy.\n\n${price}. Full source code access.\n\n${url}`,
    `Just added: ${listing.title}\n\n${badge} · ${price} · Source code included\n\nEvaluate it → ${url}`,
  ]);
}

export function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  return pickUnique("milestone", [
    `"${listing.title}" has been adopted by ${milestone} organizations.\n\nProduction-tested by real teams.\n\n${url}`,
    `${milestone} teams now run "${listing.title}" as owned software.\n\n${url}`,
  ]);
}

export function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "Free" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return pickUnique("trending_digest", [
    `Most adopted this week:\n\n${lines.join("\n")}\n\nAll available with full source code.\n\n${SITE_URL}`,
    `What enterprise teams are deploying:\n\n${lines.join("\n")}\n\nBrowse the full catalog → ${SITE_URL}`,
  ]);
}

export function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return pickUnique("weekly", [
    `Weekly catalog update:\n\n${stats.listings} new apps added\n${stats.sales} deployments\n${stats.builders} new builders contributing\n\nThe owned software ecosystem continues to grow.\n\n${SITE_URL}`,
    `This week: ${stats.listings} new production-ready apps, ${stats.sales} organizations deployed owned software.\n\nThe catalog is expanding across every enterprise category.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ART PROMPT GENERATOR — PREMIUM TIER
// ═══════════════════════════════════════════════════════════════
// Each prompt is a self-contained cinematic brief. The model receives ONE
// prompt — no style-mixing, no generic fallbacks. Every image should feel
// like a hero shot from a Bloomberg or McKinsey digital report.
export function getTweetArtPrompt(postType: string): string {
  // QUALITY DIRECTIVE appended to every prompt — enforces premium bar
  const QD = "Photorealistic CGI quality, 8K render, dramatic cinematic lighting with a single warm key light and cool ambient fill, shallow depth-of-field bokeh on background elements, ultra-clean composition with generous negative space, no text, no words, no letters, no watermarks, no logos, no UI elements, aspect ratio 16:9";

  const prompts: Record<string, string[]> = {
    engagement_hook: [
      `A massive obsidian monolith standing alone in a vast salt flat at golden hour — its surface reflecting a single luminous keyhole. Surrounding it, hundreds of translucent subscription cards dissolve into dust carried by wind. The scale conveys permanence vs ephemerality. ${QD}`,
      `An aerial view of two cities at dusk: one is a chaotic tangle of glowing wires and blinking SaaS logos fading into static, the other is a serene grid of self-illuminated buildings with warm interior light. A single bridge connects them, half-built. ${QD}`,
      `A lone figure in a tailored suit stands at the edge of an infinite glass floor, beneath which thousands of spinning gears and data streams are visible. They hold a single brass key that glows faintly. Corporate power, quiet confidence. ${QD}`,
    ],
    fomo: [
      `A sweeping time-lapse composite: a barren desert landscape on the left gradually transitions to a thriving metropolis of crystalline towers on the right, with a subtle upward-curving horizon line connecting them. Golden hour light bathes the city side. ${QD}`,
      `An enormous hourglass made of polished black marble, suspended in a void. The top chamber holds dissolving subscription receipts, the bottom fills with solid gold ingots. Light refracts through the glass creating caustic patterns on surrounding darkness. ${QD}`,
    ],
    pain_point: [
      `Close-up macro shot of a tangled mass of fiber-optic cables, each glowing a different corporate color — gradually being replaced by a single elegant conduit of white light that cuts through the chaos diagonally. Shallow DOF, moody blue-gray atmosphere. ${QD}`,
      `A boardroom table seen from directly above. On one half: scattered invoices, multiple laptop screens showing different vendor dashboards. On the other half: a single clean tablet displaying one unified interface, a coffee cup, a calm hand. The contrast tells the story. ${QD}`,
    ],
    gremlin: [
      `A futuristic server room rendered as a cathedral — towering columns of light, with tiny luminous autonomous agents (abstract geometric forms, not humanoid) floating between racks, performing maintenance. Volumetric fog, teal and amber accent lighting, reverent atmosphere. ${QD}`,
      `An abstract control surface — a vast dark desk with a single glowing orb at its center, from which thin golden threads extend outward to dozens of floating app interfaces arranged in a perfect constellation. Each interface pulses with healthy green status indicators. ${QD}`,
    ],
    question: [
      `A dramatic crossroads in an impossible landscape: one path is paved with glowing subscription tiles that fade into fog, the other is a solid stone bridge leading to a single illuminated fortress on a cliff. Storm clouds above, breaking sunlight on the fortress. ${QD}`,
      `An enormous question mark sculpted from brushed titanium, standing in a minimalist gallery space with polished concrete floors. Its shadow on the wall forms the silhouette of a building. Single spotlight, museum-quality presentation. ${QD}`,
    ],
    success_story: [
      `Split composition: left side shows a cramped, cable-cluttered server closet in cold fluorescent light. Right side shows the same space transformed into an airy, plant-filled modern office with a single elegant terminal. A person walks confidently through the right side. ${QD}`,
      `An architect's hands placing the final crystalline block atop a pristine tower model. The model glows from within. Behind them, through floor-to-ceiling windows, a real city skyline mirrors the model's form. Dawn light, sense of completion. ${QD}`,
    ],
    direct_cta: [
      `A massive vault door, slightly ajar, with warm golden light spilling out into a dark marble corridor. The door's surface is brushed steel with minimal geometric patterns. The light reveals a glimpse of organized, beautiful software interfaces within. Cinematic scale. ${QD}`,
      `A hand reaching toward a floating translucent cube that contains a miniature, perfectly-running software ecosystem — tiny dashboards, data flows, user interfaces all alive and glowing. The background is pure black with subtle particle effects. ${QD}`,
    ],
    hot_take: [
      `A colossal wave frozen mid-crash, rendered in obsidian and gold. Within the wave's translucent body, you can see the outlines of legacy software interfaces being swept away. On the shore, a single modern structure stands unmoved, its foundations deep. ${QD}`,
      `A chess endgame on an enormous board in an empty grand hall — most pieces have fallen. A single unconventional piece (a key-shaped piece) stands in a winning position against a scattered army of identical pawns. Dramatic side-lighting, dust particles in air. ${QD}`,
    ],
    data_drop: [
      `An enormous holographic data visualization floating above a polished obsidian table in a dark executive briefing room. The visualization shows an inflection point — a curve breaking sharply upward. Teal and white light, no labels, pure visual impact. ${QD}`,
      `Thousands of tiny luminous data points arranged in 3D space, forming the unmistakable shape of an ascending staircase. Each step is a different shade from deep blue to brilliant gold. Shot from a low angle looking up, conveying scale and progress. ${QD}`,
    ],
    new_listing: [
      `A product reveal moment: a single app interface floating on a pedestal of light in a dark showroom space, with subtle lens flares and volumetric light rays from above. The interface glows with warm amber and clean white — like an Apple keynote product shot. ${QD}`,
      `A freshly-minted coin made of iridescent material, resting on black velvet. The coin's surface shows abstract circuit patterns that catch the light. A single dramatic spotlight from the upper right creates a long shadow. Macro photography quality. ${QD}`,
    ],
    blog_post: [
      `An open journal on a mahogany desk, its pages transforming into luminous data streams that rise and merge with a holographic globe above. The room is a sophisticated study — leather, brass, warm lamplight. The streams are cool blue against the warm interior. ${QD}`,
      `A typewriter made of polished steel and glass, with each key press releasing a tiny constellation of light upward. The scene is captured in a grand library with floor-to-ceiling bookshelves, dramatic window light, and floating dust particles. ${QD}`,
    ],
    builder_spotlight: [
      `A craftsperson's workbench viewed from a dramatic low angle — precise tools arranged with surgical precision, a glowing prototype at center. Warm workshop lighting mixed with cool screen glow. Hands in frame suggest mastery. Tilt-shift photography style. ${QD}`,
    ],
    vibe_report: [
      `An enormous transparent sphere containing a living ecosystem of software — interconnected modules orbiting each other like planets. Outside the sphere, abstract market forces swirl as colorful nebulae. Observatory aesthetic, scientific wonder. ${QD}`,
    ],
    value_tweet: [
      `A single perfect diamond resting on raw graphite — both made of carbon, utterly different in value. Shot macro with extreme shallow DOF, studio lighting. The metaphor for transformation is visual, not stated. ${QD}`,
      `A lighthouse beam cutting through dense fog at night, illuminating a narrow but clear path across dark water. Seen from aerial perspective. The beam is warm gold, everything else is moody blue-gray. Solitary, authoritative. ${QD}`,
    ],
  };

  const typePrompts = prompts[postType] || prompts.value_tweet;
  return pick(typePrompts);
}
