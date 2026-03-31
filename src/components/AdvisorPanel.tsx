import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
  Sparkles,
  Target,
  DollarSign,
} from "lucide-react";

interface AdvisorInsight {
  icon: React.ReactNode;
  title: string;
  advice: string;
  category: "growth" | "savings" | "security" | "quick-win";
}

interface AdvisorPanelProps {
  businessName?: string;
  industry?: string;
  saasReplacements?: Array<{ tool_name: string; monthly_cost: number }>;
  recommendedApps?: Array<{ title: string; description: string }>;
}

function generateInsights(props: AdvisorPanelProps): AdvisorInsight[] {
  const { businessName, industry, saasReplacements, recommendedApps } = props;
  const name = businessName || "your business";
  const insights: AdvisorInsight[] = [];

  // Savings insight
  if (saasReplacements?.length) {
    const total = saasReplacements.reduce((s, r) => s + (r.monthly_cost || 0), 0);
    const topTool = saasReplacements.sort((a, b) => b.monthly_cost - a.monthly_cost)[0];
    insights.push({
      icon: <DollarSign className="h-4 w-4" />,
      title: "Biggest savings opportunity",
      advice: `${topTool.tool_name} costs you ~$${topTool.monthly_cost}/mo. Build a custom replacement and own it forever — eliminating $${(topTool.monthly_cost * 12).toLocaleString()}/year in subscription fees.`,
      category: "savings",
    });
  }

  // Growth insight
  insights.push({
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Growth lever",
    advice: `${industry || "Your"} businesses that own their customer-facing tools see 3x higher retention. Start with a client portal — it becomes your competitive moat.`,
    category: "growth",
  });

  // Security insight
  insights.push({
    icon: <Shield className="h-4 w-4" />,
    title: "Compliance advantage",
    advice: `With owned software, ${name} controls all data flows. No third-party processors, no shared infrastructure. SOC 2 and GDPR compliance becomes dramatically simpler.`,
    category: "security",
  });

  // Quick win
  if (recommendedApps?.length) {
    const firstApp = recommendedApps[0];
    insights.push({
      icon: <Zap className="h-4 w-4" />,
      title: "Quick win — ship today",
      advice: `"${firstApp.title}" can be live in under 2 minutes. ${firstApp.description.slice(0, 120)}. Deploy it now to start capturing value immediately.`,
      category: "quick-win",
    });
  }

  // Competitive insight
  insights.push({
    icon: <Target className="h-4 w-4" />,
    title: "Competitive intelligence",
    advice: `Most ${industry || "businesses"} in your space still rent their tools. By owning yours, you eliminate per-seat scaling costs — your margins improve as you grow while competitors' shrink.`,
    category: "growth",
  });

  return insights;
}

const categoryColors: Record<string, string> = {
  growth: "bg-secondary/20 text-secondary-foreground",
  savings: "bg-accent/20 text-accent-foreground",
  security: "bg-muted text-muted-foreground",
  "quick-win": "bg-primary/10 text-foreground",
};

export function AdvisorPanel(props: AdvisorPanelProps) {
  const insights = generateInsights(props);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  if (!props.businessName && !props.industry) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            AI Advisor
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
              for {props.businessName || "you"}
            </Badge>
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Strategic insights based on your business analysis
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <button
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className="w-full text-left p-3 rounded-xl border border-border hover:border-foreground/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[insight.category]}`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{insight.title}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">
                      {insight.category}
                    </Badge>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    expandedIdx === i ? "rotate-90" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {expandedIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mt-2 pl-11 leading-relaxed">
                      {insight.advice}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          {insights.length} insights generated from your audit
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 gap-1"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        >
          Get deeper analysis <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
