import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Target, Star, Mail, Send, Clock, RefreshCw, Loader2,
  CheckCircle, AlertCircle, Building2, Users, TrendingUp,
  ChevronRight, ExternalLink, Copy, ArrowRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  { id: "discover", label: "Discover", icon: Target, action: "discover_businesses", description: "Find businesses via web search + AI" },
  { id: "score", label: "Score", icon: Star, action: "evaluate_leads", description: "AI evaluates lead quality 0–100" },
  { id: "draft", label: "Draft", icon: Mail, action: "generate_outreach", description: "Generate personalized emails" },
  { id: "send", label: "Send", icon: Send, action: "send_emails", description: "Deliver via Resend" },
  { id: "follow_up", label: "Follow Up", icon: Clock, action: "send_follow_ups", description: "Automated follow-up sequences" },
] as const;

const INDUSTRIES = [
  "Home Services", "Food & Beverage", "Health & Wellness",
  "Professional Services", "Automotive", "Beauty & Personal Care",
  "Retail & Local Shops", "Education & Childcare", "Events & Entertainment",
  "Pet Services", "Construction & Trades", "Real Estate & Property",
];

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
  const [activeView, setActiveView] = useState<"pipeline" | "leads" | "messages">("pipeline");
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[220px]">
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            onClick={runFullCycle}
            disabled={runningStep !== null}
            className="gap-1.5"
          >
            {runningStep === "full_cycle" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Full Cycle
          </Button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STEPS.map((step, i) => {
          const status = getStepStatus(step.id);
          const count = getStepCount(step.id);
          const isRunning = runningStep === step.action;
          const Icon = step.icon;

          return (
            <Card
              key={step.id}
              className={cn(
                "relative border transition-all cursor-pointer hover:shadow-md",
                status === "complete" && "border-emerald-500/30 bg-emerald-500/5",
                status === "ready" && "border-primary/30 bg-primary/5",
                status === "locked" && "opacity-50",
                isRunning && "ring-2 ring-primary animate-pulse"
              )}
              onClick={() => status !== "locked" && !runningStep && runStep(step.action)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    status === "complete" ? "bg-emerald-500/10" : "bg-muted"
                  )}>
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : status === "complete" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Icon className={cn("h-4 w-4", status === "ready" ? "text-primary" : "text-muted-foreground")} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{count}</span>
                  {status === "ready" && !isRunning && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30">
                      <ArrowRight className="h-2.5 w-2.5" /> Run
                    </Badge>
                  )}
                  {status === "locked" && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Locked
                    </Badge>
                  )}
                </div>
              </CardContent>
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={CheckCircle} label="Qualified" value={stats.qualified} color="text-emerald-500" />
        <StatCard icon={Mail} label="Emails Sent" value={stats.messagesSent} color="text-blue-500" />
        <StatCard icon={TrendingUp} label="Response Rate" value={stats.messagesSent > 0 ? `${Math.round((stats.noResponse / Math.max(1, stats.contacted + stats.noResponse)) * 100)}%` : "—"} />
      </div>

      {/* Last Result */}
      {lastResult?.result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Last Run Result</span>
              <Badge variant="outline" className="text-[10px]">{lastResult.action?.replace(/_/g, " ")}</Badge>
            </div>
            <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-auto max-h-40">
              {JSON.stringify(lastResult.result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "pipeline" as const, label: "Pipeline", icon: Target },
          { key: "leads" as const, label: "Leads", icon: Building2 },
          { key: "messages" as const, label: "Messages", icon: Mail },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-1.5",
              activeView === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === "pipeline" && (
        <div className="grid gap-3">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No campaigns yet. Click "Run Full Cycle" or "Discover" to start.</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map(c => (
              <Card key={c.id} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{c.name}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {c.industries.slice(0, 3).map((ind, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{ind}</Badge>
                      ))}
                      {c.target_regions[0] && (
                        <Badge variant="outline" className="text-[10px]">{c.target_regions[0]}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={c.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}>
                    {c.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </CardContent>
              </Card>
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
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
          <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
