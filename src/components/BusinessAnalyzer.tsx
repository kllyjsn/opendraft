import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Loader2, ArrowRight, Lightbulb, Rocket, Search, TrendingUp, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function BusinessAnalyzer() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-business-url", {
        body: { url: url.trim() },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchClick(query: string) {
    navigate(`/?q=${encodeURIComponent(query)}`);
    // scroll to browse
    setTimeout(() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function reset() {
    setResult(null);
    setError(null);
    setUrl("");
  }

  // Input form state
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
            className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Scanning your site & building recommendations…</span>
          </motion.div>
        )}
      </div>
    );
  }

  // Results state
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto w-full text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">{result.business_name}</h2>
          <p className="text-xs text-muted-foreground">
            {result.industry} • {result.summary}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground h-8">
          <X className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {/* Industry Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {result.insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm"
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

      {/* Recommended Builds */}
      <p className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
        <Rocket className="h-3.5 w-3.5" />
        Recommended for you
      </p>
      <div className="space-y-2 mb-5">
        {result.recommended_builds.map((build, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="rounded-xl border border-border/50 bg-card p-3 hover:border-primary/30 transition-colors group cursor-pointer"
            onClick={() => handleSearchClick(build.search_query)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold truncate">{build.name}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[build.priority]}`}>
                    {build.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{build.description}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Search className="h-3 w-3" />
                Find
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Browse all apps
        </Button>
      </div>
    </motion.div>
  );
}
