import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Loader2, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OutreachMessage {
  id: string;
  lead_id: string;
  campaign_id: string;
  subject: string | null;
  body: string;
  message_status: string;
  channel: string;
  ai_generated: boolean;
  sent_at: string | null;
  created_at: string;
  metadata: any;
}

interface Lead {
  id: string;
  business_name: string;
  contact_email: string | null;
  industry: string;
}

interface Props {
  campaignId: string | null;
}

export function OutreachMessagesList({ campaignId }: Props) {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from("outreach_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (campaignId) query = query.eq("campaign_id", campaignId);

    const [msgsRes, leadsRes] = await Promise.all([
      query,
      supabase.from("outreach_leads").select("id, business_name, contact_email, industry"),
    ]);

    setMessages((msgsRes.data as OutreachMessage[]) || []);

    const leadsMap: Record<string, Lead> = {};
    (leadsRes.data || []).forEach((l: any) => { leadsMap[l.id] = l; });
    setLeads(leadsMap);

    setLoading(false);
  };

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

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No messages yet. Score leads and draft outreach emails first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{messages.length} messages</p>
      {messages.map(msg => {
        const lead = leads[msg.lead_id];
        const isFollowUp = msg.metadata?.is_follow_up;

        return (
          <Card key={msg.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {msg.message_status === "sent" ? (
                      <Send className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">{lead?.business_name || "Unknown"}</span>
                    {lead?.contact_email && (
                      <span className="text-xs text-muted-foreground">{lead.contact_email}</span>
                    )}
                    <StatusBadge status={msg.message_status} />
                    {msg.ai_generated && (
                      <Badge className="text-[10px] bg-primary/10 text-primary">AI</Badge>
                    )}
                    {isFollowUp && (
                      <Badge className="text-[10px] bg-amber-500/10 text-amber-600">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        Follow-up #{msg.metadata?.follow_up_number}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{msg.body}</p>
                  {msg.sent_at && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Sent {new Date(msg.sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => copyMessage(msg)} className="shrink-0">
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    drafted: "bg-amber-500/10 text-amber-600",
    sent: "bg-emerald-500/10 text-emerald-600",
    delivered: "bg-emerald-500/10 text-emerald-600",
    opened: "bg-blue-500/10 text-blue-600",
    replied: "bg-violet-500/10 text-violet-600",
    bounced: "bg-red-500/10 text-red-600",
  };
  return (
    <Badge className={cn("text-[10px]", config[status] || "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}
