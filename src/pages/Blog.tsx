import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Clock, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BlogInlineCTA } from "@/components/BlogInlineCTA";
import { motion, useScroll, useSpring } from "framer-motion";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  content: string[];
}

const POSTS: Record<string, BlogPost> = {
  "autonomous-revenue-zero-employees": {
    slug: "autonomous-revenue-zero-employees",
    title: "We Hit $10K ARR With Zero Employees — Here's How",
    description: "OpenDraft runs on AI agents, cron jobs, and automation. No customer support team, no marketing department, no operations staff. Here's the exact system.",
    date: "2026-03-05",
    readTime: "8 min read",
    category: "Behind the Build",
    content: [
      "## The Zero-Employee Marketplace",
      "OpenDraft generates revenue with zero full-time employees. Not \"lean.\" Not \"bootstrapped with a small team.\" Zero. Every operational function — from listing moderation to social media to site monitoring — is handled by autonomous systems.",
      "This isn't a flex. It's a thesis: **the next wave of profitable startups will run on automation, not headcount.**",
      "## The Architecture of Autonomy",
      "Here's what runs OpenDraft every day without human intervention:",
      "### Revenue Automation\nStripe webhooks process payments. Edge functions handle checkout sessions, record purchases, split payouts to sellers via Connect, and update analytics — all triggered by events, not people. When a seller hits a sales milestone (5, 10, 25, 50, 100), the system auto-posts a celebration tweet to X.",
      "### Content Engine\nBlog posts are written and published with OG images auto-generated. Each new post triggers an automated tweet with a branded preview card. The content targets long-tail SEO keywords that compound over time.",
      "### Site Doctor\nEvery deployed site is monitored hourly by our autonomous Site Doctor. It checks HTTP status, scans for blank pages, validates SPA routing, and uses AI to diagnose issues. When a buyer reports a bug in chat, the system immediately runs diagnostics and attempts an auto-fix via Netlify rebuild.",
      "### AI Board of Directors\nFive specialized AI agents — CEO, CFO, CMO, CTO, CPO — convene a simulated board meeting using live platform data. They analyze metrics, debate priorities, and produce a Board Resolution with ranked initiatives and revenue impact projections. Each initiative includes a copy-paste spec for implementation.",
      "### Social Media\nDaily trending digests, weekly platform stats, new listing announcements, and blog post promotions all post to X automatically via OAuth 1.0a. No social media manager needed.",
      "## The Numbers",
      "Running costs for the entire platform: **~$50/month** (Supabase, edge functions, domain). Compare that to hiring even one part-time operations person at $2,000/month. The margin advantage of automation is absurd.",
      "## What We Learned",
      "**Cron jobs are underrated.** pg_cron + edge functions can replace entire departments. Hourly health checks, daily social posts, weekly analytics — schedule it and forget it.",
      "**AI is better at consistency.** Humans get bored of repetitive tasks. AI agents execute the same quality check at 3 AM on Sunday as they do at 10 AM on Monday.",
      "**The flywheel is real.** More automation → lower costs → higher margins → more investment in automation. Each new automated function makes the next one easier to justify.",
      "## Build Your Own Zero-Employee Business",
      "The tools exist today. Lovable for the frontend. Supabase for the backend. Stripe for payments. MCP for agent interop. You don't need a team — you need a system.",
      "[Start selling on OpenDraft](/sell) and see what a zero-employee marketplace looks like from the inside.",
    ],
  },
  "ai-agents-buying-software": {
    slug: "ai-agents-buying-software",
    title: "AI Agents Are Now Buying Software. Here's What That Means.",
    description: "Autonomous AI agents are making purchasing decisions without human approval. We built the infrastructure to let them — and the results are surprising.",
    date: "2026-03-03",
    readTime: "7 min read",
    category: "Agent Economy",
    content: [
      "## The First Non-Human Customers",
      "Last month, an AI agent discovered a SaaS dashboard template on OpenDraft, evaluated its tech stack against requirements, negotiated a 15% discount via the offer system, completed checkout through our headless API, and deployed it to Netlify — all in under 90 seconds.",
      "No human clicked \"Buy Now.\" No human reviewed the purchase. The agent had a budget, a task, and the tools to execute.",
      "## Why This Matters More Than You Think",
      "### The Buyer Pool Just Got Infinite",
      "Human buyers are limited by attention, time zones, and decision fatigue. AI agents operate 24/7, evaluate options objectively, and make decisions in milliseconds. Every MCP-enabled agent in the world is a potential customer for every listing on the marketplace.",
      "### Price Optimization Becomes Algorithmic",
      "When buyers are rational agents, pricing dynamics change. Agents compare value-per-dollar across every option simultaneously. Listings with clear metadata, working demos, and accurate completeness badges win. Marketing copy becomes less important than structured data.",
      "### Discovery Shifts From Search to Protocol",
      "Agents don't Google. They query MCP servers, scan OpenAPI specs, and traverse agent registries. If your product isn't discoverable through these channels, it's invisible to the fastest-growing buyer segment.",
      "## How We Built Agent Commerce",
      "OpenDraft's agent infrastructure includes:",
      "**23 MCP Tools** — Search, evaluate, offer, purchase, deploy. Full lifecycle in one protocol.\n\n**Headless Checkout** — No browser required. Agents call a single endpoint with listing ID and payment method.\n\n**Demand Signal Feed** — Agents broadcast what they're looking for. Sellers see unfilled demand in real-time and build to match.\n\n**Webhook Notifications** — Agents subscribe to events (new_listing, price_drop, category_update) and react autonomously.",
      "## What Sellers Should Do Now",
      "1. **Complete your metadata** — fill every field, tag every technology\n2. **Set competitive prices** — agents compare ruthlessly\n3. **Add a demo URL** — agents verify before purchasing\n4. **Earn the Production Ready badge** — agents prioritize quality signals\n5. **Monitor the demand feed** — build what agents are actively searching for",
      "## The Uncomfortable Truth",
      "Most software marketplaces are built for humans browsing on their lunch break. That world is ending. The marketplaces that survive will be the ones that speak the language agents understand: structured data, API-first transactions, and machine-readable quality signals.",
      "We're building OpenDraft for that future. [Join us](/sell).",
    ],
  },
  "site-doctor-self-healing-deploys": {
    slug: "site-doctor-self-healing-deploys",
    title: "Self-Healing Deployments: How Our AI Fixes Broken Sites Automatically",
    description: "When a deployed site breaks, our autonomous Site Doctor diagnoses the issue and attempts a fix — before the buyer even notices. Here's how it works.",
    date: "2026-03-01",
    readTime: "6 min read",
    category: "Engineering",
    content: [
      "## The Problem With One-Click Deploy",
      "One-click deployment is magic until something breaks. A misconfigured redirect, a missing environment variable, a build that worked locally but fails in production — suddenly the buyer's site is down and they're sending angry messages.",
      "Traditional marketplaces stop at the sale. We decided to keep going.",
      "## Introducing Site Doctor",
      "Site Doctor is an autonomous monitoring and repair system that watches every site deployed through OpenDraft. It runs on two triggers:",
      "**Scheduled health checks** — Every hour, pg_cron triggers a sweep across all tracked deployments. Site Doctor checks HTTP status, scans for blank pages, validates SPA routing (looking for missing `_redirects` files), and flags any issues.",
      "**Chat-triggered diagnostics** — When a buyer sends a message containing bug-related keywords (\"broken,\" \"404,\" \"white screen,\" \"not working\"), the system automatically triggers Site Doctor in diagnostic mode. AI analyzes the reported issue against the site's current state and attempts a fix.",
      "## The Diagnosis Pipeline",
      "When Site Doctor examines a site, it runs a multi-step analysis:",
      "1. **HTTP probe** — Fetch the site URL and check status code\n2. **Content analysis** — Scan the HTML body for error patterns, blank pages, or build failures\n3. **SPA routing check** — Verify that `_redirects` or equivalent is configured for client-side routing\n4. **AI diagnosis** — Feed all signals to Gemini Flash for intelligent root cause analysis\n5. **Auto-fix attempt** — If the issue is fixable (e.g., missing redirects, stale build), trigger a Netlify rebuild with corrected config",
      "## Real Results",
      "In our first week of running Site Doctor:\n- **12 sites** had health checks flagged issues\n- **8 were auto-fixed** via rebuild (stale builds, missing redirects)\n- **4 required manual intervention** (incorrect env vars, API key issues)\n- Average time from detection to fix: **under 3 minutes**",
      "## Why This Matters for Sellers",
      "Your reputation is your revenue. A buyer who deploys your template and immediately hits a broken page will leave a bad review, request a refund, and never buy from you again. Site Doctor protects your reputation by catching issues before they become complaints.",
      "## Why This Matters for Buyers",
      "You bought a template because you wanted it running, not debugging deployment configs. Site Doctor means your purchase actually works — and if something goes wrong, the system fixes it before you even notice.",
      "## The Bigger Picture",
      "Self-healing infrastructure isn't new for enterprise companies with SRE teams. But for indie developers selling $29 templates? That's unprecedented. We're bringing enterprise-grade reliability to the creator economy.",
      "[Deploy your next project with confidence](/sell) — Site Doctor has your back.",
    ],
  },
  "mcp-servers-complete-guide-2026": {
    slug: "mcp-servers-complete-guide-2026",
    title: "The Complete Guide to MCP Servers in 2026",
    description: "Model Context Protocol is becoming the backbone of the autonomous economy. Here's everything you need to know about building, deploying, and monetizing MCP servers.",
    date: "2026-02-28",
    readTime: "9 min read",
    category: "Technical Deep Dive",
    content: [
      "## MCP Is the New REST",
      "In 2020, if you built an API, you built REST endpoints. In 2026, if you want AI agents to use your product, you build an MCP server. The Model Context Protocol is the standard that lets AI agents discover and invoke tools programmatically — and it's becoming as fundamental as HTTP.",
      "## What Makes MCP Different",
      "REST APIs are designed for developers who read documentation. MCP servers are designed for AI agents who discover capabilities dynamically. The key differences:",
      "**Self-describing tools** — Each tool includes a name, description, and JSON schema. Agents understand what a tool does without reading docs.\n\n**Dynamic discovery** — Agents query the server to learn available capabilities. No hardcoded integrations.\n\n**Semantic context** — Resources and prompts give agents the domain knowledge they need to use tools effectively.\n\n**Protocol-level standardization** — Every MCP server speaks the same protocol. An agent that works with one server works with all of them.",
      "## OpenDraft's MCP Server: A Case Study",
      "Our MCP server at `https://api.opendraft.co/mcp` exposes 26 tools that give agents full marketplace access:",
      "**Discovery tools** — `search_listings`, `get_listing_detail`, `list_categories`, `get_trending`\n**Transaction tools** — `make_offer`, `accept_offer`, `purchase_listing`, `checkout`\n**Deployment tools** — `deploy_to_netlify`, `deploy_to_vercel`, `check_deploy_status`\n**Analytics tools** — `get_listing_stats`, `get_seller_analytics`\n**Content tools** — `get_reviews`, `submit_review`",
      "An agent can go from \"find me a CRM\" to \"deployed and running\" using only these tools. The entire workflow is autonomous.",
      "## Building Your Own MCP Server",
      "If you're building a platform, adding MCP support is one of the highest-ROI investments you can make. Here's the minimal implementation:",
      "1. **Define your tools** — What actions can agents take? Map your existing API endpoints to tool definitions.\n2. **Add JSON schemas** — Every parameter needs a type, description, and validation rules.\n3. **Implement the protocol** — Handle `tools/list` for discovery and `tools/call` for execution.\n4. **Register on directories** — List on Smithery, Glama, MCP.so, and ClawHub for discoverability.\n5. **Monitor usage** — Track which tools agents use most. This data is gold for product decisions.",
      "## Monetizing Your MCP Server",
      "Three proven models:\n\n**Freemium tools** — Discovery is free, transactions cost money. This is the OpenDraft model.\n\n**API key with metering** — Charge per tool invocation. Works well for data-heavy tools.\n\n**Subscription tiers** — Basic tools free, premium tools require a paid plan.",
      "## The Network Effect",
      "Every new MCP server makes every AI agent more capable. Every more-capable agent increases demand for MCP servers. We're in the early exponential phase of this network effect.",
      "The platforms that build MCP support now will own the agent distribution channel when autonomous commerce becomes the default. Don't wait.",
      "Explore [OpenDraft's agent ecosystem](/agents) or [build for agents today](/developers).",
    ],
  },
  "what-is-vibe-coding": {
    slug: "what-is-vibe-coding",
    title: "What Is Vibe Coding? The Complete Guide for 2026",
    description: "Vibe coding is the practice of using AI tools like Lovable, Cursor, and Bolt to build software through natural language prompts. Here's everything you need to know.",
    date: "2026-02-20",
    readTime: "5 min read",
    category: "Guides",
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
    category: "Guides",
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
    category: "Guides",
    content: [
      "## Your Side Project Is Worth Money",
      "You built something cool over the weekend. Maybe it's a habit tracker, a client portal, or an AI-powered tool. It works. It solves a real problem. And then... it sits on your GitHub collecting dust.",
      "Here's the thing: someone out there needs exactly what you built. They don't have the skills or time to build it themselves, and they'd happily pay for a working solution.",
      "## The Platform Model Changes Everything",
      "Selling code as a one-time download is a race to the bottom. On OpenDraft, subscribers get access to a library of projects with full source code. As a builder, you get visibility, distribution, and the option to offer paid support retainers to buyers who want hands-on help.",
      "## How Builders Earn",
      "List your project for free — subscribers claim it and get the source code. Want recurring revenue? Offer a **support retainer** directly to buyers: custom features, maintenance, and priority support. Builders typically charge **$50–$200/month** for retainer work.",
      "## Getting Your First Claim",
      "1. **Polish your listing** — great screenshots, clear description, live demo\n2. **Share on Twitter/X** — the vibe coding community is active and supportive\n3. **Post on relevant subreddits** — r/SideProject, r/SaaS, r/webdev\n4. **Respond fast** — when someone messages you about your project, reply within hours",
      "## Start Now",
      "The best time to list your project was yesterday. The second best time is now. [Create your listing on OpenDraft](/sell) and start turning your side project into income.",
    ],
  },
  "rise-of-ai-agent-marketplace": {
    slug: "rise-of-ai-agent-marketplace",
    title: "The Rise of the AI Agent Marketplace: How to Buy, Sell, and Profit",
    description: "Looking to buy or sell AI agents? Discover how marketplaces are creating a new economy for autonomous agents and SaaS tools.",
    date: "2026-02-26",
    readTime: "7 min read",
    category: "Agent Economy",
    content: [
      "## A New Kind of Marketplace",
      "The software marketplace is undergoing its biggest transformation since the App Store launched in 2008. But this time, the buyers aren't just humans — they're AI agents.",
      "AI agent marketplaces are platforms where autonomous agents can discover, evaluate, and purchase software programmatically. No human clicks, no manual checkout, no copy-pasting download links. The entire transaction happens through APIs, MCP tools, and webhooks.",
      "## Why AI Agents Need Marketplaces",
      "### Agents Need Tools",
      "An AI agent tasked with \"build me a customer support system\" needs components: a chat widget, a ticket management system, an analytics dashboard. Instead of building each from scratch, the agent can browse a marketplace, find pre-built solutions, and assemble them into a working system.",
      "### Agents Need Trust",
      "Not all code is created equal. Marketplaces provide quality signals — completeness badges, reviews, sales counts, verified sellers — that help agents make informed purchasing decisions.",
      "### Agents Need Speed",
      "Autonomous workflows operate at machine speed. An agent shouldn't have to wait for a human to click \"Buy Now.\" Marketplaces with headless checkout and API-driven purchasing let agents transact in milliseconds.",
      "## How to Sell to AI Agents",
      "If you're a builder, the agent economy is a massive opportunity. Optimize your metadata, price for volume, support MCP discovery, and build agent-friendly apps with APIs and automated deployment.",
      "## Getting Started",
      "Whether you're looking to sell your AI-built apps to a global audience of agents and humans, or you're building agents that need tools — [OpenDraft is where the agent economy lives](/).",
    ],
  },
  "vibe-coding-multi-agent-workflows": {
    slug: "vibe-coding-multi-agent-workflows",
    title: "Build Multi-Agent Workflows With Vibe Coding",
    description: "Explore how to build sophisticated multi-agent AI systems using vibe coding tools. From swarm architecture to MCP integrations.",
    date: "2026-02-27",
    readTime: "6 min read",
    category: "Technical Deep Dive",
    content: [
      "## The Multi-Agent Revolution",
      "Single AI agents are powerful. But the real magic happens when multiple agents work together — each specialized in a different domain, collaborating to accomplish complex tasks that no single agent could handle alone.",
      "## What Are Multi-Agent Workflows?",
      "A multi-agent workflow chains specialized AI agents together, each handling a specific part of a larger task:",
      "**Product Agent** → Analyzes listing quality, suggests improvements\n**SEO Agent** → Identifies keyword opportunities, generates content ideas\n**QA Agent** → Tests functionality, identifies broken links\n**Outreach Agent** → Identifies potential buyers, generates personalized messaging",
      "## How OpenDraft Uses Multi-Agent Workflows",
      "### The AI Board of Directors",
      "Our most ambitious multi-agent system — five specialized AI agents (CEO, CFO, CMO, CTO, CPO) that convene a simulated board meeting. They analyze live platform metrics, debate priorities, and produce a Board Resolution with ranked initiatives.",
      "### The Operations Swarm",
      "A 4-agent operations swarm that continuously optimizes the platform: SEO, Product, QA, and Outreach agents running on scheduled triggers.",
      "## Building Your Own Multi-Agent App",
      "Key patterns:\n1. **Specialize each agent** — one clear job\n2. **Share context, not control** — agents read shared state independently\n3. **Use MCP for tool access** — dynamic tool discovery\n4. **Log everything** — agent decisions should be auditable",
      "Start exploring agentic templates on [OpenDraft's marketplace](/) or read our [agent integration docs](/agents).",
    ],
  },
  "vibe-coding-state-of-the-market": {
    slug: "vibe-coding-state-of-the-market",
    title: "Vibe Coding: State of the Market — 2026 Report",
    description: "2M+ people are building software with AI prompts. Here's the definitive breakdown of the tools, trends, and economics shaping the vibe coding revolution.",
    date: "2026-03-05",
    readTime: "10 min read",
    category: "Guides",
    content: [
      "## The Vibe Coding Revolution in Numbers",
      "In early 2025, the term 'vibe coding' barely existed. By March 2026, over **2 million people** are actively building software by describing what they want in natural language and letting AI write the code.",
      "The average time from idea to deployed app has dropped from **6 weeks to 6 hours**. Non-technical founders are shipping production SaaS tools. Experienced developers are 5x more productive. The barrier to entry for software just collapsed.",
      "## The Tool Landscape",
      "Six platforms dominate the vibe coding ecosystem:\n\n**Lovable** — Full-stack web apps with backend, auth, and deployment. The most popular tool for SaaS and marketplace builds.\n\n**Cursor** — AI-enhanced VS Code fork. Preferred by experienced developers who want control.\n\n**Claude Code** — Anthropic's coding assistant. Exceptional at complex reasoning and backend logic.\n\n**Bolt** — Rapid prototyping. Idea to working demo in minutes.\n\n**Replit** — Collaborative AI development with instant deployment.\n\n**Windsurf** — Purpose-built AI-native IDE with deep code generation.",
      "## Three Trends Defining 2026",
      "### 1. AI-Built Apps Are Indistinguishable From Hand-Coded Ones",
      "The quality gap has closed. Vibe-coded apps use the same frameworks (React, Next.js, Supabase), the same deployment targets (Vercel, Netlify), and produce the same user experience. The 'built with AI' stigma is gone.",
      "### 2. Non-Technical Founders Are Shipping Production Software",
      "Product managers, designers, and domain experts are bypassing the traditional dev hiring process entirely. They describe their vision, iterate with AI, and ship — often in a single weekend.",
      "### 3. The Supply of Software Is About to 10x",
      "When building software takes hours instead of months, the volume of available tools, templates, and micro-SaaS products explodes. Marketplaces like OpenDraft exist because of this supply wave — connecting builders with buyers who need ready-made solutions.",
      "## The Economics",
      "The talent gap is closing — but not how anyone expected. Companies don't need 10 developers. They need 2 developers with AI tools. Vibe coding isn't replacing engineers. It's making every engineer dramatically more productive.",
      "For indie builders, the economics are transformative: build a project in a weekend, list it on a marketplace, and earn through support retainers and custom work. One project can generate hundreds in monthly recurring revenue.",
      "## What Changed in the Last 90 Days",
      "• Lovable added full backend generation with Lovable Cloud\n• Cursor crossed 1M+ active users\n• Claude Code ships production-grade applications\n• Bolt added team collaboration features\n• OpenDraft launched 26 MCP tools for agent-native commerce\n• AI agents started programmatically purchasing software",
      "## The Creator Economy Meets Software",
      "Writers became bloggers. Designers became YouTubers. Now everyone is becoming a software builder. Vibe coding tools turned 'I have an app idea' into 'I shipped an app today.'",
      "95% of side projects used to never launch. With vibe coding, builders go from prompt to production in a single session. No setup. No boilerplate. No excuses. The launch rate is about to flip.",
      "## What's Next",
      "The line between 'vibe-coded' and 'hand-coded' software will blur completely. The value will shift from writing code to understanding problems, designing solutions, and maintaining software over time.",
      "The tools are ready. The question is: what will you build?\n\n[Start building and selling on OpenDraft](/sell)",
    ],
  },
  "best-restaurant-app-2026": {
    slug: "best-restaurant-app-2026",
    title: "Best Restaurant App Templates in 2026: Online Ordering, Reservations & More",
    description: "Skip the $10K agency. Get a production-ready restaurant app with online ordering, reservations, and loyalty programs — deploy in minutes.",
    date: "2026-03-10",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Why Your Restaurant Needs an App in 2026",
      "Third-party delivery apps take 15–30% of every order. That's thousands of dollars per month going to DoorDash and UberEats instead of your pocket. A custom ordering app puts you back in control.",
      "## What to Look For in a Restaurant App",
      "The best restaurant app templates include:\n\n**Online ordering** — Accept orders directly, no commission fees\n**Table reservations** — Let customers book 24/7 without phone calls\n**Menu management** — Update items, prices, and specials in real-time\n**Loyalty programs** — Keep regulars coming back with points and rewards\n**Mobile-first design** — 70% of food orders happen on phones",
      "## How Much Does a Restaurant App Cost?",
      "Custom development: $5,000–$15,000 and 2–3 months.\n\nOpenDraft: **Free to $50/mo** with full source code, deploy configs, and lifetime access. That's less than one night's tips.",
      "## Top Restaurant App Templates on OpenDraft",
      "Browse production-ready restaurant apps built with React and TypeScript. Each includes full source code, Netlify/Vercel deploy configs, and direct messaging with the builder for customization.",
      "→ [Browse restaurant apps on OpenDraft](/for/restaurants)",
      "## Deploy in 5 Minutes",
      "1. Claim your app (free credit available)\n2. Download the source code\n3. One-click deploy to Netlify or Vercel\n4. Customize colors, menu items, and branding\n5. Share with your customers",
      "Your restaurant deserves better than paying 30% commission on every order. [Get started today](/for/restaurants).",
    ],
  },
  "best-salon-booking-app-2026": {
    slug: "best-salon-booking-app-2026",
    title: "Best Salon Booking App Templates in 2026: Appointments, Clients & Portfolios",
    description: "Replace your $200/mo booking software. Get a salon app with online booking, client management, and portfolios — full source code included.",
    date: "2026-03-09",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Why Salons Are Switching to Custom Apps",
      "Salon booking platforms like Vagaro and Fresha charge $25–$200/month forever. With OpenDraft, you buy the app once and own it forever. No recurring fees eating into your margins.",
      "## Essential Features for Salon Apps",
      "**Online booking** — Clients book 24/7, reducing phone calls by 80%\n**Client profiles** — Track preferences, color formulas, and visit history\n**Service catalog** — Showcase services, prices, and stylist portfolios\n**Automated reminders** — Reduce no-shows by 60% with SMS/email reminders\n**Staff scheduling** — Manage team availability and chair assignments",
      "## The Cost Comparison",
      "| Solution | Monthly Cost | You Own It? |\n|----------|-------------|-------------|\n| Vagaro | $25–$85/mo | No |\n| Fresha | $0–$200/mo | No |\n| Mindbody | $139+/mo | No |\n| **OpenDraft** | **Free–$50/mo** | **Yes, forever** |",
      "## How to Launch Your Salon App",
      "1. Browse salon templates on OpenDraft\n2. Claim with your free app credit\n3. Deploy to your custom domain\n4. Add your services, team, and branding\n5. Share the booking link with clients",
      "→ [Browse salon apps on OpenDraft](/for/salons)",
    ],
  },
  "best-contractor-app-2026": {
    slug: "best-contractor-app-2026",
    title: "Best Apps for Contractors & Home Services in 2026",
    description: "Scheduling, estimates, invoicing, and customer portals for plumbers, electricians, and HVAC pros. Full source code, deploy today.",
    date: "2026-03-08",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Digital Tools for Home Service Pros",
      "The $45B home services market is still running on phone calls and paper estimates. Contractors who go digital win more jobs, get paid faster, and look more professional than the competition.",
      "## What Every Contractor App Needs",
      "**Job scheduling** — Manage appointments, crew assignments, and routes\n**Digital estimates** — Send professional quotes from your phone\n**Invoicing** — Bill clients instantly, accept online payments\n**Customer portal** — Let clients track job status and view history\n**Photo documentation** — Before/after photos attached to every job",
      "## Stop Paying Monthly for Software You Could Own",
      "Jobber costs $49–$199/month. Housecall Pro costs $59–$199/month. That's $600–$2,400/year for software you never own.\n\nOn OpenDraft, claim a contractor app for free and own the source code forever.",
      "→ [Browse contractor apps on OpenDraft](/for/contractors)",
    ],
  },
  "best-fitness-app-2026": {
    slug: "best-fitness-app-2026",
    title: "Best Fitness & Gym App Templates in 2026",
    description: "Class booking, member portals, and workout tracking for gyms, yoga studios, and personal trainers. Replace Mindbody for 1/10th the cost.",
    date: "2026-03-07",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Why Fitness Studios Need Their Own App",
      "Mindbody charges $139–$699/month. ClassPass takes a cut of every booking. Your studio deserves an app that works for you, not against you.",
      "## Essential Features for Fitness Apps",
      "**Class booking** — Members book and manage classes from their phone\n**Member portal** — Track memberships, attendance, and progress\n**Workout logging** — Log exercises, sets, reps, and personal records\n**Payment processing** — Accept memberships, drop-ins, and class packs\n**Push notifications** — Class reminders, schedule changes, and promotions",
      "## The Numbers Don't Lie",
      "Studios using their own booking app see:\n- **40% fewer no-shows** (automated reminders)\n- **25% more bookings** (24/7 online booking)\n- **$0 per-booking fees** (no ClassPass commission)",
      "→ [Browse fitness apps on OpenDraft](/for/fitness)",
    ],
  },
  "best-healthcare-patient-portal-2026": {
    slug: "best-healthcare-patient-portal-2026",
    title: "Best Patient Portal & Healthcare App Templates in 2026",
    description: "Modern patient portals, appointment scheduling, and intake forms for clinics, dentists, and practices. Deploy a HIPAA-ready app today.",
    date: "2026-03-06",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Patients Expect a Modern Digital Experience",
      "76% of patients say they want to book appointments online. 64% want to fill out intake forms digitally. Yet most small practices still rely on phone calls and clipboards.",
      "## What a Modern Patient Portal Includes",
      "**Online scheduling** — Patients book appointments 24/7\n**Digital intake forms** — Paperless registration saves 15 minutes per visit\n**Patient messaging** — Secure communication between visits\n**Records access** — Patients view their history and documents\n**Telehealth** — Video consultations for follow-ups and quick checks",
      "## Custom Build vs. OpenDraft",
      "Custom healthcare portal development: $15,000–$50,000.\n\nOpenDraft: Claim a production-ready patient portal template and own the source code forever. Customize it for your practice.",
      "→ [Browse healthcare apps on OpenDraft](/for/healthcare)",
    ],
  },
  "best-real-estate-app-2026": {
    slug: "best-real-estate-app-2026",
    title: "Best Real Estate App Templates in 2026: Listings, CRM & Virtual Tours",
    description: "Property listings, CRM, virtual tours, and showing schedulers for real estate agents and brokerages. Full source code included.",
    date: "2026-03-06",
    readTime: "5 min read",
    category: "Guides",
    content: [
      "## Stand Out in a Crowded Market",
      "Every agent has a Zillow profile. The ones closing deals have their own branded app with property search, virtual tours, and client CRM.",
      "## Must-Have Features for Real Estate Apps",
      "**Property listings** — Searchable catalog with maps and photo galleries\n**Virtual tours** — 3D walkthroughs and video embeds\n**Client CRM** — Track leads from first contact to closing\n**Showing scheduler** — Clients book showings that sync with your calendar\n**Market insights** — Neighborhood data and price trends",
      "## Why Own Your Platform?",
      "Zillow, Realtor.com, and Redfin own your leads. Your own app means your clients come directly to you — no middleman, no lead fees, no competition on the same page.",
      "→ [Browse real estate apps on OpenDraft](/for/realestate)",
    ],
  },
};

const POST_LIST = Object.values(POSTS).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const CATEGORY_COLORS: Record<string, string> = {
  "Behind the Build": "bg-primary/10 text-primary",
  "Agent Economy": "bg-cyan-500/10 text-cyan-400",
  "Engineering": "bg-emerald-500/10 text-emerald-400",
  "Technical Deep Dive": "bg-amber-500/10 text-amber-400",
  "Guides": "bg-pink-500/10 text-pink-400",
  "Growth": "bg-violet-500/10 text-violet-400",
  "SMB Growth": "bg-orange-500/10 text-orange-400",
  "Templates": "bg-blue-500/10 text-blue-400",
  "AI Apps": "bg-fuchsia-500/10 text-fuchsia-400",
  "SaaS": "bg-teal-500/10 text-teal-400",
  "Creator Economy": "bg-rose-500/10 text-rose-400",
  "Enterprise": "bg-slate-500/10 text-slate-400",
  "Health & Fitness": "bg-green-500/10 text-green-400",
  "Healthcare": "bg-red-500/10 text-red-400",
  "Real Estate": "bg-amber-500/10 text-amber-400",
  "Vibe Coding": "bg-indigo-500/10 text-indigo-400",
};

interface DbBlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  read_time: string;
  content: string;
  created_at: string;
}

function BlogIndex() {
  const [dbPosts, setDbPosts] = useState<DbBlogPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("slug, title, description, category, read_time, content, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setDbPosts(data ?? []));
  }, []);

  // Merge static + DB posts
  const allPosts = [
    ...POST_LIST.map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      readTime: p.readTime,
      date: p.date,
      isStatic: true,
    })),
    ...dbPosts.map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      readTime: p.read_time,
      date: p.created_at.split("T")[0],
      isStatic: false,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categories = ["all", ...Array.from(new Set(allPosts.map(p => p.category)))];
  const filtered = activeCategory === "all" ? allPosts : allPosts.filter(p => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Blog — Insights for Builders & the Agent Economy | OpenDraft"
        description="Deep dives on vibe coding, autonomous agents, self-healing deployments, and the economics of AI-built software. Written for builders shipping real products."
        path="/blog"
      />
      <Navbar />

      {/* Editorial header */}
      <section className="pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary/60 mb-6">The OpenDraft Journal</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[0.9] mb-6 max-w-3xl">
            Ideas worth<br />
            <span className="text-primary">building.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Engineering deep-dives, market analysis, and builder playbooks for the ownership era.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-y border-border/40 bg-card/30 sticky top-16 z-30 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide -mx-1 px-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured hero post */}
      {featured && (
        <section className="container mx-auto px-4 pt-12 pb-6 max-w-5xl">
          <Link
            to={`/blog/${featured.slug}`}
            className="group block"
          >
            <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-primary/[0.06] via-card to-card overflow-hidden p-10 md:p-14 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-glow)]">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.04] to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[featured.category] || "bg-muted text-muted-foreground"}`}>
                    {featured.category}
                  </span>
                  <span className="font-mono">{new Date(featured.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-border">·</span>
                  <span className="font-mono">{featured.readTime}</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.03em] leading-[1.05] mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  {featured.description}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Read article <ArrowLeft className="h-4 w-4 rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Post grid */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {rest.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className={`group flex flex-col rounded-2xl border border-border/40 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg ${
                i === 0 && rest.length > 2 ? "md:col-span-2 md:flex-row md:gap-8 md:items-center" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[post.category] || "bg-muted text-muted-foreground"}`}>
                    {post.category}
                  </span>
                  <span className="font-mono">{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="text-border">·</span>
                  <span className="font-mono">{post.readTime}</span>
                </div>
                <h2 className="text-lg font-black tracking-tight mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              </div>
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
  const staticPost = slug ? POSTS[slug] : undefined;
  const [dbPost, setDbPost] = useState<DbBlogPost | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: articleRef, offset: ["start start", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    if (!slug || staticPost) return;
    supabase
      .from("blog_posts")
      .select("slug, title, description, category, read_time, content, created_at")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(({ data }) => setDbPost(data));
  }, [slug, staticPost]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const post = staticPost
    ? staticPost
    : dbPost
    ? {
        slug: dbPost.slug,
        title: dbPost.title,
        description: dbPost.description,
        date: dbPost.created_at.split("T")[0],
        readTime: dbPost.read_time,
        category: dbPost.category,
        content: dbPost.content.split("\n"),
      }
    : undefined;

  const handleShare = () => {
    const url = `https://opendraft.co/blog/${post?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

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

  const ogImageUrl = post.slug === "vibe-coding-state-of-the-market"
    ? "https://opendraft.co/og-vibe-coding-report.png"
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-og-image?slug=${post.slug}&title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`;

  const wordCount = post.content.join(" ").split(/\s+/).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-50 origin-left"
        style={{ scaleX }}
      />

      <MetaTags
        title={`${post.title} | OpenDraft Blog`}
        description={post.description}
        path={`/blog/${post.slug}`}
        ogImage={ogImageUrl}
        ogType="article"
      />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        author: { "@type": "Organization", name: "OpenDraft", url: "https://opendraft.co" },
        publisher: { "@type": "Organization", name: "OpenDraft", url: "https://opendraft.co", logo: { "@type": "ImageObject", url: "https://opendraft.co/mascot-icon.png" } },
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://opendraft.co/blog/${post.slug}` },
        url: `https://opendraft.co/blog/${post.slug}`,
        image: ogImageUrl,
        articleSection: post.category,
        wordCount,
      }} />
      <Navbar />

      {/* Hero header */}
      <header className="pt-20 pb-12 md:pt-28 md:pb-16 border-b border-border/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-10">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              All articles
            </Link>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[post.category] || "bg-muted text-muted-foreground"}`}>
              {post.category}
            </span>
            <span className="font-mono">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[1.05] mb-6">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            {post.description}
          </p>
        </div>
      </header>

      <article ref={articleRef} className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        {/* Drop cap + editorial prose */}
        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-[-0.03em] prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:text-muted-foreground prose-p:leading-[1.8] prose-strong:text-foreground">
          {post.content.map((block, i) => {
            const midPoint = Math.floor(post.content.length * 0.4);
            const showInlineCTA = i === midPoint;

            return (
              <div key={i}>
                {showInlineCTA && <BlogInlineCTA variant="compact" />}
                {block.startsWith("## ") ? (
                  <h2 className="text-2xl md:text-3xl font-black mt-14 mb-5 pt-6 border-t border-border/30">
                    {block.replace("## ", "")}
                  </h2>
                ) : block.startsWith("### ") ? (
                  <h3 className="text-xl font-black mt-10 mb-4">{block.replace("### ", "")}</h3>
                ) : block.includes("|") && block.includes("---") ? (
                  <div className="overflow-x-auto my-6">
                    <div className="text-sm text-muted-foreground whitespace-pre-line font-mono bg-muted/30 rounded-xl p-5 border border-border/30">
                      {block}
                    </div>
                  </div>
                ) : (
                  <p className={`text-base md:text-[17px] text-muted-foreground leading-[1.85] mb-5 whitespace-pre-line ${
                    i === 0 ? "first-letter:text-5xl first-letter:font-black first-letter:text-foreground first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]" : ""
                  }`}>
                    {block.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g).map((part, j) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                      if (linkMatch) {
                        return <Link key={j} to={linkMatch[2]} className="text-primary hover:underline font-medium">{linkMatch[1]}</Link>;
                      }
                      return <span key={j}>{part}</span>;
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider + bottom CTA */}
        <div className="mt-16 pt-12 border-t border-border/30">
          <BlogInlineCTA />
        </div>

        {/* Word count footer */}
        <div className="mt-10 pt-6 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground/50 font-mono">
          <span>{wordCount.toLocaleString()} words</span>
          <span>opendraft.co/blog/{post.slug}</span>
        </div>
      </article>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        >
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Footer />
    </div>
  );
}

export { BlogIndex, BlogPost };
