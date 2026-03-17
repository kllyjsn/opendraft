import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, Lightbulb, Rocket, Search, AlertCircle, X,
  Wand2, ArrowRight, Sparkles, Zap, Layout, Brain, FileText, Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Insight {
  title: string;
  description: string;
}

interface RecommendedBuild {
  name: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  search_query: string;
}

interface AnalysisResult {
  business_name: string;
  industry: string;
  summary: string;
  insights: Insight[];
  recommended_builds: RecommendedBuild[];
  pageTitle: string;
  url: string;
}

const CATEGORY_ICON: Record<string, typeof Zap> = {
  saas_tool: Zap,
  ai_app: Brain,
  landing_page: Layout,
  utility: FileText,
  game: Gamepad2,
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

export function BusinessAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function buildInstantFallback(rawUrl: string): AnalysisResult {
    const formatted = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;

    let domain = rawUrl;
    try {
      domain = new URL(formatted).hostname.replace("www.", "");
    } catch {
      domain = rawUrl;
    }

    const businessName = domain.split(".")[0]?.replace(/[-_]/g, " ") || domain;
    const prettyName = businessName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      business_name: prettyName || "Your Business",
      industry: "Digital Business Operations",
      summary: "We generated instant recommendations you can build right now in OpenDraft while live analysis catches up.",
      insights: [
        { title: "Automate repetitive workflows", description: "Use app workflows to remove manual handoffs in onboarding, approvals, and reporting." },
        { title: "Build customer self-serve", description: "Ship portals that let users get answers, submit requests, and track progress without support delays." },
        { title: "Use AI for speed", description: "Add AI assistants for lead triage, drafting, and knowledge retrieval to increase team throughput." },
      ],
      recommended_builds: [
        {
          name: "Client Onboarding Portal",
          description: "A milestone-based onboarding app with tasks, documents, and status tracking.",
          category: "saas_tool",
          priority: "high",
          search_query: `${domain} onboarding portal app`,
        },
        {
          name: "AI Lead Qualification Assistant",
          description: "Score inbound leads and auto-route high-intent prospects to sales instantly.",
          category: "ai_app",
          priority: "high",
          search_query: `${domain} ai lead qualification app`,
        },
        {
          name: "Customer Health Dashboard",
          description: "Track activation, usage, and renewal risk in one operational dashboard.",
          category: "utility",
          priority: "medium",
          search_query: `${domain} customer health dashboard`,
        },
        {
          name: "ROI Proof Landing Page",
          description: "A high-converting landing experience with calculator, proof points, and demo CTA.",
          category: "landing_page",
          priority: "medium",
          search_query: `${domain} roi landing page`,
        },
      ],
      pageTitle: prettyName || domain,
      url: formatted,
    };
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    setResult(null);

    try {
      const invokePromise = supabase.functions.invoke("analyze-business-url", {
        body: { url: url.trim() },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Analysis is taking longer than expected.")), 22000);
      });

      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.recommended_builds?.length) throw new Error("No build recommendations returned.");
      setResult(data);
    } catch (err) {
      setResult(buildInstantFallback(url.trim()));
      setNotice("Live analysis was slow, so we loaded instant build ideas you can generate now.");
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate(prompt: string) {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/?generate=${encodeURIComponent(prompt)}`);
  }

  function handleSearchClick(query: string) {
    navigate(`/?q=${encodeURIComponent(query)}`);
    setTimeout(() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function reset() {
    setResult(null);
    setError(null);
    setNotice(null);
    setUrl("");
  }

  // ── Input Form ──
  if (!result) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <form onSubmit={handleAnalyze}>
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-500" />
            <div className="relative flex items-center">
              <Globe className="absolute left-4 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Enter your company URL…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-11 pr-28 h-13 bg-card border-border/50 focus-visible:border-primary/40 focus-visible:shadow-glow transition-all rounded-xl text-sm leading-normal [&]:py-0"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !url.trim()}
                className="absolute right-2 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 rounded-lg h-9 px-5 text-xs font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-3 text-sm text-destructive justify-center"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 mt-6"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Scanning your site & building recommendations…
            </div>
            <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Results ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto w-full text-left"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-1"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              {result.industry}
            </span>
          </motion.div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{result.business_name}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">{result.summary}</p>
          {notice && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
              <AlertCircle className="h-3 w-3" />
              {notice}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground h-8 shrink-0">
          <X className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {/* Insights Strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8"
      >
        {result.insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className="rounded-xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm"
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
      </motion.div>

      {/* Recommended Builds */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5" />
          Apps we'd build for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {result.recommended_builds.map((build, i) => {
            const Icon = CATEGORY_ICON[build.category] || Sparkles;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${PRIORITY_STYLES[build.priority]}`}
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

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(build.search_query)}
                    className="flex-1 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-8 text-[11px] font-bold rounded-lg"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {user ? "Generate this app" : "Sign in to generate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSearchClick(build.search_query)}
                    className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Browse similar"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Button
          onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Or browse all apps
        </Button>
      </motion.div>
    </motion.div>
  );
}
