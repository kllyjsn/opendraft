import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  content: string[];
}

const POSTS: Record<string, BlogPost> = {
  "what-is-vibe-coding": {
    slug: "what-is-vibe-coding",
    title: "What Is Vibe Coding? The Complete Guide for 2026",
    description: "Vibe coding is the practice of using AI tools like Lovable, Cursor, and Bolt to build software through natural language prompts. Here's everything you need to know.",
    date: "2026-02-20",
    readTime: "5 min read",
    content: [
      "## What Is Vibe Coding?",
      "Vibe coding is a new approach to software development where you describe what you want in natural language, and an AI tool writes the code for you. Instead of manually writing every line, you 'vibe' with an AI pair programmer — iterating through prompts, feedback, and refinements until the app matches your vision.",
      "The term was coined in early 2025 and has since exploded in popularity as AI coding tools have become genuinely capable of producing production-quality software.",
      "## How Does Vibe Coding Work?",
      "You start with an idea — 'build me a SaaS dashboard with user auth and Stripe billing' — and feed it to an AI coding tool. The tool generates the codebase, which you then review, tweak, and deploy. The best vibe coders iterate rapidly, treating the AI as a junior developer they're pair-programming with.",
      "Popular vibe coding tools include **Lovable** (full-stack web apps), **Cursor** (AI-enhanced code editor), **Bolt** (rapid prototyping), **Claude Code** (Anthropic's coding assistant), and **Replit** (collaborative AI development).",
      "## Why Vibe Coding Matters",
      "Vibe coding has democratized software development. People who never wrote a line of code are now shipping functional SaaS tools, landing pages, and AI apps. For experienced developers, it's a massive productivity multiplier — what used to take weeks now takes hours.",
      "This has created an entirely new economy: a marketplace of AI-built projects that can be bought, sold, and maintained. That's exactly what OpenDraft is — a marketplace where vibe-coded projects find their buyers.",
      "## The Future of Vibe Coding",
      "As AI models improve, the line between 'vibe-coded' and 'hand-coded' software will blur completely. The value will shift from writing code to understanding problems, designing solutions, and maintaining software over time. Builders who master this skill now are positioning themselves for the future of software.",
    ],
  },
  "best-ai-coding-tools-2026": {
    slug: "best-ai-coding-tools-2026",
    title: "The 6 Best AI Coding Tools in 2026",
    description: "A comparison of the top AI coding tools for building apps: Lovable, Cursor, Claude Code, Bolt, Replit, and more. Find the right tool for your project.",
    date: "2026-02-19",
    readTime: "6 min read",
    content: [
      "## The Best AI Coding Tools for Building Apps",
      "The AI coding tool landscape has matured significantly. Here's how the top tools compare for different use cases.",
      "### 1. Lovable",
      "**Best for:** Full-stack web apps with backend. Lovable generates complete React + Supabase apps from natural language prompts. It handles auth, database, edge functions, and deployment — making it ideal for SaaS tools and marketplaces. Projects built with Lovable are the most popular on OpenDraft.",
      "### 2. Cursor",
      "**Best for:** Developers who want AI-enhanced coding. Cursor is a fork of VS Code with deeply integrated AI assistance. It's great for experienced developers who want to move faster while maintaining full control over the codebase.",
      "### 3. Claude Code",
      "**Best for:** Complex reasoning and code generation. Anthropic's Claude Code excels at understanding nuanced requirements and generating well-structured code. It's particularly strong for backend logic and data processing.",
      "### 4. Bolt",
      "**Best for:** Rapid prototyping. Bolt is designed for speed — you can go from idea to working prototype in minutes. Great for validating ideas quickly, though the output may need more polish for production.",
      "### 5. Replit",
      "**Best for:** Collaborative development. Replit's AI features are built into a collaborative coding environment, making it easy to build and deploy apps with a team.",
      "### 6. Windsurf",
      "**Best for:** AI-native IDE experience. Windsurf offers a purpose-built IDE with deep AI integration for code generation, refactoring, and debugging.",
      "## Which Tool Should You Use?",
      "If you're building a full web app with backend needs, start with **Lovable**. If you're a developer who wants AI assistance in your existing workflow, try **Cursor**. If you need rapid prototyping, go with **Bolt**. And once you've built something great, [list it on OpenDraft](/sell) to start earning.",
    ],
  },
  "monetize-side-project": {
    slug: "monetize-side-project",
    title: "How to Monetize Your Side Project in 2026",
    description: "Stop letting side projects collect dust. Here's how to turn your AI-built app into recurring revenue by selling it as a subscription service.",
    date: "2026-02-18",
    readTime: "4 min read",
    content: [
      "## Your Side Project Is Worth Money",
      "You built something cool over the weekend. Maybe it's a habit tracker, a client portal, or an AI-powered tool. It works. It solves a real problem. And then... it sits on your GitHub collecting dust.",
      "Here's the thing: someone out there needs exactly what you built. They don't have the skills or time to build it themselves, and they'd happily pay $20/month for a working solution with support.",
      "## The Subscription Model Changes Everything",
      "Selling code as a one-time download is a race to the bottom. But selling ongoing support, maintenance, and feature development? That's a service — and services command premium prices.",
      "When someone subscribes to your project on OpenDraft, they're not buying a ZIP file. They're buying **peace of mind**: the knowledge that a developer is maintaining their app, fixing bugs, and shipping improvements. You become their developer on retainer.",
      "## How to Price Your Project",
      "The sweet spot for subscriptions is **$15–$30/month**. At this price point, buyers see it as a no-brainer compared to hiring a developer ($50–$200/hour). And for you, 10 subscribers at $20/month = $200/month in recurring revenue — from a project you already built.",
      "One-time purchases work too, typically priced at **$49–$199** depending on completeness. But subscriptions build long-term income.",
      "## Getting Your First Sale",
      "1. **Polish your listing** — great screenshots, clear description, live demo\n2. **Share on Twitter/X** — the vibe coding community is active and supportive\n3. **Post on relevant subreddits** — r/SideProject, r/SaaS, r/webdev\n4. **Respond fast** — when someone messages you about your project, reply within hours",
      "## Start Now",
      "The best time to list your project was yesterday. The second best time is now. [Create your listing on OpenDraft](/sell) and start turning your side project into income.",
    ],
  },
  "best-ai-apps-to-buy-2026": {
    slug: "best-ai-apps-to-buy-2026",
    title: "The Best AI Apps to Buy in 2026: Ready-Made Solutions",
    description: "Why build from scratch when you can buy a working AI app? Here are the most popular categories of AI-built apps available on marketplaces like OpenDraft.",
    date: "2026-02-17",
    readTime: "5 min read",
    content: [
      "## Why Buy an AI-Built App?",
      "Building software from scratch — even with AI tools — still takes time. You need to set up auth, payments, databases, and deployment. What if you could skip all that and get a working app for less than the cost of a dinner out?",
      "That's the promise of AI app marketplaces like OpenDraft. Builders create polished, working apps and sell them — either as one-time purchases or monthly subscriptions with ongoing support.",
      "## Top Categories of AI Apps Worth Buying",
      "### SaaS Dashboards",
      "The most popular category. Admin panels, analytics dashboards, client portals — these are time-consuming to build from scratch but incredibly useful. On OpenDraft, you can find production-ready dashboards starting at **$29** with features like auth, role management, and Stripe integration already wired up.",
      "### AI-Powered Tools",
      "Content generators, image processors, chatbot builders, data analyzers — AI tools are the fastest-growing category. These often come with API integrations already configured, saving you hours of setup.",
      "### Landing Pages & Marketing Sites",
      "Need a high-converting landing page? Buying a pre-built one with proven design patterns, SEO optimization, and responsive design is far more cost-effective than hiring a designer. Prices typically range from **$15–$49**.",
      "### Internal Tools & Utilities",
      "Invoice generators, inventory trackers, scheduling apps, CRM tools — these \"boring\" utilities are often the highest-value purchases because they solve immediate business problems.",
      "## What to Look For",
      "When buying an AI-built app, look for these signals:\n- **Production Ready badge** — the app has been tested and polished\n- **Active builder** — the seller responds to messages and ships updates\n- **Demo URL** — you can try before you buy\n- **Tech stack transparency** — know what you're getting\n- **Reviews from other buyers** — social proof matters",
      "## The Bottom Line",
      "Buying an AI-built app is the fastest way to go from idea to working product. Browse [OpenDraft's marketplace](/) to find your next tool.",
    ],
  },
  "how-to-price-your-side-project": {
    slug: "how-to-price-your-side-project",
    title: "How to Price Your Side Project: A Data-Driven Guide",
    description: "Pricing your app wrong leaves money on the table. Here's a framework for setting the right price — whether you're selling one-time or as a subscription.",
    date: "2026-02-16",
    readTime: "5 min read",
    content: [
      "## The Pricing Problem",
      "Most indie developers underprice their work. They look at how much time they spent building (a weekend) and price accordingly ($10). But buyers don't care about your time — they care about the **value** your app provides.",
      "A client portal that saves a freelancer 5 hours per month is worth far more than $10. At $50/hour saved, that's $250/month in value. Charging $20/month for it is a steal for the buyer and great recurring revenue for you.",
      "## The Pricing Framework",
      "### Step 1: Identify the Value",
      "Ask yourself: What does my app help someone achieve? How much time or money does it save them? What would they pay for an alternative solution (hiring a developer, using a SaaS tool with a monthly fee)?",
      "### Step 2: Choose Your Model",
      "**One-time purchase ($29–$199):** Best for tools the buyer will customize heavily. They get the code, fork it, and make it their own. Price higher for production-ready apps with auth, payments, and deployment.\n\n**Monthly subscription ($15–$30/month):** Best for apps where the buyer wants ongoing support, updates, and maintenance. This is where the real money is — 20 subscribers at $20/month = $400/month recurring.",
      "### Step 3: Position Against Alternatives",
      "Your competition isn't other apps on OpenDraft. It's:\n- Hiring a freelancer ($50–$200/hour)\n- Building it themselves (10–40 hours of their time)\n- Existing SaaS tools ($30–$100/month)\n\nPrice at 30–50% of the cheapest alternative and you'll convert.",
      "### Step 4: Test and Iterate",
      "Start at a price you're comfortable with. If you're getting views but no sales, try lowering the price or adding a live demo. If you're selling easily, raise the price — you were underpriced.",
      "## Common Mistakes",
      "**Pricing at $5–$10:** Signals low quality. Buyers assume something that cheap isn't worth their time.\n\n**No demo:** Buyers can't evaluate without seeing the app. Always include a demo URL.\n\n**One price for everything:** Consider offering tiers — basic (code only) and premium (code + setup support + feature requests).",
      "## Start Listing",
      "Ready to price and sell your project? [Create your listing on OpenDraft](/sell) and start earning what your work is truly worth.",
    ],
  },
  "vibe-coding-vs-traditional-development": {
    slug: "vibe-coding-vs-traditional-development",
    title: "Vibe Coding vs Traditional Development: A Honest Comparison",
    description: "Is vibe coding replacing traditional software development? Here's an honest look at where AI-assisted coding shines — and where it falls short.",
    date: "2026-02-15",
    readTime: "6 min read",
    content: [
      "## The Debate",
      "Every tech community is having the same argument: \"AI will replace developers\" vs \"AI is just a tool.\" The truth, as usual, is more nuanced. Let's break down where vibe coding excels and where traditional development still wins.",
      "## Where Vibe Coding Wins",
      "### Speed to MVP",
      "Nothing beats vibe coding for going from idea to working prototype. What used to take 2–4 weeks can now happen in a single afternoon. For founders validating ideas, freelancers building client projects, and indie hackers shipping side projects — this speed advantage is transformational.",
      "### Accessibility",
      "Non-developers can now build real software. Product managers, designers, marketers — anyone who can clearly articulate what they want can create working apps. This isn't a toy-level change; we're seeing production SaaS tools built entirely through AI prompts.",
      "### Boilerplate Elimination",
      "Authentication, CRUD operations, API integrations, payment processing — these are solved problems that AI handles exceptionally well. Traditional development requires writing (or copying) the same patterns repeatedly. AI tools generate them perfectly every time.",
      "## Where Traditional Development Still Wins",
      "### Complex Business Logic",
      "Multi-step workflows, complex state machines, intricate authorization rules — these still benefit from careful human design. AI can generate the code, but a senior developer's architectural decisions around these systems produce more maintainable results.",
      "### Performance-Critical Systems",
      "Real-time systems, high-throughput data pipelines, and performance-sensitive applications need careful optimization that AI doesn't prioritize. A human developer with profiling tools will still outperform AI-generated code for these edge cases.",
      "### Large Codebase Maintenance",
      "AI excels at creating new code but can struggle with understanding and modifying large, interconnected codebases. For enterprise-scale applications with millions of lines of code, traditional development practices (code reviews, testing, documentation) remain essential.",
      "## The Sweet Spot",
      "The most productive approach in 2026 is **hybrid**: use AI to handle the 80% of work that's pattern-based (UI components, API routes, database queries), then apply traditional development skills to the 20% that requires architectural thinking and optimization.",
      "Builders who embrace this hybrid approach are the ones thriving on OpenDraft — they use AI tools to build fast, then apply their expertise to polish, optimize, and maintain their projects for paying customers.",
      "## The Real Question",
      "It's not \"will AI replace developers?\" It's \"how quickly can you learn to work with AI?\" The builders who answer that question fastest are already [selling their projects](/sell) and building recurring revenue streams.",
    ],
  },
};

const POST_LIST = Object.values(POSTS).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function BlogIndex() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/blog" />

      <section className="border-b border-border bg-card/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Blog</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Insights for Builders
          </h1>
          <p className="text-muted-foreground text-lg">
            Guides, trends, and strategies for the vibe coding economy.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <div className="space-y-6">
          {POST_LIST.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block rounded-2xl border border-border/60 bg-card p-6 shadow-card hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? POSTS[slug] : undefined;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🤔</div>
            <h2 className="text-xl font-bold mb-2">Post not found</h2>
            <Link to="/blog"><Button>Back to blog</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path={`/blog/${post.slug}`} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        author: { "@type": "Organization", name: "OpenDraft" },
        publisher: { "@type": "Organization", name: "OpenDraft", url: "https://opendraft.co" },
        url: `https://opendraft.co/blog/${post.slug}`,
      }} />

      <article className="container mx-auto px-4 py-14 max-w-2xl">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{post.description}</p>

        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          {post.content.map((block, i) => {
            if (block.startsWith("## ")) {
              return <h2 key={i} className="text-2xl font-black mt-10 mb-4">{block.replace("## ", "")}</h2>;
            }
            if (block.startsWith("### ")) {
              return <h3 key={i} className="text-lg font-black mt-8 mb-3">{block.replace("### ", "")}</h3>;
            }
            const parts = block.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
            return (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                  if (linkMatch) {
                    return <Link key={j} to={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</Link>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </p>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h3 className="text-xl font-black mb-2">Ready to join the marketplace?</h3>
          <p className="text-sm text-muted-foreground mb-5">Browse projects or list your own.</p>
          <div className="flex justify-center gap-3">
            <Link to="/">
              <Button variant="outline">Browse Projects</Button>
            </Link>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">Start Selling</Button>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}

export { BlogIndex, BlogPost };
