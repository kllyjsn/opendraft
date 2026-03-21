import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Users, Zap, DollarSign, Globe, Shield, Rocket, Target, Brain, ArrowRight, Activity, Wrench, CloudLightning, Ban, Crown, Building2, BarChart3 } from "lucide-react";
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
            <p className="text-sm font-bold tracking-widest uppercase text-primary mb-4">The Anti-SaaS Movement</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-4">
              Stop Renting Software.
              <br />
              <span className="text-gradient">Start Owning It.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
              Every company deserves software built for them — not generic SaaS designed for nobody in particular.
              OpenDraft makes it possible for anyone, without code.
            </p>
            <p className="text-sm font-semibold text-gradient">Seed Round · 2026</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-24 space-y-10 max-w-4xl">

        {/* The Problem */}
        <Slide title="The $300B Problem" icon={Ban} index={0}>
          <p className="text-muted-foreground mb-6">
            Every company in the world rents generic software. They pay per-seat fees forever for tools that don't match their brand, workflow, or ambitions.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { pain: "Per-Seat Pricing", detail: "A 50-person company pays $50K+/yr for tools they barely customize" },
              { pain: "Vendor Lock-In", detail: "Your data, workflows, and integrations are hostage to renewal" },
              { pain: "Generic by Design", detail: "SaaS serves millions — it will never perfectly fit YOUR business" },
              { pain: "Zero Ownership", detail: "Cancel your subscription, lose everything you built" },
            ].map((p) => (
              <div key={p.pain} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-bold text-foreground text-sm mb-1">{p.pain}</p>
                <p className="text-xs text-muted-foreground">{p.detail}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">The shift is already happening:</strong> 2M+ "vibe coders" are using AI tools (Lovable, Cursor, Bolt, Replit) to build custom software in hours instead of months. OpenDraft is the <strong className="text-foreground">distribution and deployment layer</strong> for this ownership economy.
            </p>
          </div>
        </Slide>

        {/* The Solution */}
        <Slide title="The Solution" icon={Zap} index={1}>
          <p className="text-lg font-bold text-foreground mb-2">
            Replace the SaaS you rent with software you own.
          </p>
          <p className="text-muted-foreground mb-6">
            Describe what your company needs → OpenDraft builds it → deploy in 60 seconds → own the source code forever. No coding. No agencies. No subscriptions.
          </p>
          <div className="space-y-3 mb-6">
            <FlywheelStep emoji="🔗" title="Paste your business URL" desc="AI analyzes your business and recommends exactly what to build" />
            <FlywheelStep emoji="⚡" title="Generate or browse templates" desc="AI-built apps across 12 industries — booking, CRM, ordering, portfolios, and more" />
            <FlywheelStep emoji="☁️" title="One-click deploy to production" desc="Live on Netlify or Vercel in under 60 seconds — no Git, no CLI, no DevOps" />
            <FlywheelStep emoji="🔧" title="Autonomous monitoring & fixes" desc="Site Doctor checks 24/7, AI diagnoses issues, auto-repairs when possible" arrow={false} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard label="Time to Deploy" value="<60s" sub="From purchase to live" />
            <MetricCard label="Cost vs Agency" value="99%" sub="Less expensive" />
            <MetricCard label="Source Code" value="Yours" sub="Own it forever" />
            <MetricCard label="Coding Required" value="Zero" sub="AI does the work" />
          </div>
        </Slide>

        {/* Why Now */}
        <Slide title="Why Now" icon={Activity} index={2}>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="text-3xl font-black text-gradient mb-2">2M+</p>
              <p className="font-bold text-foreground text-sm mb-1">Vibe Coders</p>
              <p className="text-xs text-muted-foreground">AI-powered builders creating production-quality software daily — a new creator class without a distribution platform</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="text-3xl font-black text-gradient mb-2">$300B</p>
              <p className="font-bold text-foreground text-sm mb-1">SaaS Spend</p>
              <p className="text-xs text-muted-foreground">Global SaaS market growing 15% annually — and buyers are increasingly frustrated with per-seat pricing and lock-in</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="text-3xl font-black text-gradient mb-2">33M</p>
              <p className="font-bold text-foreground text-sm mb-1">US SMBs</p>
              <p className="text-xs text-muted-foreground">Small businesses spending ~$75B/yr on websites and apps, most paying $5K–$15K to agencies for basic tools</p>
            </div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">The convergence:</strong> AI can now generate production-quality software. Distribution is the bottleneck, not creation. OpenDraft is the first platform purpose-built to connect AI-generated software with the businesses that need it.
            </p>
          </div>
        </Slide>

        {/* Market Opportunity */}
        <Slide title="Market Opportunity" icon={Globe} index={3}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <MetricCard label="TAM" value="$300B+" sub="Global SaaS spend" />
            <MetricCard label="SAM" value="$25B" sub="SMB + corporate tools" />
            <MetricCard label="SOM Y1" value="$3M" sub="ARR target" />
            <MetricCard label="SaaS Replaced" value="∞" sub="Every subscription" />
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Segment", "Size", "Our Angle"]} />
              </thead>
              <tbody>
                <TableRow cells={["SMB App Spend (US)", "$75B/yr", "Replace agency + SaaS at 1% the cost"]} />
                <TableRow cells={["Corporate Internal Tools", "$10B+", "Employees build custom tools, get promoted"]} />
                <TableRow cells={["Freelancer/Agency Market", "$50B", "White-label custom apps for clients"]} />
                <TableRow cells={["AI Builder Economy", "$8B", "2M+ vibe coders need distribution"]} />
              </tbody>
            </table>
          </div>
        </Slide>

        {/* The Hook */}
        <Slide title="The Hook That Sells" icon={Crown} index={4}>
          <div className="text-center py-6 mb-6">
            <p className="text-3xl md:text-4xl font-black text-foreground mb-3">
              "Improve your company.<br />
              <span className="text-gradient">Get promoted."</span>
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every employee who deploys better software for their team looks like a hero. 
              Every business owner who replaces $500/mo in SaaS with a $49 one-time purchase sees immediate ROI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">For the employee</p>
              <p className="text-sm text-muted-foreground">
                You find your company's scheduling system clunky. Instead of submitting a helpdesk ticket, you build a custom replacement on OpenDraft in 10 minutes. Your manager asks how. You're the office hero.
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">For the SMB owner</p>
              <p className="text-sm text-muted-foreground">
                You're a salon owner paying $75/mo for Vagaro. You find a custom booking app on OpenDraft for $49 — one time. It has your branding, your colors, your name. You own it forever. You just saved $900/yr.
              </p>
            </div>
          </div>
        </Slide>

        {/* Revenue Model */}
        <Slide title="Revenue Model" icon={DollarSign} index={5}>
          <p className="text-muted-foreground mb-6">
            Built for the ownership economy. We charge <strong className="text-foreground">less than any single SaaS tool we replace</strong>.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Tier", "Price", "What You Get", "Margin"]} />
              </thead>
              <tbody>
                <TableRow cells={["Free", "$0", "1 app, community templates", "—"]} />
                <TableRow cells={["Builder", "$29/mo", "Unlimited apps, priority AI, custom domains", "95%"]} />
                <TableRow cells={["Team", "$99/mo", "5 seats, shared workspace, analytics", "95%"]} />
                <TableRow cells={["Enterprise", "$499/mo", "Unlimited seats, SSO, SLA, integrations", "95%"]} />
                <TableRow cells={["Marketplace", "$9–$199", "One-time templates (80% to creator)", "80%"]} />
                <TableRow cells={["Managed Hosting", "$15/mo/site", "Monitoring, SSL, CDN, auto-fix", "70%"]} />
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">The math is obvious:</strong> A $29/mo OpenDraft subscription replaces $500+/mo in SaaS spending. The customer saves money. We build a recurring revenue engine. Creators earn 80% on every template sale. Everyone wins.
            </p>
          </div>
        </Slide>

        {/* SaaS Replacement Examples */}
        <Slide title="What We Replace" icon={Building2} index={6}>
          <p className="text-muted-foreground mb-6">
            Every vertical has expensive SaaS subscriptions that OpenDraft replaces with owned software at a fraction of the cost.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Industry", "SaaS They Rent", "Monthly Cost", "OpenDraft", "Annual Savings"]} />
              </thead>
              <tbody>
                <TableRow cells={["Salon", "Vagaro / Mindbody", "$75–$150/mo", "$49 once", "$900–$1,800"]} />
                <TableRow cells={["Restaurant", "Toast / Square", "$100–$200/mo", "$69 once", "$1,200–$2,400"]} />
                <TableRow cells={["Real Estate", "Zillow Premier", "$500+/mo", "$99 once", "$6,000+"]} />
                <TableRow cells={["Fitness", "Mindbody", "$150/mo", "$49 once", "$1,800"]} />
                <TableRow cells={["Healthcare", "Dentrix", "$400/mo", "$99 once", "$4,800"]} />
                <TableRow cells={["Auto Repair", "Shop-Ware", "$300/mo", "$69 once", "$3,600"]} />
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <MetricCard label="Avg SaaS Cost" value="$200/mo" sub="Per tool, per business" />
            <MetricCard label="OpenDraft Cost" value="$49" sub="One-time, own forever" />
            <MetricCard label="Year 1 Savings" value="$2,400" sub="Per business, per tool" />
          </div>
        </Slide>

        {/* Full Lifecycle */}
        <Slide title="Full Lifecycle Platform" icon={Wrench} index={7}>
          <p className="text-muted-foreground mb-6">
            No competitor covers the complete journey. We own every step from idea to running production app.
          </p>
          <div className="space-y-3 mb-6">
            <FlywheelStep emoji="🔍" title="Discover" desc="Business URL analyzer recommends exactly what to build based on your company" />
            <FlywheelStep emoji="⚡" title="Generate" desc="AI creates complete, production-ready apps — or browse 95+ expert-built templates" />
            <FlywheelStep emoji="💰" title="Purchase" desc="One-time purchase or subscription — source code delivered instantly" />
            <FlywheelStep emoji="☁️" title="Deploy" desc="One-click to Netlify or Vercel — live in under 60 seconds, no DevOps" />
            <FlywheelStep emoji="🔧" title="Monitor & Fix" desc="Site Doctor checks 24/7, AI diagnoses issues, auto-repairs when possible" arrow={false} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Lifecycle Stage", "OpenDraft", "Gumroad", "Vercel", "Agencies"]} />
              </thead>
              <tbody>
                <TableRow cells={["AI Generation", "✅", "❌", "❌", "❌"]} />
                <TableRow cells={["Business Analysis", "✅", "❌", "❌", "Manual"]} />
                <TableRow cells={["Marketplace", "✅", "✅", "Partial", "❌"]} />
                <TableRow cells={["One-Click Deploy", "✅", "❌", "✅", "❌"]} />
                <TableRow cells={["Health Monitoring", "✅", "❌", "❌", "Paid"]} />
                <TableRow cells={["AI Auto-Fix", "✅", "❌", "❌", "❌"]} />
                <TableRow cells={["Source Ownership", "✅", "Varies", "✅", "Varies"]} />
                <TableRow cells={["Marketing Kit", "✅", "❌", "❌", "Paid"]} />
              </tbody>
            </table>
          </div>
        </Slide>

        {/* GTM Strategy */}
        <Slide title="Go-to-Market" icon={Users} index={8}>
          <p className="text-muted-foreground mb-6">
            We don't sell to developers. We sell to the <strong className="text-foreground">99% of people who aren't developers</strong> but know their company needs better software.
          </p>
          <div className="space-y-3 mb-6">
            {[
              { phase: "Phase 1 — SMB Verticals (Now ✅)", items: [
                "12 industry verticals with personalized recommendations via Business URL Analyzer",
                "95+ templates covering booking, ordering, CRM, portfolios, loyalty, and invoicing",
                "One-click deploy: business owners go from browse → live site in <60 seconds",
                "Founder First Program: 0% fees for first 100 creators to seed supply",
              ]},
              { phase: "Phase 2 — Demand Generation (Q2)", items: [
                "SEO: \"[industry] app alternative\" landing pages — target searchers already frustrated with SaaS",
                "Content: \"How [Business] saved $6K/yr by ditching [SaaS]\" case studies and ROI calculators",
                "Outreach Swarm: auto-discover SMBs → personalized emails with matching templates and savings projections",
                "Viral loop: deployed sites include 'Built on OpenDraft' badge → organic discovery",
              ]},
              { phase: "Phase 3 — Enterprise & Scale (Q3+)", items: [
                "Enterprise plans for companies replacing multiple SaaS tools across departments",
                "Agency channel: white-label custom apps for client portfolios",
                "AI 'SaaS Audit': connect your billing → see exactly how much you could save",
                "International expansion — SaaS fatigue is global",
              ]},
            ].map((p) => (
              <div key={p.phase} className="rounded-xl border border-border/40 bg-muted/20 p-5">
                <p className="font-bold text-foreground text-sm mb-3">{p.phase}</p>
                <ul className="space-y-1.5">
                  {p.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary font-bold shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard label="Target SMBs" value="33M" sub="In the US alone" />
            <MetricCard label="Avg Agency Cost" value="$10K" sub="Our price: $0–$99" />
            <MetricCard label="CAC Target" value="<$5" sub="Organic + auto-outreach" />
            <MetricCard label="LTV:CAC" value="20:1" sub="Subscription model" />
          </div>
        </Slide>

        {/* Financial Projections */}
        <Slide title="Financial Projections" icon={BarChart3} index={9}>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Quarter", "Free Users", "Paid Subs", "Deployed Sites", "MRR", "Revenue"]} />
              </thead>
              <tbody>
                <TableRow cells={["Q1", "2,000", "200", "500", "$8K", "$24K"]} />
                <TableRow cells={["Q2", "8,000", "800", "2,000", "$32K", "$96K"]} />
                <TableRow cells={["Q3", "25,000", "3,000", "8,000", "$120K", "$360K"]} />
                <TableRow cells={["Q4", "60,000", "8,600", "20,000", "$250K", "$750K"]} />
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <MetricCard label="Year 1" value="$1.2M" sub="Revenue" />
            <MetricCard label="Year 2" value="$8M" sub="ARR" />
            <MetricCard label="Year 3" value="$30M" sub="ARR" />
            <MetricCard label="Gross Margin" value="90%+" />
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Growth driver:</strong> Every deployed site is a billboard. Every employee who deploys becomes an internal champion. Every business that saves money tells their network. Organic compounding at near-zero marginal cost — because the platform runs itself.
            </p>
          </div>
        </Slide>

        {/* 3-Year Trajectory */}
        <Slide title="3-Year Trajectory" icon={Rocket} index={10}>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <TableRow header cells={["Year", "Paid Users", "Deployed Sites", "SaaS Replaced", "ARR"]} />
              </thead>
              <tbody>
                <TableRow cells={["Y1", "8,600", "20,000", "$48M saved", "$1.2M"]} />
                <TableRow cells={["Y2", "50,000", "120,000", "$288M saved", "$8M"]} />
                <TableRow cells={["Y3", "200,000", "500,000", "$1.2B saved", "$30M"]} />
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">The flywheel:</strong> More users → more templates → more verticals covered → more SaaS replaced → more savings stories → more users. Combined with autonomous operations (zero marginal headcount per user), this creates a margin structure traditional SaaS companies can't match.
            </p>
          </div>
        </Slide>

        {/* Competitive Moat */}
        <Slide title="Competitive Moat" icon={Shield} index={11}>
          <div className="space-y-4">
            {[
              { t: "Anti-SaaS Positioning", d: "The only platform explicitly built to replace SaaS subscriptions with owned software. Competitors sell to developers — we sell to the 99% who aren't." },
              { t: "Full Lifecycle Ownership", d: "Discover → Generate → Deploy → Monitor → Fix → Improve. No competitor covers the complete journey from business need to running production app." },
              { t: "Business URL Intelligence", d: "Paste your website, get a personalized software recommendation. This 'magic moment' converts browsers to buyers at 3-5x industry rates." },
              { t: "Self-Healing Infrastructure", d: "Site Doctor + AI auto-fix means deployed apps improve autonomously. This creates ongoing value that justifies managed hosting revenue." },
              { t: "Creator Economy Flywheel", d: "Builders earn 80% on templates. More builders → more templates → more industry coverage → more customers → more builders." },
              { t: "Quantifiable ROI", d: "Every customer can calculate exact savings: 'You spend $X/yr on SaaS. OpenDraft costs $Y. You save $Z.' The sale is a math problem." },
            ].map((m) => (
              <div key={m.t} className="rounded-xl border border-border/40 bg-muted/20 p-5">
                <h3 className="font-bold text-foreground mb-1">{m.t}</h3>
                <p className="text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* Autonomous Ops */}
        <Slide title="Zero-Headcount Operations" icon={Brain} index={12}>
          <p className="text-muted-foreground mb-6">
            OpenDraft doesn't just sell software — it <strong className="text-foreground">runs itself</strong>. This isn't aspirational; it's operational today.
          </p>
          <div className="space-y-3 mb-6">
            <FlywheelStep emoji="📝" title="Auto-approve listings" desc="Quality gate checks in ≤30 minutes — zero human review" />
            <FlywheelStep emoji="📣" title="Auto-promote on X/Twitter" desc="20+ randomized posts/week — new listings, milestones, trending, stats" />
            <FlywheelStep emoji="⚕️" title="Site Doctor monitors 24/7" desc="Hourly health checks, AI diagnosis, auto-fix — zero support staff" />
            <FlywheelStep emoji="💸" title="Auto-transfer payouts" desc="Stripe Connect handles all creator payments — zero accounting" arrow={false} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard label="Cron Jobs" value="4" sub="Run the platform" />
            <MetricCard label="Support Staff" value="0" sub="AI handles it" />
            <MetricCard label="Content Staff" value="0" sub="Auto-generated" />
            <MetricCard label="Ops Cost" value="~$0" sub="Near-zero marginal" />
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
          <p className="text-sm font-bold tracking-widest uppercase text-primary-foreground/60 mb-3">The Ask</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary-foreground mb-3">
            Join the Anti-SaaS Movement
          </h2>
          <p className="text-4xl sm:text-6xl md:text-7xl font-black text-primary-foreground/90 mb-2">$2M</p>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-8">Seed round at $8M pre-money valuation</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">24mo</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Runway</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">~20%</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Dilution</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">90%+</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Gross Margin</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-primary-foreground">0</p>
              <p className="text-[10px] sm:text-xs text-primary-foreground/70">Headcount Needed</p>
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-xs text-primary-foreground/60">
              60% Growth · 25% Product · 15% Operations
            </p>
          </div>
        </motion.section>

      </div>
      <Footer />
    </div>
  );
}
