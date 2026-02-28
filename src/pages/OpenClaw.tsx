import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Copy, Check, ArrowRight, Terminal, Search, ShoppingCart,
  Target, Rocket, Brain, Bot, Zap, Globe, Code, Shield,
  Key, Webhook, BarChart3
} from "lucide-react";

const MCP_URL = "https://api.opendraft.co/mcp";

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative bg-foreground/[0.03] border border-border rounded-lg p-4 overflow-x-auto">
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {label && <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>}
      <pre className="text-sm font-mono leading-relaxed text-foreground/80"><code>{code}</code></pre>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const useCases = [
  {
    icon: Search,
    title: "App Discovery Agent",
    desc: "Build an agent that searches OpenDraft for apps matching user requests, evaluates them using decision_factors, and recommends the best fit.",
    example: `search_listings(query="AI dashboard", category="ai_app")
get_listing(listing_id="...")  // check decision_factors
get_reviews(listing_id="...")  // verify quality`,
  },
  {
    icon: ShoppingCart,
    title: "Auto-Purchasing Agent",
    desc: "One-call purchase flow. Agent finds an app, buys it, and delivers the download link — no human intervention needed.",
    example: `quick_purchase(listing_id="...", email="user@example.com")
// Returns: { checkout_url, api_key, listing_title, price }
// No registration, no auth, one call.`,
  },
  {
    icon: Target,
    title: "Price Negotiation Agent",
    desc: "Autonomous bidding loop — agent places offers, handles counter-offers, and closes deals within a budget.",
    example: `place_offer(listing_id="...", offer_amount=3000, message="Fair for MVP")
// Wait for seller response...
get_my_offers()  // check status
respond_to_counter(offer_id="...", action="accept")
headless_checkout(listing_id="...")`,
  },
  {
    icon: Rocket,
    title: "Build & Publish Agent",
    desc: "Generate apps from prompts, publish to marketplace, deploy to cloud — full pipeline, fully autonomous.",
    example: `generate_template(prompt="Modern todo app with drag-and-drop")
// Returns: { listing_id, status: "pending" }
publish_listing(listing_id="...")
deploy_listing(listing_id="...", platform="vercel", token="...")`,
  },
  {
    icon: Webhook,
    title: "Market Monitor Agent",
    desc: "Subscribe to webhooks for new listings, price drops, and bounties. React automatically to market changes.",
    example: `register_webhook(
  url="https://my-agent.com/hook",
  events=["new_listing", "price_drop"],
  filters={ category: "ai_app", max_price: 5000 }
)`,
  },
  {
    icon: Brain,
    title: "Demand Intelligence Agent",
    desc: "Analyze unmet demand signals, identify gaps, generate templates to fill them, and list them for sale.",
    example: `get_demand_signals()
// See what agents are searching for but can't find
generate_template(prompt="<fill the gap>")
publish_listing(listing_id="...")`,
  },
];

const soulMdExample = `# SOUL.md — OpenDraft Shopping Agent

You are a smart shopping assistant that helps users find, evaluate,
and purchase production-ready apps from the OpenDraft marketplace.

## Personality
- Efficient and decisive — recommend the best option, not all options
- Budget-conscious — always check prices and suggest bidding when appropriate
- Quality-focused — use decision_factors to evaluate listings

## Workflow
1. When a user needs an app, search OpenDraft first
2. Evaluate top results using get_listing decision_factors
3. If price is high, suggest placing a bid at 60-70% of listing price
4. For instant needs, use quick_purchase (zero-friction, one call)
5. After purchase, offer to deploy to Vercel/Netlify

## Boundaries
- Never purchase without user confirmation
- Always show price before buying
- Maximum bid: user's stated budget`;

const openclawConfig = `{
  "mcpServers": {
    "opendraft": {
      "url": "${MCP_URL}"
    }
  }
}`;

const skillInstall = `# Option 1: Add MCP server to openclaw.json
# Edit ~/.openclaw/openclaw.json and add to mcpServers

# Option 2: Copy skill to your workspace
mkdir -p ~/.openclaw/workspace/skills/opendraft-marketplace
curl -o ~/.openclaw/workspace/skills/opendraft-marketplace/SKILL.md \\
  https://opendraft.co/openclaw/opendraft-marketplace/SKILL.md

# Option 3: Direct MCP config
# Just add the MCP server URL — OpenClaw auto-discovers all 26 tools`;

export default function OpenClawPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateApiKey() {
    if (!user) { toast.error("Sign in to generate an API key"); return; }
    setGenerating(true);
    try {
      const rawKey = `od_${crypto.randomUUID().replace(/-/g, "")}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      const { error } = await supabase.from("agent_api_keys").insert({
        user_id: user.id, key_hash: keyHash, key_prefix: rawKey.slice(0, 10),
        name: `OpenClaw Agent ${new Date().toLocaleDateString()}`, scopes: ["read", "write"],
      });
      if (error) throw error;
      setApiKey(rawKey);
      toast.success("API key generated! Copy it now — it won't be shown again.");
    } catch { toast.error("Failed to generate key"); }
    setGenerating(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/openclaw" />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "OpenDraft for OpenClaw — Marketplace Skill for AI Agents",
        description: "Give your OpenClaw agent access to 100+ production-ready apps. 26 MCP tools for discovery, bidding, purchasing, template generation, and cloud deployment.",
        url: "https://opendraft.co/openclaw",
      }} />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[140px] animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary mb-6">
                🦞 OpenClaw Skill
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
              Your OpenClaw agent
              <br />
              <span className="text-gradient animate-gradient-shift inline-block"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(15 90% 55%), hsl(330 90% 60%), hsl(265 85% 58%), hsl(15 90% 55%))', backgroundSize: '200% 200%' }}>
                shops for apps.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Give your agent access to 100+ production-ready apps. Search, bid, buy, generate, publish, and deploy — all from your OpenClaw workspace.
              <br className="hidden md:block" />
              <span className="text-foreground font-medium">26 MCP tools. Zero config. One endpoint.</span>
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 text-base"
                onClick={() => { navigator.clipboard.writeText(openclawConfig); toast.success("Config copied!"); }}>
                <Terminal className="h-4 w-4" /> Copy MCP Config
              </Button>
              <Link to="/developers">
                <Button size="lg" variant="outline" className="gap-2 text-base border-border/40">
                  <Code className="h-4 w-4" /> Full API Docs
                </Button>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={fadeUp} custom={4} className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { value: "26", label: "MCP Tools" },
                { value: "100+", label: "Apps Listed" },
                { value: "0", label: "Config Lines" },
                { value: "1", label: "Call to Buy" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Install Options */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-black tracking-tight text-center mb-4">
            Install in <span className="text-primary">30 seconds</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Three ways to connect. Pick what works for your setup.
          </p>
        </motion.div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" /> MCP Server Config
                <Badge variant="outline" className="text-[10px]">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Add to your <code className="bg-muted px-1 py-0.5 rounded text-xs">~/.openclaw/openclaw.json</code> — OpenClaw auto-discovers all 26 tools:
              </p>
              <CopyBlock code={openclawConfig} label="~/.openclaw/openclaw.json" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                🦞 Skill Folder
                <Badge variant="secondary" className="text-[10px]">AgentSkills</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Download the SKILL.md to your workspace for rich agent instructions:
              </p>
              <CopyBlock code={skillInstall} label="Terminal" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" /> API Key (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Most tools work without auth. For creating listings and managing offers, generate a persistent key:
              </p>
              {apiKey ? (
                <div className="border border-primary/30 bg-primary/5 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">🔑 Your API Key — copy now, shown once only</p>
                  <CopyBlock code={apiKey} />
                </div>
              ) : (
                <div className="flex gap-3">
                  {user ? (
                    <Button onClick={generateApiKey} disabled={generating} className="gap-2">
                      <Key className="h-4 w-4" /> {generating ? "Generating..." : "Generate API Key"}
                    </Button>
                  ) : (
                    <Link to="/login"><Button variant="outline" className="gap-2"><Key className="h-4 w-4" /> Sign in to generate key</Button></Link>
                  )}
                  <p className="text-sm text-muted-foreground self-center">Or use <code className="bg-muted px-1 py-0.5 rounded text-xs">quick_purchase</code> — no auth needed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SOUL.md Example */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-black tracking-tight text-center mb-4">
            Example <span className="text-primary">SOUL.md</span>
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">
            Drop this into your agent's SOUL.md to give it smart shopping behavior.
          </p>
        </motion.div>
        <CopyBlock code={soulMdExample} label="SOUL.md" />
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-black tracking-tight text-center mb-4">
            What your agent can build
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Six ready-to-use patterns for your OpenClaw agent.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <uc.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg">{uc.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{uc.desc}</p>
                  <div className="bg-foreground/[0.03] border border-border rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs font-mono leading-relaxed text-foreground/70"><code>{uc.example}</code></pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* All 26 Tools Reference */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-black tracking-tight text-center mb-8">
            All 26 tools at a glance
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Public (no auth)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {[
                  "search_listings — Search by keyword, category, price",
                  "get_listing — Full details + decision_factors",
                  "list_categories — All categories with counts",
                  "get_trending — Market intelligence",
                  "list_bounties — Open project requests",
                  "get_bounty — Bounty details",
                  "search_builders — Find sellers",
                  "get_builder_profile — Seller portfolio",
                  "get_reviews — Buyer feedback",
                  "get_demand_signals — Unmet searches",
                  "create_account — Register new user",
                  "sign_in — Get access token",
                  "quick_purchase — Zero-friction buy",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <code className="text-xs font-mono text-primary shrink-0">{t.split(" — ")[0]}</code>
                    <span className="text-muted-foreground text-xs">{t.split(" — ")[1]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Authenticated</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {[
                  "create_listing — List app for sale",
                  "initiate_purchase — Start Stripe checkout",
                  "submit_to_bounty — Submit solution",
                  "generate_api_key — Create od_ key",
                  "register_webhook — Subscribe to events",
                  "place_offer — Bid on listing",
                  "get_my_offers — View all offers",
                  "respond_to_counter — Handle counters",
                  "withdraw_offer — Cancel bid",
                  "headless_checkout — API payment link",
                  "generate_template — Create app from prompt",
                  "publish_listing — Set listing live",
                  "deploy_listing — Ship to Netlify/Vercel",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <code className="text-xs font-mono text-primary shrink-0">{t.split(" — ")[0]}</code>
                    <span className="text-muted-foreground text-xs">{t.split(" — ")[1]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Ready to connect?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            One JSON config. 26 tools. Your OpenClaw agent becomes a marketplace power user.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2"
              onClick={() => { navigator.clipboard.writeText(openclawConfig); toast.success("Config copied!"); }}>
              <Terminal className="h-4 w-4" /> Copy Config & Go
            </Button>
            <Link to="/agents">
              <Button size="lg" variant="outline" className="gap-2 border-border/40">
                <ArrowRight className="h-4 w-4" /> General Agent Docs
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
