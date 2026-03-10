import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, ExternalLink, Copy, Eye, CheckCircle, Clock,
  AlertCircle, Loader2, Mail, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-14 sm:py-20 text-center px-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1.5">No leads found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Run "Discover" to find businesses.</p>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = ["qualified", "nurture", "new", "contacted"].map(s => ({
    status: s,
    count: leads.filter(l => l.lead_status === s).length,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground font-medium">{leads.length} leads</p>
        <div className="flex gap-1 flex-wrap">
          {statusCounts.map(({ status, count }) => (
            <Badge key={status} variant="secondary" className="text-[10px] font-medium rounded-md">
              {status.replace(/_/g, " ")} · {count}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lead cards */}
      <div className="space-y-1.5">
        {leads.map((lead, i) => {
          const scoring = lead.metadata?.scoring || {};
          const msg = getMessage(lead.id);
          const isExpanded = expandedId === lead.id;

          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
            >
              <Card className={cn(
                "border-border/40 transition-all",
                isExpanded ? "ring-1 ring-primary/15 shadow-md border-border/60" : "hover:border-border/60 hover:shadow-sm"
              )}>
                <CardContent className="p-3 sm:p-3.5">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    {/* Score */}
                    <div className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs sm:text-sm tabular-nums",
                      lead.score >= 70
                        ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                        : lead.score >= 40
                          ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/15"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {lead.score}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{lead.business_name}</h3>
                        <LeadStatusBadge status={lead.lead_status} />
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2.5 mt-1 text-[10px] sm:text-[11px] text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-medium rounded-md px-1.5">{lead.industry}</Badge>
                        {lead.contact_email && (
                          <span className="font-mono text-[9px] sm:text-[10px] truncate max-w-[150px] sm:max-w-none">{lead.contact_email}</span>
                        )}
                        {lead.city && lead.state && (
                          <span className="hidden sm:inline">{lead.city}, {lead.state}</span>
                        )}
                        {lead.website_url && (
                          <a
                            href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`}
                            target="_blank" rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-0.5 transition-colors hidden sm:flex"
                          >
                            {lead.website_url.replace(/^https?:\/\//, "").split("/")[0]}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>

                      {scoring.pain_points?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                          {scoring.pain_points.slice(0, 2).map((p: string, j: number) => (
                            <Badge key={j} className="text-[9px] bg-destructive/6 text-destructive/70 border-0 rounded-md font-normal">{p}</Badge>
                          ))}
                          {scoring.pain_points.length > 2 && (
                            <Badge className="text-[9px] bg-muted text-muted-foreground border-0 rounded-md font-normal">+{scoring.pain_points.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg"
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      >
                        {isExpanded ? <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      </Button>
                      {msg && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg hidden sm:flex" onClick={() => copyMessage(msg)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Show mobile-hidden info */}
                        <div className="flex gap-2 mt-2 flex-wrap sm:hidden text-[10px] text-muted-foreground">
                          {lead.contact_name && <span className="font-medium text-foreground/70">{lead.contact_name}</span>}
                          {lead.city && lead.state && <span>{lead.city}, {lead.state}</span>}
                          {lead.website_url && (
                            <a
                              href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="hover:text-primary flex items-center gap-0.5 transition-colors"
                            >
                              {lead.website_url.replace(/^https?:\/\//, "").split("/")[0]}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>

                        {scoring.reasoning && (
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-muted/40 leading-relaxed border border-border/30">
                            {scoring.reasoning}
                          </p>
                        )}
                        {msg && (
                          <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[11px] font-bold">Draft Email</span>
                              <Badge variant="outline" className="text-[10px] rounded-md">{msg.message_status}</Badge>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-md sm:hidden ml-auto" onClick={() => copyMessage(msg)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs font-semibold mb-1">{msg.subject}</p>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    qualified: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle },
    nurture: { color: "bg-amber-500/10 text-amber-600", icon: Clock },
    contacted: { color: "bg-secondary/10 text-secondary", icon: Mail },
    new: { color: "bg-primary/8 text-primary", icon: AlertCircle },
    low_priority: { color: "bg-muted text-muted-foreground", icon: AlertCircle },
    no_response: { color: "bg-destructive/10 text-destructive", icon: AlertCircle },
    replied: { color: "bg-blue-500/10 text-blue-600", icon: CheckCircle },
  };
  const { color, icon: Icon } = config[status] || config.new;
  return (
    <Badge className={cn("text-[9px] gap-0.5 border-0 rounded-md", color)}>
      <Icon className="h-2.5 w-2.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
