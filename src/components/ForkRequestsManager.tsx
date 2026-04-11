import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { GitFork, DollarSign, Clock, CheckCircle, MessageSquare, X, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

interface ForkRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  builder_id: string;
  description: string;
  budget: number | null;
  builder_fee: number | null;
  status: string;
  created_at: string;
  listing_title?: string;
  requester_name?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "New Request", icon: <Clock className="h-3.5 w-3.5" />, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  quoted: { label: "Quote Sent", icon: <DollarSign className="h-3.5 w-3.5" />, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  accepted: { label: "Accepted", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  in_progress: { label: "In Progress", icon: <GitFork className="h-3.5 w-3.5" />, className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  delivered: { label: "Delivered", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", icon: <X className="h-3.5 w-3.5" />, className: "bg-muted text-muted-foreground" },
};

export function ForkRequestsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ForkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteFees, setQuoteFees] = useState<Record<string, string>>({});
  const [autoBuilding, setAutoBuilding] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, [user]);

  async function loadRequests() {
    if (!user) return;
    setLoading(true);

    // Get fork requests where I'm the builder
    const { data: reqs } = await api.from("fork_requests" as any)
      .select("*")
      .eq("builder_id", user.id)
      .order("created_at", { ascending: false });

    if (!reqs || reqs.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Enrich with listing titles and requester names
    const listingIds = [...new Set((reqs as any[]).map((r: any) => r.listing_id))];
    const requesterIds = [...new Set((reqs as any[]).map((r: any) => r.requester_id))];

    const [{ data: listings }, { data: profiles }] = await Promise.all([
      api.from("listings").select("id, title").in("id", listingIds),
      api.from("public_profiles").select("user_id, username").in("user_id", requesterIds),
    ]);

    const listingMap = Object.fromEntries((listings ?? []).map((l) => [l.id, l.title]));
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));

    setRequests(
      (reqs as any[]).map((r: any) => ({
        ...r,
        listing_title: listingMap[r.listing_id] ?? "Unknown",
        requester_name: profileMap[r.requester_id] ?? "Anonymous",
      }))
    );
    setLoading(false);
  }

  async function sendQuote(requestId: string) {
    const feeStr = quoteFees[requestId];
    if (!feeStr) return;
    const feeCents = Math.round(parseFloat(feeStr) * 100);
    if (feeCents <= 0) return;

    const { error } = await api.from("fork_requests" as any)
      .update({ builder_fee: feeCents, status: "quoted" })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Failed to send quote", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote sent! 💰" });
      loadRequests();
    }
  }

  async function updateStatus(requestId: string, status: string) {
    const { error } = await api.from("fork_requests" as any)
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      loadRequests();
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
        <GitFork className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-bold mb-1">No fork requests yet</h3>
        <p className="text-muted-foreground text-sm">When buyers request custom versions of your apps, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <GitFork className="h-5 w-5 text-primary" />
          Fork Requests
        </h2>
        <span className="text-sm text-muted-foreground">{requests.length} total</span>
      </div>

      {requests.map((req) => {
        const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
        return (
          <div key={req.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-bold text-sm">
                  {req.requester_name} wants a custom fork of{" "}
                  <Link to={`/listing/${req.listing_id}`} className="text-primary hover:underline">
                    {req.listing_title}
                  </Link>
                </p>
              </div>
              {req.budget && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</p>
                  <p className="font-bold text-sm">${(req.budget / 100).toFixed(0)}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{req.description}</p>

            {/* Actions based on status */}
            {req.status === "pending" && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[160px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Your fee"
                    value={quoteFees[req.id] ?? ""}
                    onChange={(e) => setQuoteFees((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="pl-7 h-9 text-sm"
                  />
                </div>
                <Button size="sm" onClick={() => sendQuote(req.id)} disabled={!quoteFees[req.id]} className="gradient-hero text-white border-0">
                  <DollarSign className="h-3.5 w-3.5 mr-1" /> Send Quote
                </Button>
                <Button size="sm" variant="ghost" onClick={() => updateStatus(req.id, "cancelled")} className="text-muted-foreground">
                  Decline
                </Button>
              </div>
            )}

            {req.status === "quoted" && req.builder_fee && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Your quote:</span>
                <span className="font-bold">${(req.builder_fee / 100).toFixed(0)}</span>
                <span className="text-muted-foreground">— waiting for buyer to accept</span>
              </div>
            )}

            {req.status === "accepted" && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => updateStatus(req.id, "in_progress")} className="gradient-hero text-white border-0">
                  Start Building
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={autoBuilding === req.id}
                  onClick={async () => {
                    setAutoBuilding(req.id);
                    try {
                      const { data: data, error } = await api.post<{ data: any }>("/functions/swarm-fork-autobuilder", { fork_request_id: req.id },);
                      if (error) throw error;
                      toast({ title: "Fork auto-built! 🤖", description: `Created "${data.title}" with ${data.changed_files} modified files.` });
                      loadRequests();
                    } catch (e: any) {
                      toast({ title: "Auto-build failed", description: e.message, variant: "destructive" });
                    } finally {
                      setAutoBuilding(null);
                    }
                  }}
                >
                  {autoBuilding === req.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  AI Auto-Build
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message Buyer
                </Button>
              </div>
            )}

            {req.status === "in_progress" && (
              <div className="flex items-center gap-2">
                <Link to={`/sell?remix=${req.listing_id}&fork_request=${req.id}`}>
                  <Button size="sm" className="gradient-hero text-white border-0">
                    <GitFork className="h-3.5 w-3.5 mr-1" /> Publish Fork & Deliver
                  </Button>
                </Link>
              </div>
            )}

            {req.status === "delivered" && (
              <p className="text-sm text-primary font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Delivered successfully
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
