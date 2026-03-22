import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Star, Mail, Send, Clock, Loader2,
  Building2, Users, Zap, Sparkles, Inbox, Pencil,
  ChevronRight, BarChart3, RefreshCw,
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

const ACTIONS = [
  { id: "discover_businesses", label: "Discover", icon: Target, shortLabel: "Discover" },
  { id: "evaluate_leads", label: "Score Leads", icon: Star, shortLabel: "Score" },
  { id: "generate_outreach", label: "Draft Emails", icon: Sparkles, shortLabel: "Draft" },
  { id: "send_emails", label: "Send All", icon: Send, shortLabel: "Send" },
  { id: "send_follow_ups", label: "Follow Up", icon: Clock, shortLabel: "Follow" },
] as const;

const INDUSTRIES = [
  "Home Services", "Food & Beverage", "Health & Wellness",
  "Professional Services", "Automotive", "Beauty & Personal Care",
  "Retail & Local Shops", "Education & Childcare", "Events & Entertainment",
  "Pet Services", "Construction & Trades", "Real Estate & Property",
];

type ViewKey = "inbox" | "drafts" | "sent" | "leads" | "all";

const NAV_ITEMS: { key: ViewKey; label: string; icon: any }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "drafts", label: "Drafts", icon: Pencil },
  { key: "sent", label: "Sent", icon: Send },
  { key: "leads", label: "Leads", icon: Building2 },
  { key: "all", label: "All Mail", icon: Mail },
];

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
  const [activeView, setActiveView] = useState<ViewKey>("inbox");
  const [showActions, setShowActions] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const campaignFilter = selectedCampaign !== "all" ? selectedCampaign : null;

    const [campaignsRes, leadsRes, messagesRes] = await Promise.all([
      supabase.from("outreach_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("outreach_leads").select("id, score, lead_status, industry, campaign_id"),
      supabase.from("outreach_messages").select("id, message_status, campaign_id, lead_id, direction"),
    ]);

    setCampaigns((campaignsRes.data as Campaign[]) || []);

    const leads = (leadsRes.data || []).filter(l => {
      if (campaignFilter && l.campaign_id !== campaignFilter) return false;
      if (selectedIndustry !== "all" && l.industry !== selectedIndustry) return false;
      return true;
    });

    const messages = (messagesRes.data || []).filter((m: any) => {
      if (campaignFilter && m.campaign_id !== campaignFilter) return false;
      return true;
    });

    const draftedLeadIds = new Set(
      messages.filter((m: any) => m.message_status === "drafted").map((m: any) => m.lead_id)
    );
    const readyForDraft = leads.filter(
      l => l.score >= 50 && ["qualified", "nurture"].includes(l.lead_status) && !draftedLeadIds.has(l.id)
    ).length;

    const inboundCount = messages.filter((m: any) => m.direction === "inbound").length;

    setStats({
      totalLeads: leads.length,
      unscored: leads.filter(l => l.score === 0).length,
      qualified: leads.filter(l => l.lead_status === "qualified").length,
      nurture: leads.filter(l => l.lead_status === "nurture").length,
      contacted: leads.filter(l => l.lead_status === "contacted").length,
      messagesDrafted: messages.filter((m: any) => m.message_status === "drafted").length,
      messagesSent: messages.filter((m: any) => m.message_status === "sent" || (m.direction !== "inbound" && m.message_status !== "drafted")).length,
      noResponse: leads.filter(l => l.lead_status === "no_response").length,
      readyForDraft,
    });

    setLoading(false);
  }, [selectedCampaign, selectedIndustry]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const runStep = async (action: string) => {
    setRunningStep(action);
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
      toast.success(`${action.replace(/_/g, " ")} completed`);
      fetchStats();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setRunningStep(null);
    }
  };

  const getNavCount = (key: ViewKey) => {
    switch (key) {
      case "inbox": return stats.contacted + stats.noResponse; // inbound approximation
      case "drafts": return stats.messagesDrafted;
      case "sent": return stats.messagesSent;
      case "leads": return stats.totalLeads;
      case "all": return stats.messagesDrafted + stats.messagesSent;
      default: return 0;
    }
  };

  const messageFilter = activeView === "leads" ? null :
    activeView === "inbox" ? "inbox" as const :
    activeView === "drafts" ? "drafted" as const :
    activeView === "sent" ? "sent" as const :
    "all" as const;

  return (
    <div className="flex flex-col sm:flex-row gap-0 sm:gap-0 min-h-[60vh]">
      {/* Sidebar — vertical on desktop, horizontal strip on mobile */}
      <nav className="sm:w-52 shrink-0 sm:border-r border-border/50 sm:pr-3 sm:mr-3">
        {/* Mobile: horizontal scrollable nav */}
        <div className="flex sm:hidden overflow-x-auto gap-1 pb-3 -mx-1 px-1">
          {NAV_ITEMS.map(item => {
            const count = getNavCount(item.key);
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  activeView === item.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold min-w-[18px] text-center rounded-full px-1",
                    activeView === item.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: vertical sidebar */}
        <div className="hidden sm:flex flex-col gap-0.5 py-1">
          {NAV_ITEMS.map(item => {
            const count = getNavCount(item.key);
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all w-full text-left",
                  isActive
                    ? "bg-primary/8 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    isActive ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="h-px bg-border/40 my-2" />

          {/* Filters */}
          <div className="space-y-2 px-1">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-full bg-transparent border-border/40 text-xs h-8 rounded-lg">
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
              <SelectTrigger className="w-full bg-transparent border-border/40 text-xs h-8 rounded-lg">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRIES.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Separator */}
          <div className="h-px bg-border/40 my-2" />

          {/* Quick actions */}
          <div className="space-y-0.5 px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">Actions</p>
            {ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => runStep(action.id)}
                disabled={runningStep !== null}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full text-left transition-all",
                  "text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
                )}
              >
                {runningStep === action.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                ) : (
                  <action.icon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={() => runStep("full_cycle")}
              disabled={runningStep !== null}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full text-left transition-all mt-1",
                "text-primary font-semibold hover:bg-primary/5 disabled:opacity-40"
              )}
            >
              {runningStep === "full_cycle" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <Zap className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>Full Cycle</span>
            </button>
          </div>

          {/* Stats footer */}
          <div className="h-px bg-border/40 my-2" />
          <div className="grid grid-cols-2 gap-1.5 px-1">
            <MiniStat label="Leads" value={stats.totalLeads} />
            <MiniStat label="Qualified" value={stats.qualified} />
            <MiniStat label="Drafts" value={stats.messagesDrafted} />
            <MiniStat label="Sent" value={stats.messagesSent} />
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile action bar */}
        <div className="sm:hidden mb-3">
          <div className="flex items-center gap-2">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="flex-1 bg-card border-border/40 text-xs h-8 rounded-lg">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs gap-1 shrink-0"
              onClick={() => setShowActions(!showActions)}
            >
              <Zap className="h-3 w-3" />
              Actions
              <ChevronRight className={cn("h-3 w-3 transition-transform", showActions && "rotate-90")} />
            </Button>
          </div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {ACTIONS.map(action => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); runStep(action.id); }}
                      disabled={runningStep !== null}
                      className="h-8 rounded-lg text-[11px] gap-1 relative z-10"
                    >
                      {runningStep === action.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <action.icon className="h-3 w-3" />
                      )}
                      {action.shortLabel}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); runStep("full_cycle"); }}
                    disabled={runningStep !== null}
                    className="h-8 rounded-lg text-[11px] gap-1 relative z-10"
                  >
                    {runningStep === "full_cycle" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    Full Cycle
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ready-for-draft banner */}
        <AnimatePresence>
          {stats.readyForDraft > 0 && activeView !== "leads" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3"
            >
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/[0.05] border border-primary/15">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-foreground flex-1">
                  <span className="font-bold">{stats.readyForDraft}</span> lead{stats.readyForDraft !== 1 ? "s" : ""} ready for drafts
                </p>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); runStep("generate_outreach"); }}
                  disabled={runningStep !== null}
                  className="h-7 rounded-lg text-[11px] gap-1 px-3 relative z-10 shrink-0"
                >
                  {runningStep === "generate_outreach" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Draft
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {activeView === "leads" ? (
              <OutreachLeadsList
                campaignId={selectedCampaign !== "all" ? selectedCampaign : null}
                industry={selectedIndustry !== "all" ? selectedIndustry : null}
              />
            ) : (
              <OutreachMessagesList
                campaignId={selectedCampaign !== "all" ? selectedCampaign : null}
                onStatsChange={fetchStats}
                defaultFilter={messageFilter!}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-center">
      <p className="text-sm font-black tabular-nums text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}
