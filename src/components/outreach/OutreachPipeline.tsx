import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Star, Mail, Send, Clock, Loader2,
  CheckCircle, Building2, Users, TrendingUp,
  Zap, Sparkles, Play,
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
  { id: "discover", label: "Discover", icon: Target, action: "discover_businesses", description: "Find businesses via web + AI" },
  { id: "score", label: "Score", icon: Star, action: "evaluate_leads", description: "AI scores lead quality 0–100" },
  { id: "draft", label: "Draft", icon: Mail, action: "generate_outreach", description: "Generate personalized emails" },
  { id: "send", label: "Send", icon: Send, action: "send_emails", description: "Deliver via Resend" },
  { id: "follow_up", label: "Follow Up", icon: Clock, action: "send_follow_ups", description: "Automated follow-ups" },
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
    toast.info(`Running ${action.replace(/_/g, " ")}...`);

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
      toast.success(`${action.replace(/_/g, " ")} completed`);
      fetchStats();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setRunningStep(null);
    }
  };

  const runFullCycle = async () => {
    setRunningStep("full_cycle");
    setLastResult(null);
    toast.info("Running full outreach cycle...");

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
      toast.success("Full cycle completed");
      fetchStats();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
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
    <div className="space-y-5">
      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[180px] bg-card border-border/60 text-xs h-9 rounded-xl">
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
          <SelectTrigger className="w-[170px] bg-card border-border/60 text-xs h-9 rounded-xl">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button
            onClick={runFullCycle}
            disabled={runningStep !== null}
            size="sm"
            className="rounded-xl gap-1.5 font-bold h-9 px-4"
            style={{ background: "var(--gradient-hero)" }}
          >
            {runningStep === "full_cycle" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            <span className="text-white">Full Cycle</span>
          </Button>
        </div>
      </motion.div>

      {/* Pipeline Steps — horizontal flow */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-muted/40 rounded-2xl">
        {STEPS.map((step, i) => {
          const status = getStepStatus(step.id);
          const count = getStepCount(step.id);
          const isRunning = runningStep === step.action;
          const Icon = step.icon;

          return (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => status !== "locked" && !runningStep && runStep(step.action)}
              disabled={status === "locked" || !!runningStep}
              className={cn(
                "relative rounded-xl p-4 text-left transition-all group",
                "bg-card hover:shadow-md",
                status === "complete" && "ring-1 ring-emerald-500/20",
                status === "ready" && "hover:ring-1 hover:ring-primary/30",
                status === "locked" && "opacity-35 cursor-not-allowed",
                isRunning && "ring-2 ring-primary/40 shadow-lg"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                  status === "complete"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : status === "ready"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}>
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "complete" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {status === "ready" && !isRunning && (
                  <Play className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="text-xs font-bold text-foreground">{step.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">{step.description}</p>
              <p className="text-xl font-black mt-2 tracking-tight tabular-nums">{count}</p>
              
              {/* Progress connector line */}
              {i < STEPS.length - 1 && status === "complete" && (
                <div className="hidden md:block absolute -right-[3px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-emerald-500/40 z-10" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-4 gap-2"
      >
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={CheckCircle} label="Qualified" value={stats.qualified} accent="emerald" />
        <StatCard icon={Send} label="Emails Sent" value={stats.messagesSent} accent="secondary" />
        <StatCard icon={TrendingUp} label="Drafts Ready" value={stats.messagesDrafted} accent="primary" />
      </motion.div>

      {/* Last Result */}
      <AnimatePresence>
        {lastResult?.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/10 bg-primary/[0.02] overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold">Last Run Result</span>
                  <Badge variant="outline" className="text-[10px] rounded-md">{lastResult.action?.replace(/_/g, " ")}</Badge>
                </div>
                <pre className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-3 overflow-auto max-h-28 font-mono leading-relaxed">
                  {JSON.stringify(lastResult.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View tabs */}
      <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl w-fit border border-border/40">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-[10px] transition-all flex items-center gap-1.5",
              activeView === tab.key
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "text-[10px] font-bold min-w-[20px] text-center py-0.5 px-1.5 rounded-md",
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeView === "pipeline" && (
            <div className="space-y-2">
              {campaigns.length === 0 ? (
                <Card className="border-dashed border-border/60">
                  <CardContent className="py-20 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-5">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1.5">No campaigns yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Click "Full Cycle" to auto-discover businesses and begin outreach.
                    </p>
                    <Button onClick={() => runStep("discover_businesses")} disabled={!!runningStep} className="gap-1.5 rounded-xl">
                      <Sparkles className="h-4 w-4" /> Start Discovering
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                campaigns.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="border-border/40 hover:shadow-md transition-all hover:border-border/60">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm">{c.name}</h3>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {c.industries.slice(0, 3).map((ind, j) => (
                              <Badge key={j} variant="secondary" className="text-[10px] rounded-md font-medium">{ind}</Badge>
                            ))}
                            {c.target_regions[0] && (
                              <Badge variant="outline" className="text-[10px] rounded-md">{c.target_regions[0]}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn(
                            "text-[10px] rounded-md font-bold",
                            c.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-muted text-muted-foreground border-0"
                          )}>
                            {c.status}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
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

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    secondary: "text-secondary bg-secondary/10",
    primary: "text-primary bg-primary/10",
  };
  const colors = accent ? colorMap[accent] : "text-muted-foreground bg-muted";
  const [textColor, bgColor] = colors.split(" ");

  return (
    <Card className="border-border/40">
      <CardContent className="p-3.5 flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
          <Icon className={cn("h-4 w-4", textColor)} />
        </div>
        <div>
          <p className="text-xl font-black tracking-tight tabular-nums">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
