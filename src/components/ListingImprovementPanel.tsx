import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, Zap, Shield, Palette, Accessibility, Bug, Code,
} from "lucide-react";

interface Props {
  listingId: string;
  listingTitle: string;
  demoUrl: string | null;
}

interface Cycle {
  id: string;
  listing_id: string;
  trigger: string;
  screenshot_url: string | null;
  analysis: any;
  suggestions: any[];
  status: string;
  created_at: string;
}

interface Change {
  id: string;
  cycle_id: string;
  file_path: string;
  change_type: string;
  description: string;
  code: string;
  risk_level: string;
  approved: boolean | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ux: <Palette className="h-3.5 w-3.5" />,
  feature: <Zap className="h-3.5 w-3.5" />,
  performance: <Sparkles className="h-3.5 w-3.5" />,
  design: <Palette className="h-3.5 w-3.5" />,
  accessibility: <Accessibility className="h-3.5 w-3.5" />,
  bug_fix: <Bug className="h-3.5 w-3.5" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  low: "bg-muted text-muted-foreground",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-600",
  medium: "text-orange-500",
  high: "text-red-500",
};

export function ListingImprovementPanel({ listingId, listingTitle, demoUrl }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [changes, setChanges] = useState<Record<string, Change[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCycles();
  }, [user, listingId]);

  async function loadCycles() {
    const { data } = await supabase
      .from("improvement_cycles" as any)
      .select("*")
      .eq("listing_id", listingId)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const cycleData = (data as any[]) ?? [];
    setCycles(cycleData);
    setLoading(false);

    if (cycleData.length > 0) {
      setExpandedCycle(cycleData[0].id);
      loadChanges(cycleData[0].id);
    }
  }

  async function loadChanges(cycleId: string) {
    if (changes[cycleId]) return;
    const { data } = await supabase
      .from("improvement_changes" as any)
      .select("*")
      .eq("cycle_id", cycleId);
    setChanges((prev) => ({ ...prev, [cycleId]: (data as any[]) ?? [] }));
  }

  async function triggerAnalysis() {
    if (!user) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-app-analyzer", {
        body: { listing_id: listingId, trigger: "manual", user_id: user.id },
      });
      if (error) throw error;
      toast({ title: `Analysis complete — Score: ${data.score}/100 🔍` });
      loadCycles();
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }

  async function approveChange(changeId: string, approved: boolean) {
    await supabase
      .from("improvement_changes" as any)
      .update({ approved, applied_at: approved ? new Date().toISOString() : null })
      .eq("id", changeId);

    setChanges((prev) => {
      const updated = { ...prev };
      for (const cycleId in updated) {
        updated[cycleId] = updated[cycleId].map((c) =>
          c.id === changeId ? { ...c, approved } : c
        );
      }
      return updated;
    });
    toast({ title: approved ? "Change approved ✓" : "Change rejected" });
  }

  async function approveAllInCycle(cycleId: string) {
    const cycleChanges = changes[cycleId] || [];
    for (const change of cycleChanges) {
      if (change.approved === null) {
        await approveChange(change.id, true);
      }
    }
    await supabase
      .from("improvement_cycles" as any)
      .update({ status: "approved" })
      .eq("id", cycleId);
    setCycles((prev) =>
      prev.map((c) => (c.id === cycleId ? { ...c, status: "approved" } : c))
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick analyze button */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Improvement Analysis
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Screenshots your app, compares to goals, and suggests improvements.
            </p>
          </div>
          <Button
            size="sm"
            disabled={analyzing}
            onClick={triggerAnalysis}
            className="gradient-hero text-white border-0 shrink-0"
          >
            {analyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {analyzing ? "Analyzing…" : "Analyze Now"}
          </Button>
        </div>
      </div>

      {/* Past cycles for THIS listing only */}
      {cycles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {cycles.length} past {cycles.length === 1 ? "analysis" : "analyses"}
          </p>

          {cycles.map((cycle) => {
            const isExpanded = expandedCycle === cycle.id;
            const cycleChanges = changes[cycle.id] || [];
            const score = cycle.analysis?.overall_score;
            const statusIcon =
              cycle.status === "approved" ? <CheckCircle className="h-4 w-4 text-green-500" /> :
              cycle.status === "rejected" ? <XCircle className="h-4 w-4 text-red-500" /> :
              cycle.status === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> :
              <Clock className="h-4 w-4 text-orange-500" />;

            return (
              <div key={cycle.id} className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
                <button
                  onClick={() => {
                    setExpandedCycle(isExpanded ? null : cycle.id);
                    if (!isExpanded) loadChanges(cycle.id);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon}
                    <div>
                      <p className="font-bold text-sm">
                        {cycle.trigger === "fork_request" ? "Fork Auto-Build" :
                         cycle.trigger === "cron" ? "Scheduled Analysis" :
                         cycle.trigger === "deploy_check" ? "Deploy Health Check" :
                         "Manual Analysis"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cycle.created_at).toLocaleDateString()} — {cycle.suggestions?.length || 0} suggestions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {score !== undefined && (
                      <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                        score >= 80 ? "bg-green-100 text-green-700" :
                        score >= 60 ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {score}/100
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/40 p-4 space-y-3">
                    {cycle.screenshot_url && (
                      <div className="rounded-lg overflow-hidden border border-border/40">
                        <img src={cycle.screenshot_url} alt="App screenshot" className="w-full max-h-64 object-cover" />
                      </div>
                    )}

                    {cycle.analysis?.overall_assessment && (
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-sm text-muted-foreground">{cycle.analysis.overall_assessment}</p>
                      </div>
                    )}

                    {(cycle.suggestions || []).map((suggestion: any, idx: number) => {
                      const change = cycleChanges[idx];
                      return (
                        <div key={idx} className="rounded-xl border border-border/40 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {CATEGORY_ICONS[suggestion.category] || <Code className="h-3.5 w-3.5" />}
                              <span className="font-bold text-sm">{suggestion.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.low}`}>
                                {suggestion.priority}
                              </span>
                              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${RISK_COLORS[suggestion.risk_level] || ""}`}>
                                <Shield className="h-3 w-3" /> {suggestion.risk_level}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                          {suggestion.implementation_hint && (
                            <pre className="text-[11px] bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                              {suggestion.implementation_hint}
                            </pre>
                          )}
                          {change && change.approved === null && (
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline" onClick={() => approveChange(change.id, true)} className="text-xs text-green-600 hover:text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => approveChange(change.id, false)} className="text-xs text-muted-foreground">
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                          {change?.approved === true && (
                            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</p>
                          )}
                          {change?.approved === false && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</p>
                          )}
                        </div>
                      );
                    })}

                    {cycle.status === "pending" && cycleChanges.some((c) => c.approved === null) && (
                      <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" onClick={() => approveAllInCycle(cycle.id)} className="gradient-hero text-white border-0 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve All
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
