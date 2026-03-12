import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, Zap, Shield, Palette, Accessibility, Bug, Code,
  Send, Target, Bot,
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
  "Analyze the UX and suggest improvements",
  "Check for accessibility issues",
  "Improve the mobile experience",
  "Suggest performance optimizations",
  "Review the design consistency",
];

export function ListingImprovementPanel({ listingId, listingTitle, demoUrl }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [changes, setChanges] = useState<Record<string, Change[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [goalsPrompt, setGoalsPrompt] = useState("");
  const [hasGoals, setHasGoals] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;
    loadCycles();
    loadGoals();
  }, [user, listingId]);

  async function loadGoals() {
    if (!user) return;
    const { data } = await supabase
      .from("project_goals" as any)
      .select("goals_prompt")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setGoalsPrompt((data as any).goals_prompt || "");
      setHasGoals(true);
    } else {
      setShowGoalsEditor(true); // Encourage setting goals if none exist
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
      {/* Gremlin Chat Header */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Gremlins™ — Project Improver</h3>
              <p className="text-xs text-muted-foreground">
                Tell the gremlins what to focus on for <strong>{listingTitle}</strong>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">Online</span>
            </div>
          </div>
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
          {cycles.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {GREMLIN_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setMessage(prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] max-h-[120px] resize-none pr-3"
                placeholder={analyzing ? "Gremlins are analyzing…" : "Tell the gremlins what to improve…"}
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

          {analyzing && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-muted-foreground">Gremlins are screenshotting & analyzing your app…</span>
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
                      <div className="rounded-lg bg-muted/30 p-3 flex gap-2">
                        <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
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
