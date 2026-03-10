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
  readyForDraft: number;
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
    contacted: 0, messagesDrafted: 0, messagesSent: 0, noResponse: 0, readyForDraft: 0,
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
      supabase.from("outreach_messages").select("id, message_status, campaign_id, lead_id"),
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

    // Find leads with score >= 50 and qualified/nurture status that don't have a drafted message
    const draftedLeadIds = new Set(
      messages.filter(m => m.message_status === "drafted").map(m => m.lead_id)
    );
    const readyForDraft = leads.filter(
      l => l.score >= 50 && ["qualified", "nurture"].includes(l.lead_status) && !draftedLeadIds.has(l.id)
    ).length;

    setStats({
      totalLeads: leads.length,
      unscored: leads.filter(l => l.score === 0).length,
      qualified: leads.filter(l => l.lead_status === "qualified").length,
      nurture: leads.filter(l => l.lead_status === "nurture").length,
      contacted: leads.filter(l => l.lead_status === "contacted").length,
      messagesDrafted: messages.filter(m => m.message_status === "drafted").length,
      messagesSent: messages.filter(m => m.message_status === "sent").length,
      noResponse: leads.filter(l => l.lead_status === "no_response").length,
      readyForDraft,
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
    <div className="space-y-4 sm:space-y-5">
      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border/60 text-xs h-9 rounded-xl">
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
          <SelectTrigger className="w-full sm:w-[170px] bg-card border-border/60 text-xs h-9 rounded-xl">
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
          className="rounded-xl gap-1.5 font-bold h-9 px-4 w-full sm:w-auto sm:ml-auto"
          style={{ background: "var(--gradient-hero)" }}
        >
          {runningStep === "full_cycle" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span className="text-white">Full Cycle</span>
        </Button>
      </motion.div>

      {/* Pipeline Steps — scrollable on mobile, grid on desktop */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex sm:grid sm:grid-cols-5 gap-1 p-1 bg-muted/40 rounded-2xl min-w-[600px] sm:min-w-0">
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
                  "relative rounded-xl p-3 sm:p-4 text-left transition-all group flex-1 sm:flex-none",
                  "bg-card hover:shadow-md",
                  status === "complete" && "ring-1 ring-emerald-500/20",
                  status === "ready" && "hover:ring-1 hover:ring-primary/30",
                  status === "locked" && "opacity-35 cursor-not-allowed",
                  isRunning && "ring-2 ring-primary/40 shadow-lg"
                )}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-colors",
                    status === "complete"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : status === "ready"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : status === "complete" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  {status === "ready" && !isRunning && (
                    <Play className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-xs font-bold text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 hidden sm:block line-clamp-1">{step.description}</p>
                <p className="text-lg sm:text-xl font-black mt-1.5 sm:mt-2 tracking-tight tabular-nums">{count}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={CheckCircle} label="Qualified" value={stats.qualified} accent="emerald" />
        <StatCard icon={Send} label="Emails Sent" value={stats.messagesSent} accent="secondary" />
        <StatCard icon={TrendingUp} label="Drafts Ready" value={stats.messagesDrafted} accent="primary" />
      </motion.div>

      {/* Draft CTA Banner */}
      <AnimatePresence>
        {stats.readyForDraft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Card className="border-primary/20 bg-primary/[0.04] overflow-hidden">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {stats.readyForDraft} lead{stats.readyForDraft !== 1 ? "s" : ""} ready for email drafts
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qualified leads with score ≥ 50 that don't have a draft yet. Click to generate personalized emails.
                  </p>
                </div>
                <Button
                  onClick={() => runStep("generate_outreach")}
                  disabled={runningStep !== null}
                  size="sm"
                  className="rounded-xl gap-1.5 font-bold h-9 px-5 shrink-0 w-full sm:w-auto"
                >
                  {runningStep === "generate_outreach" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate Drafts
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Result — human-readable summary */}
      <AnimatePresence>
        {lastResult?.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Cycle Complete</p>
                    <p className="text-[10px] text-muted-foreground">{lastResult.action?.replace(/_/g, " ")}</p>
                  </div>
                </div>

                {/* Human-readable summary */}
                {lastResult.result.summary ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-card rounded-xl p-2.5 sm:p-3 text-center border border-border/40">
                      <p className="text-lg sm:text-2xl font-black tabular-nums text-foreground">{lastResult.result.summary.businesses_found ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Leads Found</p>
                    </div>
                    <div className="bg-card rounded-xl p-2.5 sm:p-3 text-center border border-border/40">
                      <p className="text-lg sm:text-2xl font-black tabular-nums text-foreground">{lastResult.result.summary.leads_scored ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Scored</p>
                    </div>
                    <div className="bg-card rounded-xl p-2.5 sm:p-3 text-center border border-border/40">
                      <p className="text-lg sm:text-2xl font-black tabular-nums text-foreground">{lastResult.result.summary.messages_drafted ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Drafts Created</p>
                    </div>
                  </div>
                ) : (
                  <pre className="text-[10px] sm:text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 sm:p-3 overflow-auto max-h-28 font-mono leading-relaxed">
                    {JSON.stringify(lastResult.result, null, 2)}
                  </pre>
                )}

                {/* Quick actions after cycle */}
                {lastResult.result.summary?.messages_drafted > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 gap-1.5"
                      onClick={() => setActiveView("messages")}
                    >
                      <Mail className="h-3 w-3" /> Review {lastResult.result.summary.messages_drafted} Drafts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 gap-1.5"
                      onClick={() => setActiveView("leads")}
                    >
                      <Building2 className="h-3 w-3" /> View Leads
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl w-fit border border-border/40">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs font-semibold rounded-[10px] transition-all flex items-center gap-1.5 whitespace-nowrap",
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
                  <CardContent className="py-14 sm:py-20 text-center px-4">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                      <Target className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1.5">No campaigns yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 max-w-sm mx-auto">
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
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm">{c.name}</h3>
                              <Badge className={cn(
                                "text-[10px] rounded-md font-bold",
                                c.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-muted text-muted-foreground border-0"
                              )}>
                                {c.status}
                              </Badge>
                            </div>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {c.industries.slice(0, 3).map((ind, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px] rounded-md font-medium">{ind}</Badge>
                              ))}
                              {c.target_regions[0] && (
                                <Badge variant="outline" className="text-[10px] rounded-md">{c.target_regions[0]}</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:block">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
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
      <CardContent className="p-3 flex items-center gap-2.5 sm:gap-3">
        <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
          <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", textColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-black tracking-tight tabular-nums">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
