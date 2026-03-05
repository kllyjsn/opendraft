import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Users, Zap, DollarSign, Globe, Bot, Shield, Rocket, Target, Brain, ArrowRight, Activity, Radio, Wrench, CloudLightning } from "lucide-react";
import { motion } from "framer-motion";

const PITCH_PASSWORD = "opendraft2026";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

function Slide({ title, children, icon: Icon, index }: { title: string; children: React.ReactNode; icon: React.ElementType; index: number }) {
  return (
    <motion.section
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className="rounded-2xl border border-border/60 bg-card p-5 sm:p-8 md:p-12 shadow-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/30 p-3 md:p-5 text-center overflow-hidden">
      <p className="text-xl sm:text-2xl md:text-4xl font-black text-gradient truncate">{value}</p>
      <p className="text-xs sm:text-sm font-semibold text-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function TableRow({ cells, header }: { cells: string[]; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return (
    <tr className={header ? "border-b border-border" : "border-b border-border/30"}>
      {cells.map((c, i) => (
        <Tag key={i} className={`py-2 px-1.5 sm:px-3 text-left text-xs sm:text-sm whitespace-nowrap ${header ? "font-bold text-foreground" : i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {c}
        </Tag>
      ))}
    </tr>
  );
}

function FlywheelStep({ emoji, title, desc, arrow = true }: { emoji: string; title: string; desc: string; arrow?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-lg">{emoji}</span>
      </div>
      <div className="flex-1">
        <p className="font-bold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {arrow && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </div>
  );
}

export default function Pitch() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (pw === PITCH_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <CanonicalTag path="/pitch" />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-card text-center"
          >
            <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Investor Deck</h1>
            <p className="text-sm text-muted-foreground mb-6">Enter the password to view the pitch deck.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleUnlock(); }} className="space-y-3">
              <Input
                type="password"
                placeholder="Password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-xs text-destructive">Incorrect password</p>}
              <Button type="submit" className="w-full gradient-hero text-primary-foreground font-bold">
                Unlock
              </Button>
            </form>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CanonicalTag path="/pitch" />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 gradient-hero opacity-[0.04]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <img src="/mascot-icon.png" alt="OpenDraft" className="h-16 w-16 rounded-2xl mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-4">
              Open<span className="text-gradient">Draft</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
              The first app store where AI agents autonomously discover, purchase, deploy, and maintain software.
            </p>
            <p className="text-sm font-semibold text-gradient">Seed Round · 2026</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-24 space-y-10 max-w-4xl">

        {/* Problem */}
        <Slide title="The Problem" icon={Target} index={0}>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex gap-3"><span className="text-destructive font-bold">1.</span> AI agents need software tools but have no marketplace to buy from programmatically.</li>
            <li className="flex gap-3"><span className="text-destructive font-bold">2.</span> 2M+ vibe coders build apps with no distribution beyond manual marketing.</li>
            <li className="flex gap-3"><span className="text-destructive font-bold">3.</span> Existing marketplaces (Gumroad, LemonSqueezy) have zero agent-native infrastructure.</li>
            <li className="flex gap-3"><span className="text-destructive font-bold">4.</span> Deployed apps break silently — no platform monitors, diagnoses, or fixes post-sale.</li>
          </ul>
        </Slide>

        {/* Solution */}
        <Slide title="The Solution" icon={Zap} index={1}>
          <p className="text-muted-foreground mb-4">
            A fully autonomous two-sided marketplace — MCP server, REST API, webhooks, automated social promotion, and post-sale infrastructure — so both humans <strong className="text-foreground">and AI agents</strong> can browse, purchase, deploy, and maintain software without human intervention.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <MetricCard label="MCP Tools" value="26" sub="Full agent toolkit" />
            <MetricCard label="REST Endpoints" value="12+" sub="Programmatic access" />
            <MetricCard label="Live Listings" value="95+" sub="Across 6 categories" />
            <MetricCard label="Automation" value="100%" sub="Zero-touch operations" />
          </div>
        </Slide>

        {/* Market */}
        <Slide title="Market Opportunity" icon={Globe} index={2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <MetricCard label="TAM" value="$120B" sub="AI agent economy (2030)" />
            <MetricCard label="Agent Commerce" value="$50B" sub="Programmatic procurement" />
            <MetricCard label="SAM" value="$8B" sub="Indie/SMB AI tools" />
            <MetricCard label="SOM Y1" value="$2M" sub="Year 1 GMV target" />
          </div>
          <p className="text-sm text-muted-foreground">
            Gartner projects 15B+ autonomous agent instances by 2030. <strong className="text-foreground">Market validation:</strong> TrustMRR — a simple revenue-verification directory — already facilitates $30M+/mo across 125 OpenClaw startups. A full transactional marketplace with agent-native infrastructure and autonomous operations captures significantly more value. OpenDraft is the first-mover building this layer.
          </p>
        </Slide>

        {/* Automated Revenue Flywheel — NEW */}
        <Slide title="Automated Revenue Flywheel" icon={Radio} index={3}>
          <p className="text-muted-foreground mb-6">
            Every listing generates revenue <strong className="text-foreground">without human intervention</strong>. The platform auto-approves, auto-promotes, auto-monitors, and auto-fixes — creating a compounding growth loop.
          </p>
          <div className="space-y-3 mb-6">
            <FlywheelStep emoji="📝" title="Builder submits listing" desc="Quality gate: title, description, price → auto-approved in ≤30 minutes" />
            <FlywheelStep emoji="🐦" title="Auto-posted to X/Twitter" desc="Randomized templates for new listings, sales milestones (5/10/25/50/100), daily trending, weekly stats" />
            <FlywheelStep emoji="🤖" title="Agents discover via MCP/API" desc="26 MCP tools + REST API → autonomous search, evaluate, purchase" />
            <FlywheelStep emoji="☁️" title="One-click cloud deploy" desc="Netlify & Vercel deployment from source ZIP or GitHub — mobile-safe, no OAuth required" />
            <FlywheelStep emoji="⚕️" title="Site Doctor monitors 24/7" desc="Hourly health checks, AI-powered diagnosis, auto-fix attempts, chat-triggered bug reports" arrow={false} />
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Operational leverage:</strong> This flywheel runs on 4 cron jobs and 0 human operators. Every new listing automatically enters the promotion → discovery → deployment → monitoring pipeline. Traditional marketplaces require content moderation teams, social media managers, and support staff. <strong className="text-foreground">We require none.</strong>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <MetricCard label="Cron Jobs" value="4" sub="Fully automated" />
            <MetricCard label="X Posts/Week" value="20+" sub="Auto-generated" />
            <MetricCard label="Approval Time" value="<30m" sub="Zero manual review" />
            <MetricCard label="Site Checks" value="24/day" sub="Per deployed site" />
          </div>
        </Slide>

        {/* Post-Sale Infrastructure — NEW */}
        <Slide title="Post-Sale Infrastructure" icon={Wrench} index={4}>
          <p className="text-muted-foreground mb-6">
            No marketplace monitors what happens <em>after</em> the sale. OpenDraft does. Our Site Doctor autonomously ensures deployed apps stay healthy — a critical differentiator that increases buyer confidence and repeat purchases.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Autonomous Health Monitoring
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Hourly HTTP health checks on all deployed sites</li>
                <li>• SPA routing validation (deep route testing)</li>
                <li>• Blank page / missing module detection</li>
                <li>• Runtime JavaScript error scanning</li>
                <li>• Rolling 50-entry health log per site</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI-Powered Diagnosis & Fix
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Gemini Flash analyzes issues + buyer reports</li>
                <li>• Auto-triggers Netlify rebuilds when possible</li>
                <li>• Chat-triggered: buyer says "broken" → doctor runs</li>
                <li>• Builder notified with diagnosis + fix suggestions</li>
                <li>• Tracks fix count and success rate per site</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Why this matters for revenue:</strong> Post-sale support is the #1 reason buyers leave negative reviews and request refunds on digital marketplaces. By automating monitoring and fixes, we reduce churn, increase Net Promoter Score, and build trust that drives repeat purchases and higher ASP (average selling price).
            </p>
          </div>
        </Slide>

        {/* Cloud Deployments — NEW */}
        <Slide title="One-Click Cloud Deployment" icon={CloudLightning} index={5}>
          <p className="text-muted-foreground mb-4">
            Buyers deploy purchased apps to production in under 60 seconds — no Git, no CLI, no DevOps. This removes the biggest friction point in digital product sales: <strong className="text-foreground">"I bought it, now what?"</strong>
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5 text-center">
              <p className="text-3xl font-black text-gradient mb-1">Netlify</p>
              <p className="text-xs text-muted-foreground">Source build + SPA routing</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5 text-center">
              <p className="text-3xl font-black text-gradient mb-1">Vercel</p>
              <p className="text-xs text-muted-foreground">Zero-config deploy</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5 text-center">
              <p className="text-3xl font-black text-gradient mb-1">GitHub</p>
              <p className="text-xs text-muted-foreground">Server-side ZIP fetch</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong className="text-foreground">Mobile-safe pipeline:</strong> Token-based auth bypasses OAuth redirect failures in mobile browsers</p>
            <p>• <strong className="text-foreground">Auto-configures:</strong> Injects _redirects, netlify.toml, vercel.json for SPA routing</p>
            <p>• <strong className="text-foreground">Auto-tracks:</strong> Every deployment registered for Site Doctor health monitoring</p>
            <p>• <strong className="text-foreground">Full lifecycle:</strong> Purchase → Deploy → Monitor → Fix — entirely autonomous</p>
          </div>
        </Slide>

        {/* Revenue Model */}
        <Slide title="Revenue Model" icon={DollarSign} index={6}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-foreground mb-2">Platform Fee</h3>
              <p className="text-4xl font-black text-gradient mb-1">20%</p>
              <p className="text-sm text-muted-foreground">Of every transaction. Sellers keep 80%.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Pricing Tiers</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">One-time</span> — Single purchase, instant delivery</p>
                <p><span className="font-semibold text-foreground">Monthly</span> — Recurring subscriptions ($15–$20/mo avg)</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Future Streams</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Featured Placements</span> — Promoted listings on X feed</p>
                <p><span className="font-semibold text-foreground">Enterprise API</span> — Agent fleet licensing</p>
                <p><span className="font-semibold text-foreground">Managed Deploys</span> — Premium hosting tier</p>
              </div>
            </div>
          </div>
        </Slide>

        {/* Forecasts */}
        <Slide title="Financial Projections" icon={TrendingUp} index={7}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Quarter", "Listings", "Subscriptions", "Agent Calls/mo", "GMV", "Revenue"]} />
              </thead>
              <tbody>
                <TableRow cells={["Q1", "100", "120", "5K", "$30K", "$6K"]} />
                <TableRow cells={["Q2", "300", "600", "50K", "$150K", "$30K"]} />
                <TableRow cells={["Q3", "700", "2,000", "500K", "$500K", "$100K"]} />
                <TableRow cells={["Q4", "1,500", "5,000", "2M", "$1.5M", "$300K"]} />
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <MetricCard label="Year 1 GMV" value="$2.2M" />
            <MetricCard label="Year 1 Revenue" value="$436K" />
            <MetricCard label="LTV:CAC" value="18:1" />
            <MetricCard label="Op. Headcount" value="0" sub="Fully automated" />
          </div>
        </Slide>

        {/* 3-Year */}
        <Slide title="3-Year Trajectory" icon={Rocket} index={8}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Year", "Listings", "Active Subs", "Agent Traffic", "GMV", "Revenue"]} />
              </thead>
              <tbody>
                <TableRow cells={["Y1", "1,500", "5,000", "15%", "$2.2M", "$436K"]} />
                <TableRow cells={["Y2", "8,000", "35,000", "40%", "$22M", "$4.4M"]} />
                <TableRow cells={["Y3", "20,000", "120,000", "65%", "$100M", "$20M"]} />
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mt-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Key driver:</strong> The automated flywheel means each new listing adds revenue capacity with zero marginal cost. Auto-promotion on X, auto-deployment, and auto-monitoring create a self-reinforcing growth loop that compounds — traditional marketplaces scale headcount linearly with GMV.
            </p>
          </div>
        </Slide>

        {/* Autonomous Strategy Engine */}
        <Slide title="Autonomous Operations Stack" icon={Brain} index={9}>
          <p className="text-muted-foreground mb-6">
            OpenDraft doesn't just sell software — it <strong className="text-foreground">runs itself</strong>. From strategic planning to daily operations, every layer is automated.
          </p>
          <div className="space-y-3 mb-6">
            <FlywheelStep emoji="📊" title="AI Board of Directors" desc="5 AI directors (CEO, CFO, CMO, CTO, CPO) analyze live metrics and generate prioritized strategic resolutions" />
            <FlywheelStep emoji="🐝" title="4-Agent Operations Swarm" desc="SEO, QA, Outreach, and Product agents execute autonomous scans and generate implementation specs" />
            <FlywheelStep emoji="🔄" title="Revenue Automation Engine" desc="Cron-driven: auto-approve listings, post to X, check milestones, transfer payouts — every 30 minutes" />
            <FlywheelStep emoji="⚕️" title="Site Doctor" desc="Hourly health checks, AI diagnosis, auto-fix, chat-triggered bug detection — zero human involvement" arrow={false} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard label="AI Directors" value="5" sub="Strategic planning" />
            <MetricCard label="Swarm Agents" value="4" sub="Operations execution" />
            <MetricCard label="Cron Jobs" value="7" sub="Continuous automation" />
            <MetricCard label="Human Input" value="0" sub="Fully autonomous" />
          </div>
        </Slide>

        {/* Competitive Landscape */}
        <Slide title="Competitive Landscape" icon={Globe} index={10}>
          <p className="text-muted-foreground mb-6">
            TrustMRR facilitates <strong className="text-foreground">$30M+/mo in GMV</strong> as a verification directory. But no platform handles the full lifecycle: list → promote → sell → deploy → monitor → fix.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Feature", "OpenDraft", "TrustMRR", "Gumroad", "LemonSqueezy"]} />
              </thead>
              <tbody>
                <TableRow cells={["Agent API (MCP)", "✅ 26 tools", "❌", "❌", "❌"]} />
                <TableRow cells={["Built-in Checkout", "✅ Stripe", "❌ External", "✅", "✅"]} />
                <TableRow cells={["Auto Social Promotion", "✅ X/Twitter", "❌", "❌", "❌"]} />
                <TableRow cells={["Cloud Deployment", "✅ Netlify/Vercel", "❌", "❌", "❌"]} />
                <TableRow cells={["Post-Sale Monitoring", "✅ Site Doctor", "❌", "❌", "❌"]} />
                <TableRow cells={["AI Auto-Fix", "✅ Gemini Flash", "❌", "❌", "❌"]} />
                <TableRow cells={["AI-Generated Supply", "✅", "❌", "❌", "❌"]} />
                <TableRow cells={["Fork & Remix Model", "✅", "❌", "❌", "❌"]} />
                <TableRow cells={["Webhook Subscriptions", "✅ Real-time", "❌", "✅", "✅"]} />
                <TableRow cells={["Zero-Ops Automation", "✅ 7 cron jobs", "❌", "❌", "❌"]} />
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Key insight:</strong> OpenDraft is the only platform that covers the <em>entire</em> software commerce lifecycle autonomously. Competitors handle at most 2 of 6 stages (list, promote, sell, deploy, monitor, fix). This full-stack approach creates switching costs and compounding network effects that are extremely difficult to replicate.
            </p>
          </div>
        </Slide>

        {/* Moat */}
        <Slide title="Competitive Moat" icon={Shield} index={11}>
          <div className="space-y-4">
            {[
              { t: "Agent-Native Infrastructure", d: "26 MCP tools, REST API, webhook subscriptions. No competitor has programmatic commerce for AI agents." },
              { t: "Full Lifecycle Automation", d: "List → auto-approve → auto-promote on X → agent discovery → deploy → monitor → fix. Zero human operators required." },
              { t: "Demand Signal Flywheel", d: "Every failed agent search → logged → feeds AI template generator → creates supply for next query. Self-healing marketplace." },
              { t: "Post-Sale Lock-In", d: "Buyers deploy via our infra and we monitor their sites 24/7. This creates ongoing value that Gumroad/Lemon can never match." },
              { t: "Autonomous Strategy Engine", d: "AI Board of Directors + 4-agent swarm + revenue automation. The platform strategizes, executes, and improves itself." },
            ].map((m) => (
              <div key={m.t} className="rounded-xl border border-border/40 bg-muted/20 p-5">
                <h3 className="font-bold text-foreground mb-1">{m.t}</h3>
                <p className="text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* Go-to-Market */}
        <Slide title="Go-to-Market" icon={Users} index={12}>
          <div className="space-y-3">
            {[
              { phase: "Phase 1 (Now ✅)", desc: "95+ live listings. Automated X promotion live. Site Doctor monitoring deployed. Revenue flywheel operational." },
              { phase: "Phase 2 (Q2)", desc: "Agent developer outreach — SDK packages, Claude Desktop configs, MCP registry listings on Smithery, Glama, MCP.so." },
              { phase: "Phase 3 (Q3+)", desc: "Enterprise agent fleet deals — bulk API access, managed deployment tier, custom procurement pipelines." },
            ].map((p) => (
              <div key={p.phase} className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{p.phase}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Slide>

        {/* The Ask */}
        <motion.section
          custom={13}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl gradient-hero p-6 sm:p-10 md:p-14 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary-foreground mb-3">The Ask</h2>
          <p className="text-4xl sm:text-6xl md:text-7xl font-black text-primary-foreground/90 mb-2">$1M</p>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-6">Seed round at $4.5M pre-money valuation</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">18mo</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Runway</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">~18%</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Dilution</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">90%</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Gross Margin</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">0</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Headcount Needed</p>
            </div>
          </div>
        </motion.section>

      </div>
      <Footer />
    </div>
  );
}
