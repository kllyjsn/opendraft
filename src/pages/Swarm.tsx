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
import { Bot, Zap, TrendingUp, Globe, RefreshCw, Clock, CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { CanonicalTag } from "@/components/CanonicalTag";

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
      .limit(50);
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

  const seoTasks = tasks.filter(t => t.agent_type === "seo_content");
  const outreachTasks = tasks.filter(t => t.agent_type === "outreach_growth");

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
            <p className="text-sm text-muted-foreground">Autonomous agents optimizing marketing & growth</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchTasks}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {Object.entries(agentConfig).map(([key, config]) => {
            const Icon = config.icon;
            const agentTasks = tasks.filter(t => t.agent_type === key);
            const lastRun = agentTasks[0];
            const completedCount = agentTasks.filter(t => t.status === "completed").length;

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

        {/* Results */}
        <Tabs defaultValue="seo" className="mt-8">
          <TabsList>
            <TabsTrigger value="seo" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> SEO Results
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Outreach Results
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> All Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seo" className="space-y-4 mt-4">
            {seoTasks.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No SEO agent runs yet. Click "full cycle" above to start.</CardContent></Card>
            ) : seoTasks.map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>

          <TabsContent value="outreach" className="space-y-4 mt-4">
            {outreachTasks.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No Outreach agent runs yet. Click "full cycle" above to start.</CardContent></Card>
            ) : outreachTasks.map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {tasks.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No agent activity yet.</CardContent></Card>
            ) : tasks.map(task => <TaskResultCard key={task.id} task={task} />)}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

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
          {task.error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md mb-3">
              ❌ {task.error}
            </div>
          )}
          {task.output && (
            <div className="space-y-4">
              {/* SEO output */}
              {task.output.blog_posts && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Blog Post Ideas</h4>
                  <div className="space-y-2">
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
                  </div>
                </div>
              )}
              {task.output.meta_improvements && task.output.meta_improvements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Meta Improvements</h4>
                  {task.output.meta_improvements.map((m: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/30 mb-1">
                      <p className="text-xs font-medium">{m.listing_title}: <span className="text-muted-foreground">{m.recommendation}</span></p>
                    </div>
                  ))}
                </div>
              )}
              {task.output.content_gaps && task.output.content_gaps.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Content Gaps</h4>
                  {task.output.content_gaps.map((g: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/30 mb-1">
                      <p className="text-xs"><span className="font-medium">{g.page_title}</span> → {g.url_path}</p>
                      <p className="text-[10px] text-muted-foreground">{g.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Outreach output */}
              {task.output.directories && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Discovered Directories</h4>
                  <div className="space-y-1">
                    {task.output.directories.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                        <Badge variant={d.priority === "high" ? "default" : "outline"} className="text-[9px]">{d.priority}</Badge>
                        <span className="text-sm font-medium flex-1">{d.name}</span>
                        <a href={d.url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Visit</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {task.output.partnerships && task.output.partnerships.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Partnership Opportunities</h4>
                  {task.output.partnerships.map((p: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/30 mb-1">
                      <p className="text-xs"><span className="font-medium">{p.partner_name}</span>: {p.opportunity}</p>
                      <p className="text-[10px] text-muted-foreground">→ {p.action_item}</p>
                    </div>
                  ))}
                </div>
              )}
              {task.output.growth_tactics && task.output.growth_tactics.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Growth Tactics</h4>
                  {task.output.growth_tactics.map((t: any, i: number) => (
                    <div key={i} className="p-2 rounded-md bg-muted/30 mb-1">
                      <p className="text-xs"><span className="font-medium">{t.tactic}</span> via {t.channel}</p>
                      <p className="text-[10px] text-muted-foreground">Expected: {t.expected_result}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback raw output */}
              {!task.output.blog_posts && !task.output.directories && (
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
