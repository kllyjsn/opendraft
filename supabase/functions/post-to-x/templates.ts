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
    `🔴 LIVE: ${stats.browsing || 127} people browsing apps right now\n\nThe best ones get claimed fast.\n\nDon't miss out → ${SITE_URL}`,
    `That app you've been thinking about building?\n\nSomeone just bought a clone of it.\n\n${stats.apps || 1000}+ apps. First come, first served.\n\n${SITE_URL}`,
    `Every hour you wait:\n\n→ Competitors get ahead\n→ Best apps get claimed\n→ Your launch date slips further\n\nStop waiting. Start shipping.\n\n${SITE_URL}`,
    `Your competitor just launched.\n\nThey didn't code it.\n\nThey bought it on OpenDraft, slapped their brand on it, and went live.\n\nYou're still in figma.\n\n${SITE_URL}`,
    `PSA: The best free apps on OpenDraft don't stay free forever.\n\nBuilders raise prices as traction grows.\n\nGrab them while they're cheap.\n\n${SITE_URL}`,
    `${stats.signups || 12} founders signed up today.\n\nThey'll be launching apps this week while you're still planning.\n\n${SITE_URL}`,
    `Monday: "I should build that app"\nTuesday: "I'll start this weekend"\nFriday: "Maybe next week"\n\n...6 months later: nothing.\n\nOr just → ${SITE_URL}`,
    `3 apps got claimed in the last hour.\n\nPeople are waking up to how easy this is.\n\n${SITE_URL}`,
    // NEW — Time-based FOMO
    `While you read this tweet, someone just claimed an app and is already customizing it.\n\nBy tomorrow, they'll have users.\n\n${SITE_URL}`,
    // NEW — Social proof FOMO
    `The same app got claimed by 3 different founders this week.\n\nAll in different niches.\nAll launching different products.\nSame source code.\n\nThat's the playbook.\n\n${SITE_URL}`,
    // NEW — Price anchor
    `A founder just spent $29 on an app that would cost $35,000 to rebuild.\n\nI checked. Same features. Same quality.\n\nThe math is embarrassing.\n\n${SITE_URL}`,
    // NEW — Competitive intel
    `Just saw a YC startup launch. Their MVP looks familiar.\n\nBecause I saw the exact same template on OpenDraft 3 weeks ago.\n\nFor $39.\n\nThe smart money moves fast.\n\n${SITE_URL}`,
    // NEW — Weekend FOMO
    `Friday shipping thread:\n\nPost what you launched this week.\n\n(Half the replies will be OpenDraft apps. Watch.)\n\n${SITE_URL}`,
    // NEW — Seasonal
    `Q2 just started.\n\nWill you spend it building from scratch?\nOr launching 4 products?\n\nThe tools exist. The apps exist. The only thing missing is you.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PAIN POINTS — 15+ agitation templates
// ═══════════════════════════════════════════════════════════════
export function painPointTweet(): string {
  return pickUnique("pain", [
    `Tired of:\n\n❌ 6-month dev timelines\n❌ $50k+ development costs\n❌ Hiring unreliable freelancers\n❌ Learning to code yourself\n\nThere's a shortcut.\n\n${SITE_URL}`,
    `You have an idea.\nYou don't have 6 months.\nYou don't have $50,000.\nYou don't have a dev team.\n\nYou DO have ${SITE_URL}`,
    `Stages of building a SaaS:\n\n1. Excitement\n2. Planning\n3. More planning\n4. "This is harder than I thought"\n5. Burnout\n\n...or skip to step 6: launch.\n\n${SITE_URL}`,
    `If you've ever stared at a blank VS Code window wondering where to start...\n\nYou don't need more tutorials.\n\nYou need a head start.\n\n${SITE_URL}`,
    `"How's the app going?"\n"Great, I'm almost done with the auth page"\n"You started 4 months ago"\n"..."\n\nThere's a better way.\n\n${SITE_URL}`,
    `Real talk: nobody cares if you built it from scratch.\n\nCustomers care if it works.\n\nInvestors care if it ships.\n\nYour ego is the only thing that wants custom code.\n\n${SITE_URL}`,
    `Quick math:\n\nFreelancer: $100/hr × 500 hrs = $50,000\nOpenDraft: $29 × 1 = $29\n\nSame app. Same outcome.\n\n${SITE_URL}`,
    `The real cost of building from scratch isn't money.\n\nIt's the 6 months of your life you'll never get back.\n\nWhile you build, your market moves on.\n\n${SITE_URL}`,
    `POV: You just spent 3 weeks implementing OAuth for the 47th time in your career\n\n🫠\n\n${SITE_URL}`,
    // NEW — Developer-specific pain
    `Things developers love building:\n→ Auth systems\n→ Payment integrations\n→ Admin dashboards\n\nThings that actually make money:\n→ None of the above\n\nBuy the boring parts. Build the differentiator.\n\n${SITE_URL}`,
    // NEW — Agency pain
    `If you're an agency charging clients $50k for apps you could source for $200 total...\n\nI'm not saying anything.\n\nI'm just saying.\n\n${SITE_URL}`,
    // NEW — Burnout empathy
    `Burnout isn't a badge of honor.\n\nIf someone already built what you need, using it isn't "cheating."\n\nIt's called being smart.\n\nYour mental health matters more than your git commits.\n\n${SITE_URL}`,
    // NEW — Tutorial hell
    `Tutorial hell:\n\n→ Watch 47 YouTube videos\n→ Take 3 Udemy courses\n→ Read 12 blog posts\n→ Still can't deploy\n\nAlternative: pick a working app and reverse-engineer it.\n\n${SITE_URL}`,
    // NEW — Scope creep
    `The project was supposed to take 2 weeks.\n\n"Just one more feature."\n"Oh, we need this too."\n"Can you also add..."\n\n6 months later: still no users.\n\nShip first. Iterate later.\n\n${SITE_URL}`,
    // NEW — Hiring pain
    `Hiring a developer in 2026:\n\n→ 3 months to find one\n→ $150k+ salary\n→ 3 months to onboard\n→ First feature in 6 months\n\nOr: ${SITE_URL} → ship today\n\nYour call.`,
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
    `Quick poll:\n\nWhat's stopping you from launching your app idea?\n\n🅰️ No coding skills\n🅱️ No time\n🅲 No budget\n🅳 All of the above\n\n(Reply and I'll show you a shortcut)`,
    `Be honest:\n\nHow long have you been "working on" your app idea?\n\n⏰ < 1 month\n⏰ 1-6 months\n⏰ 6-12 months\n⏰ I don't want to talk about it\n\nThere's a faster way → ${SITE_URL}`,
    `Would you rather:\n\n🅰️ Spend 6 months building an app from scratch\n🅱️ Buy a ready-made app and launch this week\n\n(Most successful founders choose B)`,
    `What would you build if you could launch an app in 24 hours?\n\nDrop your idea below 👇\n\nI'll tell you if it already exists on OpenDraft.`,
    `Genuine question for founders:\n\nDo you NEED to build from scratch, or do you WANT to?\n\nBe honest.\n\nBecause there's a massive difference.`,
    `What's your biggest app idea you've never shipped?\n\nReply and I'll find something close on OpenDraft that you can launch THIS WEEK.\n\n${SITE_URL}`,
    `Debate: Is buying a pre-built app and customizing it "cheating"?\n\nOr is it just... smart?\n\n🔥 in the replies`,
    `Which is more impressive:\n\nA) Spent 2 years building a beautiful app nobody uses\nB) Bought an app, launched in a day, got 100 paying users\n\nI know my answer.`,
    `Raise your hand if you have 3+ unfinished side projects right now ✋\n\nWhat if you just... bought the finished version?\n\n${SITE_URL}`,
    // NEW — Spicier questions
    `Hot take request:\n\nWhat's the most overrated programming language in 2026?\n\n(Wrong answers only)\n\n...also, does it matter if you can just buy the app? ${SITE_URL}`,
    // NEW — This or that
    `This or that:\n\n🅰️ Perfect code, 0 users\n🅱️ "Good enough" code, 1000 users\n\nYour answer reveals everything about why you haven't shipped yet.`,
    // NEW — Fill in the blank
    `Fill in the blank:\n\n"I would have launched my app by now, but ___________"\n\n(The top reply gets a free app from OpenDraft)\n\n${SITE_URL}`,
    // NEW — Challenge
    `72-hour challenge:\n\nFind an app → Customize it → Deploy it → Get your first user.\n\nWho's in? Drop a 🚀 below.\n\nStart here → ${SITE_URL}`,
    // NEW — Founder reflection
    `Founders: what's the one thing you wish you'd done differently when starting?\n\nI'll start: I wish I'd stopped building from scratch sooner.\n\n${SITE_URL}`,
    // NEW — Controversial take
    `Unpopular opinion:\n\n"Full-stack developer" will be an extinct job title by 2028.\n\nThe future is assemblers, not builders.\n\nAgree or disagree? 👇`,
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
