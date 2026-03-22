import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, ExternalLink, Copy, Eye, CheckCircle, Clock,
  AlertCircle, Loader2, Mail, EyeOff, Plus, Upload, Search,
  Globe, User, MapPin, X, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

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

const INDUSTRIES = [
  "Home Services", "Food & Beverage", "Health & Wellness",
  "Professional Services", "Automotive", "Beauty & Personal Care",
  "Retail & Local Shops", "Education & Childcare", "Events & Entertainment",
  "Pet Services", "Construction & Trades", "Real Estate & Property", "Other",
];

export function OutreachLeadsList({ campaignId, industry }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [addingProspect, setAddingProspect] = useState(false);
  const [importingUrl, setImportingUrl] = useState(false);

  // Add prospect form
  const [newProspect, setNewProspect] = useState({
    business_name: "", website_url: "", contact_email: "",
    contact_name: "", industry: "Other", city: "", state: "",
  });
  const [importUrl, setImportUrl] = useState("");
  const [importIndustry, setImportIndustry] = useState("Other");

  useEffect(() => { fetchData(); }, [campaignId, industry]);

  const fetchData = async () => {
    setLoading(true);
    let leadsQuery = supabase
      .from("outreach_leads")
      .select("*")
      .order("score", { ascending: false })
      .limit(200);

    if (campaignId) leadsQuery = leadsQuery.eq("campaign_id", campaignId);
    if (industry) leadsQuery = leadsQuery.eq("industry", industry);

    const [leadsRes, msgsRes] = await Promise.all([
      leadsQuery,
      supabase.from("outreach_messages").select("id, lead_id, subject, body, message_status").limit(500),
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

  const handleAddProspect = async () => {
    if (!newProspect.business_name && !newProspect.website_url) {
      toast.error("Enter a business name or website URL");
      return;
    }
    setAddingProspect(true);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: {
          action: "add_prospect",
          ...newProspect,
          campaign_id: campaignId,
        },
      });
      if (error) throw error;
      if (data?.result?.error) throw new Error(data.result.error);
      toast.success(`Added ${data?.result?.lead?.business_name || "prospect"}`);
      setShowAddDialog(false);
      setNewProspect({ business_name: "", website_url: "", contact_email: "", contact_name: "", industry: "Other", city: "", state: "" });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to add prospect");
    } finally {
      setAddingProspect(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl) { toast.error("Enter a URL"); return; }
    setImportingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("swarm-b2b-outreach", {
        body: {
          action: "import_from_url",
          url: importUrl,
          industry: importIndustry,
          campaign_id: campaignId,
        },
      });
      if (error) throw error;
      if (data?.result?.error) throw new Error(data.result.error);
      toast.success(`Imported ${data?.result?.imported_count || 0} prospects`);
      setShowImportDialog(false);
      setImportUrl("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImportingUrl(false);
    }
  };

  // Filter leads
  const filtered = leads.filter(l => {
    if (statusFilter !== "all" && l.lead_status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.business_name.toLowerCase().includes(q) ||
        l.contact_email?.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const statusCounts = ["qualified", "nurture", "new", "contacted", "no_response", "replied"].map(s => ({
    status: s,
    count: leads.filter(l => l.lead_status === s).length,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="pl-8 h-8 text-xs rounded-lg bg-card border-border/40"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg bg-card border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusCounts.map(s => (
              <SelectItem key={s.status} value={s.status}>
                {s.status.replace(/_/g, " ")} ({s.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Prospect */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" /> Add Prospect
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={newProspect.website_url}
                      onChange={e => setNewProspect(p => ({ ...p, website_url: e.target.value }))}
                      placeholder="example.com"
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">We'll auto-extract business name, email & contact info</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Business Name</label>
                  <Input
                    value={newProspect.business_name}
                    onChange={e => setNewProspect(p => ({ ...p, business_name: e.target.value }))}
                    placeholder="Acme Plumbing"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
                  <Input
                    value={newProspect.contact_email}
                    onChange={e => setNewProspect(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="owner@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Contact Name</label>
                  <Input
                    value={newProspect.contact_name}
                    onChange={e => setNewProspect(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="John Smith"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry</label>
                  <Select value={newProspect.industry} onValueChange={v => setNewProspect(p => ({ ...p, industry: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newProspect.city}
                    onChange={e => setNewProspect(p => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="h-9 text-sm"
                  />
                  <Input
                    value={newProspect.state}
                    onChange={e => setNewProspect(p => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleAddProspect} disabled={addingProspect} className="w-full h-9 text-sm gap-2">
                {addingProspect ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {addingProspect ? "Enriching & adding..." : "Add & enrich prospect"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import from URL */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1">
              <Upload className="h-3 w-3" /> Import
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" /> Import from URL
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Directory / List URL</label>
                <Input
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://yelp.com/search?find_desc=plumber&find_loc=Austin"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Paste a Yelp, Google Maps, or directory page — we'll extract all businesses
                </p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry</label>
                <Select value={importIndustry} onValueChange={setImportIndustry}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleImportFromUrl} disabled={importingUrl} className="w-full h-9 text-sm gap-2">
                {importingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {importingUrl ? "Scraping & importing..." : "Import prospects"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status chips */}
      {statusCounts.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors",
              statusFilter === "all" ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            All · {leads.length}
          </button>
          {statusCounts.map(({ status, count }) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors",
                statusFilter === status ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {status.replace(/_/g, " ")} · {count}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-14 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-base mb-1.5">
              {leads.length === 0 ? "No leads yet" : "No matches"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {leads.length === 0
                ? "Add prospects manually, import from a URL, or run auto-discovery."
                : "Try adjusting your search or filters."}
            </p>
            {leads.length === 0 && (
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-3 w-3" /> Add Prospect
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-3 w-3" /> Import URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lead cards */}
      <div className="space-y-1.5">
        {filtered.map((lead, i) => {
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
                "border-border/40 transition-all cursor-pointer",
                isExpanded ? "ring-1 ring-primary/15 shadow-md border-border/60" : "hover:border-border/60 hover:shadow-sm"
              )} onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
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
                        {lead.source === "manual" && (
                          <Badge variant="outline" className="text-[8px] rounded px-1 border-primary/20 text-primary">manual</Badge>
                        )}
                        {lead.source === "url_import" && (
                          <Badge variant="outline" className="text-[8px] rounded px-1 border-blue-500/20 text-blue-500">import</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2.5 mt-1 text-[10px] sm:text-[11px] text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-medium rounded-md px-1.5">{lead.industry}</Badge>
                        {lead.contact_email && (
                          <span className="font-mono text-[9px] sm:text-[10px] truncate max-w-[150px] sm:max-w-none">{lead.contact_email}</span>
                        )}
                        {!lead.contact_email && (
                          <span className="text-[9px] text-destructive/60 italic">no email</span>
                        )}
                        {lead.city && lead.state && (
                          <span className="hidden sm:inline">{lead.city}, {lead.state}</span>
                        )}
                        {lead.website_url && (
                          <a
                            href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`}
                            target="_blank" rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-0.5 transition-colors hidden sm:flex"
                            onClick={e => e.stopPropagation()}
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
                      {msg && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg" onClick={e => { e.stopPropagation(); copyMessage(msg); }}>
                          <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                        <div className="flex gap-2 mt-2 flex-wrap sm:hidden text-[10px] text-muted-foreground">
                          {lead.contact_name && <span className="font-medium text-foreground/70">{lead.contact_name}</span>}
                          {lead.city && lead.state && <span>{lead.city}, {lead.state}</span>}
                          {lead.website_url && (
                            <a
                              href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="hover:text-primary flex items-center gap-0.5 transition-colors"
                              onClick={e => e.stopPropagation()}
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
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-md sm:hidden ml-auto" onClick={e => { e.stopPropagation(); copyMessage(msg); }}>
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
