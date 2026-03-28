import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChangelogFeed } from "@/components/ChangelogFeed";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, Zap, Shield, Palette, Accessibility, Bug, Code, GitCommit,
  Eye, ExternalLink, ArrowUpCircle, Monitor, Maximize2, Minimize2,
  Smartphone, X, RotateCcw,
} from "lucide-react";

// ── Types ──
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

// ── Constants ──
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ux: <Palette className="h-3.5 w-3.5" />,
  feature: <Zap className="h-3.5 w-3.5" />,
  performance: <Sparkles className="h-3.5 w-3.5" />,
  design: <Palette className="h-3.5 w-3.5" />,
  accessibility: <Accessibility className="h-3.5 w-3.5" />,
  bug_fix: <Bug className="h-3.5 w-3.5" />,
};

const STEPS = [
  { key: "analyze", label: "Analyze", icon: Sparkles },
  { key: "review", label: "Review", icon: Code },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "promote", label: "Go Live", icon: ArrowUpCircle },
] as const;

function getStepIndex(status: string): number {
  switch (status) {
    case "analyzing": case "pending": return 0;
    case "approved": return 1;
    case "applying": case "preview": return 2;
    case "applied": return 3;
    default: return 0;
  }
}

// ── Step Progress Bar ──
function StepProgress({ currentStep, status }: { currentStep: number; status: string }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isComplete = i < currentStep || status === "applied";
        const isCurrent = i === currentStep && status !== "applied";
        const isActive = isComplete || isCurrent;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${isComplete ? "bg-primary text-primary-foreground" : ""}
                ${isCurrent ? "bg-secondary text-secondary-foreground ring-2 ring-primary/20" : ""}
                ${!isActive ? "bg-muted text-muted-foreground" : ""}
              `}>
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent && status === "applying" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-[2px] flex-1 mx-1 mt-[-16px] rounded transition-colors duration-500 ${
                i < currentStep ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Inline Preview Frame ──
function PreviewFrame({ url, onClose }: { url: string; onClose: () => void }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`rounded-xl border border-border bg-background overflow-hidden ${
        expanded ? "fixed inset-4 z-50 shadow-2xl" : "relative"
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-orange-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono ml-2 truncate max-w-[200px]">
            {url}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setViewport("desktop")} title="Desktop">
            <Monitor className={`h-3.5 w-3.5 ${viewport === "desktop" ? "text-foreground" : "text-muted-foreground"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setViewport("mobile")} title="Mobile">
            <Smartphone className={`h-3.5 w-3.5 ${viewport === "mobile" ? "text-foreground" : "text-muted-foreground"}`} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setExpanded(!expanded)} title={expanded ? "Collapse" : "Expand"}>
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild title="Open in new tab">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          {expanded && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Iframe */}
      <div className={`flex justify-center bg-muted/20 transition-all duration-300 ${
        expanded ? "h-[calc(100%-44px)]" : "h-[400px]"
      }`}>
        <iframe
          src={url}
          title="Preview"
          className={`h-full border-0 bg-background transition-all duration-300 ${
            viewport === "mobile" ? "w-[390px] rounded-lg my-2 shadow-lg border border-border" : "w-full"
          }`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* Backdrop for expanded */}
      {expanded && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10" onClick={() => setExpanded(false)} />
      )}
    </motion.div>
  );
}

// ── Build Progress Animation ──
function BuildProgress({ stage }: { stage: string }) {
  const stages = [
    { key: "loading", label: "Loading source code…", done: false },
    { key: "patching", label: "AI patching files…", done: false },
    { key: "packaging", label: "Packaging build…", done: false },
    { key: "deploying", label: "Deploying preview…", done: false },
  ];

  const activeIdx = stage === "loading" ? 0 : stage === "patching" ? 1 : stage === "packaging" ? 2 : 3;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-semibold">Building preview…</span>
      </div>
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          {i < activeIdx ? (
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
          ) : i === activeIdx ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-border shrink-0" />
          )}
          <span className={`text-xs ${i <= activeIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {s.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

// ── Main Dashboard ──
export function ImprovementDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<ImprovementCycle[]>([]);
  const [changes, setChanges] = useState<Record<string, ImprovementChange[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [analyzingListing, setAnalyzingListing] = useState<string | null>(null);
  const [applyingCycle, setApplyingCycle] = useState<string | null>(null);
  const [buildStage, setBuildStage] = useState<string>("loading");
  const [promotingCycle, setPromotingCycle] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [listings, setListings] = useState<{ id: string; title: string; demo_url: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: cycleData }, { data: listingData }] = await Promise.all([
      supabase.from("improvement_cycles" as any).select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("listings").select("id, title, demo_url")
        .eq("seller_id", user.id).eq("status", "live"),
    ]);
    setCycles((cycleData as any[]) ?? []);
    setListings(listingData ?? []);
    setLoading(false);
    if (cycleData?.length) {
      const first = (cycleData as any[])[0];
      setExpandedCycle(first.id);
      loadChanges(first.id);
    }
  }, [user]);

  async function loadChanges(cycleId: string) {
    if (changes[cycleId]) return;
    const { data } = await supabase
      .from("improvement_changes" as any).select("*").eq("cycle_id", cycleId);
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
      toast({ title: `Analysis complete — Score: ${data.score}/100` });
      loadData();
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzingListing(null);
    }
  }

  async function approveChange(changeId: string, approved: boolean) {
    await supabase.from("improvement_changes" as any).update({ approved }).eq("id", changeId);
    setChanges((prev) => {
      const updated = { ...prev };
      for (const cycleId in updated) {
        updated[cycleId] = updated[cycleId].map((c) =>
          c.id === changeId ? { ...c, approved } : c
        );
      }
      return updated;
    });
  }

  async function approveAllInCycle(cycleId: string) {
    const cycleChanges = changes[cycleId] || [];
    for (const change of cycleChanges) {
      if (change.approved === null) await approveChange(change.id, true);
    }
    await supabase.from("improvement_cycles" as any).update({ status: "approved" }).eq("id", cycleId);
    setCycles((prev) => prev.map((c) => (c.id === cycleId ? { ...c, status: "approved" } : c)));
  }

  async function applyAndPreview(cycleId: string, listingId: string) {
    if (!user) return;
    setApplyingCycle(cycleId);
    setBuildStage("loading");

    // Simulate stage progression
    const stageTimer = setTimeout(() => setBuildStage("patching"), 3000);
    const stageTimer2 = setTimeout(() => setBuildStage("packaging"), 8000);
    const stageTimer3 = setTimeout(() => setBuildStage("deploying"), 12000);

    try {
      await approveAllInCycle(cycleId);
      const { data, error } = await supabase.functions.invoke("swarm-apply-fixes", {
        body: { cycle_id: cycleId, listing_id: listingId, user_id: user.id, mode: "preview" },
      });
      if (error) throw error;

      setCycles((prev) =>
        prev.map((c) => c.id === cycleId ? {
          ...c, status: "preview",
          analysis: { ...c.analysis, preview_url: data.preview_url, preview_zip_path: data.zip_path, apply_summary: data.summary }
        } : c)
      );

      // Auto-open the inline preview
      if (data.preview_url) {
        setShowPreview(cycleId);
      }

      toast({ title: "Preview ready — review your changes below" });
    } catch (e: any) {
      toast({ title: "Build failed", description: e.message, variant: "destructive" });
    } finally {
      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setApplyingCycle(null);
    }
  }

  async function promoteToProduction(cycleId: string, listingId: string) {
    if (!user) return;
    setPromotingCycle(cycleId);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-apply-fixes", {
        body: { cycle_id: cycleId, listing_id: listingId, user_id: user.id, mode: "promote" },
      });
      if (error) throw error;
      toast({ title: "Live! Your changes are in production." });
      setCycles((prev) => prev.map((c) => c.id === cycleId ? { ...c, status: "applied" } : c));
      setShowPreview(null);
    } catch (e: any) {
      toast({ title: "Promote failed", description: e.message, variant: "destructive" });
    } finally {
      setPromotingCycle(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trigger section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Analyze & Improve
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          AI reads your source code, finds real issues, and generates a preview you can inspect before anything goes live.
        </p>
        <div className="flex flex-wrap gap-2">
          {listings.map((l) => (
            <Button key={l.id} size="sm" variant="outline" disabled={analyzingListing === l.id}
              onClick={() => triggerAnalysis(l.id)} className="text-xs">
              {analyzingListing === l.id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
              {l.title.slice(0, 30)}
            </Button>
          ))}
          {!listings.length && <p className="text-xs text-muted-foreground">No live listings to analyze</p>}
        </div>
      </div>

      {/* Changelog */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-primary" />
          Code Changelog
        </h3>
        <ChangelogFeed compact />
      </div>

      {/* Cycles */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          Improvement History
        </h2>
        <span className="text-xs text-muted-foreground">{cycles.length} cycles</span>
      </div>

      {cycles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">No improvement cycles yet</h3>
          <p className="text-muted-foreground text-xs">Analyze a listing above to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const isExpanded = expandedCycle === cycle.id;
            const cycleChanges = changes[cycle.id] || [];
            const score = cycle.analysis?.overall_score;
            const previewUrl = cycle.analysis?.preview_url;
            const currentStep = getStepIndex(cycle.status);
            const isBuilding = applyingCycle === cycle.id;
            const isPreviewOpen = showPreview === cycle.id;

            return (
              <motion.div
                key={cycle.id}
                layout
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => {
                    setExpandedCycle(isExpanded ? null : cycle.id);
                    if (!isExpanded) loadChanges(cycle.id);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {cycle.status === "applied" ? (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    ) : cycle.status === "preview" ? (
                      <div className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cycle.trigger === "cron" ? "Scheduled Analysis" :
                         cycle.trigger === "deploy_check" ? "Health Check" :
                         "Manual Analysis"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(cycle.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{cycle.suggestions?.length || 0} suggestions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score !== undefined && (
                      <span className={`text-xs font-bold tabular-nums ${
                        score >= 80 ? "text-primary" : score >= 60 ? "text-orange-500" : "text-destructive"
                      }`}>
                        {score}/100
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">
                        {/* Step progress */}
                        <StepProgress currentStep={currentStep} status={cycle.status} />

                        {/* Assessment */}
                        {cycle.analysis?.overall_assessment && (
                          <div className="rounded-lg bg-muted/40 p-3.5">
                            <p className="text-xs text-muted-foreground leading-relaxed">{cycle.analysis.overall_assessment}</p>
                          </div>
                        )}

                        {/* Build progress when applying */}
                        <AnimatePresence>
                          {isBuilding && <BuildProgress stage={buildStage} />}
                        </AnimatePresence>

                        {/* Inline Preview */}
                        <AnimatePresence>
                          {cycle.status === "preview" && previewUrl && isPreviewOpen && (
                            <PreviewFrame url={previewUrl} onClose={() => setShowPreview(null)} />
                          )}
                        </AnimatePresence>

                        {/* Preview action bar */}
                        {cycle.status === "preview" && previewUrl && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-border bg-muted/20 p-4"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-sm font-medium">Preview ready</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {cycle.analysis?.apply_summary
                                    ? cycle.analysis.apply_summary.slice(0, 100) + (cycle.analysis.apply_summary.length > 100 ? "…" : "")
                                    : "Review the changes before going live."}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!isPreviewOpen ? (
                                  <Button size="sm" variant="outline" onClick={() => setShowPreview(cycle.id)} className="text-xs">
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    View Preview
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setShowPreview(null)} className="text-xs">
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Close Preview
                                  </Button>
                                )}
                                <Button size="sm" onClick={() => promoteToProduction(cycle.id, cycle.listing_id)}
                                  disabled={promotingCycle === cycle.id}
                                  className="gradient-hero text-primary-foreground border-0 text-xs">
                                  {promotingCycle === cycle.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                  ) : (
                                    <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  {promotingCycle === cycle.id ? "Promoting…" : "Go Live"}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Suggestions list */}
                        {!isBuilding && (cycle.suggestions || []).map((suggestion: any, idx: number) => {
                          const change = cycleChanges[idx];
                          const canApprove = change && change.approved === null && cycle.status !== "preview" && cycle.status !== "applied";

                          return (
                            <div key={idx} className="rounded-lg border border-border p-3.5 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {CATEGORY_ICONS[suggestion.category] || <Code className="h-3.5 w-3.5 shrink-0" />}
                                  <span className="font-medium text-sm truncate">{suggestion.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {suggestion.priority && (
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      suggestion.priority === "critical" ? "bg-destructive/10 text-destructive" :
                                      suggestion.priority === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" :
                                      "bg-muted text-muted-foreground"
                                    }`}>
                                      {suggestion.priority}
                                    </span>
                                  )}
                                  {change?.approved === true && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                                  {change?.approved === false && <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
                              {suggestion.implementation_hint && (
                                <pre className="text-[11px] bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
                                  {suggestion.implementation_hint}
                                </pre>
                              )}
                              {canApprove && (
                                <div className="flex gap-2 pt-1">
                                  <Button size="sm" variant="outline" onClick={() => approveChange(change.id, true)} className="text-xs h-7">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => approveChange(change.id, false)} className="text-xs h-7 text-muted-foreground">
                                    <XCircle className="h-3 w-3 mr-1" /> Skip
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Bottom actions */}
                        {(cycle.status === "pending" || cycle.status === "approved") && !isBuilding && (
                          <div className="flex justify-end gap-2 pt-1">
                            {cycle.status === "pending" && cycleChanges.some((c) => c.approved === null) && (
                              <Button size="sm" variant="outline" onClick={() => approveAllInCycle(cycle.id)} className="text-xs h-8">
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve All
                              </Button>
                            )}
                            <Button size="sm" onClick={() => applyAndPreview(cycle.id, cycle.listing_id)}
                              disabled={isBuilding} className="gradient-hero text-primary-foreground border-0 text-xs h-8">
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Build & Preview
                            </Button>
                          </div>
                        )}

                        {cycle.status === "applied" && (
                          <div className="flex items-center gap-2 text-xs text-primary font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Changes are live in production
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
