import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HandCoins, Check, X, ExternalLink, Clock, ArrowRightLeft } from "lucide-react";

interface BuyerOffer {
  id: string;
  listing_id: string;
  seller_id: string;
  offer_amount: number;
  original_price: number;
  counter_amount: number | null;
  status: string;
  message: string | null;
  seller_message: string | null;
  created_at: string;
  updated_at: string;
  listing_title?: string;
}

export function BuyerOffersPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<BuyerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchOffers();
  }, [user]);

  async function fetchOffers() {
    if (!user) return;
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const listingIds = [...new Set(data.map((o: any) => o.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      const titleMap: Record<string, string> = {};
      listings?.forEach((l: any) => { titleMap[l.id] = l.title; });

      setOffers(data.map((o: any) => ({ ...o, listing_title: titleMap[o.listing_id] || "Unknown" })));
    }
    setLoading(false);
  }

  async function handleAcceptCounter(offerId: string) {
    setResponding(offerId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "accept_counter", offerId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");

      toast({ title: "Counter-offer accepted! 🎉", description: "Redirecting to checkout…" });
      if (result.checkoutUrl) {
        navigate(result.checkoutUrl);
      } else {
        fetchOffers();
      }
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setResponding(null);
    }
  }

  async function handleDeclineCounter(offerId: string) {
    setResponding(offerId);
    try {
      // We'll update the offer status to "rejected" from the buyer side
      const { error } = await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offerId)
        .eq("buyer_id", user!.id);
      if (error) throw new Error(error.message);
      toast({ title: "Counter-offer declined" });
      fetchOffers();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setResponding(null);
    }
  }

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    pending: { label: "Pending", icon: <Clock className="h-3 w-3" />, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    accepted: { label: "Accepted", icon: <Check className="h-3 w-3" />, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
    rejected: { label: "Declined", icon: <X className="h-3 w-3" />, className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
    countered: { label: "Counter-offer", icon: <ArrowRightLeft className="h-3 w-3" />, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground", icon: null },
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
        <HandCoins className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-bold mb-1">No bids yet</h3>
        <p className="text-muted-foreground text-sm">When you suggest a price on a listing, your bids will appear here so you can track them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const config = statusConfig[offer.status] || statusConfig.expired;
        const needsAction = offer.status === "countered";
        const wasAccepted = offer.status === "accepted";

        return (
          <div
            key={offer.id}
            className={`rounded-2xl border bg-card p-5 shadow-card transition-all ${
              needsAction ? "border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800" : "border-border/60"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link to={`/listing/${offer.listing_id}`} className="font-bold text-sm hover:text-primary transition-colors">
                  {offer.listing_title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(offer.created_at).toLocaleDateString()} · {new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 ${config.className}`}>
                {config.icon} {config.label}
              </span>
            </div>

            {/* Price comparison */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div className="rounded-xl bg-muted/50 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asking</p>
                <p className="font-bold">${(offer.original_price / 100).toFixed(2)}/mo</p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your bid</p>
                <p className="font-bold text-primary">${(offer.offer_amount / 100).toFixed(2)}/mo</p>
              </div>
              {offer.counter_amount && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seller's counter</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">${(offer.counter_amount / 100).toFixed(2)}/mo</p>
                </div>
              )}
            </div>

            {/* Messages */}
            {offer.message && (
              <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 mb-2 italic">You: "{offer.message}"</p>
            )}
            {offer.seller_message && (
              <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 mb-3 italic">Seller: "{offer.seller_message}"</p>
            )}

            {/* Counter-offer action buttons */}
            {needsAction && (
              <div className="pt-3 border-t border-border/40 space-y-3">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    🔄 The seller countered with ${(offer.counter_amount! / 100).toFixed(2)}/mo
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    Accept to proceed to checkout at the counter price, or decline.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptCounter(offer.id)}
                    disabled={responding === offer.id}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {responding === offer.id ? "Processing…" : `Accept — $${(offer.counter_amount! / 100).toFixed(2)}/mo`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeclineCounter(offer.id)}
                    disabled={responding === offer.id}
                    className="border-border/60"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Accepted → checkout CTA */}
            {wasAccepted && (
              <div className="pt-3 border-t border-border/40">
                <Link to={`/checkout/${offer.listing_id}?offer=${offer.id}`}>
                  <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Complete Purchase — ${((offer.counter_amount || offer.offer_amount) / 100).toFixed(2)}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
