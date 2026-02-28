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
import {
  Crown, TrendingUp, DollarSign, Megaphone, Cpu, Package,
  RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Zap, Target, Clock, ArrowUp,
  ArrowDown, Minus, Rocket, Shield, Users,
} from "lucide-react";
import { toast } from "sonner";
import { CanonicalTag } from "@/components/CanonicalTag";
import { cn } from "@/lib/utils";

const DIRECTOR_CONFIG: Record<string, { title: string; shortTitle: string; icon: any; color: string; bgColor: string }> = {
  ceo: { title: "Chief Executive Officer", shortTitle: "CEO", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  cfo: { title: "Chief Financial Officer", shortTitle: "CFO", icon: DollarSign, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  cmo: { title: "Chief Marketing Officer", shortTitle: "CMO", icon: Megaphone, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  cto: { title: "Chief Technology Officer", shortTitle: "CTO", icon: Cpu, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  cpo: { title: "Chief Product Officer", shortTitle: "CPO", icon: Package, color: "text-rose-500", bgColor: "bg-rose-500/10" },
};

const healthColors: Record<string, string> = {
  thriving: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  healthy: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  needs_attention: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  critical: "bg-red-500/15 text-red-600 border-red-500/30",
};

const priorityColors: Record<string, string> = {
  P0: "bg-red-500/15 text-red-600 border-red-500/30",
  P1: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  P2: "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

const trendIcon = (trend: string) => {
  switch (trend) {
    case "up": return <ArrowUp className="h-3 w-3 text-emerald-500" />;
    case "down": return <ArrowDown className="h-3 w-3 text-red-500" />;
    default: return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

interface BoardMeeting {
  id: string;
  status: string;
  output: any;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function BoardRoomPage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<BoardMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [convening, setConvening] = useState(false);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("swarm_tasks")
      .select("*")
      .eq("agent_type", "board_meeting")
      .order("created_at", { ascending: false })
      .limit(20);
    setMeetings((data as BoardMeeting[]) ?? []);
    setLoading(false);
  };

  const conveneMeeting = async () => {
    setConvening(true);
    toast.info("🏛️ Convening the Board of Directors...");

    try {
      const { data, error } = await supabase.functions.invoke("swarm-board-meeting", {
        body: { include_synthesis: true },
      });
      if (error) throw error;
      toast.success("✅ Board meeting concluded!");
      fetchMeetings();
    } catch (e: any) {
      toast.error(`❌ Board meeting failed: ${e.message}`);
    } finally {
      setConvening(false);
    }
  };

  const deployInitiative = async (initiative: any, meetingId: string) => {
    const key = `${meetingId}-${initiative.title}`;
    setDeployingId(key);
    toast.info("🚀 Generating implementation code...");

    try {
      const { data, error } = await supabase.functions.invoke("swarm-deploy-suggestion", {
        body: {
          suggestion: {
            title: initiative.title,
            description: initiative.description,
            implementation: initiative.implementation,
            issue: initiative.description,
            suggestion: initiative.expected_revenue_impact,
          },
          source_task_id: meetingId,
          category: "board_initiative",
        },
      });
      if (error) throw error;

      const changes = data?.result?.changes?.length || 0;
      if (changes > 0) {
        toast.success(`✅ Generated ${changes} code changes! Check Swarm → Deploy Suggestions.`);
      } else {
        toast.warning("⚠️ Agent completed but generated no code changes.");
      }
    } catch (e: any) {
      toast.error(`❌ Deploy failed: ${e.message}`);
    } finally {
      setDeployingId(null);
    }
  };

  if (adminLoading || !isAdmin) return null;

  const latestMeeting = meetings[0];
  const latestOutput = latestMeeting?.output;
  const synthesis = latestOutput?.synthesis;
  const directors = latestOutput?.directors || {};
  const snapshot = latestOutput?.platform_snapshot;

  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/boardroom" />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Board of Directors</h1>
            <p className="text-sm text-muted-foreground">AI C-suite analyzing real platform data to maximize growth & profit</p>
          </div>
          <Button onClick={conveneMeeting} disabled={convening} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
            {convening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            {convening ? "Convening..." : "Convene Board Meeting"}
          </Button>
        </div>

        {/* Platform Snapshot */}
        {snapshot && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: "Live Listings", value: snapshot.live_listings, icon: Package },
              { label: "Total Users", value: snapshot.total_users, icon: Users },
              { label: "Purchases", value: snapshot.total_purchases, icon: DollarSign },
              { label: "Revenue", value: `$${(snapshot.total_revenue_cents / 100).toFixed(0)}`, icon: TrendingUp },
              { label: "All Listings", value: snapshot.total_listings, icon: Target },
            ].map((s) => (
              <Card key={s.label} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!latestMeeting && !loading && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="py-16 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Board Meetings Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Convene the board to get AI-powered strategic analysis from your C-suite directors.</p>
              <Button onClick={conveneMeeting} disabled={convening} className="gap-2">
                <Crown className="h-4 w-4" /> Convene First Meeting
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {latestMeeting && (
          <Tabs defaultValue="resolution" className="mt-2">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="resolution" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Board Resolution
              </TabsTrigger>
              {Object.keys(directors).map((key) => {
                const config = DIRECTOR_CONFIG[key];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" /> {config.shortTitle}
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="history" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" /> History
              </TabsTrigger>
            </TabsList>

            {/* Board Resolution Tab */}
            <TabsContent value="resolution" className="space-y-4 mt-4">
              {latestMeeting.status === "running" && (
                <Card><CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-3" />
                  <p className="text-sm font-medium">Board meeting in progress...</p>
                  <p className="text-xs text-muted-foreground">Directors are analyzing platform data</p>
                </CardContent></Card>
              )}

              {latestMeeting.error && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="py-4 flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm">{latestMeeting.error}</span>
                  </CardContent>
                </Card>
              )}

              {synthesis && (
                <>
                  {/* Overall Health + Executive Summary */}
                  <Card className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-xs", healthColors[synthesis.overall_health] || "")}>
                          {synthesis.overall_health?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Convened: {new Date(latestMeeting.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{synthesis.executive_summary}</p>
                    </CardContent>
                  </Card>

                  {/* Critical Decision */}
                  {synthesis.critical_decision && (
                    <Card className="border-red-500/30 bg-red-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" /> Critical Decision Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">{synthesis.critical_decision.question}</p>
                        <p className="text-sm text-foreground">→ {synthesis.critical_decision.recommendation}</p>
                        <p className="text-xs text-muted-foreground">{synthesis.critical_decision.rationale}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Unified Initiatives */}
                  {synthesis.unified_initiatives?.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Prioritized Initiatives
                      </h3>
                      {synthesis.unified_initiatives.map((init: any, i: number) => (
                        <Card key={i} className="border-border/50">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={cn("text-[10px]", priorityColors[init.priority] || "")}>
                                {init.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {init.timeline?.replace(/_/g, " ")}
                              </Badge>
                              {init.owners?.map((o: string) => (
                                <Badge key={o} variant="secondary" className="text-[9px]">
                                  {DIRECTOR_CONFIG[o]?.shortTitle || o}
                                </Badge>
                              ))}
                              <span className="text-[10px] text-emerald-600 ml-auto font-medium">
                                {init.expected_revenue_impact}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{init.title}</p>
                            <p className="text-xs text-muted-foreground">{init.description}</p>
                            {init.implementation && (
                              <div className="flex items-center gap-2 pt-1">
                                <p className="text-[10px] text-muted-foreground font-mono flex-1">{init.implementation.slice(0, 150)}…</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] h-7 gap-1 shrink-0"
                                  onClick={() => deployInitiative(init, latestMeeting.id)}
                                  disabled={deployingId !== null}
                                >
                                  {deployingId === `${latestMeeting.id}-${init.title}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Rocket className="h-3 w-3" />
                                  )}
                                  Deploy
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* KPIs */}
                  {synthesis.kpis_to_track?.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" /> KPIs to Track
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {synthesis.kpis_to_track.map((kpi: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                              <span className="text-xs font-medium text-foreground flex-1">{kpi.metric}</span>
                              <span className="text-xs text-muted-foreground">Now: {kpi.current}</span>
                              <span className="text-xs text-amber-600">30d: {kpi.target_30d}</span>
                              <span className="text-xs text-emerald-600">90d: {kpi.target_90d}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Conflicts */}
                  {synthesis.conflicts?.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-500" /> Noted Conflicts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {synthesis.conflicts.map((c: any, i: number) => (
                          <div key={i} className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-1">
                            <p className="text-xs font-semibold text-foreground">{c.issue}</p>
                            <p className="text-[10px] text-muted-foreground">{c.positions}</p>
                            <p className="text-[10px] text-amber-600">Resolution: {c.resolution}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Director Tabs */}
            {Object.entries(directors).map(([key, dirData]: [string, any]) => {
              const config = DIRECTOR_CONFIG[key];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <TabsContent key={key} value={key} className="space-y-4 mt-4">
                  {dirData.error ? (
                    <Card className="border-destructive/30">
                      <CardContent className="py-4 flex items-center gap-2 text-destructive">
                        <XCircle className="h-4 w-4" /> <span className="text-sm">{dirData.error}</span>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Director Header */}
                      <Card className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                              <Icon className={cn("h-5 w-5", config.color)} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold">{config.title}</p>
                              <p className="text-xs text-muted-foreground">{dirData.headline}</p>
                            </div>
                            <Badge className={cn("text-xs", healthColors[dirData.health_assessment] || "")}>
                              {dirData.health_assessment?.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          {/* Key Metrics */}
                          {dirData.key_metrics?.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {dirData.key_metrics.map((m: any, i: number) => (
                                <div key={i} className={cn("rounded-lg border p-2 text-center",
                                  m.assessment === "good" ? "border-emerald-500/30 bg-emerald-500/5" :
                                  m.assessment === "critical" ? "border-red-500/30 bg-red-500/5" :
                                  "border-amber-500/30 bg-amber-500/5"
                                )}>
                                  <div className="flex items-center justify-center gap-1">
                                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                                    {trendIcon(m.trend)}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{m.metric}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recommendations */}
                      {dirData.recommendations?.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommendations</h3>
                          {dirData.recommendations.map((rec: any, i: number) => (
                            <Card key={i} className="border-border/50">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={cn("text-[10px]", priorityColors[rec.priority] || "")}>{rec.priority}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{rec.effort} effort</Badge>
                                </div>
                                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                                <p className="text-xs text-muted-foreground">{rec.description}</p>
                                <p className="text-xs text-emerald-600">Impact: {rec.expected_impact}</p>
                                {rec.implementation && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <p className="text-[10px] text-muted-foreground font-mono flex-1">{rec.implementation.slice(0, 120)}…</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[10px] h-7 gap-1 shrink-0"
                                      onClick={() => deployInitiative({
                                        ...rec,
                                        expected_revenue_impact: rec.expected_impact,
                                      }, latestMeeting.id)}
                                      disabled={deployingId !== null}
                                    >
                                      {deployingId === `${latestMeeting.id}-${rec.title}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Rocket className="h-3 w-3" />
                                      )}
                                      Deploy
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Risks */}
                      {dirData.risks?.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identified Risks</h3>
                          {dirData.risks.map((r: any, i: number) => (
                            <div key={i} className={cn("rounded-lg border p-3 space-y-1",
                              r.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                              r.severity === "high" ? "border-orange-500/30 bg-orange-500/5" :
                              "border-amber-500/30 bg-amber-500/5"
                            )}>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase">{r.severity}</span>
                              </div>
                              <p className="text-xs font-medium text-foreground">{r.risk}</p>
                              <p className="text-[10px] text-muted-foreground">Mitigation: {r.mitigation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              );
            })}

            {/* History Tab */}
            <TabsContent value="history" className="space-y-3 mt-4">
              {meetings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No meetings yet.</CardContent></Card>
              ) : meetings.map((m) => (
                <Card key={m.id} className="border-border/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    {m.status === "completed" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                     m.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> :
                     <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">Board Meeting</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    {m.output?.synthesis?.overall_health && (
                      <Badge className={cn("text-[10px]", healthColors[m.output.synthesis.overall_health] || "")}>
                        {m.output.synthesis.overall_health.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {m.output?.synthesis?.unified_initiatives && (
                      <Badge variant="outline" className="text-[10px]">
                        {m.output.synthesis.unified_initiatives.length} initiatives
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={fetchMeetings}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}
