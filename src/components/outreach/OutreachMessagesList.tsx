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
import { Mail, Copy, Loader2, Send, Clock, Pencil, Save, X, CheckCircle, Sparkles, Reply, MessageSquare, Inbox, ArrowUpDown, TestTube } from "lucide-react";
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
  const [filter, setFilter] = useState<"inbox" | "drafted" | "sent" | "all">("inbox");

  const [replyingTo, setReplyingTo] = useState<{ leadId: string; campaignId: string; originalSubject: string } | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

  const [expandedThread, setExpandedThread] = useState<string | null>(null);
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
      setFilter("inbox");
    } catch (e: any) {
      toast.error(`Simulate failed: ${e.message}`);
    } finally {
      setSimulatingReply(null);
    }
  };

  const inboundMessages = messages.filter(m => m.direction === "inbound");
  const draftedMessages = messages.filter(m => m.message_status === "drafted");
  const sentMessages = messages.filter(m => m.direction !== "inbound" && m.message_status !== "drafted");

  const filteredMessages = messages.filter(m => {
    if (filter === "inbox") return m.direction === "inbound";
    if (filter === "drafted") return m.message_status === "drafted";
    if (filter === "sent") return m.direction !== "inbound" && m.message_status !== "drafted";
    return true;
  });

  const getThreadMessages = (leadId: string) =>
    messages.filter(m => m.lead_id === leadId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const startEdit = (msg: OutreachMessage) => { setEditingId(msg.id); setEditSubject(msg.subject || ""); setEditBody(msg.body); };
  const cancelEdit = () => { setEditingId(null); setEditSubject(""); setEditBody(""); };

  const saveEdit = async (msgId: string) => {
    setSaving(true);
    const { error } = await supabase.from("outreach_messages").update({ subject: editSubject, body: editBody }).eq("id", msgId);
    if (error) { toast.error("Failed to save"); } else {
      toast.success("Draft updated");
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, subject: editSubject, body: editBody } : m));
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

  if (messages.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-14 sm:py-20 text-center px-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h3 className="font-bold text-base sm:text-lg mb-1.5">No emails yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Score leads and draft outreach emails first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl w-fit border border-border/40">
          {([
            { key: "inbox" as const, label: "Inbox", count: inboundMessages.length, icon: Inbox },
            { key: "drafted" as const, label: "Drafts", count: draftedMessages.length, icon: Pencil },
            { key: "sent" as const, label: "Sent", count: sentMessages.length, icon: Send },
            { key: "all" as const, label: "All", count: messages.length, icon: Mail },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-[10px] transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap",
                filter === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold min-w-[16px] sm:min-w-[18px] text-center py-0.5 px-1 rounded-md",
                  filter === tab.key
                    ? tab.key === "inbox" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredMessages.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 sm:py-16 text-center px-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-muted/40 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              {filter === "inbox" ? <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" /> : <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              {filter === "inbox"
                ? "No replies yet. When leads respond, their messages appear here."
                : filter === "drafted"
                ? "No drafts. Run the Draft step to generate emails."
                : "No messages match this filter."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1.5">
        {filteredMessages.map((msg, i) => {
          const lead = leads[msg.lead_id];
          const isFollowUp = msg.metadata?.is_follow_up;
          const isAdminReply = msg.metadata?.type === "admin_reply";
          const isInbound = msg.direction === "inbound";
          const isEditing = editingId === msg.id;
          const isDraft = msg.message_status === "drafted";
          const isReplying = replyingTo?.leadId === msg.lead_id;
          const isThreadExpanded = expandedThread === msg.lead_id;
          const threadMessages = isThreadExpanded ? getThreadMessages(msg.lead_id) : [];

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
            >
              <Card className={cn(
                "border-border/40 transition-all group",
                isInbound && "border-l-2 border-l-blue-500/50 bg-blue-500/[0.015]",
                isDraft && "border-l-2 border-l-amber-500/40",
                isAdminReply && "border-l-2 border-l-primary/40",
                isEditing && "ring-1 ring-primary/20 shadow-lg",
                !isEditing && "hover:border-border/60 hover:shadow-sm"
              )}>
                <CardContent className="p-3 sm:p-3.5">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                          <span className="font-bold text-xs">Editing for {lead?.business_name || "Unknown"}</span>
                        </div>
                        {lead?.contact_email && (
                          <span className="text-[10px] text-muted-foreground font-mono block -mt-2">→ {lead.contact_email}</span>
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                          <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="Email subject line" className="text-sm rounded-xl" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Body</label>
                          <Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} className="font-mono text-xs leading-relaxed rounded-xl" />
                        </div>
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving} className="text-xs rounded-lg h-8">
                            <X className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => saveEdit(msg.id)} disabled={saving} className="text-xs rounded-lg h-8">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save
                          </Button>
                          <Button size="sm" onClick={() => { saveEdit(msg.id).then(() => setSendConfirmId(msg.id)); }} disabled={saving} className="text-xs gap-1 rounded-lg h-8">
                            <Send className="h-3 w-3" /> Send
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Message header + body */}
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          {/* Status icon */}
                          <div className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            isInbound ? "bg-blue-500/10" : isAdminReply ? "bg-primary/10" : isDraft ? "bg-amber-500/10" : "bg-emerald-500/10"
                          )}>
                            {isInbound ? <Inbox className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" /> :
                             isAdminReply ? <Reply className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" /> :
                             isDraft ? <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" /> :
                             <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 flex-wrap">
                              {isInbound && (
                                <Badge className="text-[8px] sm:text-[9px] bg-blue-500/10 text-blue-600 border-0 gap-0.5 font-bold rounded-md">
                                  <Inbox className="h-2 w-2" /> FROM
                                </Badge>
                              )}
                              <span className="font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{lead?.business_name || "Unknown"}</span>
                              <MessageStatusBadge status={msg.message_status} />
                              {msg.ai_generated && (
                                <Badge className="text-[8px] sm:text-[9px] bg-primary/8 text-primary border-0 gap-0.5 rounded-md hidden sm:flex">
                                  <Sparkles className="h-2 w-2" /> AI
                                </Badge>
                              )}
                            </div>

                            {lead?.contact_email && (
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate">{lead.contact_email}</p>
                            )}

                            <p className="text-xs sm:text-sm font-semibold mt-1.5">{msg.subject}</p>
                            <p className={cn(
                              "text-[10px] sm:text-[11px] text-muted-foreground mt-1 whitespace-pre-line leading-relaxed",
                              isInbound ? "line-clamp-4 sm:line-clamp-6" : "line-clamp-2"
                            )}>
                              {msg.body}
                            </p>

                            {/* Timestamp */}
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
                              {isInbound ? <Clock className="h-2.5 w-2.5" /> : <Send className="h-2.5 w-2.5" />}
                              {new Date(msg.sent_at || msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Actions — stacked on mobile, row on desktop */}
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/30 flex-wrap">
                          {isDraft && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => startEdit(msg)} className="text-[10px] sm:text-xs gap-1 h-7 px-2 sm:px-2.5 rounded-lg flex-1 sm:flex-none">
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                              <Button size="sm" onClick={() => setSendConfirmId(msg.id)} className="text-[10px] sm:text-xs gap-1 h-7 px-2 sm:px-2.5 rounded-lg flex-1 sm:flex-none">
                                <Send className="h-3 w-3" /> Send
                              </Button>
                            </>
                          )}
                          {(isInbound || (!isDraft && lead?.contact_email)) && (
                            <Button size="sm" variant={isInbound ? "default" : "outline"} onClick={() => startReply(msg)} className="text-[10px] sm:text-xs gap-1 h-7 px-2 sm:px-2.5 rounded-lg flex-1 sm:flex-none">
                              <Reply className="h-3 w-3" /> Reply
                            </Button>
                          )}
                          {!isDraft && !isInbound && lead?.contact_email && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => simulateInboundReply(msg)}
                              disabled={simulatingReply === msg.id}
                              className="text-[10px] sm:text-xs gap-1 h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              {simulatingReply === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                              <span className="hidden sm:inline">Test</span>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setExpandedThread(isThreadExpanded ? null : msg.lead_id)} className="text-[10px] sm:text-xs gap-1 h-7 px-2 rounded-lg">
                            <ArrowUpDown className="h-3 w-3" />
                            <span className="hidden sm:inline">Thread</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyMessage(msg)} className="text-[10px] sm:text-xs gap-1 h-7 px-2 rounded-lg">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Thread view */}
                        <AnimatePresence>
                          {isThreadExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-border/40"
                            >
                              <div className="flex items-center gap-2 mb-2.5">
                                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Thread · {threadMessages.length} messages
                                </span>
                              </div>
                              <div className="space-y-1.5 max-h-60 sm:max-h-80 overflow-y-auto pr-1">
                                {threadMessages.map(tm => (
                                  <div
                                    key={tm.id}
                                    className={cn(
                                      "rounded-xl p-2.5 sm:p-3 text-[10px] sm:text-[11px]",
                                      tm.direction === "inbound"
                                        ? "bg-blue-500/[0.04] border border-blue-500/10 mr-4 sm:mr-12"
                                        : "bg-muted/30 border border-border/30 ml-4 sm:ml-12"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-[10px] sm:text-xs">
                                        {tm.direction === "inbound" ? lead?.business_name : "You"}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                        {new Date(tm.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    {tm.subject && <p className="font-semibold mb-1 text-[10px] sm:text-xs">{tm.subject}</p>}
                                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{tm.body}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Inline reply */}
                        <AnimatePresence>
                          {isReplying && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-border/40"
                            >
                              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                                  <Reply className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-xs font-bold">Reply to {lead?.business_name}</span>
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">→ {lead?.contact_email}</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                                  <Input value={replySubject} onChange={e => setReplySubject(e.target.value)} placeholder="Re: ..." className="text-sm rounded-xl" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Message</label>
                                  <Textarea
                                    value={replyBody}
                                    onChange={e => setReplyBody(e.target.value)}
                                    rows={4}
                                    placeholder="Write your reply..."
                                    className="text-sm leading-relaxed rounded-xl"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="ghost" size="sm" onClick={cancelReply} disabled={replySending} className="text-xs rounded-lg h-8">
                                    <X className="h-3 w-3 mr-1" /> Cancel
                                  </Button>
                                  <Button size="sm" onClick={executeReply} disabled={replySending || !replyBody.trim()} className="text-xs gap-1 rounded-lg h-8">
                                    {replySending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Send confirmation */}
      <Dialog open={!!sendConfirmId} onOpenChange={open => !open && setSendConfirmId(null)}>
        <DialogContent className="rounded-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              {sendConfirmId && (() => {
                const msg = messages.find(m => m.id === sendConfirmId);
                const lead = msg ? leads[msg.lead_id] : null;
                return `Send email to ${lead?.contact_email || "this lead"}?`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSendConfirmId(null)} disabled={sending} className="rounded-lg w-full sm:w-auto">Cancel</Button>
            <Button onClick={executeSend} disabled={sending} className="gap-1.5 rounded-lg w-full sm:w-auto">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    drafted: "bg-amber-500/10 text-amber-600",
    sent: "bg-emerald-500/10 text-emerald-600",
    delivered: "bg-emerald-500/10 text-emerald-600",
    opened: "bg-secondary/10 text-secondary",
    replied: "bg-primary/10 text-primary",
    received: "bg-blue-500/10 text-blue-600",
    bounced: "bg-destructive/10 text-destructive",
  };
  return (
    <Badge className={cn("text-[8px] sm:text-[9px] border-0 rounded-md", config[status] || "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}
