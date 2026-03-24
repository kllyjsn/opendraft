/**
 * Value-first tweet templates — NO hard sell
 * These provide genuine tips, insights, and discussion starters.
 * Only ~20% include a soft CTA. The rest build trust and followers.
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

// ── TIPS & TACTICS (pure value, no CTA) ──
export function tipTweet(): string {
  return pickUnique("tip", [
    `Quick SaaS audit trick:\n\nOpen your credit card statement. Search "subscription."\n\nCount the tools. Multiply by 12.\n\nThat number will motivate you to find alternatives.`,

    `Framework for evaluating any software tool:\n\n1. Do I use >20% of the features?\n2. Am I paying per seat?\n3. Can I export my data easily?\n\nIf the answers are No, Yes, No — you're overpaying.`,

    `Founder tip: before signing any annual SaaS contract, ask:\n\n"What happens to my data if I cancel?"\n\nThe answer tells you everything about the vendor's priorities.`,

    `The 10-minute software audit:\n\n1. List every tool your team uses daily\n2. Star the ones charging per-seat\n3. Google "[tool name] owned alternative"\n\nYou'll find options for at least half.`,

    `Negotiation hack for SaaS renewals:\n\nBefore the call, find an owned alternative and get a quote.\n\nEven if you don't switch, having a real number gives you leverage.\n\nVendors discount 20-40% when you have options.`,

    `Underrated business metric: software cost per employee.\n\nMost companies don't track it.\n\nThe ones that do are usually surprised — it's $200-400/month per person.\n\nMultiply by headcount. That's your optimization opportunity.`,

    `Rule of thumb for SaaS vs owned:\n\nIf you'll use the tool for 2+ years, owning is almost always cheaper.\n\nThe breakeven is usually 3-6 months.`,

    `Before buying any business software, ask:\n\n"Would I rather pay $X/month forever, or $Y once?"\n\nIf the one-time option exists, do the math.\n\nIt's rarely close.`,

    `The best time to audit your SaaS stack is before renewal season.\n\nThe second best time is right now.\n\nPut 30 minutes on your calendar this week.`,

    `Startup tip: your first 10 hires each add ~$300/month in per-seat software costs.\n\n$36k/year. Before they write a line of code.\n\nPlan for this. Or eliminate it.`,
  ]);
}

// ── INDUSTRY INSIGHTS (thought leadership, no CTA) ──
export function insightTweet(): string {
  return pickUnique("insight", [
    `Interesting pattern: the fastest-growing SMBs I know all have one thing in common.\n\nThey own their core software.\n\nCoincidence? The margin data says no.`,

    `The SaaS industry generated $300B in revenue last year.\n\nRoughly $200B of that came from features customers never use.\n\nThat's not a business model. That's a pricing strategy.`,

    `A trend I'm watching: non-technical founders building their own tools with AI.\n\nNot because they want to code.\n\nBecause they're tired of paying $14k/month for software they barely use.`,

    `The "enterprise" tier is the biggest markup in software.\n\nSame product. Same features. 5x the price.\n\nThe only difference? A checkbox labeled "SSO" and a PDF invoice.`,

    `Something shifted in 2025:\n\nBuilding custom software became faster than evaluating SaaS options.\n\nThe sales demo → trial → negotiation → implementation cycle takes months.\n\nAI-built tools take hours.`,

    `The real cost of SaaS isn't the subscription.\n\nIt's the switching cost that keeps you locked in.\n\nEvery month you use a tool, leaving gets harder.\n\nThat's by design.`,

    `Data I keep coming back to:\n\nBusinesses that own their software have 15-30% better margins than competitors using equivalent SaaS.\n\nThe delta compounds over time.`,

    `Prediction: by 2028, "SaaS fatigue" will be a recognized business problem with its own consulting industry.\n\nThe same way "cloud migration" was 10 years ago.`,

    `The average SMB uses 37 SaaS tools.\n\n12 of them overlap in functionality.\n\n8 are used by fewer than 3 people.\n\nEvery company has this problem. Few measure it.`,

    `Counterintuitive: the best software decision is often NOT the "best" tool.\n\nIt's the adequate tool you own and control.\n\n"Good enough + owned" beats "best-in-class + rented" on a 3-year horizon.`,
  ]);
}

// ── DISCUSSION STARTERS (engagement bait done well) ──
export function discussionTweet(): string {
  return pickUnique("discuss", [
    `Genuine question for founders:\n\nWhat's the one SaaS subscription you'd eliminate first if you had an alternative?\n\nCurious what comes up most.`,

    `Debate this:\n\nIs per-seat pricing fair, or is it just the most effective way to extract revenue?\n\nI have strong opinions but I want to hear yours first.`,

    `What's your company's software cost per employee?\n\nMost people have no idea.\n\nDrop your number below (or your best guess). I'll share the average.`,

    `Unpopular opinion:\n\nMost SaaS tools are commodities pretending to be luxuries.\n\nThe UI is different. The functionality is identical.\n\nChange my mind.`,

    `Quick poll for business owners:\n\nIf you could own ONE tool you currently rent, which would save you the most money?\n\n🅰️ CRM\n🅱️ Project management\n🅲 Marketing tools\n🅳 Analytics`,

    `Founders: what's the most surprisingly expensive SaaS tool in your stack?\n\nThe one where you looked at the invoice and thought "wait, really?"\n\nI'll start — our analytics tool. $800/mo for data we barely looked at.`,

    `Hot take: the best tech stack is the one with the fewest subscriptions.\n\nFewer vendors = less complexity = better margins.\n\nOr am I wrong? Tell me why.`,

    `Thought experiment:\n\nIf every SaaS tool charged a one-time fee instead of monthly, which companies would still exist?\n\nThe answer reveals a lot about where the value actually is.`,
  ]);
}

// ── BUILDER/CREATOR STORIES (community building) ──
export function builderStoryTweet(): string {
  return pickUnique("builder_story", [
    `A developer I know builds apps on weekends.\n\nHe listed 3 on a marketplace.\n\nOne of them now earns $800/month passively.\n\nThe math on selling code is underrated.`,

    `The indie hacker playbook that actually works:\n\n1. Build something useful for yourself\n2. Realize others have the same problem\n3. Package it\n4. List it\n5. Repeat\n\nNo VC. No marketing team. Just useful software.`,

    `Interesting conversation with a developer last week:\n\n"I used to think my side projects were worthless."\n\n"Then I listed one for $49 and made $2k in a month."\n\nYour code has value. Most developers undercharge.`,

    `The best side hustle for developers in 2026 isn't freelancing.\n\nIt's building tools once and selling them repeatedly.\n\n$0 marginal cost. Infinite leverage.`,

    `Met a founder who replaced their entire SaaS stack with 4 custom tools.\n\nTotal cost: $340.\nMonthly savings: $2,800.\nTime to build: 2 weekends.\n\nThe economics are changing fast.`,

    `Developer economics, 2026 edition:\n\nFreelancing: trade time for money\nSaaS: trade time for recurring revenue (and recurring headaches)\nSelling owned apps: trade time for passive income\n\nThe last one scales best.`,
  ]);
}
