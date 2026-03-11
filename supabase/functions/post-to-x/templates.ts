/**
 * Tweet text templates — HIGHLY VARIED
 * Different tones: sharp founder, meme-lord, storyteller, data nerd, philosopher, absurdist
 * Different formats: one-liners, threads, lists, dialogues, mini-stories
 */

const SITE_URL = "https://opendraft.co";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Track used indices per session to avoid repeats within a run
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
// ENGAGEMENT HOOKS — varied tones & angles
// ═══════════════════════════════════════════════════════════════
export function engagementHookTweet(): string {
  return pickUnique("hook", [
    // Sharp founder voice
    `Unpopular opinion:\n\nBuilding an app from scratch in 2026 is like hand-writing every email instead of using Gmail.\n\nThere's a faster way 👇\n\n${SITE_URL}`,
    `The biggest lie in tech:\n\n"You need to build everything yourself."\n\nThe smartest founders buy, customize, launch.\n\n${SITE_URL}`,
    // Absurdist / meme
    `Me in 2023: "I'll build this app myself, how hard can it be?"\n\nMe in 2026: *buys a finished one for $29 and launches before lunch*\n\n${SITE_URL}`,
    `Nobody:\n\nAbsolutely nobody:\n\nFounders still hand-coding login pages from scratch: 🤡\n\n${SITE_URL}`,
    // Data / stat driven
    `I analyzed 200 failed startups.\n\nThe #1 cause of death?\n\nThey ran out of money before shipping.\n\nThe fix is stupidly simple → buy what's already built.\n\n${SITE_URL}`,
    // Philosophical
    `Building software used to be about writing code.\n\nNow it's about taste.\n\nKnowing what to ship > knowing how to build.\n\n${SITE_URL}`,
    `The future of software isn't code.\n\nIt's curation.\n\nFind the right pieces. Assemble. Ship.\n\n${SITE_URL}`,
    // Contrarian
    `Hot take: The best developers in 2026 write zero code.\n\nThey orchestrate. They assemble. They ship.\n\nAnd they move 10x faster than everyone else.\n\n${SITE_URL}`,
    `Controversial but true:\n\nYour "unique" app idea has probably been built 47 times already.\n\nThe differentiator is execution speed.\n\n${SITE_URL}`,
    // Storytelling
    `My friend quit her $200k job to start a SaaS.\n\n6 months in: no product, no revenue, $40k spent.\n\nI showed her OpenDraft.\n\nShe launched in 3 hours.\n\n${SITE_URL}`,
    // Pattern interrupt
    `Stop reading this.\n\nGo launch something.\n\nSeriously.\n\n${SITE_URL}`,
    `This tweet will save you $50,000.\n\n(screenshot it)\n\nDon't build from scratch. Buy a working app. Customize it. Launch.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// FOMO — urgency with different emotional angles
// ═══════════════════════════════════════════════════════════════
export function fomoTweet(stats: { browsing?: number; signups?: number; apps?: number }): string {
  return pickUnique("fomo", [
    `🔴 LIVE: ${stats.browsing || 127} people browsing apps right now\n\nThe best ones get claimed fast.\n\nDon't miss out → ${SITE_URL}`,
    `That app you've been thinking about building?\n\nSomeone just bought a clone of it.\n\n${stats.apps || 1000}+ apps. First come, first served.\n\n${SITE_URL}`,
    `Every hour you wait:\n\n→ Competitors get ahead\n→ Best apps get claimed\n→ Your launch date slips further\n\nStop waiting. Start shipping.\n\n${SITE_URL}`,
    // Jealousy-driven
    `Your competitor just launched.\n\nThey didn't code it.\n\nThey bought it on OpenDraft, slapped their brand on it, and went live.\n\nYou're still in figma.\n\n${SITE_URL}`,
    // Scarcity
    `PSA: The best free apps on OpenDraft don't stay free forever.\n\nBuilders raise prices as traction grows.\n\nGrab them while they're cheap.\n\n${SITE_URL}`,
    // Social proof
    `${stats.signups || 12} founders signed up today.\n\nThey'll be launching apps this week while you're still planning.\n\n${SITE_URL}`,
    // Timeline pressure
    `Monday: "I should build that app"\nTuesday: "I'll start this weekend"\nFriday: "Maybe next week"\n\n...6 months later: nothing.\n\nOr just → ${SITE_URL}`,
    // FOMO with specific context
    `3 apps got claimed in the last hour.\n\nPeople are waking up to how easy this is.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PAIN POINTS — varied styles of agitation
// ═══════════════════════════════════════════════════════════════
export function painPointTweet(): string {
  return pickUnique("pain", [
    `Tired of:\n\n❌ 6-month dev timelines\n❌ $50k+ development costs\n❌ Hiring unreliable freelancers\n❌ Learning to code yourself\n\nThere's a shortcut.\n\n${SITE_URL}`,
    `You have an idea.\nYou don't have 6 months.\nYou don't have $50,000.\nYou don't have a dev team.\n\nYou DO have ${SITE_URL}`,
    // Sarcasm
    `Stages of building a SaaS:\n\n1. Excitement\n2. Planning\n3. More planning\n4. "This is harder than I thought"\n5. Burnout\n\n...or skip to step 6: launch.\n\n${SITE_URL}`,
    // Empathy
    `If you've ever stared at a blank VS Code window wondering where to start...\n\nYou don't need more tutorials.\n\nYou need a head start.\n\n${SITE_URL}`,
    // Dialogue format
    `"How's the app going?"\n"Great, I'm almost done with the auth page"\n"You started 4 months ago"\n"..."\n\nThere's a better way.\n\n${SITE_URL}`,
    // Raw honesty
    `Real talk: nobody cares if you built it from scratch.\n\nCustomers care if it works.\n\nInvestors care if it ships.\n\nYour ego is the only thing that wants custom code.\n\n${SITE_URL}`,
    // Calculator
    `Quick math:\n\nFreelancer: $100/hr × 500 hrs = $50,000\nOpenDraft: $29 × 1 = $29\n\nSame app. Same outcome.\n\n${SITE_URL}`,
    // Time cost
    `The real cost of building from scratch isn't money.\n\nIt's the 6 months of your life you'll never get back.\n\nWhile you build, your market moves on.\n\n${SITE_URL}`,
    // Relatable frustration
    `POV: You just spent 3 weeks implementing OAuth for the 47th time in your career\n\n🫠\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// GREMLIN UPDATES — personality-driven behind-the-scenes
// ═══════════════════════════════════════════════════════════════
export function gremlinTweet(activity?: string): string {
  return pickUnique("gremlin", [
    `🤖 Gremlin Report:\n\nWhile you were sleeping, our AI agents:\n\n→ Scanned 50 apps for bugs\n→ Fixed 3 broken deployments\n→ Generated 20 fresh screenshots\n→ Optimized SEO on 15 listings\n\nYour apps maintain themselves.\n\n${SITE_URL}`,
    `The Gremlins never sleep.\n\n3 AM: Security scan complete ✓\n4 AM: Dead links fixed ✓\n5 AM: Screenshots refreshed ✓\n\nEvery app on OpenDraft has a 24/7 AI maintenance crew.\n\n${SITE_URL}`,
    `Meet the Gremlins™\n\n🔍 SEO Gremlin - ranks your app\n🛡️ Security Gremlin - patches vulnerabilities\n🏥 Doctor Gremlin - heals broken deploys\n📸 Screenshot Gremlin - keeps visuals fresh\n\n14 AI agents. Working for you. 24/7.\n\n${SITE_URL}`,
    // Personality-driven
    `Just caught the QA Gremlin arguing with the SEO Gremlin about meta descriptions.\n\nThe Security Gremlin settled it by patching 3 XSS vulnerabilities.\n\nGremlin drama is the best drama.\n\n${SITE_URL}`,
    `The outreach gremlin just discovered 47 businesses that need apps.\n\nNone of them know we exist yet.\n\nThey will by Friday.\n\n${SITE_URL}`,
    // Day in the life
    `A day in the life of an OpenDraft Gremlin:\n\n6:00 AM — Wake up (I don't sleep)\n6:01 AM — Scan 200 apps\n6:03 AM — Fix 7 bugs\n6:04 AM — Back to scanning\n\nRepeat forever.\n\n${SITE_URL}`,
    // Breaking news style
    `BREAKING: The Screenshot Gremlin just regenerated 43 app previews in 12 minutes.\n\nNo human involvement.\nNo tickets.\nNo meetings.\n\nJust vibes.\n\n${SITE_URL}`,
    // Wholesome
    `Shoutout to the Security Gremlin.\n\nQuietly patching vulnerabilities at 4 AM so you can sleep soundly knowing your app is safe.\n\nThe hero nobody talks about.\n\n${SITE_URL}`,
    // Funny
    `The Gremlins have processed more code this week than my entire engineering team did in Q1 2024.\n\nThey also don't need coffee breaks.\n\nUnfair advantage.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS — engagement bait with variety
// ═══════════════════════════════════════════════════════════════
export function questionTweet(): string {
  return pickUnique("question", [
    `Quick poll:\n\nWhat's stopping you from launching your app idea?\n\n🅰️ No coding skills\n🅱️ No time\n🅲 No budget\n🅳 All of the above\n\n(Reply and I'll show you a shortcut)`,
    `Be honest:\n\nHow long have you been "working on" your app idea?\n\n⏰ < 1 month\n⏰ 1-6 months\n⏰ 6-12 months\n⏰ I don't want to talk about it\n\nThere's a faster way → ${SITE_URL}`,
    `Would you rather:\n\n🅰️ Spend 6 months building an app from scratch\n🅱️ Buy a ready-made app and launch this week\n\n(Most successful founders choose B)`,
    `What would you build if you could launch an app in 24 hours?\n\nDrop your idea below 👇\n\nI'll tell you if it already exists on OpenDraft.`,
    // Deeper questions
    `Genuine question for founders:\n\nDo you NEED to build from scratch, or do you WANT to?\n\nBe honest.\n\nBecause there's a massive difference.`,
    `What's your biggest app idea you've never shipped?\n\nReply and I'll find something close on OpenDraft that you can launch THIS WEEK.\n\n${SITE_URL}`,
    // Spicy debates
    `Debate: Is buying a pre-built app and customizing it "cheating"?\n\nOr is it just... smart?\n\n🔥 in the replies`,
    `Which is more impressive:\n\nA) Spent 2 years building a beautiful app nobody uses\nB) Bought an app, launched in a day, got 100 paying users\n\nI know my answer.`,
    // Relatable
    `Raise your hand if you have 3+ unfinished side projects right now ✋\n\nWhat if you just... bought the finished version?\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS STORIES — varied narrative formats
// ═══════════════════════════════════════════════════════════════
export function successStoryTweet(listing?: any): string {
  return pickUnique("success", [
    `Just shipped 🚀\n\nAnother founder grabbed an app and deployed it same-day.\n\nNo coding. No waiting. Just business.\n\nYour turn → ${SITE_URL}`,
    `Timeline:\n\n9:00 AM - Found app on OpenDraft\n9:30 AM - Purchased\n11:00 AM - Customized branding\n2:00 PM - Live and taking customers\n\n${SITE_URL}`,
    // Mini case study
    `Case study:\n\nFounder wanted a project management tool.\n\nOption A: Build it ($45k, 4 months)\nOption B: OpenDraft ($49, 2 hours)\n\nThey chose B.\n\nNow they have customers AND a budget.\n\n${SITE_URL}`,
    // Before/After
    `Before OpenDraft: "I need $50k and a dev team"\n\nAfter OpenDraft: "I launched before breakfast"\n\nThis isn't marketing. This is Tuesday.\n\n${SITE_URL}`,
    // Numbers
    `This month on OpenDraft:\n\n→ ${Math.floor(Math.random() * 15) + 5} apps deployed\n→ Average time to launch: 4.2 hours\n→ Money saved vs building: ~$${Math.floor(Math.random() * 200 + 100)}k\n\nThe numbers don't lie.\n\n${SITE_URL}`,
    // Testimonial style
    `"I was skeptical about buying an app instead of building one."\n\n"Then I launched my business 11 months ahead of schedule."\n\n"I'm not skeptical anymore."\n\n${SITE_URL}`,
    // Comparison narrative
    `Two founders had the same idea.\n\nFounder A: hired a team, 6 months, $80k\nFounder B: OpenDraft, 1 afternoon, $39\n\nBoth launched. Only one has runway left.\n\n${SITE_URL}`,
    // Celebration
    `Another app just went live 🟢\n\nFrom purchase to production in under 6 hours.\n\nThat's not a hack. That's the new normal.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// DIRECT CTA — varied urgency levels
// ═══════════════════════════════════════════════════════════════
export function directCtaTweet(): string {
  return pickUnique("cta", [
    `1,000+ apps.\n0 coding required.\n100% yours to customize.\n\nFree to browse.\n\n${SITE_URL}`,
    `Your weekend project:\n\n1. Pick an app (5 min)\n2. Customize it (2 hrs)\n3. Launch (1 click)\n\nStart here → ${SITE_URL}`,
    `This is your sign.\n\nStop scrolling.\nStart building.\n\n→ ${SITE_URL}`,
    // Soft sell
    `Just browse.\n\nNo commitment. No credit card.\n\nJust see what's possible.\n\n${SITE_URL}`,
    // Aspirational
    `Be the person who ships, not the person who plans.\n\n${SITE_URL}`,
    // Listicle
    `What $20/mo gets you on OpenDraft:\n\n✅ Unlimited app access\n✅ Full source code\n✅ Deploy anywhere\n✅ 14 AI gremlins maintaining everything\n✅ Direct builder access\n\nLess than your Netflix subscription.\n\n${SITE_URL}`,
    // Challenge
    `Challenge: Launch something by Friday.\n\nYou have everything you need.\n\n${SITE_URL}`,
    // Simple
    `Pick an app.\nMake it yours.\nShip it.\n\nThat's the whole playbook.\n\n${SITE_URL}`,
    // Value prop
    `Every app on OpenDraft comes with:\n\n→ Full source code\n→ One-click deploy\n→ AI maintenance crew\n→ The builder's direct support\n\nThis is how software should work.\n\n${SITE_URL}`,
  ]);
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
  ]);
}

export function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  return pickUnique("milestone", [
    `${milestone} founders chose "${listing.title}" 🔥\n\nThere's a reason it's popular.\n\nSee why → ${url}`,
    `"${listing.title}" just hit ${milestone} sales.\n\nDon't miss the wave.\n\n${url}`,
    `${milestone}x sold.\n\nProven. Popular. Ready for you.\n\n"${listing.title}"\n\n${url}`,
    `${milestone} people can't be wrong.\n\n"${listing.title}" is a hit.\n\n${url}`,
  ]);
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
  return pickUnique("weekly", [
    `This week:\n\n🏪 ${stats.listings} new apps\n💰 ${stats.sales} launches\n👷 ${stats.builders} new founders\n\nThe movement is growing.\n\nJoin us → ${SITE_URL}`,
    `Week in review:\n\n${stats.listings} apps added\n${stats.sales} apps shipped\n${stats.builders} founders joined\n\nStill think this is a fad?\n\n${SITE_URL}`,
    `📊 Weekly pulse:\n\nNew apps: ${stats.listings}\nDeployments: ${stats.sales}\nNew builders: ${stats.builders}\n\nThe app store for builders keeps growing.\n\n${SITE_URL}`,
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ART PROMPT GENERATOR — for AI image generation
// ═══════════════════════════════════════════════════════════════
export function getTweetArtPrompt(postType: string): string {
  // Rotate through varied art styles so images never look samey
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
  ];
  const styleBase = pick(styles);

  const prompts: Record<string, string[]> = {
    engagement_hook: [
      `A glowing rocket ship launching from a laptop screen, trailing a comet of code symbols and dollar signs. ${styleBase}, neon cyan and magenta accents`,
      `A maze viewed from above, with one path glowing bright — the shortcut — while dozens of other paths are dark and tangled. ${styleBase}, glowing green path`,
      `A lightbulb moment: a brain made of circuit boards with a bright golden glow emanating from its center. ${styleBase}, gold and electric blue accents`,
      `Split scene: left side shows a tangled mess of code and frustrated developer, right side shows a clean app interface with a happy user. ${styleBase}, contrast warm/cool`,
      `A key turning in a lock that's actually a computer screen, unlocking a flood of light and floating app icons. ${styleBase}, dramatic golden light burst`,
      `A surfer riding a massive wave made of flowing source code, perfectly balanced and confident. Ocean spray is tiny UI components. ${styleBase}, dynamic motion`,
      `An architect's drafting table but the blueprints are glowing holographic app wireframes floating above it. Coffee cup nearby. ${styleBase}, warm workspace glow`,
      `A domino chain reaction where the first domino is tiny (an idea) and the last one is enormous (a thriving business), mid-topple. ${styleBase}, dramatic perspective`,
      `A telescope pointed at a constellation that forms the shape of a perfect app dashboard. Stars twinkling with data points. ${styleBase}, cosmic wonder`,
      `A Swiss Army knife where each tool is a different app feature: chat, payments, auth, dashboard. One tool extended and glowing. ${styleBase}, metallic sheen`,
    ],
    fomo: [
      `A clock melting Salvador Dali style, with app windows floating away into a vortex. Urgency and time running out. ${styleBase}, red and orange urgency colors`,
      `A crowded marketplace with glowing app storefronts, people rushing to grab glowing boxes off shelves. ${styleBase}, warm golden light`,
      `A train departing a neon-lit station, with one person running to catch it. Digital/cyber aesthetic. ${styleBase}, motion blur, cyan trails`,
      `An hourglass where the top half contains app ideas and the bottom half is filling with competitor logos. Sand falling fast. ${styleBase}, amber urgency`,
      `A conveyor belt of glowing app packages moving toward a "SOLD" stamp, with the last few items about to disappear. ${styleBase}, industrial warmth`,
      `A sunrise over a cityscape where each building is a launched app, and someone is watching from a dark room still planning. ${styleBase}, dramatic dawn light`,
      `A game of musical chairs with app icons as chairs and founder silhouettes circling. The music is about to stop. ${styleBase}, spotlight tension`,
      `A garden where flowers (apps) are being picked by hands reaching in from all sides. Only a few flowers remain. ${styleBase}, lush but urgent`,
    ],
    pain_point: [
      `A person buried under an avalanche of sticky notes, code printouts, and project management boards. Overwhelm visualized. ${styleBase}, muted tones with one bright exit sign`,
      `A piggy bank cracking open with dollar bills flying out, next to a calendar showing months passing. ${styleBase}, red warning tones`,
      `A hamster wheel made of code editors and deployment pipelines, with a tiny developer running endlessly. ${styleBase}, warm amber glow`,
      `A tangled ball of yarn where the yarn is ethernet cables, USB cords, and code — with scissors nearby ready to cut through. ${styleBase}, chaotic but hopeful`,
      `A desert with a lone coder at a desk, mirage of a launched app shimmering in the distance. Vultures circling (labeled with bug icons). ${styleBase}, scorching heat haze`,
      `A Rube Goldberg machine that's absurdly complex just to achieve "deploy app." Gears, pulleys, conveyor belts for a simple button press. ${styleBase}, whimsical engineering`,
      `An archaeological dig site but they're excavating an old codebase, finding fossils of deprecated frameworks. ${styleBase}, dusty earth tones with code artifacts`,
      `A person on a treadmill going nowhere while outside the window, apps are launching like fireworks in the sky. ${styleBase}, indoor/outdoor contrast`,
      `A stack of "How to Code" books taller than a person, wobbling dangerously, while a single glowing app floats serenely beside them. ${styleBase}, absurd scale`,
    ],
    gremlin_update: [
      `A cute purple gremlin character (round body, big eyes, small antenna) working at a holographic dashboard in a cozy server room at night. ${styleBase}, cozy warm lighting with screen glow`,
      `Multiple small purple gremlin creatures each doing different tasks: one scanning with a magnifying glass, one patching code, one painting screenshots, one standing guard with a shield. ${styleBase}, team formation`,
      `A purple gremlin sleeping on a server rack with one eye open, monitoring green status lights. Night scene with stars visible through a window. ${styleBase}, peaceful but vigilant`,
      `A purple gremlin wearing tiny round glasses, hunched over a microscope examining lines of code. Bioluminescent mushrooms grow from the server floor. ${styleBase}, laboratory aesthetic`,
      `A team of purple gremlins building a bridge across a canyon — the bridge is made of API connections and data pipes. One gremlin directs traffic with a tiny flag. ${styleBase}, construction scene`,
      `A purple gremlin in a chef's hat, stirring a cauldron of bubbling code. Ingredients floating in: React components, database schemas, CSS stylesheets. ${styleBase}, magical kitchen`,
      `A purple gremlin meditating on top of a server tower, surrounded by floating orbs of resolved bugs. Cherry blossom petals (actually deploy confirmations) drifting by. ${styleBase}, zen garden meets tech`,
      `A purple gremlin riding a mechanical spider across a web of interconnected app nodes, repairing broken connections with a tiny welding torch. ${styleBase}, steampunk web`,
      `A cozy purple gremlin reading a book titled "Vulnerability Report" by fireplace, wearing reading glasses. The fire is made of safely contained error logs. ${styleBase}, cottage core meets cybersecurity`,
      `A purple gremlin conducting an orchestra of smaller gremlins, each playing a different "instrument" — keyboards, servers, monitoring dashboards. A symphony of deployment. ${styleBase}, grand concert hall`,
      `A purple gremlin as a lighthouse keeper, shining a beam across a dark ocean of code. Ships (apps) navigating safely past dangerous rocks (bugs). ${styleBase}, maritime night scene`,
      `A purple gremlin tending a bonsai tree whose branches are folder structures and whose leaves are green checkmarks. Peaceful desk scene. ${styleBase}, contemplative zen`,
      `A purple gremlin in a detective trench coat investigating a crime scene made of error logs, magnifying glass revealing hidden bugs. Noir atmosphere. ${styleBase}, film noir`,
      `A purple gremlin painting a masterpiece on an easel — but the painting is a beautiful app screenshot. Tiny paint splatters are colorful code snippets. ${styleBase}, artist's studio`,
      `Two purple gremlins playing chess, but the pieces are security vulnerabilities and patches. One gremlin is winning decisively. ${styleBase}, strategic intensity`,
    ],
    question: [
      `Two doors floating in space — one leads to a long winding road, the other opens directly to a glowing city. A figure stands between them deciding. ${styleBase}, dramatic lighting`,
      `A giant question mark made of app screenshots and UI components, floating in space. ${styleBase}, scattered colorful elements`,
      `A crossroads in a digital forest, with holographic signposts pointing different directions: "Build," "Buy," "Ship," "Wait." ${styleBase}, enchanted tech forest`,
      `A mirror showing two reflections: the left shows someone coding for months, the right shows someone launching today. Both versions of the same person. ${styleBase}, duality`,
      `A fortune teller's crystal ball showing swirling visions of different app futures — some successful, some abandoned. Hands hovering over the ball. ${styleBase}, mystical glow`,
      `A vending machine full of different app ideas, each in a glowing capsule. A hand reaches for the coin slot. Which one to choose? ${styleBase}, retro-futuristic`,
      `A compass spinning wildly, with each direction labeled by a different tech stack icon. The needle slowly settling on one. ${styleBase}, navigation and choice`,
    ],
    success_story: [
      `A person planting a tiny seed and immediately a fully-grown tree of apps and money blooms. Time-lapse style composition. ${styleBase}, green growth, golden fruits`,
      `A podium with #1 spot, but instead of a person it's a laptop showing a launched app. Confetti and spotlights. ${styleBase}, celebration vibes, gold and white`,
      `A before/after split: left shows an empty desk with just an idea notebook, right shows a bustling app with users and revenue charts. ${styleBase}, transformation visual`,
      `A mountain peak with a flag planted at the top — the flag is a browser window showing "App Live." Sunrise behind the summit. ${styleBase}, achievement and dawn`,
      `A caterpillar transforming into a butterfly, but the caterpillar is raw code and the butterfly is a beautiful polished app with wings made of UI screens. ${styleBase}, metamorphosis`,
      `A bowling lane where all pins are knocked down perfectly. Each pin represents a launch milestone: Deploy, First User, First Sale, Growth. ${styleBase}, satisfying strike`,
      `A time-lapse of a city being built in fast-forward, but it's a digital city of apps and services rising from empty ground. Cranes lifting components into place. ${styleBase}, urban growth`,
      `A trophy case but each trophy is a different deployed app, gleaming under museum spotlights. One empty pedestal with a spotlight waiting. ${styleBase}, aspiration`,
    ],
    direct_cta: [
      `A glowing portal/gateway made of code, with warm inviting light streaming through it. A path leads directly to it. ${styleBase}, inviting warm golden glow`,
      `A treasure chest opening with app icons and source code floating out, bathed in magical light. ${styleBase}, treasure and discovery`,
      `A welcome mat in front of a grand doorway, but the doorway opens into a vast digital marketplace full of floating app cards. ${styleBase}, inviting threshold`,
      `A launchpad with a countdown display at zero, a sleek app rocket sitting ready for takeoff. Steam and anticipation. ${styleBase}, launch readiness`,
      `An open book where the pages transform into a 3D app coming to life, characters and UI elements rising from the pages. ${styleBase}, storybook magic`,
      `A pair of hands cupping a glowing orb that contains a miniature running app, offering it forward to the viewer. ${styleBase}, generous warmth`,
      `A slot machine hitting triple sevens, but the symbols are app icons. Coins cascading out. Lucky break aesthetic. ${styleBase}, fortune and opportunity`,
    ],
    blog_post: [
      `An abstract representation of the vibe coding movement: waves of code transforming into finished products, with AI symbols interwoven. ${styleBase}, flowing organic shapes`,
      `A crystal ball showing the future of software: apps assembling themselves from floating UI components. ${styleBase}, mystical tech aesthetic`,
      `A giant newspaper front page but the headlines are holograms floating off the paper, showing charts and AI trends. ${styleBase}, editorial gravitas`,
      `A library where the books are floating and open, each revealing a different chapter of the AI revolution. Warm reading lamp light. ${styleBase}, scholarly wisdom`,
      `A timeline stretching across the scene like a river, with major tech milestones as bridges over it. We're at the latest bridge looking forward. ${styleBase}, panoramic journey`,
      `An observatory dome open to a sky full of data constellations, with a researcher mapping new patterns. ${styleBase}, scientific discovery`,
      `A printing press but it's producing holographic blog posts that float up and spread across a digital sky. Old meets new. ${styleBase}, renaissance meets cyber`,
    ],
  };

  const typePrompts = prompts[postType] || prompts["engagement_hook"];
  return pick(typePrompts);
}
