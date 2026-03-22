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
import {
  Mail, Copy, Loader2, Send, Clock, Pencil, Save, X,
  CheckCircle, Sparkles, Reply, Inbox, TestTube, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  direction: string;
  replied_at: string | null;
  metadata: any;
}

interface Lead {
  id: string;
  business_name: string;
  contact_email: string | null;
  industry: string;
  lead_status: string;
}

interface Props {
  campaignId: string | null;
  onStatsChange?: () => void;
  defaultFilter?: "inbox" | "drafted" | "sent" | "all";
}

export function OutreachMessagesList({ campaignId, onStatsChange, defaultFilter = "all" }: Props) {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<OutreachMessage | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [replyingTo, setReplyingTo] = useState<{ leadId: string; campaignId: string; originalSubject: string } | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [simulatingReply, setSimulatingReply] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("outreach_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (campaignId) query = query.eq("campaign_id", campaignId);

    const [msgsRes, leadsRes] = await Promise.all([
      query,
      supabase.from("outreach_leads").select("id, business_name, contact_email, industry, lead_status"),
    ]);

    setMessages((msgsRes.data as OutreachMessage[]) || []);
    const leadsMap: Record<string, Lead> = {};
    (leadsRes.data || []).forEach((l: any) => { leadsMap[l.id] = l; });
    setLeads(leadsMap);
    setLoading(false);
  };

  const filteredMessages = messages.filter(m => {
    if (defaultFilter === "inbox") return m.direction === "inbound";
    if (defaultFilter === "drafted") return m.message_status === "drafted";
    if (defaultFilter === "sent") return m.direction !== "inbound" && m.message_status !== "drafted";
    return true;
  });

  const simulateInboundReply = async (msg: OutreachMessage) => {
    const lead = leads[msg.lead_id];
    if (!lead?.contact_email) { toast.error("Lead has no email"); return; }
    setSimulatingReply(msg.id);
    try {
      const mockPayload = {
        type: "email.received",
        from: { email: lead.contact_email },
        to: ["outreach@opendraft.co"],
        subject: `Re: ${msg.subject || "Your message"}`,
        text: `Hi there,\n\nThanks for reaching out! We're interested in learning more about what you offer. Could you send over some pricing details?\n\nBest regards,\n${lead.business_name}`,
      };
      const { error } = await supabase.functions.invoke("outreach-inbound", { body: mockPayload });
      if (error) throw error;
      toast.success(`Simulated reply from ${lead.business_name}`);
      await fetchData();
      onStatsChange?.();
    } catch (e: any) {
      toast.error(`Simulate failed: ${e.message}`);
    } finally {
      setSimulatingReply(null);
    }
  };

  const startEdit = (msg: OutreachMessage) => { setEditingId(msg.id); setEditSubject(msg.subject || ""); setEditBody(msg.body); };
  const cancelEdit = () => { setEditingId(null); setEditSubject(""); setEditBody(""); };

  const saveEdit = async (msgId: string) => {
    setSaving(true);
    const { error } = await supabase.from("outreach_messages").update({ subject: editSubject, body: editBody }).eq("id", msgId);
    if (error) { toast.error("Failed to save"); } else {
      toast.success("Draft updated");
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, subject: editSubject, body: editBody } : m));
      if (selectedMsg?.id === msgId) setSelectedMsg(prev => prev ? { ...prev, subject: editSubject, body: editBody } : null);
      cancelEdit();
    }
    setSaving(false);
  };

  const executeSend = async () => {
    if (!sendConfirmId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: { action: "send_single", message_id: sendConfirmId, triggered_by: "manual" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Email sent!");
      setMessages(prev => prev.map(m => m.id === sendConfirmId ? { ...m, message_status: "sent", sent_at: new Date().toISOString() } : m));
      onStatsChange?.();
    } catch (e: any) {
      toast.error(`Failed to send: ${e.message}`);
    } finally {
      setSending(false);
      setSendConfirmId(null);
    }
  };

  const startReply = (msg: OutreachMessage) => {
    setReplyingTo({ leadId: msg.lead_id, campaignId: msg.campaign_id, originalSubject: msg.subject || "" });
    const subj = msg.subject || "";
    setReplySubject(subj.startsWith("Re:") ? subj : `Re: ${subj}`);
    setReplyBody("");
  };
  const cancelReply = () => { setReplyingTo(null); setReplySubject(""); setReplyBody(""); };

  const executeReply = async () => {
    if (!replyingTo || !replyBody.trim()) return;
    setReplySending(true);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: {
          action: "reply_to_lead", lead_id: replyingTo.leadId, campaign_id: replyingTo.campaignId,
          subject: replySubject, body: replyBody.trim(), triggered_by: "manual",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Reply sent!");
      setMessages(prev => [{
        id: data.message_id || crypto.randomUUID(), lead_id: replyingTo.leadId, campaign_id: replyingTo.campaignId,
        subject: replySubject, body: replyBody.trim(), message_status: "sent", channel: "email",
        ai_generated: false, sent_at: new Date().toISOString(), created_at: new Date().toISOString(),
        direction: "outbound", replied_at: null, metadata: { type: "admin_reply" },
      }, ...prev]);
      cancelReply();
      onStatsChange?.();
    } catch (e: any) {
      toast.error(`Failed to send reply: ${e.message}`);
    } finally {
      setReplySending(false);
    }
  };

  const copyMessage = (msg: OutreachMessage) => {
    navigator.clipboard.writeText(`Subject: ${msg.subject}\n\n${msg.body}`);
    toast.success("Copied");
  };

  if (loading) {
    return <div className="py-20 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
          {defaultFilter === "inbox" ? <Inbox className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground">
          {defaultFilter === "inbox" ? "No replies yet" : defaultFilter === "drafted" ? "No drafts" : "No messages"}
        </p>
      </div>
    );
  }

  // If a message is selected, show detail view
  if (selectedMsg) {
    const lead = leads[selectedMsg.lead_id];
    const isDraft = selectedMsg.message_status === "drafted";
    const isInbound = selectedMsg.direction === "inbound";
    const isEditing = editingId === selectedMsg.id;
    const threadMessages = messages
      .filter(m => m.lead_id === selectedMsg.lead_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
      <div className="space-y-0">
        {/* Back button + subject header */}
        <div className="flex items-center gap-2 pb-3 border-b border-border/40 mb-4">
          <Button size="sm" variant="ghost" onClick={() => { setSelectedMsg(null); cancelEdit(); cancelReply(); }} className="h-8 w-8 p-0 rounded-lg shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate">{selectedMsg.subject || "(no subject)"}</h2>
            <p className="text-[11px] text-muted-foreground">{lead?.business_name} · {lead?.contact_email}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isDraft && (
              <>
                <Button size="sm" variant="outline" onClick={() => startEdit(selectedMsg)} className="h-7 text-[11px] gap-1 rounded-lg px-2">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button size="sm" onClick={() => setSendConfirmId(selectedMsg.id)} className="h-7 text-[11px] gap-1 rounded-lg px-2">
                  <Send className="h-3 w-3" /> Send
                </Button>
              </>
            )}
            {!isDraft && lead?.contact_email && (
              <Button size="sm" variant={isInbound ? "default" : "outline"} onClick={() => startReply(selectedMsg)} className="h-7 text-[11px] gap-1 rounded-lg px-2">
                <Reply className="h-3 w-3" /> Reply
              </Button>
            )}
            {!isDraft && !isInbound && lead?.contact_email && (
              <Button
                size="sm" variant="ghost"
                onClick={() => simulateInboundReply(selectedMsg)}
                disabled={simulatingReply === selectedMsg.id}
                className="h-7 text-[11px] gap-1 rounded-lg px-2 text-muted-foreground"
              >
                {simulatingReply === selectedMsg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => copyMessage(selectedMsg)} className="h-7 w-7 p-0 rounded-lg">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Thread view */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {threadMessages.map(tm => {
            const tmIsInbound = tm.direction === "inbound";
            return (
              <div key={tm.id} className={cn(
                "rounded-xl p-3 sm:p-4 text-sm",
                tmIsInbound
                  ? "bg-blue-500/[0.04] border border-blue-500/10"
                  : "bg-muted/20 border border-border/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-xs">{tmIsInbound ? lead?.business_name : "Jason (You)"}</span>
                  {tm.ai_generated && (
                    <Badge className="text-[9px] bg-primary/8 text-primary border-0 rounded-md gap-0.5">
                      <Sparkles className="h-2 w-2" /> AI
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                    {new Date(tm.sent_at || tm.created_at).toLocaleString()}
                  </span>
                </div>
                {tm.subject && <p className="font-semibold text-xs mb-2">{tm.subject}</p>}

                {editingId === tm.id ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                      <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="text-sm rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Body</label>
                      <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} className="font-mono text-xs leading-relaxed rounded-lg" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving} className="text-xs rounded-lg h-7">
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(tm.id)} disabled={saving} className="text-xs gap-1 rounded-lg h-7">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] sm:text-[13px] text-muted-foreground whitespace-pre-line leading-relaxed">{tm.body}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline reply composer */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 pt-4 border-t border-border/40"
            >
              <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                <Input value={replySubject} onChange={e => setReplySubject(e.target.value)} placeholder="Subject" className="text-sm rounded-lg border-0 bg-transparent px-0 h-8 font-semibold focus-visible:ring-0" />
                <Textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  rows={4}
                  placeholder="Write your reply..."
                  className="text-sm leading-relaxed rounded-lg border-0 bg-transparent px-0 resize-none focus-visible:ring-0"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" size="sm" onClick={cancelReply} disabled={replySending} className="text-xs rounded-lg h-7">Cancel</Button>
                  <Button size="sm" onClick={executeReply} disabled={replySending || !replyBody.trim()} className="text-xs gap-1 rounded-lg h-7">
                    {replySending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send confirmation */}
        <SendConfirmDialog
          open={!!sendConfirmId}
          onOpenChange={open => !open && setSendConfirmId(null)}
          sending={sending}
          onConfirm={executeSend}
          recipientEmail={sendConfirmId ? leads[messages.find(m => m.id === sendConfirmId)?.lead_id || ""]?.contact_email : null}
        />
      </div>
    );
  }

  // Message list view (like email rows)
  return (
    <div>
      <div className="divide-y divide-border/30">
        {filteredMessages.map((msg, i) => {
          const lead = leads[msg.lead_id];
          const isInbound = msg.direction === "inbound";
          const isDraft = msg.message_status === "drafted";
          const isAdminReply = msg.metadata?.type === "admin_reply";
          const isFollowUp = msg.metadata?.is_follow_up;

          return (
            <motion.button
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.15) }}
              onClick={() => setSelectedMsg(msg)}
              className={cn(
                "flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 w-full text-left transition-colors hover:bg-muted/40 group",
                isInbound && "bg-blue-500/[0.02]",
              )}
            >
              {/* Status dot */}
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                isInbound ? "bg-blue-500" :
                isDraft ? "bg-amber-500" :
                isAdminReply ? "bg-primary" :
                "bg-emerald-500"
              )} />

              {/* Sender / business */}
              <span className={cn(
                "text-xs shrink-0 w-24 sm:w-36 truncate",
                isInbound ? "font-bold text-foreground" : "text-muted-foreground"
              )}>
                {isInbound ? lead?.business_name || "Unknown" : `→ ${lead?.business_name || "Unknown"}`}
              </span>

              {/* Subject + preview */}
              <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                <span className={cn(
                  "text-xs truncate shrink-0 max-w-[120px] sm:max-w-[200px]",
                  (isInbound || isDraft) ? "font-semibold text-foreground" : "text-foreground"
                )}>
                  {msg.subject || "(no subject)"}
                </span>
                <span className="text-[11px] text-muted-foreground/60 truncate hidden sm:block">
                  — {msg.body.slice(0, 80)}
                </span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {isDraft && (
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-600 border-0 rounded-md hidden sm:flex">Draft</Badge>
                )}
                {isFollowUp && (
                  <Badge className="text-[9px] bg-muted text-muted-foreground border-0 rounded-md hidden sm:flex">Follow-up</Badge>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-12 sm:w-auto text-right">
                {formatRelativeTime(msg.sent_at || msg.created_at)}
              </span>
            </motion.button>
          );
        })}
      </div>

      <SendConfirmDialog
        open={!!sendConfirmId}
        onOpenChange={open => !open && setSendConfirmId(null)}
        sending={sending}
        onConfirm={executeSend}
        recipientEmail={sendConfirmId ? leads[messages.find(m => m.id === sendConfirmId)?.lead_id || ""]?.contact_email : null}
      />
    </div>
  );
}

function SendConfirmDialog({ open, onOpenChange, sending, onConfirm, recipientEmail }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sending: boolean;
  onConfirm: () => void;
  recipientEmail: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Confirm Send</DialogTitle>
          <DialogDescription>Send email to {recipientEmail || "this lead"}?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending} className="rounded-lg w-full sm:w-auto">Cancel</Button>
          <Button onClick={onConfirm} disabled={sending} className="gap-1.5 rounded-lg w-full sm:w-auto">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
