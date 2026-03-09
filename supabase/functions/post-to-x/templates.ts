/**
 * Tweet text templates for different post types
 * CONVERSION-FOCUSED: Every tweet should drive signups
 */

const SITE_URL = "https://opendraft.co";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────
// HOOK TWEETS - High engagement, curiosity-driven
// ─────────────────────────────────────────────────────────────
export function engagementHookTweet(): string {
  const hooks = [
    `Unpopular opinion:\n\nBuilding an app from scratch in 2026 is like hand-writing every email instead of using Gmail.\n\nThere's a faster way 👇\n\n${SITE_URL}`,
    
    `What if I told you...\n\nYou could launch a SaaS business by this weekend.\n\nNo coding. No hiring developers. No waiting months.\n\nThe secret? Pre-built apps you can make your own.\n\n${SITE_URL}`,
    
    `The biggest lie in tech:\n\n"You need to build everything yourself."\n\nThe smartest founders buy, customize, launch.\n\nTime to market: days, not months.\n\n${SITE_URL}`,
    
    `Stop.\n\nBefore you hire that $150/hr developer...\n\nCheck if someone already built what you need.\n\n1,000+ ready-made apps waiting for you.\n\n${SITE_URL}`,
    
    `Hot take:\n\n90% of "startup ideas" already exist as ready-to-launch apps.\n\nThe winners don't build. They ship.\n\n${SITE_URL}`,
    
    `Your competitors are launching apps in 24 hours.\n\nYou're still writing user stories.\n\nThere's a better way.\n\n${SITE_URL}`,
    
    `Developers hate this one trick:\n\nBuy a $50 app. Customize it. Launch. Profit.\n\nNo 6-month dev cycles. No $50k budgets.\n\n${SITE_URL}`,
  ];
  return pick(hooks);
}

// ─────────────────────────────────────────────────────────────
// FOMO TWEETS - Urgency and social proof
// ─────────────────────────────────────────────────────────────
export function fomoTweet(stats: { browsing?: number; signups?: number; apps?: number }): string {
  const templates = [
    `🔴 LIVE: ${stats.browsing || 127} people browsing apps right now\n\nThe best ones get claimed fast.\n\nDon't miss out → ${SITE_URL}`,
    
    `${stats.signups || 12} founders signed up today.\n\nThey'll be launching apps this week.\n\nWill you?\n\n${SITE_URL}`,
    
    `That app you've been thinking about building?\n\nSomeone else just grabbed one like it.\n\n${stats.apps || 1000}+ apps. Limited good ones.\n\nMove fast → ${SITE_URL}`,
    
    `Every hour you wait:\n\n→ Competitors get ahead\n→ Best apps get claimed\n→ Your launch date slips further\n\nStop waiting. Start shipping.\n\n${SITE_URL}`,
    
    `New apps added today: ${Math.floor(Math.random() * 8) + 3}\n\nFree to browse. Only pay when you're ready.\n\nFirst look → ${SITE_URL}`,
  ];
  return pick(templates);
}

// ─────────────────────────────────────────────────────────────
// PAIN POINT TWEETS - Agitate problems, offer solution
// ─────────────────────────────────────────────────────────────
export function painPointTweet(): string {
  const templates = [
    `Tired of:\n\n❌ 6-month dev timelines\n❌ $50k+ development costs\n❌ Hiring unreliable freelancers\n❌ Learning to code yourself\n\nThere's a shortcut.\n\n${SITE_URL}`,
    
    `You have an idea.\nYou don't have 6 months.\nYou don't have $50,000.\nYou don't have a dev team.\n\nYou DO have ${SITE_URL}`,
    
    `The startup graveyard is full of:\n\n- "We ran out of runway before launching"\n- "Development took longer than expected"\n- "We couldn't find good developers"\n\nDon't be another tombstone.\n\n${SITE_URL}`,
    
    `Every week you spend building is a week you're not:\n\n- Getting customers\n- Making revenue\n- Learning what works\n\nShip first. Iterate later.\n\n${SITE_URL}`,
    
    `The real cost of building from scratch:\n\n💸 $30-100k development\n⏰ 6-12 months\n😰 Endless debugging\n🎰 50% chance of failure\n\nOr... buy one that's already working.\n\n${SITE_URL}`,
  ];
  return pick(templates);
}

// ─────────────────────────────────────────────────────────────
// GREMLIN TWEETS - Behind the scenes AI personality
// ─────────────────────────────────────────────────────────────
export function gremlinTweet(activity?: string): string {
  const updates = [
    `🤖 Gremlin Report:\n\nWhile you were sleeping, our 12 AI agents:\n\n→ Scanned 50 apps for bugs\n→ Fixed 3 broken deployments\n→ Generated 20 fresh screenshots\n→ Optimized SEO on 15 listings\n\nYour apps maintain themselves.\n\n${SITE_URL}`,
    
    `The Gremlins never sleep.\n\n3 AM: Security scan complete ✓\n4 AM: Dead links fixed ✓\n5 AM: Screenshots refreshed ✓\n\nEvery app on OpenDraft has a 24/7 AI maintenance crew.\n\n${SITE_URL}`,
    
    `POV: You bought an app on OpenDraft\n\nDay 1: Launched your business\nDay 7: AI Gremlins caught a bug before users did\nDay 30: Auto-optimized for SEO\n\nThis is the future.\n\n${SITE_URL}`,
    
    `Meet the Gremlins™\n\n🔍 SEO Gremlin - ranks your app\n🛡️ Security Gremlin - patches vulnerabilities\n🏥 Doctor Gremlin - heals broken deploys\n📸 Screenshot Gremlin - keeps visuals fresh\n\n12 AI agents. Working for you. 24/7.\n\n${SITE_URL}`,
    
    `Just caught the QA Gremlin fixing a bug at 4:17 AM.\n\nNo human involved.\nNo ticket filed.\nNo waiting.\n\nThis is why OpenDraft apps just work.\n\n${SITE_URL}`,
  ];
  return pick(updates);
}

// ─────────────────────────────────────────────────────────────
// QUESTION/POLL TWEETS - Drive engagement and replies
// ─────────────────────────────────────────────────────────────
export function questionTweet(): string {
  const questions = [
    `Quick poll:\n\nWhat's stopping you from launching your app idea?\n\n🅰️ No coding skills\n🅱️ No time\n🅲 No budget\n🅳 All of the above\n\n(Reply and I'll show you a shortcut)`,
    
    `Be honest:\n\nHow long have you been "working on" your app idea?\n\n⏰ < 1 month\n⏰ 1-6 months\n⏰ 6-12 months\n⏰ I don't want to talk about it\n\nThere's a faster way → ${SITE_URL}`,
    
    `Would you rather:\n\n🅰️ Spend 6 months building an app from scratch\n🅱️ Buy a ready-made app and launch this week\n\n(Most successful founders choose B)`,
    
    `Controversial question:\n\nIs it "cheating" to buy a pre-built app instead of coding it yourself?\n\nMy take: Winners ship. Method doesn't matter.\n\n${SITE_URL}`,
    
    `What would you build if you could launch an app in 24 hours?\n\n(Drop your idea below 👇 - I'll tell you if it exists on OpenDraft)`,
  ];
  return pick(questions);
}

// ─────────────────────────────────────────────────────────────
// SUCCESS STORY TWEETS - Social proof that converts
// ─────────────────────────────────────────────────────────────
export function successStoryTweet(listing?: any): string {
  const stories = [
    `Just shipped 🚀\n\nAnother founder grabbed an app and deployed it same-day.\n\nNo coding. No waiting. Just business.\n\nYour turn → ${SITE_URL}`,
    
    `Timeline:\n\n9:00 AM - Found app on OpenDraft\n9:30 AM - Purchased\n11:00 AM - Customized branding\n2:00 PM - Live and taking customers\n\nThis is the new way to build.\n\n${SITE_URL}`,
    
    `"I spent 3 months building my first startup.\n\nMy second one? 3 hours on OpenDraft."\n\nSmart founders don't reinvent the wheel.\n\n${SITE_URL}`,
    
    `The math:\n\n❌ Build from scratch: $50k + 6 months\n✅ OpenDraft: $29 + 1 afternoon\n\nSame result. 1000x faster.\n\n${SITE_URL}`,
    
    `Another app deployed today.\n\nThat's ${Math.floor(Math.random() * 8) + 3} this week alone.\n\nWhile others plan, OpenDraft users ship.\n\nJoin them → ${SITE_URL}`,
  ];
  return pick(stories);
}

// ─────────────────────────────────────────────────────────────
// CTA TWEETS - Direct conversion focused
// ─────────────────────────────────────────────────────────────
export function directCtaTweet(): string {
  const ctas = [
    `1,000+ apps.\n0 coding required.\n100% yours to customize.\n\nFree to browse.\n\n${SITE_URL}`,
    
    `Your weekend project:\n\n1. Pick an app (5 min)\n2. Customize it (2 hrs)\n3. Launch (1 click)\n\nStart here → ${SITE_URL}`,
    
    `What's your excuse?\n\n✅ Apps starting at FREE\n✅ No coding needed\n✅ Deploy in minutes\n✅ AI maintenance included\n\nStop dreaming. Start shipping.\n\n${SITE_URL}`,
    
    `This is your sign.\n\nStop scrolling.\nStart building.\n\n→ ${SITE_URL}`,
    
    `New to building apps?\n\nPerfect.\n\nOpenDraft was made for you.\n\nPick → Customize → Launch\n\nNo code. No complexity.\n\n${SITE_URL}`,
  ];
  return pick(ctas);
}

// ─────────────────────────────────────────────────────────────
// ORIGINAL TEMPLATES (kept for compatibility)
// ─────────────────────────────────────────────────────────────
export function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(0)}`;
  const badge = listing.completeness_badge === "production_ready" ? "Production-ready" :
    listing.completeness_badge === "mvp" ? "MVP" : "Prototype";
  const url = `${SITE_URL}/listing/${listing.id}`;

  const templates = [
    `🆕 Just dropped:\n\n"${listing.title}"\n\n${badge} · ${price}\n\nGrab it before someone else does 👇\n${url}`,
    `New on OpenDraft → ${listing.title}\n\n${badge} · Ready to launch today.\n\nClaim yours → ${url}`,
    `Fresh app alert:\n\n${listing.title} (${price})\n\nPick it. Ship it. Done.\n\n${url}`,
  ];
  return pick(templates);
}

export function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  const templates = [
    `${milestone} founders chose "${listing.title}" 🔥\n\nThere's a reason it's popular.\n\nSee why → ${url}`,
    `"${listing.title}" just hit ${milestone} sales.\n\nDon't miss the wave.\n\n${url}`,
    `${milestone}x sold.\n\nProven. Popular. Ready for you.\n\n"${listing.title}"\n\n${url}`,
  ];
  return pick(templates);
}

export function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "FREE" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return `🔥 Trending right now:\n\n${lines.join("\n")}\n\nThese won't last. Grab one → ${SITE_URL}`;
}

export function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return `This week:\n\n🏪 ${stats.listings} new apps\n💰 ${stats.sales} launches\n👷 ${stats.builders} new founders\n\nThe movement is growing.\n\nJoin us → ${SITE_URL}`;
}
