import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Zap, TrendingUp, Globe, RefreshCw, Clock, CheckCircle, XCircle, Loader2, Play, ShieldCheck, Lightbulb, Rocket, Code, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { CanonicalTag } from "@/components/CanonicalTag";
import { cn } from "@/lib/utils";

interface SwarmTask {
  id: string;
  agent_type: string;
  action: string;
  status: string;
  input: any;
  output: any;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  triggered_by: string;
}

const statusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
    case "running": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const severityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "bg-red-500/10 text-red-500 border-red-500/30";
    case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
    case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    case "low": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "pass": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const agentConfig = {
  seo_content: {
    label: "SEO & Content",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Generates blog ideas, meta improvements, and content gap analysis",
    functionName: "swarm-seo-agent",
    actions: ["full_cycle", "blog_ideas", "meta_audit"],
  },
  outreach_growth: {
    label: "Outreach & Growth",
    icon: Globe,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Discovers directories, crafts submissions, finds partnership opportunities",
    functionName: "swarm-outreach-agent",
    actions: ["full_cycle", "find_directories", "craft_submissions"],
  },
  product_improvement: {
    label: "Product Improvement",
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Analyzes listing quality, SEO gaps, conversion funnel, and feature gaps",
    functionName: "swarm-product-agent",
    actions: ["full_cycle", "listing_quality", "seo_gaps", "conversion_funnel", "feature_gaps"],
  },
  qa_testing: {
    label: "QA Testing",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Tests deploy pipelines, edge functions, listing integrity, and auth",
    functionName: "swarm-qa-agent",
    actions: ["full_cycle", "deploy_pipelines", "edge_function_health", "listing_integrity", "auth_permissions"],
  },
};

export default function SwarmPage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("swarm_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setTasks((data as SwarmTask[]) ?? []);
    setLoading(false);
  };

  const triggerAgent = async (agentType: string, action: string) => {
    const config = agentConfig[agentType as keyof typeof agentConfig];
    if (!config) return;

    setRunningAgent(`${agentType}-${action}`);
    toast.info(`🤖 ${config.label} agent starting...`);

    try {
      const { data, error } = await supabase.functions.invoke(config.functionName, {
        body: { action, triggered_by: "manual" },
      });

      if (error) throw error;
      toast.success(`✅ ${config.label} agent completed!`);
      fetchTasks();
    } catch (e: any) {
      toast.error(`❌ ${config.label} agent failed: ${e.message}`);
    } finally {
      setRunningAgent(null);
    }
  };

  const copySpecToClipboard = (suggestion: any, category: string) => {
    const title = suggestion.title || suggestion.feature || suggestion.listing_title || "Suggestion";
    const desc = suggestion.issue || suggestion.gap || suggestion.description || suggestion.rationale || "";
    const fix = suggestion.suggestion || suggestion.fix || "";
    const spec = [
      `## ${category.replace(/_/g, " ").toUpperCase()}: ${title}`,
      ``,
      `**Severity:** ${suggestion.severity || suggestion.priority || "N/A"}`,
      suggestion.effort ? `**Effort:** ${suggestion.effort}` : null,
      suggestion.expected_impact ? `**Expected Impact:** ${suggestion.expected_impact}` : null,
      ``,
      desc ? `### Problem\n${desc}` : null,
      fix ? `### Suggested Fix\n${fix}` : null,
      suggestion.implementation ? `### Implementation Details\n${suggestion.implementation}` : null,
      suggestion.affected_items ? `### Affected Items\n${suggestion.affected_items}` : null,
      ``,
      `### Acceptance Criteria`,
      `- The change described above is implemented and working`,
      `- No regressions to existing functionality`,
      `- Code follows existing project conventions`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(spec).then(() => {
      toast.success("📋 Spec copied! Paste it into Lovable to implement.");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const tasksByType = (type: string) => tasks.filter(t => t.agent_type === type);

  if (adminLoading) return null;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/swarm" />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Swarm Control Center</h1>
            <p className="text-sm text-muted-foreground">Autonomous agents for marketing, product improvement & QA</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchTasks}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {Object.entries(agentConfig).map(([key, config]) => {
            const Icon = config.icon;
            const agTasks = tasksByType(key);
            const completedCount = agTasks.filter(t => t.status === "completed").length;
            const lastRun = agTasks[0];

            return (
              <Card key={key} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    {config.label}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {completedCount} runs
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lastRun && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {statusIcon(lastRun.status)}
                      <span>Last run: {new Date(lastRun.created_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {config.actions.map(action => (
                      <Button
                        key={action}
                        size="sm"
                        variant={action === "full_cycle" ? "default" : "outline"}
                        onClick={() => triggerAgent(key, action)}
                        disabled={runningAgent !== null}
                        className="text-xs"
                      >
                        {runningAgent === `${key}-${action}` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {action.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Results Tabs */}
        <Tabs defaultValue="product" className="mt-8">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="product" className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> Product
            </TabsTrigger>
            <TabsTrigger value="qa" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> QA
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> SEO
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Outreach
            </TabsTrigger>
            <TabsTrigger value="deploys" className="gap-1.5">
              <Code className="h-3.5 w-3.5" /> Deploy Suggestions
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4 mt-4">
            {tasksByType("product_improvement").length === 0 ? (
              <EmptyState text="No product improvement runs yet." />
            ) : tasksByType("product_improvement").map(task => (
              <ProductTaskCard key={task.id} task={task} onCopySpec={copySpecToClipboard} />
            ))}
          </TabsContent>

          <TabsContent value="qa" className="space-y-4 mt-4">
            {tasksByType("qa_testing").length === 0 ? (
              <EmptyState text="No QA runs yet." />
            ) : tasksByType("qa_testing").map(task => (
              <QATaskCard key={task.id} task={task} onCopySpec={copySpecToClipboard} />
            ))}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            {tasksByType("seo_content").length === 0 ? (
              <EmptyState text="No SEO runs yet." />
            ) : tasksByType("seo_content").map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>

          <TabsContent value="outreach" className="space-y-4 mt-4">
            {tasksByType("outreach_growth").length === 0 ? (
              <EmptyState text="No outreach runs yet." />
            ) : tasksByType("outreach_growth").map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>

          <TabsContent value="deploys" className="space-y-4 mt-4">
            {tasksByType("deploy_suggestion").length === 0 ? (
              <EmptyState text="No spec history yet. Run a Product or QA scan, then click 'Copy Spec' on a suggestion." />
            ) : tasksByType("deploy_suggestion").map(task => (
              <DeployTaskCard key={task.id} task={task} />
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {tasks.length === 0 ? (
              <EmptyState text="No agent activity yet." />
            ) : tasks.map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground text-sm">{text}</CardContent>
    </Card>
  );
}

/* ---- Product Improvement Task Card ---- */
function ProductTaskCard({ task, onCopySpec }: { task: SwarmTask; onCopySpec: (s: any, cat: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const output = task.output;

  const allSuggestions = [
    ...(output?.listing_quality || []).map((s: any) => ({ ...s, _cat: "listing_quality" })),
    ...(output?.seo_gaps || []).map((s: any) => ({ ...s, _cat: "seo_gaps" })),
    ...(output?.conversion_improvements || []).map((s: any) => ({ ...s, _cat: "conversion" })),
    ...(output?.feature_gaps || []).map((s: any) => ({ ...s, _cat: "feature_gaps" })),
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {statusIcon(task.status)}
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Product Improvement</span>
          <Badge variant="outline" className="text-[10px]">{task.action.replace(/_/g, " ")}</Badge>
          {output && (
            <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
              {allSuggestions.length} suggestions
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(task.created_at).toLocaleString()}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {task.error && <ErrorBlock error={task.error} />}
          {allSuggestions.map((s, i) => (
            <SuggestionCard
              key={i}
              suggestion={s}
              category={s._cat}
              onCopySpec={onCopySpec}
            />
          ))}
          {!output && !task.error && <p className="text-xs text-muted-foreground">No output yet.</p>}
        </CardContent>
      )}
    </Card>
  );
}

/* ---- QA Task Card ---- */
function QATaskCard({ task, onCopySpec }: { task: SwarmTask; onCopySpec: (s: any, cat: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const output = task.output;
  const summary = output?.summary;
  const findings = output?.findings || [];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {statusIcon(task.status)}
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">QA Testing</span>
          <Badge variant="outline" className="text-[10px]">{task.action.replace(/_/g, " ")}</Badge>
          {summary && (
            <>
              <Badge className={cn("text-[10px]", summary.health_score >= 80 ? "bg-emerald-500/10 text-emerald-600" : summary.health_score >= 50 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600")}>
                Score: {summary.health_score}/100
              </Badge>
              {summary.critical_count > 0 && (
                <Badge className="text-[10px] bg-red-500/10 text-red-500">
                  {summary.critical_count} critical
                </Badge>
              )}
            </>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(task.created_at).toLocaleString()}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {task.error && <ErrorBlock error={task.error} />}
          {summary && (
            <div className="grid grid-cols-4 gap-2">
              <StatBox label="Health" value={`${summary.health_score}%`} color={summary.health_score >= 80 ? "text-emerald-500" : "text-amber-500"} />
              <StatBox label="Critical" value={summary.critical_count} color="text-red-500" />
              <StatBox label="Warnings" value={summary.warning_count} color="text-amber-500" />
              <StatBox label="Passed" value={summary.passed_count} color="text-emerald-500" />
            </div>
          )}
          {findings.map((f: any, i: number) => (
            <div key={i} className={cn("rounded-lg border p-3 space-y-2", severityColor(f.severity))}>
              <div className="flex items-center gap-2">
                {f.severity === "critical" || f.severity === "high" ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : f.severity === "pass" ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-bold uppercase">{f.severity}</span>
                <Badge variant="outline" className="text-[9px]">{f.category.replace(/_/g, " ")}</Badge>
              </div>
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs opacity-80">{f.description}</p>
              {f.affected_items && <p className="text-[10px] opacity-60">Affected: {f.affected_items}</p>}
              {f.implementation && f.severity !== "pass" && (
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-[10px] opacity-70 flex-1 font-mono">{f.implementation.slice(0, 120)}…</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 gap-1"
                    onClick={() => onCopySpec(f, f.category)}
                  >
                    📋 Copy Spec
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

/* ---- Suggestion Card with Copy Spec ---- */
function SuggestionCard({ suggestion, category, onCopySpec }: {
  suggestion: any;
  category: string;
  onCopySpec: (s: any, cat: string) => void;
}) {
  const title = suggestion.listing_title || suggestion.page_or_listing || suggestion.area || suggestion.feature || "Suggestion";
  const severity = suggestion.severity || suggestion.priority || "medium";
  const desc = suggestion.issue || suggestion.gap || suggestion.description || suggestion.rationale || "";
  const fix = suggestion.suggestion || suggestion.fix || "";

  return (
    <div className={cn("rounded-lg border p-3 space-y-2", severityColor(severity))}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[9px]">{category.replace(/_/g, " ")}</Badge>
        <span className="text-xs font-bold uppercase">{severity}</span>
        {suggestion.effort && <Badge variant="secondary" className="text-[9px]">{suggestion.effort}</Badge>}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {desc && <p className="text-xs opacity-80">{desc}</p>}
      {fix && <p className="text-xs opacity-70">→ {fix}</p>}
      {suggestion.implementation && (
        <div className="flex items-center gap-2 pt-1">
          <p className="text-[10px] opacity-60 flex-1 font-mono">{suggestion.implementation.slice(0, 120)}…</p>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] h-7 gap-1 shrink-0"
            onClick={() => onCopySpec(suggestion, category)}
          >
            📋 Copy Spec
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---- Deploy Suggestion Task Card ---- */
function DeployTaskCard({ task }: { task: SwarmTask }) {
  const [expanded, setExpanded] = useState(true);
  const output = task.output;
  const changes = output?.changes || [];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {statusIcon(task.status)}
          <Code className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Generated Code</span>
          {output?.risk_level && (
            <Badge className={cn("text-[10px]", output.risk_level === "low" ? "bg-emerald-500/10 text-emerald-600" : output.risk_level === "high" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600")}>
              {output.risk_level} risk
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{changes.length} files</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(task.created_at).toLocaleString()}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Validation Status Banner */}
          {task.status === "completed" && changes.length > 0 && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-600">✅ Validated — {changes.length} code changes generated successfully</p>
                <p className="text-[10px] text-emerald-600/70">Risk: {output?.risk_level || "unknown"} · {output?.test_steps?.length || 0} verification steps</p>
              </div>
            </div>
          )}
          {task.status === "completed" && changes.length === 0 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs font-medium text-amber-600">⚠️ Agent completed but produced no actionable code changes</p>
            </div>
          )}
          {task.status === "failed" && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs font-medium text-destructive">❌ Code generation failed — see error below</p>
            </div>
          )}
          {task.error && <ErrorBlock error={task.error} />}
          {output?.summary && (
            <p className="text-sm font-medium text-foreground">{output.summary}</p>
          )}
          {/* Source suggestion */}
          {task.input?.suggestion && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
              <span className="font-medium">Source:</span> {task.input.suggestion.title || task.input.suggestion.feature || task.input.suggestion.listing_title || task.input.category}
            </div>
          )}
          {/* Code changes */}
          {changes.map((c: any, i: number) => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
                <Badge variant={c.change_type === "create" ? "default" : c.change_type === "delete" ? "destructive" : "secondary"} className="text-[9px]">
                  {c.change_type}
                </Badge>
                <code className="text-xs font-mono text-foreground">{c.file_path}</code>
              </div>
              <p className="text-xs text-muted-foreground px-3 py-1.5">{c.description}</p>
              <pre className="text-[10px] bg-background/50 px-3 py-2 overflow-x-auto max-h-60 font-mono whitespace-pre-wrap">
                {c.code}
              </pre>
            </div>
          ))}
          {/* Test steps */}
          {output?.test_steps && output.test_steps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Verification Steps</h4>
              <ol className="list-decimal list-inside space-y-0.5">
                {output.test_steps.map((step: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ErrorBlock({ error }: { error: string }) {
  return (
    <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md">❌ {error}</div>
  );
}

function StatBox({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2 text-center">
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---- Generic Task Result Card (for SEO/Outreach/All) ---- */
function TaskResultCard({ task }: { task: SwarmTask }) {
  const [expanded, setExpanded] = useState(false);
  const config = agentConfig[task.agent_type as keyof typeof agentConfig];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {statusIcon(task.status)}
          <span className="text-sm font-medium">{config?.label || task.agent_type}</span>
          <Badge variant="outline" className="text-[10px]">{task.action.replace(/_/g, " ")}</Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {new Date(task.created_at).toLocaleString()}
          </span>
          <Badge variant={task.triggered_by === "cron" ? "secondary" : "default"} className="text-[10px]">
            {task.triggered_by}
          </Badge>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {task.error && <ErrorBlock error={task.error} />}
          {task.output && (
            <div className="space-y-4">
              {task.output.blog_posts && (
                <OutputSection title="Blog Post Ideas">
                  {task.output.blog_posts.map((post: any, i: number) => (
                    <div key={i} className="p-3 rounded-md bg-muted/30">
                      <p className="text-sm font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{post.meta_description}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.target_keywords?.map((kw: string) => (
                          <Badge key={kw} variant="outline" className="text-[9px]">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </OutputSection>
              )}
              {task.output.directories && (
                <OutputSection title="Discovered Directories">
                  {task.output.directories.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                      <Badge variant={d.priority === "high" ? "default" : "outline"} className="text-[9px]">{d.priority}</Badge>
                      <span className="text-sm font-medium flex-1">{d.name}</span>
                      <a href={d.url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Visit</a>
                    </div>
                  ))}
                </OutputSection>
              )}
              {!task.output.blog_posts && !task.output.directories && !task.output.findings && !task.output.changes && (
                <pre className="text-[10px] bg-muted/30 p-3 rounded-md overflow-auto max-h-60">
                  {JSON.stringify(task.output, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function OutputSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
