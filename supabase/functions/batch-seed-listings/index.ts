import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Category distribution targets (total = 1000) ──
// saas_tool: 300, ai_app: 200, utility: 200, landing_page: 100, game: 100, other: 100
const CATEGORY_CONFIGS: Record<string, { target: number; themes: string[] }> = {
  saas_tool: {
    target: 300,
    themes: [
      "CRM", "project management", "invoicing", "HR management", "inventory tracking",
      "email marketing", "customer support ticketing", "appointment scheduling", "subscription billing",
      "team collaboration", "time tracking", "analytics dashboard", "document signing",
      "social media management", "expense tracking", "lead generation", "survey builder",
      "helpdesk", "knowledge base", "workflow automation", "employee onboarding",
      "payroll management", "contract management", "event management", "fleet management",
      "property management", "restaurant POS", "salon booking", "gym management",
      "school administration", "clinic management", "veterinary practice", "legal case management",
      "real estate listing", "job board", "freelancer marketplace", "rental marketplace",
      "food delivery dashboard", "warehouse management", "supply chain tracking",
      "quality assurance", "compliance management", "risk assessment", "audit management",
      "vendor management", "procurement", "asset tracking", "maintenance scheduling",
      "field service management", "dispatch management", "route optimization",
      "customer feedback", "NPS survey", "A/B testing", "feature flagging",
      "error tracking", "uptime monitoring", "log management", "API gateway",
      "webhook management", "notification center", "chat widget", "video conferencing",
      "screen recording", "file sharing", "password manager", "VPN dashboard",
      "DNS management", "SSL certificate manager", "CDN dashboard", "cloud cost optimizer",
      "database admin panel", "CI/CD pipeline", "code review", "sprint planning",
      "OKR tracker", "meeting scheduler", "standup bot", "retrospective board",
      "design system manager", "component library", "icon pack manager", "font manager",
      "color palette generator", "brand kit", "press release manager", "media monitoring",
      "influencer management", "affiliate tracking", "referral program", "loyalty rewards",
      "gift card manager", "coupon engine", "pricing optimizer", "revenue analytics",
      "churn prediction", "customer health score", "account management", "sales pipeline",
      "quote generator", "proposal builder", "e-signature", "document template",
      "mail merge", "form builder", "quiz maker", "poll creator",
      "webinar platform", "course builder", "LMS admin", "student portal",
    ],
  },
  ai_app: {
    target: 200,
    themes: [
      "AI writing assistant", "image generator", "code copilot", "chatbot builder",
      "voice transcription", "text-to-speech", "sentiment analysis", "content summarizer",
      "AI resume builder", "AI logo maker", "AI photo editor", "AI music composer",
      "AI recipe generator", "AI fitness coach", "AI language tutor", "AI story writer",
      "AI presentation maker", "AI email composer", "AI meeting notes", "AI data analyst",
      "AI customer service bot", "AI product description writer", "AI social media poster",
      "AI SEO optimizer", "AI ad copy generator", "AI video editor", "AI podcast editor",
      "AI document analyzer", "AI contract reviewer", "AI code reviewer",
      "AI diagram generator", "AI flowchart maker", "AI wireframe generator",
      "AI color scheme generator", "AI font pairing tool", "AI accessibility checker",
      "AI translation hub", "AI grammar checker", "AI plagiarism detector",
      "AI citation generator", "AI bibliography maker", "AI research assistant",
      "AI flashcard generator", "AI quiz generator", "AI study planner",
      "AI meal planner", "AI workout generator", "AI meditation guide",
      "AI dream journal analyzer", "AI mood tracker", "AI habit recommender",
      "AI budget advisor", "AI investment analyzer", "AI tax assistant",
      "AI travel planner", "AI itinerary builder", "AI packing list generator",
      "AI interior designer", "AI garden planner", "AI pet care advisor",
      "AI baby name generator", "AI gift recommender", "AI event planner",
      "AI speech writer", "AI debate assistant", "AI negotiation coach",
      "AI interview prep", "AI cover letter writer", "AI LinkedIn optimizer",
      "MCP server builder", "AI agent orchestrator", "AI pipeline designer",
      "AI prompt library", "AI model comparator", "AI fine-tuning dashboard",
      "AI dataset curator", "AI annotation tool", "AI benchmark runner",
      "RAG knowledge base", "AI vector search", "AI embedding visualizer",
    ],
  },
  utility: {
    target: 200,
    themes: [
      "markdown editor", "JSON formatter", "regex tester", "color picker",
      "unit converter", "QR code generator", "barcode scanner", "image compressor",
      "PDF merger", "screenshot tool", "clipboard manager", "bookmark manager",
      "password generator", "hash calculator", "base64 encoder", "URL shortener",
      "IP lookup", "DNS lookup", "SSL checker", "port scanner",
      "speed test", "ping tool", "traceroute viewer", "network monitor",
      "system dashboard", "process manager", "disk analyzer", "memory profiler",
      "CPU monitor", "GPU dashboard", "battery tracker", "temperature monitor",
      "file diff viewer", "code beautifier", "minifier", "linter dashboard",
      "dependency checker", "license scanner", "changelog generator", "release notes builder",
      "migration tool", "database diff", "schema visualizer", "ER diagram generator",
      "API tester", "GraphQL playground", "WebSocket tester", "gRPC client",
      "cron expression builder", "date calculator", "timezone converter", "epoch converter",
      "lorem ipsum generator", "fake data generator", "UUID generator", "token generator",
      "JWT decoder", "OAuth tester", "SAML debugger", "CORS tester",
      "HTTP header inspector", "cookie manager", "local storage viewer", "IndexedDB browser",
      "SVG optimizer", "image resizer", "favicon generator", "sprite sheet maker",
      "CSS gradient generator", "box shadow generator", "border radius previewer",
      "flexbox playground", "grid layout builder", "animation editor", "keyframe generator",
      "font previewer", "icon search", "emoji picker", "unicode lookup",
      "character counter", "word counter", "reading time calculator", "readability scorer",
      "sitemap generator", "robots.txt builder", "meta tag generator", "OG image previewer",
      "structured data tester", "page speed checker", "lighthouse runner", "accessibility auditor",
      "contrast checker", "screen reader simulator", "keyboard navigation tester",
      "responsive preview", "device emulator", "browser compatibility checker",
      "Git command builder", "SSH key generator", "env file manager", "dotfile editor",
      "terminal emulator", "command palette", "snippet manager", "text expander",
    ],
  },
  landing_page: {
    target: 100,
    themes: [
      "SaaS startup", "mobile app launch", "product launch", "agency portfolio",
      "freelancer portfolio", "photographer portfolio", "designer portfolio", "developer portfolio",
      "restaurant website", "cafe website", "bakery website", "food truck website",
      "fitness studio", "yoga studio", "dance studio", "martial arts school",
      "real estate agency", "architecture firm", "interior design studio", "construction company",
      "law firm", "accounting firm", "consulting firm", "marketing agency",
      "dental clinic", "medical practice", "therapy practice", "veterinary clinic",
      "non-profit organization", "charity fundraiser", "crowdfunding campaign", "Kickstarter page",
      "event conference", "music festival", "wedding planner", "birthday party",
      "online course", "ebook launch", "newsletter signup", "waitlist page",
      "coming soon page", "maintenance page", "404 error page", "thank you page",
      "pricing page", "comparison page", "testimonial page", "case study page",
      "podcast website", "YouTube channel", "Twitch streamer", "content creator",
      "fashion brand", "beauty brand", "skincare brand", "supplement brand",
      "tech gadget", "smart home device", "wearable device", "drone company",
      "electric vehicle", "solar energy", "sustainable fashion", "eco-friendly product",
      "crypto project", "NFT collection", "DeFi protocol", "Web3 startup",
      "gaming studio", "esports team", "board game", "indie game",
      "music artist", "band website", "record label", "music school",
      "travel agency", "hotel website", "hostel website", "vacation rental",
      "pet store", "plant nursery", "bookstore", "art gallery",
      "coworking space", "virtual office", "startup incubator", "VC fund",
      "personal blog", "tech blog", "food blog", "travel blog",
      "resume website", "link in bio page", "digital business card", "QR landing page",
    ],
  },
  game: {
    target: 100,
    themes: [
      "trivia quiz", "word puzzle", "crossword", "sudoku",
      "memory match", "card matching", "Simon says", "pattern recognition",
      "typing speed test", "reaction time test", "aim trainer", "rhythm game",
      "snake game", "Tetris clone", "Pong clone", "Breakout clone",
      "Flappy Bird clone", "2048 clone", "Minesweeper clone", "Solitaire",
      "chess", "checkers", "Go", "Othello",
      "tic-tac-toe", "Connect Four", "Battleship", "Hangman",
      "word search", "anagram solver", "Scrabble helper", "Wordle clone",
      "math puzzle", "number guessing", "dice roller", "coin flip",
      "slot machine", "roulette wheel", "blackjack", "poker hand evaluator",
      "RPG character creator", "dungeon crawler", "text adventure", "choose your adventure",
      "idle clicker", "incremental game", "tycoon game", "resource manager",
      "tower defense", "castle defense", "plant defense", "space defender",
      "platformer", "endless runner", "side scroller", "gravity game",
      "maze generator", "labyrinth runner", "escape room", "puzzle box",
      "color mixing game", "pixel art painter", "drawing guesser", "art quiz",
      "geography quiz", "flag quiz", "capital cities quiz", "map explorer",
      "music quiz", "movie quiz", "celebrity quiz", "history quiz",
      "cooking game", "farming sim", "pet simulator", "aquarium sim",
      "space explorer", "asteroid shooter", "galaxy defender", "lunar lander",
      "racing game", "car customizer", "drift simulator", "parking challenge",
      "fishing game", "hunting sim", "bird watching", "bug catcher",
      "fantasy sports", "bracket predictor", "score tracker", "league manager",
      "multiplayer lobby", "turn-based strategy", "real-time strategy", "card battle",
    ],
  },
  other: {
    target: 100,
    themes: [
      "personal diary", "gratitude journal", "habit tracker", "mood logger",
      "meditation timer", "breathing exercise", "sleep tracker", "dream journal",
      "recipe organizer", "meal prep planner", "grocery list", "pantry manager",
      "workout log", "running tracker", "cycling tracker", "swimming log",
      "book tracker", "reading list", "movie watchlist", "music playlist manager",
      "travel journal", "bucket list", "goal tracker", "vision board",
      "budget tracker", "expense splitter", "tip calculator", "mortgage calculator",
      "wedding planner", "baby milestone tracker", "pet health tracker", "plant care tracker",
      "home inventory", "moving checklist", "cleaning schedule", "maintenance log",
      "car maintenance log", "fuel tracker", "mileage logger", "parking finder",
      "weather dashboard", "tide tracker", "sunrise/sunset calculator", "moon phase tracker",
      "astrology chart", "tarot reader", "fortune cookie generator", "magic 8-ball",
      "white noise generator", "ambient sound mixer", "rain sounds", "focus music player",
      "pomodoro timer", "study tracker", "flashcard app", "spaced repetition",
      "vocabulary builder", "language exchange", "pen pal finder", "cultural exchange",
      "volunteer finder", "donation tracker", "community board", "neighborhood watch",
      "lost and found", "garage sale organizer", "swap meet", "barter exchange",
      "time capsule", "memory album", "family tree builder", "ancestry tracker",
      "birthday reminder", "anniversary tracker", "gift registry", "wish list",
      "secret Santa generator", "team picker", "random name drawer", "wheel spinner",
      "countdown timer", "stopwatch", "world clock", "alarm clock",
      "calendar app", "daily planner", "weekly agenda", "monthly overview",
      "note taking app", "sticky notes", "kanban board", "mind map",
      "brainstorm tool", "idea journal", "writing prompt generator", "creative writing helper",
      "podcast listener", "audiobook player", "news reader", "RSS feed aggregator",
    ],
  },
};

const TECH_STACKS: Record<string, string[][]> = {
  saas_tool: [
    ["React", "TypeScript", "Tailwind CSS", "Supabase"],
    ["React", "TypeScript", "Tailwind CSS", "Stripe"],
    ["React", "TypeScript", "Shadcn/UI", "PostgreSQL"],
    ["React", "TypeScript", "Recharts", "Supabase"],
    ["React", "TypeScript", "Tailwind CSS", "Firebase"],
    ["React", "TypeScript", "TanStack Query", "Supabase"],
    ["React", "TypeScript", "Zustand", "Tailwind CSS"],
    ["React", "TypeScript", "Radix UI", "Prisma"],
  ],
  ai_app: [
    ["React", "TypeScript", "OpenAI API", "Tailwind CSS"],
    ["React", "TypeScript", "Gemini API", "Supabase"],
    ["React", "TypeScript", "Anthropic API", "Tailwind CSS"],
    ["React", "TypeScript", "LangChain", "Pinecone"],
    ["React", "TypeScript", "Hugging Face", "Tailwind CSS"],
    ["React", "TypeScript", "Vercel AI SDK", "Supabase"],
    ["React", "TypeScript", "Replicate", "Tailwind CSS"],
    ["React", "TypeScript", "Stable Diffusion", "Supabase"],
  ],
  utility: [
    ["React", "TypeScript", "Tailwind CSS", "Vite"],
    ["React", "TypeScript", "Monaco Editor", "Tailwind CSS"],
    ["React", "TypeScript", "CodeMirror", "Tailwind CSS"],
    ["React", "TypeScript", "D3.js", "Tailwind CSS"],
    ["React", "TypeScript", "Tailwind CSS", "Web APIs"],
    ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
  ],
  landing_page: [
    ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    ["React", "TypeScript", "Tailwind CSS", "GSAP"],
    ["React", "TypeScript", "Tailwind CSS", "Three.js"],
    ["React", "TypeScript", "Shadcn/UI", "Framer Motion"],
  ],
  game: [
    ["React", "TypeScript", "Canvas API", "Tailwind CSS"],
    ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
    ["React", "TypeScript", "PixiJS", "Tailwind CSS"],
    ["React", "TypeScript", "Phaser", "Tailwind CSS"],
    ["React", "TypeScript", "WebGL", "Tailwind CSS"],
    ["React", "TypeScript", "Howler.js", "Tailwind CSS"],
  ],
  other: [
    ["React", "TypeScript", "Tailwind CSS", "LocalStorage"],
    ["React", "TypeScript", "Tailwind CSS", "IndexedDB"],
    ["React", "TypeScript", "Tailwind CSS", "Supabase"],
    ["React", "TypeScript", "Chart.js", "Tailwind CSS"],
    ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
  ],
};

const COMPLETENESS: Array<"prototype" | "mvp" | "production_ready"> = [
  "prototype", "prototype", "mvp", "mvp", "mvp", "production_ready",
];

function generateBrandName(theme: string): string {
  const prefixes = [
    "Nova", "Flux", "Pulse", "Drift", "Bloom", "Spark", "Vibe", "Glow",
    "Wave", "Bolt", "Haze", "Mint", "Peak", "Dash", "Fuse", "Snap",
    "Edge", "Core", "Sync", "Loop", "Nest", "Helm", "Arch", "Axis",
    "Base", "Cast", "Grid", "Link", "Node", "Port", "Rack", "Slot",
    "Tier", "Unit", "Wrap", "Zinc", "Alto", "Brio", "Coda", "Dune",
    "Echo", "Fern", "Glen", "Halo", "Isle", "Jade", "Kite", "Lux",
    "Mesa", "Neon", "Opal", "Pine", "Quill", "Reed", "Sage", "Teal",
    "Umber", "Vale", "Wren", "Xeno", "Yew", "Zest", "Aero", "Bliss",
    "Clay", "Dawn", "Elm", "Frost", "Gem", "Hex", "Ink", "Joy",
  ];
  const suffixes = [
    "Hub", "Lab", "Kit", "Pro", "App", "AI", "IO", "Box",
    "Pad", "Tab", "Zen", "Max", "Go", "Up", "On", "Ly",
    "er", "ify", "ize", "ful", "Flow", "Sync", "Wave", "Base",
    "Cloud", "Desk", "Mind", "Craft", "Works", "Space", "Stack", "Forge",
    "Deck", "Board", "Track", "Mate", "Scout", "Vault", "Wire", "Pixel",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${suffix}`;
}

function generateDescription(name: string, theme: string, category: string): string {
  const intros = [
    `${name} is a modern, beautifully designed ${theme} built with React and TypeScript.`,
    `A sleek, production-grade ${theme} application. ${name} delivers a premium user experience.`,
    `${name} brings a fresh approach to ${theme} with a clean, intuitive interface.`,
    `Ship faster with ${name} — a ready-to-deploy ${theme} built on modern web standards.`,
    `${name} is a full-featured ${theme} with responsive design and dark mode support.`,
    `A polished ${theme} application built for scale. ${name} includes everything you need to launch.`,
  ];
  const features = [
    "Features responsive design, dark mode, and smooth animations.",
    "Includes authentication, data persistence, and real-time updates.",
    "Built with accessibility in mind and optimized for performance.",
    "Ships with deploy configs for Netlify and Vercel out of the box.",
    "Clean codebase with TypeScript, Zod validation, and proper error handling.",
    "Fully customizable with Tailwind CSS and shadcn/ui components.",
  ];
  const ctas = [
    "Clone it, customize it, and launch in minutes.",
    "Ready to deploy on your own infrastructure today.",
    "Own the source code. Make it yours.",
    "Perfect starting point for your next product.",
    "Skip months of development — start shipping now.",
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];
  const feature = features[Math.floor(Math.random() * features.length)];
  const cta = ctas[Math.floor(Math.random() * ctas.length)];
  return `${intro} ${feature} ${cta}`;
}

function generatePrice(category: string, completeness: string): number {
  // ~40% free, rest paid with varying ranges
  if (Math.random() < 0.4) return 0;
  const ranges: Record<string, [number, number]> = {
    prototype: [0, 1500],
    mvp: [500, 4000],
    production_ready: [2000, 9900],
  };
  const [min, max] = ranges[completeness] || [0, 3000];
  // Round to nearest 100 cents
  return Math.round((min + Math.random() * (max - min)) / 100) * 100;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");
        if (!roles?.length) {
          return new Response(JSON.stringify({ error: "Admin only" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 100, 200);
    const sellerId = body.seller_id;

    if (!sellerId) {
      return new Response(JSON.stringify({ error: "seller_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing counts per category
    const { data: existingCounts } = await supabaseAdmin
      .from("listings")
      .select("category")
      .eq("status", "live");

    const currentCounts: Record<string, number> = {};
    for (const row of existingCounts || []) {
      currentCounts[row.category] = (currentCounts[row.category] || 0) + 1;
    }

    // Get existing titles to avoid duplicates
    const { data: existingTitles } = await supabaseAdmin
      .from("listings")
      .select("title");
    const titleSet = new Set((existingTitles || []).map((t) => t.title.toLowerCase()));

    // Build listings to insert, distributed across categories
    const listings: any[] = [];
    const usedNames = new Set<string>();
    let remaining = batchSize;

    const categories = Object.keys(CATEGORY_CONFIGS);
    // Calculate how many each category needs proportionally
    const totalNeeded = 1000;
    
    for (const cat of categories) {
      if (remaining <= 0) break;
      const config = CATEGORY_CONFIGS[cat];
      const current = currentCounts[cat] || 0;
      const needed = Math.max(0, config.target - current);
      const batch = Math.min(needed, Math.ceil(remaining * (needed / Math.max(1, categories.reduce((sum, c) => sum + Math.max(0, CATEGORY_CONFIGS[c].target - (currentCounts[c] || 0)), 0)))));
      const actualBatch = Math.min(batch, remaining, config.themes.length);

      // Shuffle themes
      const shuffled = [...config.themes].sort(() => Math.random() - 0.5);

      for (let i = 0; i < actualBatch && i < shuffled.length; i++) {
        const theme = shuffled[i];
        let name = generateBrandName(theme);
        let attempts = 0;
        while ((usedNames.has(name.toLowerCase()) || titleSet.has(name.toLowerCase())) && attempts < 20) {
          name = generateBrandName(theme);
          attempts++;
        }
        if (usedNames.has(name.toLowerCase()) || titleSet.has(name.toLowerCase())) continue;

        usedNames.add(name.toLowerCase());
        const completeness = COMPLETENESS[Math.floor(Math.random() * COMPLETENESS.length)];
        const techStacks = TECH_STACKS[cat] || TECH_STACKS.utility;
        const techStack = techStacks[Math.floor(Math.random() * techStacks.length)];
        const price = generatePrice(cat, completeness);

        listings.push({
          title: name,
          description: generateDescription(name, theme, cat),
          price,
          pricing_type: "one_time",
          category: cat,
          completeness_badge: completeness,
          tech_stack: techStack,
          screenshots: [],
          seller_id: sellerId,
          status: "live",
          built_with: "lovable",
          sales_count: Math.floor(Math.random() * 8),
          view_count: Math.floor(Math.random() * 50) + 5,
        });
        remaining--;
      }
    }

    // Insert in chunks of 50
    let inserted = 0;
    for (let i = 0; i < listings.length; i += 50) {
      const chunk = listings.slice(i, i + 50);
      const { error } = await supabaseAdmin.from("listings").insert(chunk);
      if (error) {
        console.error("Insert error:", error);
        return new Response(JSON.stringify({ error: error.message, inserted }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += chunk.length;
    }

    // Return summary
    const summary: Record<string, number> = {};
    for (const l of listings) {
      summary[l.category] = (summary[l.category] || 0) + 1;
    }

    return new Response(JSON.stringify({
      success: true,
      inserted,
      distribution: summary,
      total_existing: (existingCounts || []).length,
      new_total: (existingCounts || []).length + inserted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Batch seed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
