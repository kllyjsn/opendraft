import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScoreRing } from "@/components/ScoreRing";
import { ConfettiExplosion } from "@/components/ConfettiExplosion";
import { BrandMascot } from "@/components/BrandMascot";
import { api } from "@/lib/api";
import {
  Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, Zap, Shield, Palette, Accessibility, Bug, Code,
  Send, Target, Bot, Rocket, PartyPopper, FileCode,
  CalendarClock, Camera, Brain, ListChecks, ToggleLeft, ToggleRight,
  Trophy, Flame, ArrowRight,
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

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  ux: { icon: <Palette className="h-4 w-4" />, label: "UX", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800" },
  feature: { icon: <Zap className="h-4 w-4" />, label: "Feature", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  performance: { icon: <Sparkles className="h-4 w-4" />, label: "Performance", color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800" },
  design: { icon: <Palette className="h-4 w-4" />, label: "Design", color: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800" },
  accessibility: { icon: <Accessibility className="h-4 w-4" />, label: "A11y", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  bug_fix: { icon: <Bug className="h-4 w-4" />, label: "Bug Fix", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" },
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-primary/20 text-primary",
  low: "bg-muted text-muted-foreground",
};

const GREMLIN_PROMPTS = [
  { emoji: "📱", text: "Optimize for mobile" },
  { emoji: "🎨", text: "Improve the visual design" },
  { emoji: "♿", text: "Boost accessibility" },
  { emoji: "⚡", text: "Speed up load times" },
  { emoji: "🧩", text: "Add missing features" },
];

const ANALYSIS_STEPS = [
  { icon: Camera, label: "Capturing your live app…", emoji: "📸" },
  { icon: Brain, label: "Analyzing against your goals…", emoji: "🧠" },
  { icon: ListChecks, label: "Crafting improvements…", emoji: "✨" },
];

export function ListingImprovementPanel({ listingId, listingTitle, demoUrl }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [changes, setChanges] = useState<Record<string, Change[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [goalsPrompt, setGoalsPrompt] = useState("");
  const [hasGoals, setHasGoals] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [autoImprove, setAutoImprove] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  const latestScore = cycles[0]?.analysis?.overall_score;
  const totalSuggestions = cycles.reduce((sum, c) => sum + (c.suggestions?.length || 0), 0);

  useEffect(() => {
    if (!user) return;
    loadCycles();
    loadGoals();
  }, [user, listingId]);

  useEffect(() => {
    if (analyzing) {
      setAnalysisStep(0);
      let step = 0;
      const advance = () => {
        step++;
        if (step < ANALYSIS_STEPS.length) {
          setAnalysisStep(step);
          analysisTimerRef.current = setTimeout(advance, 4000);
        }
      };
      analysisTimerRef.current = setTimeout(advance, 3000);
    } else {
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
      setAnalysisStep(0);
    }
    return () => { if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current); };
  }, [analyzing]);

  async function loadGoals() {
    if (!user) return;
    const { data } = await api.from("project_goals" as any)
      .select("goals_prompt, auto_improve")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setGoalsPrompt((data as any).goals_prompt || "");
      setAutoImprove((data as any).auto_improve || false);
      setHasGoals(true);
    } else {
      setShowGoalsEditor(true);
    }
  }

  async function saveGoals() {
    if (!user) return;
    setSavingGoals(true);
    const payload = {
      user_id: user.id,
      listing_id: listingId,
      goals_prompt: goalsPrompt,
      structured_goals: { source: "manual", updated_at: new Date().toISOString() },
    };
    const { error } = hasGoals
      ? await api.from("project_goals" as any)
          .update({ goals_prompt: goalsPrompt, structured_goals: payload.structured_goals })
          .eq("listing_id", listingId).eq("user_id", user.id)
      : await api.from("project_goals" as any).insert(payload);
    if (error) {
      toast({ title: "Failed to save goals", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goals saved ✓" });
      setHasGoals(true);
      setShowGoalsEditor(false);
    }
    setSavingGoals(false);
  }

  async function toggleAutoImprove() {
    if (!user) return;
    setTogglingAuto(true);
    const newVal = !autoImprove;
    if (hasGoals) {
      await api.from("project_goals" as any).update({ auto_improve: newVal })
        .eq("listing_id", listingId).eq("user_id", user.id);
    } else {
      await api.from("project_goals" as any).insert({
        user_id: user.id, listing_id: listingId,
        goals_prompt: goalsPrompt || listingTitle,
        auto_improve: newVal,
        structured_goals: { source: "auto_toggle", updated_at: new Date().toISOString() },
      });
      setHasGoals(true);
    }
    setAutoImprove(newVal);
    setTogglingAuto(false);
    toast({
      title: newVal ? "🔄 Daily auto-improve enabled" : "Auto-improve paused",
      description: newVal ? "Gremlins will analyze daily at 6 AM UTC" : "Run manual analyses anytime.",
    });
  }

  async function loadCycles() {
    if (!user) return;
    const { data } = await api.from("improvement_cycles" as any)
      .select("*")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const cycleData = (data as any[]) ?? [];
    setCycles(cycleData);
    setLoading(false);

    // Count applied
    let applied = 0;
    for (const c of cycleData) {
      const { count } = await api.from("improvement_changes" as any)
        .select("*", { count: "exact", head: true })
        .eq("cycle_id", c.id)
        .eq("approved", true);
      applied += count || 0;
    }
    setAppliedCount(applied);

    if (cycleData.length > 0) {
      setExpandedCycle(cycleData[0].id);
      loadChanges(cycleData[0].id);
    }
  }

  async function loadChanges(cycleId: string) {
    if (changes[cycleId]) return;
    const { data } = await api.from("improvement_changes" as any)
      .select("*")
      .eq("cycle_id", cycleId);
    setChanges((prev) => ({ ...prev, [cycleId]: (data as any[]) ?? [] }));
  }

  async function sendMessage() {
    if (!user || (!message.trim() && !demoUrl)) return;
    const userMessage = message.trim();
    setMessage("");
    setAnalyzing(true);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/swarm-app-analyzer", { listing_id: listingId, trigger: "manual", user_id: user.id, focus_prompt: userMessage || undefined },);
      if (error) throw error;
      toast({ title: `Analysis complete — Score: ${data.score}/100 🔍` });
      loadCycles();
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function approveChange(changeId: string, approved: boolean, description?: string) {
    await api.from("improvement_changes" as any)
      .update({ approved, applied_at: approved ? new Date().toISOString() : null })
      .eq("id", changeId);
    setChanges((prev) => {
      const updated = { ...prev };
      for (const cycleId in updated) {
        updated[cycleId] = updated[cycleId].map((c) => c.id === changeId ? { ...c, approved } : c);
      }
      return updated;
    });
    if (approved) {
      setAppliedCount((p) => p + 1);
      setShowConfetti(true);
      toast({ title: "🚀 Improvement applied!", description: `"${description}" queued for deploy.` });
    } else {
      toast({ title: "Change skipped" });
    }
  }

  async function approveAllInCycle(cycleId: string) {
    const cycleChanges = changes[cycleId] || [];
    let count = 0;
    for (const change of cycleChanges) {
      if (change.approved === null) {
        await api.from("improvement_changes" as any)
          .update({ approved: true, applied_at: new Date().toISOString() })
          .eq("id", change.id);
        count++;
      }
    }
    setChanges((prev) => {
      const updated = { ...prev };
      if (updated[cycleId]) {
        updated[cycleId] = updated[cycleId].map((c) => c.approved === null ? { ...c, approved: true } : c);
      }
      return updated;
    });
    await api.from("improvement_cycles" as any).update({ status: "approved" }).eq("id", cycleId);
    setCycles((prev) => prev.map((c) => (c.id === cycleId ? { ...c, status: "approved" } : c)));
    setAppliedCount((p) => p + count);
    setShowConfetti(true);
    toast({ title: `🚀 ${count} improvements applied!` });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col items-center gap-4">
        <BrandMascot size={80} variant="thinking" />
        <p className="text-sm text-muted-foreground animate-pulse">Waking up the gremlins…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* ─── Hero header with score + stats ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden"
      >
        {/* Gradient header bar */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
          <div className="relative px-5 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Score ring or mascot */}
              <div className="shrink-0">
                {latestScore !== undefined ? (
                  <ScoreRing score={latestScore} size={90} strokeWidth={6}>
                    <div className="text-center">
                      <motion.span
                        className="text-xl font-black block leading-none"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        {latestScore}
                      </motion.span>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">/100</span>
                    </div>
                  </ScoreRing>
                ) : (
                  <BrandMascot size={80} variant="wave" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base sm:text-lg leading-tight">
                  {latestScore !== undefined ? "App Health Score" : "Meet Your Gremlins™"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                  {latestScore !== undefined
                    ? `${totalSuggestions} total suggestions · ${appliedCount} applied`
                    : `AI agents that analyze & improve ${listingTitle}`
                  }
                </p>

                {/* Stats badges */}
                {cycles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      <Flame className="h-3 w-3" />
                      {cycles.length} {cycles.length === 1 ? "analysis" : "analyses"}
                    </span>
                    {appliedCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold text-secondary">
                        <Trophy className="h-3 w-3" />
                        {appliedCount} applied
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-improve + goals row */}
        <div className="border-t border-border/40 divide-y divide-border/40">
          {/* Auto-improve toggle */}
          <button
            onClick={toggleAutoImprove}
            disabled={togglingAuto}
            className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/20 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <CalendarClock className={`h-4 w-4 shrink-0 transition-colors ${autoImprove ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-xs font-bold">Daily Auto-Improve</p>
                <p className="text-[10px] text-muted-foreground">
                  {autoImprove ? "Running daily at 6 AM UTC" : "Get daily suggestions automatically"}
                </p>
              </div>
            </div>
            {togglingAuto ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : autoImprove ? (
              <ToggleRight className="h-6 w-6 text-primary" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          {/* Goals */}
          <AnimatePresence mode="wait">
            {showGoalsEditor ? (
              <motion.div
                key="editor"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold">Project Vision</span>
                    </div>
                    {hasGoals && (
                      <button onClick={() => setShowGoalsEditor(false)} className="text-xs text-muted-foreground hover:text-foreground">
                        Done
                      </button>
                    )}
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
                    placeholder="What should this app do? Who is it for? e.g. 'A task manager for remote teams. Should feel fast and minimal.'"
                    value={goalsPrompt}
                    onChange={(e) => setGoalsPrompt(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={saveGoals} disabled={savingGoals || !goalsPrompt.trim()} className="gradient-hero text-white border-0 gap-1.5 text-xs">
                      {savingGoals ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                      {savingGoals ? "Saving…" : hasGoals ? "Update" : "Save Goals"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : hasGoals ? (
              <motion.button
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowGoalsEditor(true)}
                className="w-full px-5 py-2.5 text-left hover:bg-muted/20 transition-colors group flex items-center gap-2"
              >
                <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground truncate flex-1">
                  <span className="font-semibold text-foreground">Vision: </span>
                  {goalsPrompt.slice(0, 100)}{goalsPrompt.length > 100 ? "…" : ""}
                </p>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
              </motion.button>
            ) : (
              <motion.button
                key="nudge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowGoalsEditor(true)}
                className="w-full px-5 py-3 text-left hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs font-bold">Set your project vision!</p>
                    <p className="text-[10px] text-muted-foreground">Gremlins give smarter suggestions when they know your goals.</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Chat input ─── */}
        <div className="border-t border-border/40 px-4 py-4 space-y-3">
          {/* Quick prompts on first use */}
          {cycles.length === 0 && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground font-medium">✨ What should the gremlins work on?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {GREMLIN_PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => { setMessage(p.text); inputRef.current?.focus(); }}
                    className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-left"
                  >
                    <span className="text-sm">{p.emoji}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] max-h-[120px] resize-none"
                placeholder={analyzing ? "Gremlins are working…" : "Tell gremlins what to improve…"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={analyzing}
                rows={1}
              />
            </div>
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={analyzing}
              className="h-[44px] w-[44px] rounded-xl gradient-hero text-white border-0 shrink-0 shadow-glow"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {/* Analysis progress */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <BrandMascot size={40} variant="thinking" />
                    <div>
                      <p className="text-xs font-bold text-primary">Gremlins at work…</p>
                      <p className="text-[10px] text-muted-foreground">This usually takes 15-30 seconds</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ANALYSIS_STEPS.map((step, idx) => {
                      const isActive = idx === analysisStep;
                      const isDone = idx < analysisStep;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: isDone ? 0.5 : isActive ? 1 : 0.25, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-2.5"
                        >
                          {isDone ? (
                            <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                          ) : isActive ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                              <Loader2 className="h-4 w-4 text-primary shrink-0" />
                            </motion.span>
                          ) : (
                            <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                          )}
                          <span className={`text-xs ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                            {step.emoji} {step.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── Results ─── */}
      {cycles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              Improvement History
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {cycles.length} {cycles.length === 1 ? "run" : "runs"}
            </span>
          </div>

          {cycles.map((cycle, cycleIdx) => {
            const isExpanded = expandedCycle === cycle.id;
            const cycleChanges = changes[cycle.id] || [];
            const score = cycle.analysis?.overall_score;
            const pendingCount = cycleChanges.filter((c) => c.approved === null).length;

            return (
              <motion.div
                key={cycle.id}
                initial={cycleIdx === 0 ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => {
                    setExpandedCycle(isExpanded ? null : cycle.id);
                    if (!isExpanded) loadChanges(cycle.id);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {cycle.status === "approved" ? (
                      <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                      </div>
                    ) : cycle.status === "analyzing" ? (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-accent" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm">
                        {cycle.trigger === "cron" ? "Scheduled Analysis" : cycle.trigger === "fork_request" ? "Fork Build" : "Analysis"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(cycle.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {cycle.suggestions?.length || 0} suggestions
                        {pendingCount > 0 && (
                          <span className="text-primary font-bold"> · {pendingCount} pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score !== undefined && (
                      <ScoreRing score={score} size={36} strokeWidth={3}>
                        <span className="text-[10px] font-black">{score}</span>
                      </ScoreRing>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
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
                      <div className="border-t border-border/40 p-4 space-y-3">
                        {/* Screenshot */}
                        {cycle.screenshot_url && (
                          <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20">
                            <img src={cycle.screenshot_url} alt="App screenshot" className="w-full max-h-52 object-cover" />
                          </div>
                        )}

                        {/* AI assessment */}
                        {cycle.analysis?.overall_assessment && (
                          <div className="rounded-xl bg-muted/30 p-3 flex gap-2.5">
                            <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{cycle.analysis.overall_assessment}</p>
                          </div>
                        )}

                        {/* Suggestion cards */}
                        {(cycle.suggestions || []).map((suggestion: any, idx: number) => {
                          const change = cycleChanges[idx];
                          const isApproved = change?.approved === true;
                          const isRejected = change?.approved === false;
                          const cat = CATEGORY_META[suggestion.category] || { icon: <Code className="h-4 w-4" />, label: suggestion.category, color: "bg-muted text-muted-foreground border-border" };

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                                isApproved
                                  ? "border-secondary/40 bg-secondary/5"
                                  : isRejected
                                  ? "border-border/20 bg-muted/5 opacity-50"
                                  : "border-border/40 hover:border-primary/30 hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold shrink-0 ${cat.color}`}>
                                    {cat.icon}
                                    {cat.label}
                                  </span>
                                  <span className={`font-bold text-sm leading-tight ${isApproved ? "text-secondary" : ""}`}>
                                    {suggestion.title}
                                  </span>
                                </div>
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] font-bold shrink-0">
                                    <Rocket className="h-3 w-3" /> Applied
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
                                    Skipped
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[suggestion.priority] || PRIORITY_STYLES.low}`}>
                                      {suggestion.priority}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>

                              {/* Code preview */}
                              {isApproved && change?.code && (
                                <details className="group">
                                  <summary className="text-[11px] text-secondary cursor-pointer hover:underline flex items-center gap-1">
                                    <FileCode className="h-3 w-3" /> View applied code
                                  </summary>
                                  <pre className="text-[11px] bg-secondary/5 border border-secondary/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono mt-2">
                                    {change.code}
                                  </pre>
                                </details>
                              )}

                              {!isApproved && !isRejected && suggestion.implementation_hint && (
                                <details className="group">
                                  <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                                    <Code className="h-3 w-3" /> Preview implementation
                                  </summary>
                                  <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono mt-2">
                                    {suggestion.implementation_hint}
                                  </pre>
                                </details>
                              )}

                              {/* Action buttons */}
                              {change && change.approved === null && (
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    onClick={() => approveChange(change.id, true, suggestion.title)}
                                    className="text-xs gradient-hero text-white border-0 shadow-sm gap-1.5"
                                  >
                                    <Rocket className="h-3 w-3" /> Apply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => approveChange(change.id, false, suggestion.title)}
                                    className="text-xs text-muted-foreground"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" /> Skip
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}

                        {/* Bulk apply */}
                        {cycle.status === "pending" && pendingCount > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3"
                          >
                            <p className="text-xs text-muted-foreground">
                              <span className="font-bold text-foreground">{pendingCount}</span> improvements waiting
                            </p>
                            <Button size="sm" onClick={() => approveAllInCycle(cycle.id)} className="gradient-hero text-white border-0 text-xs gap-1.5 shadow-glow">
                              <PartyPopper className="h-3.5 w-3.5" /> Apply All
                            </Button>
                          </motion.div>
                        )}

                        {cycle.status === "approved" && (
                          <div className="rounded-xl bg-secondary/5 border border-secondary/20 p-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-secondary" />
                            <p className="text-xs text-muted-foreground">All improvements reviewed. Deploy to see changes live!</p>
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

      {/* Empty state */}
      {cycles.length === 0 && !analyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-dashed border-border/60 p-8 sm:p-12 text-center space-y-4"
        >
          <BrandMascot size={100} variant="wave" className="mx-auto" />
          <div>
            <h3 className="font-black text-lg">Your gremlins are ready!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Type a message above or pick a suggestion — they'll analyze your app and propose improvements.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
