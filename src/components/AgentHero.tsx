import { motion } from "framer-motion";
import { Bot, Zap, Search, ShoppingCart, Bell, Key, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const capabilities = [
  { icon: Search, label: "Search & discover", desc: "Find apps by keyword, category, tech stack, or price" },
  { icon: ShoppingCart, label: "Purchase & deploy", desc: "Initiate Stripe checkout and deliver apps to users" },
  { icon: Bell, label: "Webhook alerts", desc: "Get notified when new listings match your criteria" },
  { icon: Key, label: "Persistent API keys", desc: "Generate od_ keys that never expire for always-on agents" },
];

const MCP_URL = "https://xwumrdcagsuwqeelyxih.supabase.co/functions/v1/mcp-server";

export function AgentHero() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <Bot className="h-3.5 w-3.5" />
              Built for AI Agents
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center mb-4 leading-tight">
            Your agent's
            <span className="text-gradient"> app store</span>
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            17 MCP tools + REST API. Let your AI agent browse the marketplace, purchase apps,
            and deploy solutions — all programmatically. No human in the loop.
          </p>

          {/* Capabilities grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl border border-border/50 bg-card/50 p-4 text-center hover:border-primary/30 hover:shadow-glow transition-all"
              >
                <cap.icon className="h-5 w-5 text-primary mx-auto mb-2.5" />
                <p className="text-sm font-semibold mb-1">{cap.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{cap.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Code snippet */}
          <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-5 mb-8 max-w-2xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Connect in 2 lines
            </p>
            <pre className="text-sm font-mono text-foreground/80 overflow-x-auto leading-relaxed">
              <code>{`// claude_desktop_config.json
{
  "mcpServers": {
    "opendraft": { "url": "${MCP_URL}" }
  }
}`}</code>
            </pre>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/developers">
              <Button className="gradient-hero text-white border-0 shadow-glow gap-2">
                <Zap className="h-4 w-4" /> View API Docs
              </Button>
            </Link>
            <a href={MCP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Bot className="h-4 w-4" /> Try MCP Server
              </Button>
            </a>
            <a href="https://opendraft.lovable.app/.well-known/openapi.json" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="gap-1.5 text-muted-foreground">
                OpenAPI Spec <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
