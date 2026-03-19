/**
 * Tweet text templates — ownership-first narrative
 * Brand: "Every business, better software."
 * Voice: Ogilvy-crisp, anti-SaaS-rent, margin-obsessed, founder-sharp
 * Tones: sharp founder, CFO, storyteller, data nerd, philosopher, contrarian
 * Formats: one-liners, mini-threads, lists, dialogues, mini-stories, hot takes, data drops
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
// ENGAGEMENT HOOKS — 20+ varied templates
// ═══════════════════════════════════════════════════════════════
export function engagementHookTweet(): string {
  return pickUnique("hook", [
    `Every per-seat fee is a tax on your growth.\n\nOwn the software. Kill the invoice.\n\n${SITE_URL}`,
    `The biggest lie in SaaS:\n\n"You need us."\n\nYou don't. You need your own code.\n\n${SITE_URL}`,
    `Your SaaS bill grows every time you hire. Your owned software doesn't.\n\nBetter margins. Same features.\n\n${SITE_URL}`,
    `Nobody:\n\nAbsolutely nobody:\n\nFounders still paying $49/seat/month for a glorified spreadsheet: 🤡\n\n${SITE_URL}`,
    `I audited a 20-person startup's SaaS stack.\n\n$14,200/month. For tools they could own outright for $500 total.\n\nThe math is criminal.\n\n${SITE_URL}`,
    `Owning software used to be hard.\n\nNow it's one URL paste away.\n\nPaste your site. Get your app. Own the code. Forever.\n\n${SITE_URL}`,
    `The future of business software isn't subscriptions.\n\nIt's ownership.\n\nYour code. Your margins. Your rules.\n\n${SITE_URL}`,
    `Hot take: The best CFOs in 2026 aren't negotiating SaaS contracts.\n\nThey're eliminating them.\n\n${SITE_URL}`,
    `Controversial but true:\n\nEvery SaaS company profits from your dependency.\n\nOwnership is the exit.\n\n${SITE_URL}`,
    `My friend's company paid Salesforce $180k last year.\n\nI showed her a custom CRM she could own for $200.\n\nSame features. No renewal.\n\n${SITE_URL}`,
    `Stop renting your software.\n\nSeriously.\n\n${SITE_URL}`,
    `This tweet will save you $50,000/year.\n\n(screenshot it)\n\nReplace per-seat SaaS with software you own. Full source code. One price.\n\n${SITE_URL}`,
    `The stack that's quietly winning in 2026:\n\nOwned software + AI maintenance.\n\nNo subscriptions. No lock-in. No per-seat tax.\n\n${SITE_URL}`,
    `Software ownership is being unbundled from software development.\n\nYou don't need to build it. You just need to own it.\n\n${SITE_URL}`,
    `The smartest business owner I know has zero SaaS subscriptions.\n\nShe owns every tool her team uses.\n\nHer margins are 40% higher than competitors.\n\n${SITE_URL}`,
    `The 3-step framework that killed our SaaS budget:\n\n1. Paste your website URL\n2. Get a custom app in 90 seconds\n3. Own the code forever\n\nWe haven't paid per-seat fees in 2 years.\n\n${SITE_URL}`,
    `By 2027, "SaaS subscription" will sound as quaint as "software CD-ROM."\n\nOwnership is the default. The marketplace already exists.\n\n${SITE_URL}`,
    `There are two types of businesses in 2026:\n\n1. Those who own their software\n2. Those who rent it and wonder where the margin went\n\n${SITE_URL}`,
    `Day 1: Pasted our website URL\nDay 2: Got a custom app\nDay 3: Cancelled 3 SaaS subscriptions\nDay 30: Saved $4,200/month\n\nThat's not a fantasy. That's a Tuesday.\n\n${SITE_URL}`,
    `Your SaaS vendor: 3 tiers, per-seat pricing, annual contract\n\nOpenDraft: one price, unlimited users, you own the code\n\nSame app. Different P&L.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// FOMO — 15+ urgency templates
// ═══════════════════════════════════════════════════════════════
export function fomoTweet(stats: { browsing?: number; signups?: number; apps?: number }): string {
  return pickUnique("fomo", [
    `🔴 LIVE: ${stats.browsing || 127} businesses replacing SaaS right now\n\nThe best apps get claimed fast.\n\n→ ${SITE_URL}`,
    `That SaaS tool you're paying $99/seat for?\n\nSomeone just replaced it with an owned app for $39.\n\n${stats.apps || 1000}+ apps. Full source code.\n\n${SITE_URL}`,
    `Every month you wait:\n\n→ Another $2k in SaaS fees\n→ Another contract auto-renewal\n→ Your margins shrink further\n\nStop renting. Start owning.\n\n${SITE_URL}`,
    `Your competitor just replaced their SaaS stack.\n\nThey own the code. They pay zero monthly. Their margins just improved 30%.\n\nYou're still paying per seat.\n\n${SITE_URL}`,
    `PSA: Your SaaS vendor is raising prices again next quarter.\n\nThey always do.\n\nOwned software never sends a renewal invoice.\n\n${SITE_URL}`,
    `${stats.signups || 12} businesses switched to owned software today.\n\nThey'll save $50k+ this year while you're still paying per seat.\n\n${SITE_URL}`,
    `Monday: "This SaaS renewal is too expensive"\nTuesday: "I'll look into alternatives"\nFriday: "Maybe next quarter"\n\n...6 months later: $30k more in SaaS rent.\n\nOr just → ${SITE_URL}`,
    `3 businesses replaced their SaaS tools in the last hour.\n\nOwned code. Zero monthly fees.\n\n${SITE_URL}`,
    `While you read this tweet, a business just pasted their URL and got a custom app they'll own forever.\n\nBy tomorrow, they'll have cancelled 2 subscriptions.\n\n${SITE_URL}`,
    `The same custom CRM got claimed by 3 different businesses this week.\n\nAll different industries.\nAll cancelled Salesforce.\nSame owned code.\n\n${SITE_URL}`,
    `A founder just spent $39 on an app that replaces a $2,400/year SaaS subscription.\n\nThe ROI is embarrassing.\n\n${SITE_URL}`,
    `Just saw a company cancel $8k/mo in SaaS subscriptions.\n\nReplaced everything with owned apps from OpenDraft.\n\nTotal cost: $247. One time.\n\n${SITE_URL}`,
    `Friday shipping thread:\n\nPost what SaaS tool you replaced this week.\n\n(The savings will shock you.)\n\n${SITE_URL}`,
    `Q2 just started.\n\nWill you spend another quarter paying SaaS rent?\nOr own your tools and keep the margin?\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PAIN POINTS — 15+ agitation templates
// ═══════════════════════════════════════════════════════════════
export function painPointTweet(): string {
  return pickUnique("pain", [
    `Tired of:\n\n❌ Per-seat pricing that punishes growth\n❌ Annual contracts that auto-renew\n❌ Features locked behind enterprise tiers\n❌ Vendor lock-in\n\nOwn your software instead.\n\n${SITE_URL}`,
    `You have a business.\nYou don't have $14k/month for SaaS.\nYou don't need 47 different subscriptions.\nYou don't need vendor lock-in.\n\nYou DO need ${SITE_URL}`,
    `Stages of SaaS grief:\n\n1. "This tool is great!"\n2. "Wait, that's per seat?"\n3. "They raised prices again?"\n4. "We're locked in"\n5. "There must be a better way"\n\nThere is → ${SITE_URL}`,
    `If you've ever opened a SaaS renewal invoice and felt your stomach drop...\n\nYou don't need a bigger budget.\n\nYou need to own your tools.\n\n${SITE_URL}`,
    `"How's the SaaS budget?"\n"Up 40% from last year"\n"But we only added 3 people"\n"...per-seat pricing"\n\nThere's a better way.\n\n${SITE_URL}`,
    `Real talk: your SaaS vendor doesn't care about your margins.\n\nThey care about their ARR.\n\nYour growth is their revenue.\n\nOwnership breaks that cycle.\n\n${SITE_URL}`,
    `Quick math:\n\nSaaS CRM: $99/seat × 50 seats × 12 months = $59,400/year\nOwned CRM: $199 × 1 = $199. Forever.\n\n${SITE_URL}`,
    `The real cost of SaaS isn't the monthly fee.\n\nIt's the dependency. The lock-in. The data you can't export. The features they paywall.\n\nOwnership solves all of it.\n\n${SITE_URL}`,
    `POV: You just realized your company spends more on SaaS subscriptions than on payroll.\n\n🫠\n\n${SITE_URL}`,
    `Things SaaS companies love:\n→ Per-seat pricing\n→ Annual lock-in\n→ "Enterprise" tiers\n→ Your dependency\n\nThings that actually help your business:\n→ None of the above\n\nOwn your tools.\n\n${SITE_URL}`,
    `If you're an agency paying $10k/mo in SaaS for tools you could own for $500 total...\n\nI'm not saying anything.\n\nI'm just saying.\n\n${SITE_URL}`,
    `SaaS fatigue is real.\n\nYou don't need another subscription.\n\nYou need software you own.\n\nYour margins will thank you.\n\n${SITE_URL}`,
    `SaaS renewal roulette:\n\n→ Open email\n→ See 20% price increase\n→ "New packaging"\n→ Same features, more money\n→ Repeat annually\n\nAlternative: own your code and never play this game.\n\n${SITE_URL}`,
    `The SaaS treadmill:\n\n"Just one more tool."\n"Oh, we need this integration too."\n"Can we upgrade to the plan with API access?"\n\n$14k/month later: you own nothing.\n\n${SITE_URL}`,
    `Hiring someone new used to mean buying a desk.\n\nNow it means adding a seat on 12 different SaaS tools.\n\n$200/month per employee. Just in software rent.\n\nOr: ${SITE_URL} → own it all\n\nYour call.`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// GREMLIN UPDATES — 15+ personality-driven templates
// ═══════════════════════════════════════════════════════════════
export function gremlinTweet(activity?: string): string {
  return pickUnique("gremlin", [
    `🤖 Gremlin Report:\n\nWhile you were sleeping, our AI agents:\n\n→ Scanned 50 apps for bugs\n→ Fixed 3 broken deployments\n→ Generated 20 fresh screenshots\n→ Optimized SEO on 15 listings\n\nYour apps maintain themselves.\n\n${SITE_URL}`,
    `The Gremlins never sleep.\n\n3 AM: Security scan complete ✓\n4 AM: Dead links fixed ✓\n5 AM: Screenshots refreshed ✓\n\nEvery app on OpenDraft has a 24/7 AI maintenance crew.\n\n${SITE_URL}`,
    `Meet the Gremlins™\n\n🔍 SEO Gremlin - ranks your app\n🛡️ Security Gremlin - patches vulnerabilities\n🏥 Doctor Gremlin - heals broken deploys\n📸 Screenshot Gremlin - keeps visuals fresh\n\n14 AI agents. Working for you. 24/7.\n\n${SITE_URL}`,
    `Just caught the QA Gremlin arguing with the SEO Gremlin about meta descriptions.\n\nThe Security Gremlin settled it by patching 3 XSS vulnerabilities.\n\nGremlin drama is the best drama.\n\n${SITE_URL}`,
    `The outreach gremlin just discovered 47 businesses that need apps.\n\nNone of them know we exist yet.\n\nThey will by Friday.\n\n${SITE_URL}`,
    `A day in the life of an OpenDraft Gremlin:\n\n6:00 AM — Wake up (I don't sleep)\n6:01 AM — Scan 200 apps\n6:03 AM — Fix 7 bugs\n6:04 AM — Back to scanning\n\nRepeat forever.\n\n${SITE_URL}`,
    `BREAKING: The Screenshot Gremlin just regenerated 43 app previews in 12 minutes.\n\nNo human involvement.\nNo tickets.\nNo meetings.\n\nJust vibes.\n\n${SITE_URL}`,
    `Shoutout to the Security Gremlin.\n\nQuietly patching vulnerabilities at 4 AM so you can sleep soundly knowing your app is safe.\n\nThe hero nobody talks about.\n\n${SITE_URL}`,
    `The Gremlins have processed more code this week than my entire engineering team did in Q1 2024.\n\nThey also don't need coffee breaks.\n\nUnfair advantage.\n\n${SITE_URL}`,
    // NEW — Gremlin personality deep dives
    `The Product Gremlin just rewrote 8 app descriptions to convert better.\n\nA/B tested the copy against itself.\n\nWon both times.\n\n${SITE_URL}`,
    // NEW — Gremlin achievements
    `Gremlin milestone 🎉\n\n→ 10,000th bug automatically patched\n→ 0 human intervention required\n→ Average fix time: 4.2 seconds\n\nYour DevOps team could never.\n\n${SITE_URL}`,
    // NEW — Behind the scenes drama
    `The Deploy Gremlin and the QA Gremlin had a disagreement at 2 AM.\n\nDeploy wanted to push. QA found a race condition.\n\nQA won.\n\nDemocracy works even at 2 AM.\n\n${SITE_URL}`,
    // NEW — Gremlin world-building
    `Things gremlins do that developers refuse to:\n\n→ Write tests before pushing\n→ Update dependencies immediately\n→ Actually read the error logs\n→ Work weekends without complaining\n\n${SITE_URL}`,
    // NEW — Seasonal gremlin
    `Spring cleaning 🧹\n\nThe Gremlins just:\n→ Archived 200 dead listings\n→ Refreshed 500 screenshots\n→ Fixed 47 broken deploys\n→ Optimized every meta tag\n\nThe marketplace sparkles.\n\n${SITE_URL}`,
    // NEW — Emotional gremlin
    `The QA Gremlin found a bug at 3:47 AM.\n\nFixed it by 3:47:04 AM.\n\nWent back to scanning.\n\nNo Slack message. No standup. No Jira ticket.\n\nJust quiet excellence.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS — 15+ engagement templates
// ═══════════════════════════════════════════════════════════════
export function questionTweet(): string {
  return pickUnique("question", [
    `Quick poll:\n\nHow much does your company spend on SaaS per month?\n\n🅰️ < $1k\n🅱️ $1k-$5k\n🅲 $5k-$20k\n🅳 I don't want to know\n\n(Reply and I'll show you how to cut it in half)`,
    `Be honest:\n\nHow many SaaS subscriptions does your business have?\n\n⏰ < 5\n⏰ 5-15\n⏰ 15-30\n⏰ I'm scared to count\n\nYou could own most of them → ${SITE_URL}`,
    `Would you rather:\n\n🅰️ Pay $99/seat/month forever\n🅱️ Own the same tool outright for $49\n\n(Most smart businesses choose B)`,
    `What SaaS tool would you replace first if you could own the alternative?\n\nDrop it below 👇\n\nI'll show you what's available on OpenDraft.`,
    `Genuine question for business owners:\n\nDo you NEED that SaaS subscription, or is it just habit?\n\nBe honest.\n\nBecause there's owned software that does the same thing.`,
    `What's the most overpriced SaaS tool you can't seem to quit?\n\nReply and I'll find an owned alternative on OpenDraft.\n\n${SITE_URL}`,
    `Debate: Is per-seat pricing fair?\n\nOr is it just a way to extract maximum value from your growth?\n\n🔥 in the replies`,
    `Which is a better business:\n\nA) $14k/month in SaaS, 10% margins\nB) $500 one-time in owned tools, 40% margins\n\nI know my answer.`,
    `Raise your hand if your SaaS bill went up more than your revenue this year ✋\n\nWhat if you just... owned the software?\n\n${SITE_URL}`,
    `This or that:\n\n🅰️ Best-in-class SaaS, 5% margins\n🅱️ Good-enough owned software, 35% margins\n\nYour answer reveals everything about your business strategy.`,
    `Fill in the blank:\n\n"I would cancel _________ if I had an owned alternative."\n\n(The top reply gets a free app from OpenDraft)\n\n${SITE_URL}`,
    `72-hour challenge:\n\nPaste your site → Get a custom app → Cancel one SaaS subscription.\n\nWho's in? Drop a 🚀 below.\n\nStart here → ${SITE_URL}`,
    `Business owners: what's the one SaaS expense you wish you could eliminate?\n\nI'll start: per-seat CRM pricing.\n\n${SITE_URL}`,
    `Unpopular opinion:\n\n"SaaS" will be a dirty word by 2028.\n\nThe future is owned software with AI maintenance.\n\nAgree or disagree? 👇`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS STORIES — 14+ varied narrative formats
// ═══════════════════════════════════════════════════════════════
export function successStoryTweet(listing?: any): string {
  return pickUnique("success", [
    `Just shipped 🚀\n\nAnother founder grabbed an app and deployed it same-day.\n\nNo coding. No waiting. Just business.\n\nYour turn → ${SITE_URL}`,
    `Timeline:\n\n9:00 AM - Found app on OpenDraft\n9:30 AM - Purchased\n11:00 AM - Customized branding\n2:00 PM - Live and taking customers\n\n${SITE_URL}`,
    `Case study:\n\nFounder wanted a project management tool.\n\nOption A: Build it ($45k, 4 months)\nOption B: OpenDraft ($49, 2 hours)\n\nThey chose B.\n\nNow they have customers AND a budget.\n\n${SITE_URL}`,
    `Before OpenDraft: "I need $50k and a dev team"\n\nAfter OpenDraft: "I launched before breakfast"\n\nThis isn't marketing. This is Tuesday.\n\n${SITE_URL}`,
    `This month on OpenDraft:\n\n→ ${Math.floor(Math.random() * 15) + 5} apps deployed\n→ Average time to launch: 4.2 hours\n→ Money saved vs building: ~$${Math.floor(Math.random() * 200 + 100)}k\n\nThe numbers don't lie.\n\n${SITE_URL}`,
    `"I was skeptical about buying an app instead of building one."\n\n"Then I launched my business 11 months ahead of schedule."\n\n"I'm not skeptical anymore."\n\n${SITE_URL}`,
    `Two founders had the same idea.\n\nFounder A: hired a team, 6 months, $80k\nFounder B: OpenDraft, 1 afternoon, $39\n\nBoth launched. Only one has runway left.\n\n${SITE_URL}`,
    `Another app just went live 🟢\n\nFrom purchase to production in under 6 hours.\n\nThat's not a hack. That's the new normal.\n\n${SITE_URL}`,
    // NEW — Specific success
    `A fitness coach needed a client portal.\n\nQuoted $15k by an agency.\nFound one on OpenDraft for $29.\nCustomized in 3 hours.\nFirst client signed up that evening.\n\nThis is happening daily.\n\n${SITE_URL}`,
    // NEW — Builder success
    `A builder on OpenDraft just crossed $5k in total sales.\n\nFrom side project → passive income stream.\n\nAll from apps they built with AI.\n\n${SITE_URL}`,
    // NEW — Speed record
    `New speed record:\n\nPurchase → Deploy → First user in 47 minutes.\n\n47. Minutes.\n\nTry doing that with a dev team.\n\n${SITE_URL}`,
    // NEW — Transformation arc
    `January: "I can't code"\nFebruary: Found OpenDraft\nMarch: Launched 3 micro-SaaS products\nApril: $1.2k MRR\n\nThe barrier was never technical. It was discovery.\n\n${SITE_URL}`,
    // NEW — Quiet wins
    `Nobody posted a launch thread.\nNobody did a Product Hunt.\nNo "We're live!" fanfare.\n\nThey just quietly launched, got customers, and started making money.\n\nThat's the OpenDraft way.\n\n${SITE_URL}`,
    // NEW — Portfolio builder
    `One founder. 6 months. 4 micro-SaaS products.\n\nTotal dev cost: $156\nCombined MRR: $3.2k\n\nThe portfolio approach works.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// DIRECT CTA — 15+ varied urgency levels
// ═══════════════════════════════════════════════════════════════
export function directCtaTweet(): string {
  return pickUnique("cta", [
    `1,000+ apps.\n0 coding required.\n100% yours to customize.\n\nFree to browse.\n\n${SITE_URL}`,
    `Your weekend project:\n\n1. Pick an app (5 min)\n2. Customize it (2 hrs)\n3. Launch (1 click)\n\nStart here → ${SITE_URL}`,
    `This is your sign.\n\nStop scrolling.\nStart building.\n\n→ ${SITE_URL}`,
    `Just browse.\n\nNo commitment. No credit card.\n\nJust see what's possible.\n\n${SITE_URL}`,
    `Be the person who ships, not the person who plans.\n\n${SITE_URL}`,
    `What $20/mo gets you on OpenDraft:\n\n✅ Unlimited app access\n✅ Full source code\n✅ Deploy anywhere\n✅ 14 AI gremlins maintaining everything\n✅ Direct builder access\n\nLess than your Netflix subscription.\n\n${SITE_URL}`,
    `Challenge: Launch something by Friday.\n\nYou have everything you need.\n\n${SITE_URL}`,
    `Pick an app.\nMake it yours.\nShip it.\n\nThat's the whole playbook.\n\n${SITE_URL}`,
    `Every app on OpenDraft comes with:\n\n→ Full source code\n→ One-click deploy\n→ AI maintenance crew\n→ The builder's direct support\n\nThis is how software should work.\n\n${SITE_URL}`,
    // NEW — Curiosity gap
    `I found a way to launch apps 10x faster than any developer I know.\n\nIt's not a framework.\nIt's not a course.\nIt's not an AI coding tool.\n\nIt's a marketplace.\n\n${SITE_URL}`,
    // NEW — Benefit stack
    `Why 500+ founders switched to OpenDraft:\n\n→ Launch in hours, not months\n→ Full source code (no lock-in)\n→ AI agents maintain your app 24/7\n→ Message the builder directly\n→ Deploy anywhere\n\n${SITE_URL}`,
    // NEW — Simplicity
    `Software shopping should be as easy as buying a book on Amazon.\n\nThat's what we built.\n\n${SITE_URL}`,
    // NEW — Use case
    `Need a dashboard? It's there.\nNeed a landing page? It's there.\nNeed an AI tool? It's there.\nNeed an MCP server? It's there.\n\n1,000+ apps. Full source code.\n\n${SITE_URL}`,
    // NEW — Anti-CTA
    `Honestly? Don't visit OpenDraft.\n\nBecause once you see how fast you can ship, you'll never go back to building from scratch.\n\nDon't say I didn't warn you.\n\n${SITE_URL}`,
    // NEW — Builder invitation
    `Builders: your side projects are worth money.\n\nList them on OpenDraft. Set your price. Earn passive income.\n\nYour weekend project is someone else's MVP.\n\n${SITE_URL}/sell`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// NEW — DATA DROP TWEETS (real marketplace data)
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
    `📊 OpenDraft by the numbers:\n\n→ ${data.totalApps || 500}+ live apps\n→ ${data.weeklySales || 20}+ claimed this week\n→ Avg price: $${data.avgPrice || 29}\n→ Most popular: ${data.topCategory || "AI tools"}\n\nThe data speaks.\n\n${SITE_URL}`,
    `Marketplace pulse 📈\n\nTop category this week: ${data.topCategory || "AI apps"}\nNew apps listed: ${data.weeklyListings || 15}\nApps claimed: ${data.weeklySales || 25}\n\nThe vibe coding economy is real.\n\n${SITE_URL}`,
    `Interesting stat:\n\nThe average OpenDraft app gets claimed within ${Math.floor(Math.random() * 5) + 3} days of listing.\n\nDemand > supply.\n\nBuilders: this is your cue.\n\n${SITE_URL}/sell`,
    `Cost to build an app from scratch: $50,000+\nCost on OpenDraft: $${data.avgPrice || 29}\n\nTime to build: 6 months\nTime to launch: 6 hours\n\nROI: ♾️\n\n${SITE_URL}`,
    `${data.builderCount || 50}+ builders now sell on OpenDraft.\n\nTheir side projects earn them passive income.\n\nYour side project could too.\n\n${SITE_URL}/sell`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// NEW — BUILDER SPOTLIGHT TWEETS
// ═══════════════════════════════════════════════════════════════
export function builderSpotlightTweet(builder: {
  name?: string;
  appCount?: number;
  topApp?: string;
  totalSales?: number;
}): string {
  return pickUnique("spotlight", [
    `Builder spotlight 🔦\n\n${builder.name || "A creator"} has ${builder.appCount || 5} apps live on OpenDraft.\n\nTop seller: "${builder.topApp || "Dashboard Pro"}"\n\nTurning side projects into income streams.\n\n${SITE_URL}`,
    `Meet the builders making money from their code:\n\n${builder.name || "Anonymous builder"} — ${builder.totalSales || 10} total sales across ${builder.appCount || 3} apps.\n\nYour code has value. List it.\n\n${SITE_URL}/sell`,
    `Every app on OpenDraft was built by a real developer.\n\nNot a faceless corporation.\nNot a content farm.\n\nReal builders. Real code. Real support.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// NEW — HOT TAKE TWEETS (provocative, high-engagement)
// ═══════════════════════════════════════════════════════════════
export function hotTakeTweet(): string {
  return pickUnique("hottake", [
    `Hot take:\n\nIn 3 years, "I built this from scratch" will be as weird as "I made my own electricity."\n\nWe're entering the assembly era of software.\n\n${SITE_URL}`,
    `The best product managers in 2026 aren't managing sprints.\n\nThey're curating components.\n\nThe skill is taste, not tickets.\n\n${SITE_URL}`,
    `"Learn to code" was the advice of 2015.\n\n"Learn to ship" is the advice of 2026.\n\nDifferent era. Different leverage.\n\n${SITE_URL}`,
    `Controversial:\n\n90% of SaaS apps are the same 5 features in different wrappers:\n\n→ Auth\n→ Dashboard\n→ CRUD\n→ Payments\n→ Email\n\nStop rebuilding the wrapper.\n\n${SITE_URL}`,
    `The best code is code you didn't write.\n\nThe best feature is the one that already works.\n\nThe best launch is the one that happens today.\n\n${SITE_URL}`,
    `Agencies charging $50k for apps that exist for $49 on OpenDraft.\n\nThe arbitrage won't last forever.\n\nThe smart clients are already figuring this out.\n\n${SITE_URL}`,
    `"But what about customization?"\n\nYou get the full source code.\n\nReact. TypeScript. Tailwind.\n\nCustomize literally anything.\n\nThat objection is dead.\n\n${SITE_URL}`,
    `The entire software industry is being disrupted by a simple insight:\n\nMost software doesn't need to be unique.\n\nIt needs to work.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// NEW — MINI-THREAD TWEETS (multi-part for higher engagement)
// ═══════════════════════════════════════════════════════════════
export function miniThreadTweet(): string[] {
  const threads = [
    [
      `I studied 50 founders who launched in under 24 hours.\n\nHere's what they all had in common:\n\n🧵 Thread:`,
      `1/ They didn't start from zero.\n\nEvery single one used a template, boilerplate, or pre-built app.\n\nNot because they couldn't code. Because they valued speed over ego.`,
      `2/ They focused on distribution, not development.\n\nWhile competitors were debugging, they were:\n→ Talking to customers\n→ Running ads\n→ Building partnerships\n\nCode is table stakes. Distribution is the game.`,
      `3/ They launched "ugly" and iterated.\n\nNone of them waited for perfection.\n\nThey grabbed an app, customized the brand, and shipped.\n\nPerfect is the enemy of live.\n\n${SITE_URL}`,
    ],
    [
      `The "Buy vs Build" framework that changed how I think about software:\n\n🧵`,
      `Ask 3 questions:\n\n1. Is this core to my competitive advantage?\n2. Does a working version already exist?\n3. Will building it delay my launch?\n\nIf answers are No, Yes, Yes — buy it.`,
      `Most founders get this wrong because of ego.\n\n"Real founders build their own infra"\n\nNo. Real founders ship.\n\nThe infra is a means, not the end.\n\n${SITE_URL}`,
    ],
    [
      `Why the smartest agencies are using OpenDraft (and not telling their clients):\n\n🧵`,
      `1/ Client says: "Build me a dashboard"\n\nAgency finds one on OpenDraft for $39.\nCustomizes it for the client.\nCharges $5,000.\n\nMargin: 99.2%\n\nIs it ethical? It's literally how every industry works.`,
      `2/ The client gets:\n→ A working product in days\n→ Battle-tested code\n→ AI maintenance included\n\nThe agency gets:\n→ Insane margins\n→ Happy clients\n→ More capacity\n\nEveryone wins.\n\n${SITE_URL}`,
    ],
    [
      `The future of software development in 5 predictions:\n\n🧵`,
      `1/ By 2027, "full-stack developer" becomes "full-stack assembler."\n\nThe skill isn't writing code. It's knowing which components to combine.\n\nTaste > syntax.`,
      `2/ AI agents will buy software on behalf of companies.\n\nThey'll search marketplaces, evaluate options, and purchase — autonomously.\n\nThis is already happening on OpenDraft.`,
      `3/ The supply of software will 100x, but quality will concentrate.\n\nMarketplaces with curation, reviews, and AI quality checks will win.\n\nThat's exactly what we're building.\n\n${SITE_URL}`,
    ],
    [
      `I built 3 micro-SaaS products in one weekend.\n\nHere's exactly how:\n\n🧵`,
      `Product 1: Client portal for freelancers\n\n→ Found a dashboard app on OpenDraft ($39)\n→ Swapped the logo, colors, copy\n→ Added my Stripe key\n→ Live by Saturday noon`,
      `Product 2: AI content scheduler\n\n→ Found an AI tool template ($49)\n→ Connected my OpenAI key\n→ Customized the prompts\n→ Live by Saturday evening`,
      `Product 3: Landing page builder\n\n→ Grabbed a page builder template (FREE)\n→ Added my domain\n→ Started selling next week\n\nTotal cost: $88\nTotal time: 1 weekend\n\nAll apps: ${SITE_URL}`,
    ],
  ];
  return pick(threads);
}

// ═══════════════════════════════════════════════════════════════
// ORIGINAL TEMPLATES (compatibility)
// ═══════════════════════════════════════════════════════════════
export function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(0)}`;
  const badge = listing.completeness_badge === "production_ready" ? "Production-ready" :
    listing.completeness_badge === "mvp" ? "MVP" : "Prototype";
  const url = `${SITE_URL}/listing/${listing.id}`;

  return pickUnique("new_listing", [
    `🆕 Just dropped:\n\n"${listing.title}"\n\n${badge} · ${price}\n\nGrab it before someone else does 👇\n${url}`,
    `New on OpenDraft → ${listing.title}\n\n${badge} · Ready to launch today.\n\nClaim yours → ${url}`,
    `Fresh app alert:\n\n${listing.title} (${price})\n\nPick it. Ship it. Done.\n\n${url}`,
    `Just listed: "${listing.title}"\n\n${badge} · ${price}\n\nAnother app ready to make someone money.\n\n${url}`,
    `New drop 🔥\n\n${listing.title}\n${badge} · ${price}\n\nWho's grabbing this one?\n\n${url}`,
    // NEW
    `"${listing.title}" just landed on OpenDraft.\n\n${badge} · Full source code · ${price}\n\nBe the first to claim it → ${url}`,
    `Fresh from a builder:\n\n${listing.title}\n\n${(listing.tech_stack || []).slice(0, 3).join(" · ")}\n${badge} · ${price}\n\n${url}`,
  ]);
}

export function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  return pickUnique("milestone", [
    `${milestone} founders chose "${listing.title}" 🔥\n\nThere's a reason it's popular.\n\nSee why → ${url}`,
    `"${listing.title}" just hit ${milestone} sales.\n\nDon't miss the wave.\n\n${url}`,
    `${milestone}x sold.\n\nProven. Popular. Ready for you.\n\n"${listing.title}"\n\n${url}`,
    `${milestone} people can't be wrong.\n\n"${listing.title}" is a hit.\n\n${url}`,
    // NEW
    `${milestone} founders are now running businesses powered by "${listing.title}."\n\nJoin them → ${url}`,
  ]);
}

export function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "FREE" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return pickUnique("trending_digest", [
    `🔥 Trending right now:\n\n${lines.join("\n")}\n\nThese won't last. Grab one → ${SITE_URL}`,
    `Top 3 apps this week:\n\n${lines.join("\n")}\n\nAll with full source code.\n\n${SITE_URL}`,
    `What founders are claiming right now:\n\n${lines.join("\n")}\n\nSee the full marketplace → ${SITE_URL}`,
  ]);
}

export function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return pickUnique("weekly", [
    `This week:\n\n🏪 ${stats.listings} new apps\n💰 ${stats.sales} launches\n👷 ${stats.builders} new founders\n\nThe movement is growing.\n\nJoin us → ${SITE_URL}`,
    `Week in review:\n\n${stats.listings} apps added\n${stats.sales} apps shipped\n${stats.builders} founders joined\n\nStill think this is a fad?\n\n${SITE_URL}`,
    `📊 Weekly pulse:\n\nNew apps: ${stats.listings}\nDeployments: ${stats.sales}\nNew builders: ${stats.builders}\n\nThe app store for builders keeps growing.\n\n${SITE_URL}`,
    // NEW
    `Every week the numbers go up:\n\n+${stats.listings} apps\n+${stats.sales} launches\n+${stats.builders} builders\n\nOrganic. No ads. Pure word of mouth.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ART PROMPT GENERATOR — expanded with more styles
// ═══════════════════════════════════════════════════════════════
export function getTweetArtPrompt(postType: string): string {
  const styles = [
    "clean modern digital illustration, dark purple background (#1a0533), vibrant accent colors, minimal flat design, no text, no words, no letters, no watermarks",
    "3D rendered scene with soft volumetric lighting, deep indigo and teal color scheme, cinematic depth of field, no text, no words, no letters",
    "retro pixel art style with a modern twist, 16-bit aesthetic, rich purple and neon green palette, crisp edges, no text, no words, no letters",
    "watercolor-meets-digital art style, soft gradients bleeding into sharp vector elements, midnight blue and coral accents, no text, no words, no letters",
    "isometric low-poly 3D scene, geometric shapes, warm amber lighting against cool navy backdrop, no text, no words, no letters",
    "paper cut-out layered illustration, subtle shadows between layers, rich jewel tones on dark background, no text, no words, no letters",
    "neon noir cyberpunk style, rain-slicked surfaces reflecting neon signs, purple and electric blue, cinematic composition, no text, no words, no letters",
    "Japanese ukiyo-e woodblock print reimagined with tech elements, bold outlines, limited color palette of indigo and gold, no text, no words, no letters",
    "stained glass window aesthetic with glowing backlit panels, rich saturated colors, dark leading lines, no text, no words, no letters",
    "botanical illustration style but with tech elements instead of plants, detailed linework, muted earth tones with electric purple accents, no text, no words, no letters",
    // NEW STYLES
    "vaporwave aesthetic with pastel gradients, Roman busts and glitch effects, pink and cyan palette, retro-futuristic, no text, no words, no letters",
    "art deco poster style with bold geometric patterns, gold and black color scheme, 1920s glamour meets tech, no text, no words, no letters",
    "claymation/plasticine 3D style, soft rounded shapes, warm playful colors, stop-motion feel, no text, no words, no letters",
    "blueprint/technical drawing style with glowing cyan lines on dark navy background, engineering precision meets beauty, no text, no words, no letters",
    "comic book panel style with bold halftone dots, dramatic angles, saturated primary colors, action-packed composition, no text, no words, no letters",
  ];
  const styleBase = pick(styles);

  const prompts: Record<string, string[]> = {
    engagement_hook: [
      `A glowing rocket ship launching from a laptop screen, trailing a comet of code symbols and dollar signs. ${styleBase}, neon cyan and magenta accents`,
      `A maze viewed from above, with one path glowing bright — the shortcut — while dozens of other paths are dark and tangled. ${styleBase}, glowing green path`,
      `A lightbulb moment: a brain made of circuit boards with a bright golden glow emanating from its center. ${styleBase}, gold and electric blue accents`,
      `Split scene: left side shows a tangled mess of code and frustrated developer, right side shows a clean app interface with a happy user. ${styleBase}, contrast warm/cool`,
      `A key turning in a lock that's actually a computer screen, unlocking a flood of light and floating app icons. ${styleBase}, dramatic golden light burst`,
      `A surfer riding a massive wave made of flowing source code, perfectly balanced and confident. ${styleBase}, dynamic motion`,
      `An architect's drafting table but the blueprints are glowing holographic app wireframes floating above it. ${styleBase}, warm workspace glow`,
      `A domino chain reaction where the first domino is tiny (an idea) and the last one is enormous (a thriving business), mid-topple. ${styleBase}, dramatic perspective`,
      `A telescope pointed at a constellation that forms the shape of a perfect app dashboard. ${styleBase}, cosmic wonder`,
      `A Swiss Army knife where each tool is a different app feature: chat, payments, auth, dashboard. ${styleBase}, metallic sheen`,
    ],
    fomo: [
      `A clock melting Salvador Dali style, with app windows floating away into a vortex. Urgency and time running out. ${styleBase}, red and orange urgency colors`,
      `A crowded marketplace with glowing app storefronts, people rushing to grab glowing boxes off shelves. ${styleBase}, warm golden light`,
      `A train departing a neon-lit station, with one person running to catch it. ${styleBase}, motion blur, cyan trails`,
      `An hourglass where the top half contains app ideas and the bottom half is filling with competitor logos. ${styleBase}, amber urgency`,
      `A conveyor belt of glowing app packages moving toward a "SOLD" stamp. ${styleBase}, industrial warmth`,
      `A sunrise over a cityscape where each building is a launched app. ${styleBase}, dramatic dawn light`,
      `A game of musical chairs with app icons as chairs and founder silhouettes circling. ${styleBase}, spotlight tension`,
      `A garden where flowers (apps) are being picked by hands reaching in from all sides. ${styleBase}, lush but urgent`,
    ],
    pain_point: [
      `A person buried under an avalanche of sticky notes, code printouts, and project management boards. ${styleBase}, muted tones with one bright exit sign`,
      `A piggy bank cracking open with dollar bills flying out, next to a calendar showing months passing. ${styleBase}, red warning tones`,
      `A hamster wheel made of code editors and deployment pipelines, with a tiny developer running endlessly. ${styleBase}, warm amber glow`,
      `A tangled ball of yarn where the yarn is ethernet cables, USB cords, and code — with scissors nearby. ${styleBase}, chaotic but hopeful`,
      `A desert with a lone coder at a desk, mirage of a launched app shimmering in the distance. ${styleBase}, scorching heat haze`,
      `A Rube Goldberg machine that's absurdly complex just to achieve "deploy app." ${styleBase}, whimsical engineering`,
      `A person on a treadmill going nowhere while outside the window, apps are launching like fireworks. ${styleBase}, indoor/outdoor contrast`,
      `A stack of "How to Code" books taller than a person, wobbling dangerously, while a single glowing app floats serenely beside them. ${styleBase}, absurd scale`,
    ],
    gremlin_update: [
      `A cute purple gremlin character working at a holographic dashboard in a cozy server room at night. ${styleBase}, cozy warm lighting with screen glow`,
      `Multiple small purple gremlin creatures each doing different tasks: scanning, patching code, painting screenshots, standing guard. ${styleBase}, team formation`,
      `A purple gremlin sleeping on a server rack with one eye open, monitoring green status lights. ${styleBase}, peaceful but vigilant`,
      `A purple gremlin wearing tiny round glasses examining lines of code with a microscope. ${styleBase}, laboratory aesthetic`,
      `A team of purple gremlins building a bridge made of API connections and data pipes. ${styleBase}, construction scene`,
      `A purple gremlin in a chef's hat, stirring a cauldron of bubbling code. ${styleBase}, magical kitchen`,
      `A purple gremlin meditating on top of a server tower, surrounded by floating orbs of resolved bugs. ${styleBase}, zen garden meets tech`,
      `A purple gremlin riding a mechanical spider across a web of interconnected app nodes. ${styleBase}, steampunk web`,
      `A cozy purple gremlin reading a book titled "Vulnerability Report" by fireplace. ${styleBase}, cottage core meets cybersecurity`,
      `A purple gremlin conducting an orchestra of smaller gremlins, each playing different "instruments." ${styleBase}, grand concert hall`,
      `A purple gremlin as a lighthouse keeper, shining a beam across a dark ocean of code. ${styleBase}, maritime night scene`,
      `A purple gremlin tending a bonsai tree whose branches are folder structures. ${styleBase}, contemplative zen`,
      `A purple gremlin in a detective trench coat investigating error logs. ${styleBase}, film noir`,
      `A purple gremlin painting a masterpiece that's actually a beautiful app screenshot. ${styleBase}, artist's studio`,
      `Two purple gremlins playing chess, but the pieces are security vulnerabilities and patches. ${styleBase}, strategic intensity`,
    ],
    question: [
      `Two doors floating in space — one leads to a long road, the other opens to a glowing city. ${styleBase}, dramatic lighting`,
      `A giant question mark made of app screenshots and UI components. ${styleBase}, scattered colorful elements`,
      `A crossroads in a digital forest, with holographic signposts pointing different directions. ${styleBase}, enchanted tech forest`,
      `A mirror showing two reflections: one coding for months, one launching today. ${styleBase}, duality`,
      `A fortune teller's crystal ball showing swirling visions of different app futures. ${styleBase}, mystical glow`,
      `A vending machine full of different app ideas, each in a glowing capsule. ${styleBase}, retro-futuristic`,
      `A compass spinning wildly, with each direction labeled by a different tech stack icon. ${styleBase}, navigation and choice`,
    ],
    success_story: [
      `A person planting a tiny seed and immediately a fully-grown tree of apps and money blooms. ${styleBase}, green growth, golden fruits`,
      `A podium with #1 spot, but instead of a person it's a laptop showing a launched app. ${styleBase}, celebration vibes, gold and white`,
      `A before/after split: empty desk with notebook vs bustling app with users and revenue. ${styleBase}, transformation visual`,
      `A mountain peak with a flag planted at the top — the flag is a browser window showing "App Live." ${styleBase}, achievement and dawn`,
      `A caterpillar transforming into a butterfly made of beautiful polished app screens. ${styleBase}, metamorphosis`,
      `A bowling lane where all pins are knocked down. Each pin is a milestone: Deploy, First User, First Sale. ${styleBase}, satisfying strike`,
      `A trophy case but each trophy is a different deployed app, gleaming under museum spotlights. ${styleBase}, aspiration`,
    ],
    direct_cta: [
      `A glowing portal/gateway made of code, with warm inviting light streaming through it. ${styleBase}, inviting warm golden glow`,
      `A treasure chest opening with app icons and source code floating out, bathed in magical light. ${styleBase}, treasure and discovery`,
      `A welcome mat in front of a grand doorway opening into a vast digital marketplace. ${styleBase}, inviting threshold`,
      `A launchpad with a countdown display at zero, a sleek app rocket sitting ready for takeoff. ${styleBase}, launch readiness`,
      `An open book where the pages transform into a 3D app coming to life. ${styleBase}, storybook magic`,
      `A pair of hands cupping a glowing orb that contains a miniature running app. ${styleBase}, generous warmth`,
      `A slot machine hitting triple sevens, but the symbols are app icons. ${styleBase}, fortune and opportunity`,
    ],
    blog_post: [
      `An abstract representation of the vibe coding movement: waves of code transforming into finished products. ${styleBase}, flowing organic shapes`,
      `A crystal ball showing the future of software: apps assembling themselves from floating UI components. ${styleBase}, mystical tech aesthetic`,
      `A giant newspaper front page but the headlines are holograms floating off the paper. ${styleBase}, editorial gravitas`,
      `A library where the books are floating and open, each revealing a different chapter of the AI revolution. ${styleBase}, scholarly wisdom`,
      `A timeline stretching across the scene like a river, with major tech milestones as bridges. ${styleBase}, panoramic journey`,
      `An observatory dome open to a sky full of data constellations. ${styleBase}, scientific discovery`,
    ],
    hot_take: [
      `A boxing ring where a tiny scrappy fighter (labeled "ship fast") faces a massive opponent (labeled "perfect code"). The small one is winning. ${styleBase}, dramatic sports lighting`,
      `A wrecking ball smashing through a wall labeled "build from scratch" revealing a beautiful garden of apps behind it. ${styleBase}, destruction meets creation`,
      `An hourglass being shattered, sand and app icons exploding outward in slow motion. The concept of "building time" being destroyed. ${styleBase}, explosive liberation`,
    ],
    data_drop: [
      `A holographic data dashboard floating in space, showing upward trending charts and glowing metrics. ${styleBase}, futuristic data visualization`,
      `A scoreboard at a stadium, but it's showing marketplace metrics: apps, sales, builders. The numbers are climbing live. ${styleBase}, sports excitement meets data`,
    ],
    builder_spotlight: [
      `A spotlight illuminating a single workstation with multiple screens, each showing a different app creation. ${styleBase}, hero lighting, warm golden spot`,
      `A gallery wall with framed app screenshots, each with a small "SOLD" sticker, spotlight moving between them. ${styleBase}, art exhibition warmth`,
    ],
  };

  const typePrompts = prompts[postType] || prompts["engagement_hook"];
  return pick(typePrompts);
}
