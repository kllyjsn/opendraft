import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, Zap, Shield, Palette, Accessibility, Bug, Code,
  Send, Target, Bot, Rocket, PartyPopper, FileCode,
  CalendarClock, Camera, Brain, ListChecks, ToggleLeft, ToggleRight,
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

const GREMLIN_PROMPTS = [
  "Optimize for mobile devices",
  "Improve accessibility & contrast",
  "Make the hero section more engaging",
  "Add loading states & error handling",
  "Review color palette & typography",
];

const ANALYSIS_STEPS = [
  { icon: Camera, label: "Screenshotting your live app…", duration: 3000 },
  { icon: Brain, label: "AI analyzing against your goals…", duration: 6000 },
  { icon: ListChecks, label: "Generating improvement suggestions…", duration: 3000 },
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [appliedSummary, setAppliedSummary] = useState<{ changes: string[]; cycleId: string } | null>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCycles();
    loadGoals();
  }, [user, listingId]);

  // Animated progress steps during analysis
  useEffect(() => {
    if (analyzing) {
      setAnalysisStep(0);
      let step = 0;
      const advance = () => {
        step++;
        if (step < ANALYSIS_STEPS.length) {
          setAnalysisStep(step);
          analysisTimerRef.current = setTimeout(advance, ANALYSIS_STEPS[step].duration);
        }
      };
      analysisTimerRef.current = setTimeout(advance, ANALYSIS_STEPS[0].duration);
    } else {
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
      setAnalysisStep(0);
    }
    return () => {
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
    };
  }, [analyzing]);

  async function loadGoals() {
    if (!user) return;
    const { data } = await supabase
      .from("project_goals" as any)
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
      ? await supabase
          .from("project_goals" as any)
          .update({ goals_prompt: goalsPrompt, structured_goals: payload.structured_goals })
          .eq("listing_id", listingId)
          .eq("user_id", user.id)
      : await supabase.from("project_goals" as any).insert(payload);

    if (error) {
      toast({ title: "Failed to save goals", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goals saved ✓ — Gremlins will use these for smarter suggestions" });
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
      await supabase
        .from("project_goals" as any)
        .update({ auto_improve: newVal })
        .eq("listing_id", listingId)
        .eq("user_id", user.id);
    } else {
      // Create goals entry with auto_improve
      await supabase.from("project_goals" as any).insert({
        user_id: user.id,
        listing_id: listingId,
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
      description: newVal
        ? "Gremlins will analyze this project every day at 6 AM UTC and notify you with suggestions."
        : "You can still run manual analyses anytime.",
    });
  }

  async function loadCycles() {
    if (!user) return;
    const { data } = await supabase
      .from("improvement_cycles" as any)
      .select("*")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
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

  async function sendMessage() {
    if (!user || (!message.trim() && !demoUrl)) return;
    const userMessage = message.trim();
    setMessage("");
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("swarm-app-analyzer", {
        body: {
          listing_id: listingId,
          trigger: "manual",
          user_id: user.id,
          focus_prompt: userMessage || undefined,
        },
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function approveChange(changeId: string, approved: boolean, description?: string) {
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

    if (approved && description) {
      setAppliedSummary({ changes: [description], cycleId: changeId });
      setTimeout(() => setAppliedSummary(null), 6000);
    }

    toast({
      title: approved ? "✅ Improvement applied!" : "Change skipped",
      description: approved
        ? `"${description || "Change"}" has been queued for your next deploy.`
        : undefined,
    });
  }

  async function approveAllInCycle(cycleId: string) {
    const cycleChanges = changes[cycleId] || [];
    const appliedDescriptions: string[] = [];

    for (const change of cycleChanges) {
      if (change.approved === null) {
        await supabase
          .from("improvement_changes" as any)
          .update({ approved: true, applied_at: new Date().toISOString() })
          .eq("id", change.id);
        appliedDescriptions.push(change.description);
      }
    }

    setChanges((prev) => {
      const updated = { ...prev };
      if (updated[cycleId]) {
        updated[cycleId] = updated[cycleId].map((c) =>
          c.approved === null ? { ...c, approved: true } : c
        );
      }
      return updated;
    });

    await supabase
      .from("improvement_cycles" as any)
      .update({ status: "approved" })
      .eq("id", cycleId);

    setCycles((prev) =>
      prev.map((c) => (c.id === cycleId ? { ...c, status: "approved" } : c))
    );

    setAppliedSummary({ changes: appliedDescriptions, cycleId });
    setTimeout(() => setAppliedSummary(null), 8000);

    toast({
      title: `🚀 ${appliedDescriptions.length} improvements applied!`,
      description: "All approved changes are queued for your next deploy.",
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const currentStep = ANALYSIS_STEPS[analysisStep];
  const StepIcon = currentStep?.icon || Camera;

  return (
    <div className="space-y-4">
      {/* Gremlin Chat Header */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">Gremlins™ — Project Improver</h3>
              <p className="text-xs text-muted-foreground truncate">
                Tell the gremlins what to focus on for <strong>{listingTitle}</strong>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Auto-improve toggle */}
        <div className="px-5 py-2.5 border-b border-border/40 bg-muted/5">
          <button
            onClick={toggleAutoImprove}
            disabled={togglingAuto}
            className="w-full flex items-center justify-between gap-2 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarClock className={`h-4 w-4 shrink-0 ${autoImprove ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold">Daily Auto-Improve</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {autoImprove
                    ? "Gremlins analyze this project every day at 6 AM UTC"
                    : "Enable to get daily improvement suggestions automatically"}
                </p>
              </div>
            </div>
            {togglingAuto ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
            ) : autoImprove ? (
              <ToggleRight className="h-6 w-6 text-primary shrink-0" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            )}
          </button>
        </div>

        {/* Goals nudge / editor */}
        {!hasGoals && !showGoalsEditor && (
          <button
            onClick={() => setShowGoalsEditor(true)}
            className="w-full px-5 py-3 bg-accent/5 border-b border-border/40 text-left hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Set project goals first!</p>
                <p className="text-[11px] text-muted-foreground">Gremlins give better suggestions when they know your vision.</p>
              </div>
            </div>
          </button>
        )}

        {showGoalsEditor && (
          <div className="px-5 py-4 bg-muted/20 border-b border-border/40 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold">Project Goals & Direction</span>
              {hasGoals && (
                <button
                  onClick={() => setShowGoalsEditor(false)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              )}
            </div>
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
              placeholder="What should this app do? Who is it for? What does success look like? e.g. 'A task manager for remote teams. Should feel fast, minimal, and accessible. Focus on mobile-first UX.'"
              value={goalsPrompt}
              onChange={(e) => setGoalsPrompt(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={saveGoals}
                disabled={savingGoals || !goalsPrompt.trim()}
                className="gradient-hero text-white border-0 gap-1.5 text-xs"
              >
                {savingGoals ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                {savingGoals ? "Saving…" : hasGoals ? "Update Goals" : "Save Goals"}
              </Button>
            </div>
          </div>
        )}

        {/* Goals summary (when set but not editing) */}
        {hasGoals && !showGoalsEditor && (
          <button
            onClick={() => setShowGoalsEditor(true)}
            className="w-full px-5 py-2.5 bg-muted/10 border-b border-border/40 text-left hover:bg-muted/20 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground truncate flex-1">
                <span className="font-semibold text-foreground">Goals: </span>
                {goalsPrompt.slice(0, 120)}{goalsPrompt.length > 120 ? "…" : ""}
              </p>
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
            </div>
          </button>
        )}

        {/* Chat-like input area */}
        <div className="px-4 py-3 space-y-3">
          {/* Quick suggestion chips */}
          {cycles.length === 0 && !analyzing && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-medium">💡 Not sure what to ask? Try one of these:</p>
              <div className="flex flex-wrap gap-1.5">
                {GREMLIN_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setMessage(prompt);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] max-h-[120px] resize-none pr-3"
                placeholder={analyzing ? "Gremlins are working…" : "Tell the gremlins what to improve…"}
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
              className="h-[44px] w-[44px] rounded-xl gradient-hero text-white border-0 shrink-0"
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Multi-step analysis progress */}
          {analyzing && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Gremlins at work…</span>
              </div>
              <div className="space-y-2">
                {ANALYSIS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === analysisStep;
                  const isDone = idx < analysisStep;
                  return (
                    <div key={idx} className={`flex items-center gap-2.5 transition-all duration-300 ${
                      isActive ? "opacity-100" : isDone ? "opacity-50" : "opacity-30"
                    }`}>
                      {isDone ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : isActive ? (
                        <Icon className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-xs ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <div className="flex gap-0.5 ml-auto">
                          <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past analysis results */}
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
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon}
                    <div className="min-w-0">
                      <p className="font-bold text-sm">
                        {cycle.trigger === "fork_request" ? "Fork Auto-Build" :
                         cycle.trigger === "cron" ? "🔄 Scheduled Analysis" :
                         cycle.trigger === "deploy_check" ? "Deploy Health Check" :
                         "Manual Analysis"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cycle.created_at).toLocaleDateString()} — {cycle.suggestions?.length || 0} suggestions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {score !== undefined && (
                      <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                        score >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        score >= 60 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
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
                      <div className="rounded-lg bg-muted/30 p-3 flex gap-2">
                        <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{cycle.analysis.overall_assessment}</p>
                      </div>
                    )}

                    {(cycle.suggestions || []).map((suggestion: any, idx: number) => {
                      const change = cycleChanges[idx];
                      const isApproved = change?.approved === true;
                      const isRejected = change?.approved === false;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 space-y-2 transition-all ${
                            isApproved
                              ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
                              : isRejected
                              ? "border-border/20 bg-muted/10 opacity-60"
                              : "border-border/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isApproved ? (
                                <Rocket className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              ) : (
                                <span className="shrink-0">{CATEGORY_ICONS[suggestion.category] || <Code className="h-3.5 w-3.5" />}</span>
                              )}
                              <span className={`font-bold text-sm truncate ${isApproved ? "text-green-700 dark:text-green-400" : ""}`}>
                                {suggestion.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isApproved ? (
                                <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Applied
                                </span>
                              ) : isRejected ? (
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Skipped
                                </span>
                              ) : (
                                <>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.low}`}>
                                    {suggestion.priority}
                                  </span>
                                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${RISK_COLORS[suggestion.risk_level] || ""}`}>
                                    <Shield className="h-3 w-3" /> {suggestion.risk_level}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>

                          {isApproved && change?.code && (
                            <details className="group">
                              <summary className="text-[11px] text-green-600 dark:text-green-400 cursor-pointer hover:underline flex items-center gap-1">
                                <FileCode className="h-3 w-3" />
                                View applied code change
                                <span className="text-[10px] text-muted-foreground ml-1">({change.file_path})</span>
                              </summary>
                              <pre className="text-[11px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono mt-2">
                                {change.code}
                              </pre>
                            </details>
                          )}

                          {!isApproved && !isRejected && suggestion.implementation_hint && (
                            <pre className="text-[11px] bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                              {suggestion.implementation_hint}
                            </pre>
                          )}

                          {change && change.approved === null && (
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveChange(change.id, true, suggestion.title)}
                                className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              >
                                <Rocket className="h-3 w-3 mr-1" /> Apply Improvement
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
                        </div>
                      );
                    })}

                    {/* Applied summary banner */}
                    {appliedSummary && appliedSummary.cycleId === cycle.id && (
                      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800 p-4 space-y-2 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2">
                          <PartyPopper className="h-5 w-5 text-green-600" />
                          <p className="font-bold text-sm text-green-700 dark:text-green-400">
                            {appliedSummary.changes.length} improvement{appliedSummary.changes.length > 1 ? "s" : ""} applied!
                          </p>
                        </div>
                        <ul className="space-y-1 pl-7">
                          {appliedSummary.changes.map((desc, i) => (
                            <li key={i} className="text-xs text-green-700/80 dark:text-green-400/80 flex items-start gap-1.5">
                              <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                              {desc}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-green-600/70 dark:text-green-500/70 pl-7">
                          Changes will take effect on your next deploy. Re-analyze after deploying to track progress.
                        </p>
                      </div>
                    )}

                    {cycle.status === "pending" && cycleChanges.some((c) => c.approved === null) && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          {cycleChanges.filter((c) => c.approved === null).length} pending improvements
                        </p>
                        <Button size="sm" onClick={() => approveAllInCycle(cycle.id)} className="gradient-hero text-white border-0 text-xs">
                          <Rocket className="h-3.5 w-3.5 mr-1" /> Apply All Improvements
                        </Button>
                      </div>
                    )}

                    {cycle.status === "approved" && !appliedSummary && (
                      <div className="rounded-lg bg-muted/20 p-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-muted-foreground">
                          All improvements from this analysis have been reviewed. Deploy to see changes live.
                        </p>
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
