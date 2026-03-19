import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Lightbulb, Rocket, Sparkles, Zap, Brain, Layout, FileText,
  Wand2, ArrowRight, Building2, Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewBuild {
  name: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface PreviewCompany {
  name: string;
  domain: string;
  industry: string;
  icon: typeof Building2;
  summary: string;
  insights: { title: string; description: string }[];
  builds: PreviewBuild[];
}

const CATEGORY_ICON: Record<string, typeof Zap> = {
  saas_tool: Zap,
  ai_app: Brain,
  landing_page: Layout,
  utility: FileText,
  other: Sparkles,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-primary/30 bg-primary/5",
  medium: "border-accent/30 bg-accent/5",
  low: "border-border bg-muted/30",
};

const PRIORITY_TAG: Record<string, string> = {
  high: "bg-primary/15 text-primary",
  medium: "bg-accent/15 text-accent",
  low: "bg-muted text-muted-foreground",
};

const COMPANIES: PreviewCompany[] = [
  {
    name: "Goldman Sachs",
    domain: "goldmansachs.com",
    industry: "Investment Banking & Financial Services",
    icon: Building2,
    summary: "Global financial institution — we identified 4 high-impact apps that would make any ops lead look like a visionary.",
    insights: [
      { title: "Client onboarding is slow", description: "Multi-step KYC and compliance checks create bottlenecks. Fix this and you're the person who cut processing time by 60%." },
      { title: "Deal pipeline lacks visibility", description: "Analysts track deals across spreadsheets. Build the dashboard and leadership notices you first." },
      { title: "Compliance reporting is manual", description: "Regulatory reports are assembled by hand. Automate it and you'll save your team 20+ hours/week." },
    ],
    builds: [
      { name: "Client Onboarding Portal", description: "KYC document collection, identity verification, and milestone tracking in one branded portal.", category: "saas_tool", priority: "high" },
      { name: "AI Deal Memo Generator", description: "Feed in term sheets and financials — get a structured investment memo draft in seconds.", category: "ai_app", priority: "high" },
      { name: "Compliance Dashboard", description: "Real-time regulatory filing tracker with automated deadline alerts and audit trail.", category: "utility", priority: "medium" },
      { name: "Investor Relations Page", description: "Dynamic IR landing page with earnings data, SEC filings, and analyst coverage.", category: "landing_page", priority: "medium" },
    ],
  },
  {
    name: "Mike's Bikes",
    domain: "mikesbikes.com",
    industry: "Bicycle Retail & Service",
    icon: Bike,
    summary: "Multi-location bike shop — we found 4 apps that would make the operations manager a legend.",
    insights: [
      { title: "Service bookings are phone-only", description: "Customers call to schedule tune-ups. Fix this and you eliminate phone tag — your team thanks you, your boss notices." },
      { title: "Inventory is tracked in spreadsheets", description: "Stock levels across locations aren't synced. Build the dashboard and you're the one who prevented the next stockout crisis." },
      { title: "No loyalty program", description: "Repeat customers get no recognition. Launch a points system and revenue goes up — along with your reputation." },
    ],
    builds: [
      { name: "Bike Service Scheduler", description: "Online booking for tune-ups, repairs, and fittings with calendar sync and automated reminders.", category: "saas_tool", priority: "high" },
      { name: "AI Bike Fit Advisor", description: "Customers answer questions about their riding style and get personalized bike and size recommendations.", category: "ai_app", priority: "high" },
      { name: "Multi-Store Inventory Tracker", description: "Real-time stock levels across all locations with low-stock alerts and transfer suggestions.", category: "utility", priority: "medium" },
      { name: "Loyalty & Rewards Portal", description: "Points for purchases and service visits, redeemable for gear, accessories, and priority service.", category: "saas_tool", priority: "medium" },
    ],
  },
];

export function AnalysisShowcase() {
  const [active, setActive] = useState(0);
  const company = COMPANIES[active];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary/80 mb-4">See it work</p>
          <h2 className="text-2xl md:text-4xl lg:text-[2.75rem] font-black tracking-[-0.03em] leading-[1.1] mb-4">
            One URL.
            <br />
            <span className="text-muted-foreground">Four apps. Ninety seconds.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Real companies. Real recommendations. Every business has software it should own.
          </p>
        </motion.div>

        {/* Company tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {COMPANIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={c.domain}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  active === i
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Results preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={company.domain}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto"
          >
            {/* Mock browser chrome */}
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 bg-muted/30">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                </div>
                <div className="flex-1 flex items-center gap-2 rounded-lg bg-background/60 border border-border/30 px-3 py-1">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{company.domain}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-6">
                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      <Sparkles className="h-3 w-3" />
                      {company.industry}
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{company.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{company.summary}</p>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {company.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="rounded-xl border border-border/40 bg-background/60 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold leading-tight">{insight.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{insight.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recommended builds */}
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5" />
                  Apps we'd build for {company.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.builds.map((build, i) => {
                    const Icon = CATEGORY_ICON[build.category] || Sparkles;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-2xl border p-4 transition-all duration-300 ${PRIORITY_STYLES[build.priority]}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="rounded-xl bg-background/80 border border-border/50 p-2 shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="text-sm font-bold truncate">{build.name}</p>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PRIORITY_TAG[build.priority]}`}>
                                {build.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{build.description}</p>
                          </div>
                        </div>
                        <div className="h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary gap-1.5">
                          <Wand2 className="h-3 w-3" />
                          Generate this app
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA below preview */}
            <div className="text-center mt-8">
              <Button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
                  if (input) { input.focus(); input.scrollIntoView({ behavior: "smooth", block: "center" }); }
                }}
                className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-11 px-6 text-sm font-bold rounded-xl"
              >
                Try it with your site
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
