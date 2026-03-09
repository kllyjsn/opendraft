import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Copy, Loader2, Send, Clock, Pencil, Save, X } from "lucide-react";
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
  onStatsChange?: () => void;
}

export function OutreachMessagesList({ campaignId, onStatsChange }: Props) {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "drafted" | "sent">("drafted");

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from("outreach_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

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

  const filteredMessages = messages.filter(m => {
    if (filter === "drafted") return m.message_status === "drafted";
    if (filter === "sent") return m.message_status !== "drafted";
    return true;
  });

  const draftedCount = messages.filter(m => m.message_status === "drafted").length;

  const startEdit = (msg: OutreachMessage) => {
    setEditingId(msg.id);
    setEditSubject(msg.subject || "");
    setEditBody(msg.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSubject("");
    setEditBody("");
  };

  const saveEdit = async (msgId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("outreach_messages")
      .update({ subject: editSubject, body: editBody })
      .eq("id", msgId);

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("✅ Draft updated");
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, subject: editSubject, body: editBody } : m));
      cancelEdit();
    }
    setSaving(false);
  };

  const confirmSend = (msgId: string) => {
    setSendConfirmId(msgId);
  };

  const executeSend = async () => {
    if (!sendConfirmId) return;
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: { action: "send_single", message_id: sendConfirmId, triggered_by: "manual" },
      });
      if (error) throw error;
      toast.success("📧 Email sent!");
      setMessages(prev => prev.map(m => m.id === sendConfirmId ? { ...m, message_status: "sent", sent_at: new Date().toISOString() } : m));
      onStatsChange?.();
    } catch (e: any) {
      toast.error(`Failed to send: ${e.message}`);
    } finally {
      setSending(false);
      setSendConfirmId(null);
    }
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
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          { key: "drafted" as const, label: `Drafts (${draftedCount})` },
          { key: "sent" as const, label: "Sent" },
          { key: "all" as const, label: "All" },
        ]).map(tab => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
            className="text-xs"
          >
            {tab.label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredMessages.length} messages
        </span>
      </div>

      {filteredMessages.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "drafted" ? "No drafted emails. Run the Draft step first." : "No messages in this filter."}
            </p>
          </CardContent>
        </Card>
      )}

      {filteredMessages.map(msg => {
        const lead = leads[msg.lead_id];
        const isFollowUp = msg.metadata?.is_follow_up;
        const isEditing = editingId === msg.id;
        const isDraft = msg.message_status === "drafted";

        return (
          <Card key={msg.id} className={cn("border-border/50", isDraft && "border-amber-500/20")}>
            <CardContent className="p-4">
              {isEditing ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Editing draft for {lead?.business_name || "Unknown"}</span>
                    {lead?.contact_email && (
                      <span className="text-xs text-muted-foreground">→ {lead.contact_email}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                    <Input
                      value={editSubject}
                      onChange={e => setEditSubject(e.target.value)}
                      placeholder="Email subject line"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                    <Textarea
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(msg.id)} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      Save Draft
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {msg.message_status === "sent" ? (
                        <Send className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-amber-500" />
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">{msg.body}</p>
                    {msg.sent_at && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Sent {new Date(msg.sent_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {isDraft && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(msg)} className="text-xs gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" onClick={() => confirmSend(msg.id)} className="text-xs gap-1">
                          <Send className="h-3 w-3" /> Send
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => copyMessage(msg)} className="text-xs gap-1">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Send confirmation dialog */}
      <Dialog open={!!sendConfirmId} onOpenChange={open => !open && setSendConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this email?</DialogTitle>
            <DialogDescription>
              {sendConfirmId && (() => {
                const msg = messages.find(m => m.id === sendConfirmId);
                const lead = msg ? leads[msg.lead_id] : null;
                return `This will send the email to ${lead?.contact_email || "the lead"}. Make sure you've reviewed the content.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendConfirmId(null)} disabled={sending}>Cancel</Button>
            <Button onClick={executeSend} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirm Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
