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
    toast.success("📋 Copied to clipboard");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-bold mb-1">No leads found</h3>
          <p className="text-sm text-muted-foreground">Run "Discover" to find businesses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{leads.length} leads found</p>
        <div className="flex gap-1">
          {["qualified", "nurture", "new"].map(s => {
            const c = leads.filter(l => l.lead_status === s).length;
            if (c === 0) return null;
            return (
              <Badge key={s} variant="secondary" className="text-[10px] font-medium">
                {s.replace(/_/g, " ")} ({c})
              </Badge>
            );
          })}
        </div>
      </div>

      {leads.map((lead, i) => {
        const scoring = lead.metadata?.scoring || {};
        const msg = getMessage(lead.id);
        const isExpanded = expandedId === lead.id;

        return (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
          >
            <Card className={cn(
              "border-border/50 transition-all hover:shadow-md",
              isExpanded && "ring-1 ring-primary/20 shadow-md"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Score circle */}
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
                    lead.score >= 70
                      ? "bg-emerald-500/10 text-emerald-600"
                      : lead.score >= 40
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {lead.score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm truncate">{lead.business_name}</h3>
                      <Badge variant="outline" className="text-[10px] font-medium">{lead.industry}</Badge>
                      <LeadStatusBadge status={lead.lead_status} />
                      {lead.source === "ai_discovery" && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-0">AI</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      {lead.contact_name && <span className="font-medium text-foreground/70">{lead.contact_name}</span>}
                      {lead.contact_email && <span>{lead.contact_email}</span>}
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

                    {scoring.pain_points?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {scoring.pain_points.slice(0, 3).map((p: string, j: number) => (
                          <Badge key={j} className="text-[10px] bg-destructive/8 text-destructive/80 border-0">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    >
                      {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    {msg && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => copyMessage(msg)}>
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
                      {scoring.reasoning && (
                        <p className="text-xs text-muted-foreground mt-3 p-3 rounded-lg bg-muted/50 leading-relaxed">
                          {scoring.reasoning}
                        </p>
                      )}
                      {msg && (
                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-bold">Draft Email</span>
                            <Badge variant="outline" className="text-[10px]">{msg.message_status}</Badge>
                          </div>
                          <p className="text-xs font-semibold mb-1">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
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
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    qualified: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle },
    nurture: { color: "bg-amber-500/10 text-amber-600", icon: Clock },
    contacted: { color: "bg-secondary/10 text-secondary", icon: Mail },
    new: { color: "bg-primary/10 text-primary", icon: AlertCircle },
    low_priority: { color: "bg-muted text-muted-foreground", icon: AlertCircle },
    no_response: { color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  };
  const { color, icon: Icon } = config[status] || config.new;
  return (
    <Badge className={cn("text-[10px] gap-0.5 border-0", color)}>
      <Icon className="h-2.5 w-2.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
