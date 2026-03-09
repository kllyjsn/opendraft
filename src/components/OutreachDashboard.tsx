import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, Mail, Target, TrendingUp, Users, Star, 
  ExternalLink, Copy, Send, RefreshCw, Loader2, Eye,
  CheckCircle, Clock, AlertCircle, Rocket
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  niche: string;
  industries: string[];
  target_regions: string[];
  status: string;
  created_at: string;
}

interface Lead {
  id: string;
  campaign_id: string;
  business_name: string;
  industry: string;
  website_url: string | null;
  contact_email: string | null;
  contact_name: string | null;
  score: number;
  lead_status: string;
  source: string;
  metadata: any;
  created_at: string;
}

interface OutreachMessage {
  id: string;
  lead_id: string;
  subject: string | null;
  body: string;
  message_status: string;
  channel: string;
  ai_generated: boolean;
  created_at: string;
}

const TARGET_INDUSTRIES = [
  "Home Services", "Food & Beverage", "Health & Wellness",
  "Professional Services", "Automotive", "Beauty & Personal Care",
  "Retail & Local Shops", "Education & Childcare", "Events & Entertainment",
  "Pet Services", "Construction & Trades", "Real Estate & Property"
];

export function OutreachDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCampaign]);

  const fetchData = async () => {
    setLoading(true);

    const [campaignsRes, leadsRes, messagesRes] = await Promise.all([
      supabase.from("outreach_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("outreach_leads").select("*").order("score", { ascending: false }).limit(200),
      supabase.from("outreach_messages").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    setCampaigns((campaignsRes.data as Campaign[]) || []);
    setLeads((leadsRes.data as Lead[]) || []);
    setMessages((messagesRes.data as OutreachMessage[]) || []);
    setLoading(false);
  };

  const runAgent = async (action: string, extra: any = {}) => {
    setRunning(action);
    toast.info(`🤖 Running ${action.replace(/_/g, " ")}...`);

    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: { 
          action, 
          triggered_by: "manual",
          campaign_id: selectedCampaign,
          ...extra 
        },
      });

      if (error) throw error;
      toast.success(`✅ ${action.replace(/_/g, " ")} completed!`);
      fetchData();
    } catch (e: any) {
      toast.error(`❌ Failed: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const copyMessage = (msg: OutreachMessage) => {
    const text = `Subject: ${msg.subject}\n\n${msg.body}`;
    navigator.clipboard.writeText(text);
    toast.success("📋 Message copied to clipboard");
  };

  const getLeadMessage = (leadId: string) => messages.find(m => m.lead_id === leadId);

  const filteredLeads = leads.filter(l => {
    if (selectedCampaign && l.campaign_id !== selectedCampaign) return false;
    if (selectedIndustry !== "all" && l.industry !== selectedIndustry) return false;
    return true;
  });

  const stats = {
    totalLeads: filteredLeads.length,
    qualified: filteredLeads.filter(l => l.lead_status === "qualified").length,
    avgScore: filteredLeads.length > 0 
      ? Math.round(filteredLeads.reduce((sum, l) => sum + l.score, 0) / filteredLeads.length)
      : 0,
    messagesDrafted: messages.filter(m => filteredLeads.some(l => l.id === m.lead_id)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCampaign || "all"} onValueChange={v => setSelectedCampaign(v === "all" ? null : v)}>
          <SelectTrigger className="w-[200px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {TARGET_INDUSTRIES.map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => runAgent("discover_businesses", { industry: selectedIndustry !== "all" ? selectedIndustry : null })}
            disabled={running !== null}
          >
            {running === "discover_businesses" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Target className="h-3.5 w-3.5 mr-1.5" />}
            Discover
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => runAgent("evaluate_leads")}
            disabled={running !== null}
          >
            {running === "evaluate_leads" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Star className="h-3.5 w-3.5 mr-1.5" />}
            Score
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => runAgent("generate_outreach")}
            disabled={running !== null}
          >
            {running === "generate_outreach" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
            Draft
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => runAgent("send_emails")}
            disabled={running !== null}
          >
            {running === "send_emails" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Send
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => runAgent("send_follow_ups")}
            disabled={running !== null}
          >
            {running === "send_follow_ups" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
            Follow-ups
          </Button>
          <Button 
            size="sm"
            onClick={() => runAgent("full_cycle")}
            disabled={running !== null}
          >
            {running === "full_cycle" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Full Cycle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={CheckCircle} label="Qualified" value={stats.qualified} color="text-emerald-500" />
        <StatCard icon={TrendingUp} label="Avg Score" value={stats.avgScore} />
        <StatCard icon={Mail} label="Emails Drafted" value={stats.messagesDrafted} color="text-blue-500" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Leads
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Messages
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Target className="h-3.5 w-3.5" /> Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          {loading ? (
            <LoadingState />
          ) : filteredLeads.length === 0 ? (
            <EmptyState 
              text="No leads yet. Click 'Discover' to find businesses." 
              action={() => runAgent("discover_businesses")}
              actionLabel="Start Discovery"
            />
          ) : (
            <div className="grid gap-3">
              {filteredLeads.slice(0, 50).map(lead => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  message={getLeadMessage(lead.id)}
                  onCopyMessage={copyMessage}
                  isSelected={selectedLead?.id === lead.id}
                  onSelect={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {loading ? (
            <LoadingState />
          ) : messages.length === 0 ? (
            <EmptyState 
              text="No messages drafted yet. Score leads first, then generate outreach." 
              action={() => runAgent("generate_outreach")}
              actionLabel="Draft Emails"
            />
          ) : (
            <div className="grid gap-3">
              {messages.map(msg => {
                const lead = leads.find(l => l.id === msg.lead_id);
                return (
                  <MessageCard 
                    key={msg.id} 
                    message={msg} 
                    lead={lead}
                    onCopy={() => copyMessage(msg)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          {loading ? (
            <LoadingState />
          ) : campaigns.length === 0 ? (
            <EmptyState 
              text="No campaigns yet. Run discovery to auto-create one." 
              action={() => runAgent("full_cycle")}
              actionLabel="Start First Campaign"
            />
          ) : (
            <div className="grid gap-3">
              {campaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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

function LeadCard({ 
  lead, 
  message, 
  onCopyMessage,
  isSelected,
  onSelect 
}: { 
  lead: Lead; 
  message?: OutreachMessage;
  onCopyMessage: (m: OutreachMessage) => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scoring = lead.metadata?.scoring || {};
  
  return (
    <Card className={cn("border-border/50 transition-all", isSelected && "ring-2 ring-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{lead.business_name}</h3>
              <Badge variant="outline" className="text-[10px]">{lead.industry}</Badge>
              <ScoreBadge score={lead.score} />
              <StatusBadge status={lead.lead_status} />
            </div>
            {lead.website_url && (
              <a 
                href={lead.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
              >
                {new URL(lead.website_url).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {scoring.reasoning && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{scoring.reasoning}</p>
            )}
            {scoring.pain_points && scoring.pain_points.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {scoring.pain_points.slice(0, 3).map((p: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="ghost" onClick={onSelect}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {message && (
              <Button size="sm" variant="ghost" onClick={() => onCopyMessage(message)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isSelected && message && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-medium mb-1">Subject: {message.subject}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{message.body}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessageCard({ message, lead, onCopy }: { message: OutreachMessage; lead?: Lead; onCopy: () => void }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{lead?.business_name || "Unknown"}</span>
              <Badge variant="outline" className="text-[10px]">{message.message_status}</Badge>
              {message.ai_generated && (
                <Badge className="text-[10px] bg-primary/10 text-primary">AI Generated</Badge>
              )}
            </div>
            <p className="text-sm font-medium">{message.subject}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{message.body}</p>
          </div>
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{campaign.name}</h3>
            <div className="flex gap-1 mt-1 flex-wrap">
              {campaign.industries.slice(0, 3).map((ind, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{ind}</Badge>
              ))}
              <Badge variant="outline" className="text-[10px]">{campaign.target_regions[0]}</Badge>
            </div>
          </div>
          <Badge className={campaign.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}>
            {campaign.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500/10 text-emerald-600" 
    : score >= 40 ? "bg-amber-500/10 text-amber-600" 
    : "bg-muted text-muted-foreground";
  return <Badge className={cn("text-[10px]", color)}>{score}/100</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    qualified: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle },
    nurture: { color: "bg-amber-500/10 text-amber-600", icon: Clock },
    new: { color: "bg-blue-500/10 text-blue-600", icon: AlertCircle },
    low_priority: { color: "bg-muted text-muted-foreground", icon: AlertCircle },
  };
  const { color, icon: Icon } = config[status] || config.new;
  return (
    <Badge className={cn("text-[10px] gap-1", color)}>
      <Icon className="h-2.5 w-2.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="py-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ text, action, actionLabel }: { text: string; action?: () => void; actionLabel?: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">{text}</p>
        {action && actionLabel && (
          <Button size="sm" onClick={action}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
