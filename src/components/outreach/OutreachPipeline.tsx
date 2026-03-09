import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Star, Mail, Send, Clock, Loader2,
  CheckCircle, Building2, Users, TrendingUp,
  ChevronRight, Zap, Sparkles, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { OutreachLeadsList } from "./OutreachLeadsList";
import { OutreachMessagesList } from "./OutreachMessagesList";

interface Campaign {
  id: string;
  name: string;
  niche: string;
  industries: string[];
  target_regions: string[];
  status: string;
  created_at: string;
}

interface PipelineStats {
  totalLeads: number;
  unscored: number;
  qualified: number;
  nurture: number;
  contacted: number;
  messagesDrafted: number;
  messagesSent: number;
  noResponse: number;
}

const STEPS = [
  { id: "discover", label: "Discover", icon: Target, action: "discover_businesses", description: "Find businesses via web + AI", gradient: "from-primary to-accent" },
  { id: "score", label: "Score", icon: Star, action: "evaluate_leads", description: "AI scores lead quality 0–100", gradient: "from-amber-500 to-orange-500" },
  { id: "draft", label: "Draft", icon: Mail, action: "generate_outreach", description: "Generate personalized emails", gradient: "from-secondary to-cyan-400" },
  { id: "send", label: "Send", icon: Send, action: "send_emails", description: "Deliver via email", gradient: "from-emerald-500 to-green-400" },
  { id: "follow_up", label: "Follow Up", icon: Clock, action: "send_follow_ups", description: "Automated follow-ups", gradient: "from-violet-500 to-purple-400" },
] as const;

const INDUSTRIES = [
  "Home Services", "Food & Beverage", "Health & Wellness",
  "Professional Services", "Automotive", "Beauty & Personal Care",
  "Retail & Local Shops", "Education & Childcare", "Events & Entertainment",
  "Pet Services", "Construction & Trades", "Real Estate & Property",
];

type ViewKey = "pipeline" | "leads" | "messages";

export function OutreachPipeline() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [stats, setStats] = useState<PipelineStats>({
    totalLeads: 0, unscored: 0, qualified: 0, nurture: 0,
    contacted: 0, messagesDrafted: 0, messagesSent: 0, noResponse: 0,
  });
  const [loading, setLoading] = useState(true);
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("pipeline");
  const [lastResult, setLastResult] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const campaignFilter = selectedCampaign !== "all" ? selectedCampaign : null;

    const [campaignsRes, leadsRes, messagesRes] = await Promise.all([
      supabase.from("outreach_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("outreach_leads").select("id, score, lead_status, industry, campaign_id"),
      supabase.from("outreach_messages").select("id, message_status, campaign_id"),
    ]);

    setCampaigns((campaignsRes.data as Campaign[]) || []);

    const leads = (leadsRes.data || []).filter(l => {
      if (campaignFilter && l.campaign_id !== campaignFilter) return false;
      if (selectedIndustry !== "all" && l.industry !== selectedIndustry) return false;
      return true;
    });

    const messages = (messagesRes.data || []).filter(m => {
      if (campaignFilter && m.campaign_id !== campaignFilter) return false;
      return true;
    });

    setStats({
      totalLeads: leads.length,
      unscored: leads.filter(l => l.score === 0).length,
      qualified: leads.filter(l => l.lead_status === "qualified").length,
      nurture: leads.filter(l => l.lead_status === "nurture").length,
      contacted: leads.filter(l => l.lead_status === "contacted").length,
      messagesDrafted: messages.filter(m => m.message_status === "drafted").length,
      messagesSent: messages.filter(m => m.message_status === "sent").length,
      noResponse: leads.filter(l => l.lead_status === "no_response").length,
    });

    setLoading(false);
  }, [selectedCampaign, selectedIndustry]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const runStep = async (action: string) => {
    setRunningStep(action);
    setLastResult(null);
    toast.info(`🤖 Running ${action.replace(/_/g, " ")}...`);

    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: {
          action,
          triggered_by: "manual",
          campaign_id: selectedCampaign !== "all" ? selectedCampaign : null,
          industry: selectedIndustry !== "all" ? selectedIndustry : null,
        },
      });
      if (error) throw error;
      setLastResult({ action, ...data });
      toast.success(`✅ ${action.replace(/_/g, " ")} completed!`);
      fetchStats();
    } catch (e: any) {
      toast.error(`❌ Failed: ${e.message}`);
    } finally {
      setRunningStep(null);
    }
  };

  const runFullCycle = async () => {
    setRunningStep("full_cycle");
    setLastResult(null);
    toast.info("🤖 Running full outreach cycle...");

    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: {
          action: "full_cycle",
          triggered_by: "manual",
          campaign_id: selectedCampaign !== "all" ? selectedCampaign : null,
          industry: selectedIndustry !== "all" ? selectedIndustry : null,
        },
      });
      if (error) throw error;
      setLastResult({ action: "full_cycle", ...data });
      toast.success("✅ Full cycle completed!");
      fetchStats();
    } catch (e: any) {
      toast.error(`❌ Failed: ${e.message}`);
    } finally {
      setRunningStep(null);
    }
  };

  const getStepStatus = (stepId: string) => {
    switch (stepId) {
      case "discover": return stats.totalLeads > 0 ? "complete" : "ready";
      case "score": return stats.unscored === 0 && stats.totalLeads > 0 ? "complete" : stats.totalLeads > 0 ? "ready" : "locked";
      case "draft": return stats.messagesDrafted > 0 || stats.messagesSent > 0 ? "complete" : stats.qualified > 0 ? "ready" : "locked";
      case "send": return stats.messagesSent > 0 ? "complete" : stats.messagesDrafted > 0 ? "ready" : "locked";
      case "follow_up": return stats.contacted > 0 ? "ready" : "locked";
      default: return "locked";
    }
  };

  const getStepCount = (stepId: string) => {
    switch (stepId) {
      case "discover": return stats.totalLeads;
      case "score": return stats.qualified + stats.nurture;
      case "draft": return stats.messagesDrafted + stats.messagesSent;
      case "send": return stats.messagesSent;
      case "follow_up": return stats.contacted;
      default: return 0;
    }
  };

  const TABS: { key: ViewKey; label: string; icon: any; count?: number }[] = [
    { key: "pipeline", label: "Pipeline", icon: Sparkles },
    { key: "leads", label: "Leads", icon: Building2, count: stats.totalLeads },
    { key: "messages", label: "Emails", icon: Mail, count: stats.messagesDrafted + stats.messagesSent },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Outreach Pipeline</h2>
            <p className="text-white/70 text-sm mt-0.5">Discover → Score → Draft → Review → Send</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white backdrop-blur-sm text-xs h-9 [&>svg]:text-white">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white backdrop-blur-sm text-xs h-9 [&>svg]:text-white">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRIES.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={runFullCycle}
              disabled={runningStep !== null}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm gap-1.5 font-bold"
            >
              {runningStep === "full_cycle" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Full Cycle
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Pipeline Steps — horizontal flow */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STEPS.map((step, i) => {
          const status = getStepStatus(step.id);
          const count = getStepCount(step.id);
          const isRunning = runningStep === step.action;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="relative"
            >
              <button
                onClick={() => status !== "locked" && !runningStep && runStep(step.action)}
                disabled={status === "locked" || !!runningStep}
                className={cn(
                  "w-full rounded-xl p-4 text-left border transition-all group relative overflow-hidden",
                  "bg-card hover:shadow-lg",
                  status === "complete" && "border-emerald-500/30",
                  status === "ready" && "border-primary/30 hover:border-primary/50",
                  status === "locked" && "opacity-40 cursor-not-allowed",
                  isRunning && "ring-2 ring-primary/50"
                )}
              >
                {/* Subtle gradient overlay on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
                  step.gradient,
                  "pointer-events-none"
                )} style={{ opacity: status === "locked" ? 0 : undefined }} />
                <div className="absolute inset-0 bg-card opacity-0 group-hover:opacity-90 transition-opacity pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      status === "complete"
                        ? "bg-emerald-500/10"
                        : status === "ready"
                          ? "bg-primary/10"
                          : "bg-muted"
                    )}>
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : status === "complete" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Icon className={cn("h-4 w-4", status === "ready" ? "text-primary" : "text-muted-foreground")} />
                      )}
                    </div>
                    {status === "ready" && !isRunning && (
                      <Badge className="ml-auto text-[9px] bg-primary/10 text-primary border-0 gap-0.5 px-1.5">
                        <ArrowRight className="h-2.5 w-2.5" /> Run
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.description}</p>
                  <p className="text-2xl font-black mt-2 tracking-tight">{count}</p>
                </div>
              </button>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2"
      >
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={CheckCircle} label="Qualified" value={stats.qualified} color="text-emerald-500" />
        <StatCard icon={Mail} label="Emails Sent" value={stats.messagesSent} color="text-secondary" />
        <StatCard icon={TrendingUp} label="Drafts Ready" value={stats.messagesDrafted} color="text-primary" />
      </motion.div>

      {/* Last Result */}
      <AnimatePresence>
        {lastResult?.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Last Run</span>
                  <Badge variant="outline" className="text-[10px]">{lastResult.action?.replace(/_/g, " ")}</Badge>
                </div>
                <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-auto max-h-32 font-mono">
                  {JSON.stringify(lastResult.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View tabs — pill style */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5",
              activeView === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5",
                activeView === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === "pipeline" && (
            <div className="grid gap-2">
              {campaigns.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Target className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1">No campaigns yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Click "Full Cycle" or "Discover" to create your first outreach campaign.</p>
                    <Button onClick={() => runStep("discover_businesses")} disabled={!!runningStep} className="gap-1.5">
                      <Sparkles className="h-4 w-4" /> Start Discovering
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                campaigns.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm">{c.name}</h3>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.industries.slice(0, 3).map((ind, j) => (
                              <Badge key={j} variant="secondary" className="text-[10px]">{ind}</Badge>
                            ))}
                            {c.target_regions[0] && (
                              <Badge variant="outline" className="text-[10px]">{c.target_regions[0]}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          c.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-muted text-muted-foreground border-0"
                        )}>
                          {c.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeView === "leads" && (
            <OutreachLeadsList
              campaignId={selectedCampaign !== "all" ? selectedCampaign : null}
              industry={selectedIndustry !== "all" ? selectedIndustry : null}
            />
          )}

          {activeView === "messages" && (
            <OutreachMessagesList
              campaignId={selectedCampaign !== "all" ? selectedCampaign : null}
              onStatsChange={fetchStats}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
        </div>
        <div>
          <p className="text-xl font-black tracking-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
