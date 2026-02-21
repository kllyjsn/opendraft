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
};

const POST_LIST = Object.values(POSTS);

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
            // Handle bold and links in text
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
