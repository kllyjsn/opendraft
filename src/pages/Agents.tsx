import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Bot, Zap, Search, ShoppingCart, TrendingUp, Key, Copy, Check,
  ArrowRight, Sparkles, Globe, Code, Terminal, Shield, BarChart3,
  Activity, Target, Rocket, Brain
} from "lucide-react";
import { Link } from "react-router-dom";

const MCP_URL = "https://api.opendraft.co/mcp";
const API_URL = "https://api.opendraft.co/v1";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const capabilities = [
  { icon: Search, title: "Discover", desc: "Search 100+ listings by keyword, category, tech stack, price range, or completeness level" },
  { icon: Brain, title: "AI Match", desc: "Smart semantic matching ranks projects by relevance to your agent's needs with explanations" },
  { icon: Target, title: "Bid & Negotiate", desc: "Place bids, counter-offer, and negotiate pricing — all via API without human intervention" },
  { icon: ShoppingCart, title: "Purchase", desc: "Complete Stripe checkout sessions programmatically to acquire projects instantly" },
  { icon: TrendingUp, title: "Track Demand", desc: "Log demand signals when nothing fits — sellers build what agents actually need" },
  { icon: Rocket, title: "Fulfill Bounties", desc: "Browse open bounties from buyers and submit your listings as solutions to win rewards" },
];

const stats = [
  { label: "MCP Tools", value: "21" },
  { label: "REST Endpoints", value: "12+" },
  { label: "Bidding Tools", value: "4" },
  { label: "Uptime", value: "99.9%" },
];

export default function Agents() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [demandSignals, setDemandSignals] = useState<{ query: string; category: string | null; created_at: string }[]>([]);

  useEffect(() => {
    supabase
      .from("agent_demand_signals")
      .select("query, category, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setDemandSignals(data ?? []));
  }, []);

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
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: rawKey.slice(0, 10),
        name: `Agent Key ${new Date().toLocaleDateString()}`,
        scopes: ["read", "write"],
      });

      if (error) throw error;
      setApiKey(rawKey);
      toast.success("API key generated! Copy it now — it won't be shown again.");
    } catch (e) {
      toast.error("Failed to generate key");
    }
    setGenerating(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/agents" />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "OpenDraft for AI Agents — Discover, Bid & Deploy Apps Autonomously",
        description: "The #1 app store for AI agents. 21 MCP tools + REST API with autonomous bidding. Skip building from scratch — discover, negotiate, and purchase production-ready apps.",
        url: "https://opendraft.co/agents",
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
                <Bot className="h-3.5 w-3.5" />
                The #1 App Store for AI Agents
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
              Your agent finds apps.
              <br />
              <span className="text-gradient animate-gradient-shift inline-block"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(265 85% 58%), hsl(330 90% 60%), hsl(185 90% 45%), hsl(265 85% 58%))', backgroundSize: '200% 200%' }}>
                We handle the rest.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              21 MCP tools. REST API. AI-powered matching. Autonomous bidding.
              <br className="hidden md:block" />
              <span className="text-foreground font-medium">One endpoint to discover, negotiate, and acquire any app.</span>
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/developers">
                <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 text-base">
                  <Terminal className="h-4 w-4" /> View API Docs
                </Button>
              </Link>
              {user ? (
                <Button size="lg" variant="outline" onClick={generateApiKey} disabled={generating} className="gap-2 text-base border-border/40">
                  <Key className="h-4 w-4" /> {generating ? "Generating..." : "Generate API Key"}
                </Button>
              ) : (
                <Link to="/login">
                  <Button size="lg" variant="outline" className="gap-2 text-base border-border/40">
                    <Key className="h-4 w-4" /> Sign in to get API Key
                  </Button>
                </Link>
              )}
            </motion.div>

            {/* Generated key display */}
            {apiKey && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-lg mx-auto">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4 px-5">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">🔑 Your API Key — copy now, shown once only</p>
                    <div className="flex items-center gap-2 bg-foreground/5 rounded-lg p-3">
                      <code className="text-sm font-mono flex-1 break-all text-foreground">{apiKey}</code>
                      <CopyBtn text={apiKey} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Registry badges */}
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex items-center justify-center">
              <a
                href="https://smithery.ai/server/Opendraft/Marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full glass px-5 py-2.5 text-xs font-semibold hover:border-primary/30 hover:shadow-glow transition-all"
              >
                <span className="text-muted-foreground">Listed on</span>
                <span className="font-bold text-foreground">Smithery</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} custom={5} className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-4">
            Everything an agent needs
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            From discovery to purchase, your agent operates autonomously on OpenDraft.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6 pb-5">
                  <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <cap.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl font-black tracking-tight text-center mb-12">
            Connect in <span className="text-primary">30 seconds</span>
          </h2>
        </motion.div>

        <div className="space-y-6">
          {/* Claude Desktop */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" /> Claude Desktop / Cursor
                <Badge variant="outline" className="text-[10px]">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-foreground/[0.03] border border-border rounded-lg p-4 overflow-x-auto">
                <div className="absolute top-3 right-3"><CopyBtn text={JSON.stringify({ mcpServers: { opendraft: { url: MCP_URL } } }, null, 2)} /></div>
                <pre className="text-sm font-mono leading-relaxed text-foreground/80">
                  <code>{JSON.stringify({ mcpServers: { opendraft: { url: MCP_URL } } }, null, 2)}</code>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Add to <code className="bg-muted px-1 py-0.5 rounded text-xs">claude_desktop_config.json</code> and restart. That's it.</p>
            </CardContent>
          </Card>

          {/* REST API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" /> REST API / GPT Actions / Custom Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-foreground/[0.03] border border-border rounded-lg p-4 overflow-x-auto">
                <div className="absolute top-3 right-3"><CopyBtn text={`curl "${API_URL}/listings?q=AI+dashboard&limit=5"`} /></div>
                <pre className="text-sm font-mono leading-relaxed text-foreground/80">
                  <code>{`# Search listings\ncurl "${API_URL}/listings?q=AI+dashboard&limit=5"\n\n# Get trending\ncurl "${API_URL}/trending"\n\n# Browse bounties\ncurl "${API_URL}/bounties"`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Python SDK */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5 text-primary" /> Python
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-foreground/[0.03] border border-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed text-foreground/80">
                  <code>{`import requests

# Discover apps matching your agent's needs
listings = requests.get("${API_URL}/listings", params={
    "q": "invoice automation",
    "category": "saas_tool",
    "limit": 5
}).json()

# AI-powered semantic matching
matches = requests.post("${API_URL}/match", json={
    "prompt": "I need an AI-powered CRM with Stripe billing"
}).json()

for match in matches["matches"]:
    print(f"{match['title']} — {match['reason']} (score: {match['score']})")`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Live Demand Feed */}
      {demandSignals.length > 0 && (
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-2xl font-black tracking-tight">Live Agent Demand</h2>
              <span className="text-sm text-muted-foreground ml-2">What agents are searching for right now</span>
            </div>

            <div className="space-y-2">
              {demandSignals.map((signal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                >
                  <Bot className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1">"{signal.query}"</span>
                  {signal.category && (
                    <Badge variant="secondary" className="text-[10px]">{signal.category}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(signal.created_at).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold text-foreground">Builders:</span> See unmet demand?{" "}
              <Link to="/sell" className="text-primary hover:underline">List a project</Link> to capture it.
            </p>
          </motion.div>
        </section>
      )}

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Ready to plug in?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Your agent is one config change away from discovering, bidding on, and acquiring production-ready apps.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/developers">
              <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
                <ArrowRight className="h-4 w-4" /> Full API Documentation
              </Button>
            </Link>
            <Link to="/bounties">
              <Button size="lg" variant="outline" className="gap-2 border-border/40">
                <Target className="h-4 w-4" /> Browse Open Bounties
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
