import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Search, Target, Lightbulb, DollarSign, Zap, BarChart3 } from "lucide-react";

interface UnmetDemand {
  need: string;
  evidence: string;
  opportunity_score: number;
}

interface MarketGap {
  gap: string;
  category: string;
  suggested_price_range: string;
}

interface RecommendedBuild {
  title: string;
  description: string;
  category: string;
  estimated_demand: string;
  suggested_price_cents: number;
  tech_stack: string[];
}

interface RawSignals {
  top_searches: { query: string; count: number }[];
  open_bounties: number;
  total_listings: number;
  category_distribution: Record<string, number>;
  high_demand_low_conversion: { title: string; views: number; sales: number }[];
}

interface Analysis {
  summary: string;
  unmet_demands: UnmetDemand[];
  market_gaps: MarketGap[];
  recommended_builds: RecommendedBuild[];
  pricing_insights: string[];
}

interface ResearchResult {
  raw_signals: RawSignals;
  analysis: Analysis;
}

const DEMAND_COLORS: Record<string, string> = {
  very_high: "bg-red-500/15 text-red-600 border-red-500/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  medium: "bg-accent/10 text-accent border-accent/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function AdminMarketResearch() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);

  async function runResearch() {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("market-research");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast({ title: "Research complete ✓" });
    } catch (e: any) {
      toast({ title: "Research failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function autoBuild(rec: RecommendedBuild, idx: number) {
    setGeneratingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("generate-listing-concept", {
        body: { count: 1, themes: [rec.title] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: `"${rec.title}" generated!`, description: "Check pending listings." });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingIdx(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Deep Market Research</h2>
        </div>
        <Button onClick={runResearch} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          {loading ? "Analyzing…" : "Run Research"}
        </Button>
      </div>

      {loading && (
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-semibold">Analyzing search queries, bounties, listings & conversion data…</p>
            <p className="text-xs text-muted-foreground">AI is cross-referencing demand signals with current supply</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase tracking-wide text-primary mb-2">Executive Summary</p>
              <p className="text-sm leading-relaxed">{result.analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Raw Signals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Search Queries</p>
              <p className="text-2xl font-black">{result.raw_signals.top_searches.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Open Bounties</p>
              <p className="text-2xl font-black">{result.raw_signals.open_bounties}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Live Listings</p>
              <p className="text-2xl font-black">{result.raw_signals.total_listings}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">High-View Low-Sale</p>
              <p className="text-2xl font-black">{result.raw_signals.high_demand_low_conversion.length}</p>
            </div>
          </div>

          {/* Top Searches */}
          {result.raw_signals.top_searches.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-bold">Top Search Queries</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.raw_signals.top_searches.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs">
                      <span className="font-medium">{s.query}</span>
                      <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold">{s.count}×</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unmet Demands */}
          {result.analysis.unmet_demands.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-bold">Unmet Demand</p>
                </div>
                <div className="space-y-2">
                  {result.analysis.unmet_demands.map((d, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 flex items-start gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                        {d.opportunity_score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{d.need}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.evidence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Gaps */}
          {result.analysis.market_gaps.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <p className="text-sm font-bold">Market Gaps</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.analysis.market_gaps.map((g, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold">{g.gap}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">{g.category.replace("_", " ")}</span>
                        <span className="text-[10px] text-muted-foreground">{g.suggested_price_range}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Builds */}
          {result.analysis.recommended_builds.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-accent" />
                  <p className="text-sm font-bold">Recommended Builds</p>
                </div>
                <div className="space-y-3">
                  {result.analysis.recommended_builds.map((r, i) => (
                    <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold">{r.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs flex-shrink-0"
                          disabled={generatingIdx === i}
                          onClick={() => autoBuild(r, i)}
                        >
                          {generatingIdx === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                          Auto-build
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DEMAND_COLORS[r.estimated_demand] || DEMAND_COLORS.medium}`}>
                          {r.estimated_demand.replace("_", " ")} demand
                        </span>
                        <span className="text-[10px] font-bold text-foreground">
                          ${(r.suggested_price_cents / 100).toFixed(0)}
                        </span>
                        {r.tech_stack.slice(0, 4).map(t => (
                          <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Insights */}
          {result.analysis.pricing_insights.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-bold">Pricing Insights</p>
                </div>
                <ul className="space-y-1.5">
                  {result.analysis.pricing_insights.map((p, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
