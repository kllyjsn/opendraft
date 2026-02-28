import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Users, Zap, DollarSign, Globe, Bot, Shield, Rocket, Target, Brain, ArrowRight } from "lucide-react";
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
              The first app store where AI agents autonomously discover, bid on, and purchase software.
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
            <li className="flex gap-3"><span className="text-destructive font-bold">4.</span> No platform connects autonomous AI demand with human-built supply at scale.</li>
          </ul>
        </Slide>

        {/* Solution */}
        <Slide title="The Solution" icon={Zap} index={1}>
          <p className="text-muted-foreground mb-4">
            A two-sided marketplace with full programmatic access — MCP server, REST API, webhooks — so both humans <strong className="text-foreground">and AI agents</strong> can browse, negotiate, and purchase autonomously.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <MetricCard label="MCP Tools" value="23" sub="Full agent toolkit" />
            <MetricCard label="REST Endpoints" value="12+" sub="Including bidding" />
            <MetricCard label="Webhook Events" value="Real-time" sub="Agent subscriptions" />
            <MetricCard label="Live Listings" value="92" sub="Across 5 categories" />
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
            Gartner projects 15B+ autonomous agent instances by 2030. As agents proliferate, their procurement infrastructure becomes a critical choke point — and a massive revenue opportunity. OpenDraft is the first-mover building this layer.
          </p>
        </Slide>

        {/* Revenue Model */}
        <Slide title="Revenue Model" icon={DollarSign} index={3}>
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
                <p><span className="font-semibold text-foreground">Featured Placements</span> — Promoted listings</p>
                <p><span className="font-semibold text-foreground">Enterprise API</span> — Agent fleet licensing</p>
              </div>
            </div>
          </div>
        </Slide>

        {/* Forecasts */}
        <Slide title="Financial Projections" icon={TrendingUp} index={4}>
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">
            <MetricCard label="Year 1 GMV" value="$2.2M" />
            <MetricCard label="Year 1 Revenue" value="$436K" />
            <MetricCard label="LTV:CAC" value="18:1" />
          </div>
        </Slide>

        {/* 3-Year */}
        <Slide title="3-Year Trajectory" icon={Rocket} index={5}>
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
        </Slide>

        {/* AI Boardroom → Spec Pipeline (NEW) */}
        <Slide title="Autonomous Strategy Engine" icon={Brain} index={6}>
          <p className="text-muted-foreground mb-6">
            OpenDraft runs itself. An AI Board of Directors analyzes live platform metrics and generates strategic resolutions — then converts them into implementation-ready specs with one click.
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Live Metrics Ingestion</p>
                <p className="text-xs text-muted-foreground">Revenue, listings, agent traffic, conversion rates pulled in real-time</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg">🧠</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">5 AI Directors Deliberate</p>
                <p className="text-xs text-muted-foreground">CEO, CFO, CMO, CTO, CPO — each with specialized perspectives and KPIs</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg">📋</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Prioritized Board Resolution</p>
                <p className="text-xs text-muted-foreground">P0–P2 initiatives with revenue impact projections and ownership assignments</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="h-9 w-9 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                <span className="text-lg">⚡</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">One-Click Implementation Spec</p>
                <p className="text-xs text-muted-foreground">Each initiative generates a structured Markdown prompt → paste into Lovable/Cursor → built</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard label="AI Directors" value="5" sub="Specialized agents" />
            <MetricCard label="Swarm Agents" value="4" sub="SEO, QA, Outreach, Product" />
            <MetricCard label="Automation" value="90%+" sub="Strategy-to-spec pipeline" />
            <MetricCard label="Human Input" value="1 click" sub="Approve & implement" />
          </div>
        </Slide>

        {/* Moat */}
        <Slide title="Competitive Moat" icon={Shield} index={7}>
          <div className="space-y-4">
            {[
              { t: "Agent-Native Infrastructure", d: "23 MCP tools, REST API with autonomous bidding, webhook subscriptions. No competitor has this." },
              { t: "Demand Signal Flywheel", d: "Every failed agent search → logged → feeds AI template generator → creates supply for next query." },
              { t: "Autonomous Strategy Engine", d: "AI Board of Directors + 4-agent operations swarm. The platform strategizes, prioritizes, and specs its own improvements." },
              { t: "Network Effects", d: "More agents → more demand signals → better templates → more agents. Compounds exponentially." },
            ].map((m) => (
              <div key={m.t} className="rounded-xl border border-border/40 bg-muted/20 p-5">
                <h3 className="font-bold text-foreground mb-1">{m.t}</h3>
                <p className="text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* Go-to-Market */}
        <Slide title="Go-to-Market" icon={Users} index={8}>
          <div className="space-y-3">
            {[
              { phase: "Phase 1 (Now)", desc: "92 live listings. AI-generated supply seeding. Targeting Lovable, Cursor, and Bolt builders." },
              { phase: "Phase 2 (Q2)", desc: "Agent developer outreach — SDK packages, Claude Desktop configs, MCP registry listing." },
              { phase: "Phase 3 (Q3+)", desc: "Enterprise agent fleet deals — bulk API access, custom procurement pipelines for agent swarms." },
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
          custom={9}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl gradient-hero p-6 sm:p-10 md:p-14 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary-foreground mb-3">The Ask</h2>
          <p className="text-4xl sm:text-6xl md:text-7xl font-black text-primary-foreground/90 mb-2">$1M</p>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-6">Seed round at $4.5M pre-money valuation</p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
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
          </div>
        </motion.section>

      </div>
      <Footer />
    </div>
  );
}
