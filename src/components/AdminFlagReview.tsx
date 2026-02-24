/**
 * AdminFlagReview
 * ---------------
 * Admin component to review community-flagged listings.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, CheckCircle, XCircle, ShieldCheck, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface FlagRow {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing_title?: string;
}

export function AdminFlagReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    setLoading(true);
    // Fetch flags — admin can see all via RLS policy
    const { data } = await supabase
      .from("listing_flags" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      // Fetch listing titles
      const listingIds = [...new Set((data as any[]).map((f: any) => f.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      const titleMap = new Map((listings || []).map((l: any) => [l.id, l.title]));

      setFlags((data as any[]).map((f: any) => ({
        ...f,
        listing_title: titleMap.get(f.listing_id) || "Unknown",
      })));
    } else {
      setFlags([]);
    }
    setLoading(false);
  }

  async function handleAction(flagId: string, action: "reviewed" | "dismissed") {
    setActionLoading(flagId);
    const { error } = await supabase
      .from("listing_flags" as any)
      .update({ status: action, reviewed_by: user?.id } as any)
      .eq("id", flagId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "reviewed" ? "Flag reviewed" : "Flag dismissed" });
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
    }
    setActionLoading(null);
  }

  async function handleVerifyAdmin(listingId: string) {
    setActionLoading("verify-" + listingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId, method: "admin" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast({ title: "Listing verified ✅", description: "Admin override applied." });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold mb-1">No pending flags</h3>
        <p className="text-sm text-muted-foreground">Community reports will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <div key={flag.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <Link to={`/listing/${flag.listing_id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                {flag.listing_title}
              </Link>
              <Badge variant="outline" className="ml-2 text-[10px] text-destructive border-destructive/30">
                {flag.reason}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(flag.created_at).toLocaleDateString()}
            </span>
          </div>
          {flag.details && (
            <p className="text-xs text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
              {flag.details}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link to={`/listing/${flag.listing_id}`} target="_blank">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Eye className="h-3 w-3" /> View
              </Button>
            </Link>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={actionLoading === "verify-" + flag.listing_id}
              onClick={() => handleVerifyAdmin(flag.listing_id)}
            >
              {actionLoading === "verify-" + flag.listing_id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              Verify (admin)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              disabled={actionLoading === flag.id}
              onClick={() => handleAction(flag.id, "reviewed")}
            >
              <CheckCircle className="h-3 w-3" /> Reviewed
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground"
              disabled={actionLoading === flag.id}
              onClick={() => handleAction(flag.id, "dismissed")}
            >
              <XCircle className="h-3 w-3" /> Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
