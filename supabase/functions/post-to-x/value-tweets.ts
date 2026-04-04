/**
 * Value-first tweet templates — Enterprise ICP
 * Authentic, measured tone for IT leaders, CIOs, CFOs, and VPs of Engineering.
 * Pure strategic value. No hype. No gimmicks.
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

// ── STRATEGIC TIPS (pure value, no CTA) ──
export function tipTweet(): string {
  return pickUnique("tip", [
    `A useful framework for software portfolio reviews:\n\nFor each tool, calculate cost-per-active-user, not cost-per-seat.\n\nThe gap between what you're paying and what you're using is usually 40-60%.`,

    `When evaluating SaaS renewals, ask your vendor one question:\n\n"What happens to our data if we don't renew?"\n\nThe answer reveals whether you're a customer or a hostage.`,

    `The most effective IT cost optimization I've seen isn't negotiating better SaaS rates.\n\nIt's identifying the 30% of tools where owned alternatives exist — and migrating methodically.`,

    `Practical tip for enterprise IT leaders:\n\nTrack software cost per employee as a quarterly metric.\n\nMost organizations discover it's $300-500/month — and growing faster than headcount.`,

    `Before your next SaaS renewal, calculate the 3-year TCO including:\n\n- Per-seat fees at projected headcount\n- Integration maintenance\n- Data export costs if you leave\n\nThe owned alternative often wins on a 24-month horizon.`,

    `One of the most underrated IT governance practices: maintaining a clear inventory of which tools have data portability — and which don't.\n\nThis becomes critical during M&A.`,

    `Framework for build vs. buy in 2026:\n\nIf it's core to your differentiation → build.\nIf it's operational infrastructure → evaluate ownership.\nIf it's genuinely commodity → subscribe.\n\nMost companies default to subscribe for everything.`,

    `The strongest signal that your SaaS portfolio needs rationalization:\n\nWhen three different teams are paying for three different tools that do the same thing.\n\nThis is more common than most CTOs realize.`,

    `Procurement insight: the enterprise tier of most SaaS tools costs 3-5x the standard tier.\n\nThe delta buys you SSO, audit logs, and a dedicated CSM.\n\nOwned software includes all of that by default.`,

    `A question worth asking in every technology review:\n\n"If this vendor disappeared tomorrow, how long would it take us to recover?"\n\nThe answer should inform your ownership strategy.`,
  ]);
}

// ── INDUSTRY INSIGHTS (thought leadership, no CTA) ──
export function insightTweet(): string {
  return pickUnique("insight", [
    `An emerging pattern across enterprise IT: the shift from "best-of-breed SaaS" to "owned and governed."\n\nNot because owned is always better — but because the control and cost structure is more predictable.`,

    `Enterprise SaaS spending grew 18% last year while headcount grew 3%.\n\nThat ratio is unsustainable. The correction will be structural, not incremental.`,

    `Something worth watching: CIOs are starting to treat software ownership as a risk mitigation strategy, not just a cost play.\n\nVendor dependency is now a board-level concern.`,

    `The "enterprise" pricing tier exists because vendors know that once you've integrated, your switching costs exceed the premium.\n\nThis dynamic is starting to change.`,

    `A shift I'm tracking in enterprise procurement:\n\nRFPs increasingly include "data sovereignty" and "source code access" as requirements.\n\nFive years ago, those were edge cases.`,

    `The average enterprise manages 300+ SaaS vendors.\n\nEach requires security reviews, contract management, and compliance monitoring.\n\nThe administrative overhead alone justifies exploring ownership for stable, core tools.`,

    `Interesting dynamic: as AI makes custom software faster to build, the premium that SaaS vendors charge for "convenience" is eroding.\n\nConvenience was always the main value proposition.`,

    `The most common objection to owned software — "who maintains it?" — is becoming less relevant.\n\nAI-assisted maintenance is changing the operational economics.`,

    `Enterprise software is entering a phase similar to cloud migration a decade ago.\n\nNot "everything owned" — but a thoughtful rebalancing of what you rent vs. what you control.`,

    `The companies that will have the strongest technology foundations in 2028 are making ownership decisions today.\n\nNot reactively, when a vendor forces the issue — but proactively, as strategy.`,
  ]);
}

// ── DISCUSSION STARTERS (genuine engagement) ──
export function discussionTweet(): string {
  return pickUnique("discuss", [
    `For IT leaders: what percentage of your SaaS portfolio could realistically be replaced with owned alternatives?\n\nGenuinely curious about the range people are seeing.`,

    `Question for enterprise CTOs:\n\nDo you track the total cost of vendor management (procurement, security reviews, compliance) separately from subscription costs?\n\nIf so, what ratio are you seeing?`,

    `Interested in perspectives: is per-seat pricing a fair reflection of value delivered, or a pricing model optimized for vendor revenue?\n\nI think the answer depends on the tool category.`,

    `For those managing enterprise software portfolios: which category of tools has the widest gap between what you pay and what you'd need to pay for equivalent owned software?`,

    `A question I keep coming back to:\n\nAt what company size does the administrative overhead of managing SaaS vendors exceed the cost of the subscriptions themselves?`,

    `CIOs: what's your framework for deciding which tools are strategic enough to own vs. commodity enough to subscribe to?\n\nWould appreciate seeing how different orgs think about this.`,

    `Genuine question for enterprise buyers:\n\nHas a SaaS vendor acquisition ever disrupted your operations?\n\nThis seems to be happening more frequently and I'm curious about the impact.`,

    `For those who've moved from SaaS to owned software for any tool:\n\nWhat surprised you most about the transition — positively or negatively?`,
  ]);
}

// ── BUILDER/CREATOR STORIES (ecosystem perspective) ──
export function builderStoryTweet(): string {
  return pickUnique("builder_story", [
    `An underappreciated trend: experienced enterprise developers are packaging their internal tools as products.\n\nThe code that solved their company's problem often solves it for hundreds of others.`,

    `The economics of selling enterprise-grade templates are compelling:\n\nBuild once, sell repeatedly. No support overhead of custom consulting. No recurring infrastructure costs.\n\nMore developers should consider it.`,

    `Talked to a developer who left a FAANG role to build and sell production-ready app templates.\n\nHe's earning more than his senior engineer salary.\n\nThe market for quality, owned software is real.`,

    `The best software products often start as internal tools.\n\nWhen an engineering team solves their own problem well enough to productize it — that's a strong signal of quality.`,

    `A pattern in enterprise software: the gap between what you can buy as SaaS and what you actually need is filled by internal tools.\n\nThose internal tools are increasingly available to own on marketplaces.`,

    `Developer side projects that solve real enterprise problems are surprisingly valuable.\n\nNot as SaaS startups — as owned, deployable tools that organizations can govern themselves.`,
  ]);
}
