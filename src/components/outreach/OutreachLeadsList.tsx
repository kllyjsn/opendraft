import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, ExternalLink, Copy, Eye, CheckCircle, Clock,
  AlertCircle, Loader2, Mail
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  campaign_id: string;
  business_name: string;
  industry: string;
  website_url: string | null;
  contact_email: string | null;
  contact_name: string | null;
  city: string | null;
  state: string | null;
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
}

interface Props {
  campaignId: string | null;
  industry: string | null;
}

export function OutreachLeadsList({ campaignId, industry }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [campaignId, industry]);

  const fetchData = async () => {
    setLoading(true);

    let leadsQuery = supabase
      .from("outreach_leads")
      .select("*")
      .order("score", { ascending: false })
      .limit(100);

    if (campaignId) leadsQuery = leadsQuery.eq("campaign_id", campaignId);
    if (industry) leadsQuery = leadsQuery.eq("industry", industry);

    const [leadsRes, msgsRes] = await Promise.all([
      leadsQuery,
      supabase.from("outreach_messages").select("id, lead_id, subject, body, message_status").limit(200),
    ]);

    setLeads((leadsRes.data as Lead[]) || []);
    setMessages((msgsRes.data as OutreachMessage[]) || []);
    setLoading(false);
  };

  const getMessage = (leadId: string) => messages.find(m => m.lead_id === leadId);

  const copyMessage = (msg: OutreachMessage) => {
    navigator.clipboard.writeText(`Subject: ${msg.subject}\n\n${msg.body}`);
    toast.success("📋 Copied to clipboard");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No leads found. Run "Discover" to find businesses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{leads.length} leads</p>
      {leads.map(lead => {
        const scoring = lead.metadata?.scoring || {};
        const msg = getMessage(lead.id);
        const isExpanded = expandedId === lead.id;

        return (
          <Card key={lead.id} className={cn("border-border/50 transition-all", isExpanded && "ring-1 ring-primary/30")}>
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
                    {lead.source === "ai_discovery" && (
                      <Badge className="text-[10px] bg-violet-500/10 text-violet-600">AI</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {lead.contact_name && <span>{lead.contact_name}</span>}
                    {lead.contact_email && <span>{lead.contact_email}</span>}
                    {lead.city && lead.state && <span>{lead.city}, {lead.state}</span>}
                    {lead.website_url && (
                      <a href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="hover:text-primary flex items-center gap-1"
                      >
                        {lead.website_url.replace(/^https?:\/\//, "").split("/")[0]}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {scoring.reasoning && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{scoring.reasoning}</p>
                  )}

                  {scoring.pain_points?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {scoring.pain_points.slice(0, 3).map((p: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {msg && (
                    <Button size="sm" variant="ghost" onClick={() => copyMessage(msg)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && msg && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Drafted Email</span>
                    <Badge variant="outline" className="text-[10px]">{msg.message_status}</Badge>
                  </div>
                  <p className="text-xs font-medium mb-1">Subject: {msg.subject}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{msg.body}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
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
    contacted: { color: "bg-blue-500/10 text-blue-600", icon: Mail },
    new: { color: "bg-blue-500/10 text-blue-600", icon: AlertCircle },
    low_priority: { color: "bg-muted text-muted-foreground", icon: AlertCircle },
    no_response: { color: "bg-red-500/10 text-red-600", icon: AlertCircle },
  };
  const { color, icon: Icon } = config[status] || config.new;
  return (
    <Badge className={cn("text-[10px] gap-1", color)}>
      <Icon className="h-2.5 w-2.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
