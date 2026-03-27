import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChangelogFeed } from "@/components/ChangelogFeed";
import {
  Sparkles, CheckCircle, XCircle, Clock, Image, ChevronDown, ChevronUp,
  Loader2, Zap, AlertTriangle, Shield, Palette, Accessibility, Bug, Code, GitCommit, Rocket,
} from "lucide-react";

interface ImprovementCycle {
  id: string;
  listing_id: string;
  trigger: string;
  screenshot_url: string | null;
  analysis: any;
  suggestions: any[];
  status: string;
  created_at: string;
}

interface ImprovementChange {
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

export function ImprovementDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<ImprovementCycle[]>([]);
  const [changes, setChanges] = useState<Record<string, ImprovementChange[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [analyzingListing, setAnalyzingListing] = useState<string | null>(null);
  const [applyingCycle, setApplyingCycle] = useState<string | null>(null);
  const [listings, setListings] = useState<{ id: string; title: string; demo_url: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    const [{ data: cycleData }, { data: listingData }] = await Promise.all([
      supabase
        .from("improvement_cycles" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("listings")
        .select("id, title, demo_url")
        .eq("seller_id", user.id)
        .eq("status", "live"),
    ]);

    setCycles((cycleData as any[]) ?? []);
    setListings(listingData ?? []);
    setLoading(false);

    // Auto-expand most recent
    if (cycleData?.length) {
      setExpandedCycle((cycleData as any[])[0].id);
      loadChanges((cycleData as any[])[0].id);
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

  async function triggerAnalysis(listingId: string) {
    if (!user) return;
    setAnalyzingListing(listingId);

    try {
      const { data, error } = await supabase.functions.invoke("swarm-app-analyzer", {
        body: { listing_id: listingId, trigger: "manual", user_id: user.id },
      });

      if (error) throw error;
      toast({ title: `Analysis complete — Score: ${data.score}/100 🔍` });
      loadData();
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzingListing(null);
    }
  }

  async function approveChange(changeId: string, approved: boolean) {
    await supabase
      .from("improvement_changes" as any)
      .update({ approved })
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

    // Update cycle status
    await supabase
      .from("improvement_cycles" as any)
      .update({ status: "approved" })
      .eq("id", cycleId);

    setCycles((prev) =>
      prev.map((c) => (c.id === cycleId ? { ...c, status: "approved" } : c))
    );
  }

  async function applyAndDeploy(cycleId: string, listingId: string) {
    if (!user) return;
    setApplyingCycle(cycleId);

    try {
      // First approve all unapproved changes
      await approveAllInCycle(cycleId);

      // Trigger the apply-fixes function
      const { data, error } = await supabase.functions.invoke("swarm-apply-fixes", {
        body: { cycle_id: cycleId, listing_id: listingId, user_id: user.id },
      });

      if (error) throw error;

      toast({
        title: `Fixes applied & deployed! 🚀`,
        description: `${data.modified_files} files updated. ${data.deployed ? "Redeployment triggered." : "Upload complete — deploy manually."}`,
      });

      // Update local state
      setCycles((prev) =>
        prev.map((c) => (c.id === cycleId ? { ...c, status: "applied" } : c))
      );

      loadData();
    } catch (e: any) {
      toast({ title: "Apply failed", description: e.message, variant: "destructive" });
    } finally {
      setApplyingCycle(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Manual trigger section */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Analyze & Improve
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          AI screenshots your deployed app, compares it to your goals, and suggests improvements.
        </p>
        <div className="flex flex-wrap gap-2">
          {listings.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant="outline"
              disabled={analyzingListing === l.id}
              onClick={() => triggerAnalysis(l.id)}
              className="text-xs"
            >
              {analyzingListing === l.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {l.title.slice(0, 30)}
            </Button>
          ))}
          {listings.length === 0 && (
            <p className="text-xs text-muted-foreground">No live listings to analyze</p>
          )}
        </div>
      </div>

      {/* Global changelog — all code changes across projects */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-primary" />
          Code Changelog
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          All code changes made by AI across your projects
        </p>
        <ChangelogFeed compact />
      </div>

      {/* Improvement cycles */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Improvement History
        </h2>
        <span className="text-sm text-muted-foreground">{cycles.length} cycles</span>
      </div>

      {cycles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold mb-1">No improvement cycles yet</h3>
          <p className="text-muted-foreground text-sm">Click "Analyze" on one of your listings to start.</p>
        </div>
      ) : (
        cycles.map((cycle) => {
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
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
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
                <div className="border-t border-border/40 p-5 space-y-4">
                  {/* Screenshot */}
                  {cycle.screenshot_url && (
                    <div className="rounded-lg overflow-hidden border border-border/40">
                      <img src={cycle.screenshot_url} alt="App screenshot" className="w-full max-h-64 object-cover" />
                    </div>
                  )}

                  {/* Overall assessment */}
                  {cycle.analysis?.overall_assessment && (
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">{cycle.analysis.overall_assessment}</p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {(cycle.suggestions || []).map((suggestion: any, idx: number) => {
                    const change = cycleChanges[idx];
                    return (
                      <div key={idx} className="rounded-xl border border-border/40 p-4 space-y-2">
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
                        {/* Approve/Reject buttons */}
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

                  {/* Bulk actions */}
                  {(cycle.status === "pending" || cycle.status === "approved") && (
                    <div className="flex justify-end gap-2 pt-2">
                      {cycle.status === "pending" && cycleChanges.some((c) => c.approved === null) && (
                        <Button size="sm" variant="outline" onClick={() => approveAllInCycle(cycle.id)} className="text-xs">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve All
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => applyAndDeploy(cycle.id, cycle.listing_id)}
                        disabled={applyingCycle === cycle.id}
                        className="gradient-hero text-white border-0 text-xs"
                      >
                        {applyingCycle === cycle.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Rocket className="h-3.5 w-3.5 mr-1" />
                        )}
                        {applyingCycle === cycle.id ? "Applying fixes..." : "Apply & Deploy"}
                      </Button>
                    </div>
                  )}
                  {cycle.status === "applied" && (
                    <div className="flex items-center gap-2 pt-2 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Fixes applied and deployed</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
