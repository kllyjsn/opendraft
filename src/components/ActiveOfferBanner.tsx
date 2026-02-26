import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, ArrowRightLeft, HandCoins } from "lucide-react";

interface ActiveOffer {
  id: string;
  offer_amount: number;
  counter_amount: number | null;
  status: string;
  message: string | null;
  seller_message: string | null;
  created_at: string;
  original_price: number;
}

interface ActiveOfferBannerProps {
  listingId: string;
  askingPrice: number;
}

export function ActiveOfferBanner({ listingId, askingPrice }: ActiveOfferBannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchActiveOffer();
  }, [user, listingId]);

  async function fetchActiveOffer() {
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("listing_id", listingId)
      .eq("buyer_id", user!.id)
      .in("status", ["pending", "countered", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOffer(data as ActiveOffer | null);
    setLoading(false);
  }

  async function handleAcceptCounter() {
    if (!offer) return;
    setResponding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "accept_counter", offerId: offer.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");

      toast({ title: "Counter accepted! 🎉", description: "Redirecting to checkout…" });
      if (result.checkoutUrl) navigate(result.checkoutUrl);
      else fetchActiveOffer();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setResponding(false);
    }
  }

  async function handleDecline() {
    if (!offer) return;
    setResponding(true);
    try {
      await supabase.from("offers").update({ status: "rejected" }).eq("id", offer.id).eq("buyer_id", user!.id);
      toast({ title: "Counter-offer declined" });
      setOffer(null);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setResponding(false);
    }
  }

  if (loading || !offer) return null;

  if (offer.status === "pending") {
    return (
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Your bid is pending</p>
        </div>
        <p className="text-xs text-orange-600/80 dark:text-orange-400/70">
          You offered <span className="font-bold">${(offer.offer_amount / 100).toFixed(2)}/mo</span> — waiting for seller response.
        </p>
        {offer.message && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-orange-200 pl-2">"{offer.message}"</p>
        )}
      </div>
    );
  }

  if (offer.status === "countered") {
    return (
      <div className="rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Counter-offer received!</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Your bid</p>
            <p className="font-bold text-sm">${(offer.offer_amount / 100).toFixed(2)}/mo</p>
          </div>
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 text-center">
            <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Counter</p>
            <p className="font-bold text-sm text-blue-700 dark:text-blue-300">${(offer.counter_amount! / 100).toFixed(2)}/mo</p>
          </div>
        </div>
        {offer.seller_message && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-blue-200 pl-2">Seller: "{offer.seller_message}"</p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAcceptCounter}
            disabled={responding}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            {responding ? "Processing…" : `Accept $${(offer.counter_amount! / 100).toFixed(2)}/mo`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={responding}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Decline
          </Button>
        </div>
      </div>
    );
  }

  if (offer.status === "accepted") {
    const finalPrice = offer.counter_amount || offer.offer_amount;
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm font-bold text-green-700 dark:text-green-300">Offer accepted!</p>
        </div>
        <p className="text-xs text-green-600/80 dark:text-green-400/70">
          The seller accepted <span className="font-bold">${(finalPrice / 100).toFixed(2)}/mo</span>. Complete your purchase below.
        </p>
        <Link to={`/checkout/${listingId}?offer=${offer.id}`}>
          <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90" size="sm">
            Complete Purchase — ${(finalPrice / 100).toFixed(2)}/mo
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
