import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, ArrowRightLeft, HandCoins } from "lucide-react";
import { api } from "@/lib/api";

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_amount: number;
  original_price: number;
  counter_amount: number | null;
  status: string;
  message: string | null;
  seller_message: string | null;
  created_at: string;
  listing_title?: string;
}

export function OffersManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [sellerMessages, setSellerMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    fetchOffers();
  }, [user]);

  async function fetchOffers() {
    if (!user) return;
    // Fetch offers where user is seller
    const { data } = await api.from("offers")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch listing titles
      const listingIds = [...new Set(data.map((o: any) => o.listing_id))];
      const { data: listings } = await api.from("listings")
        .select("id, title")
        .in("id", listingIds);

      const titleMap: Record<string, string> = {};
      listings?.forEach((l: any) => { titleMap[l.id] = l.title; });

      setOffers(data.map((o: any) => ({ ...o, listing_title: titleMap[o.listing_id] || "Unknown" })));
    }
    setLoading(false);
  }

  async function respond(offerId: string, action: "accept" | "reject" | "counter") {
    setResponding(offerId);
    try {
      const session = { access_token: localStorage.getItem("opendraft_token") };
      if (!localStorage.getItem("opendraft_token")) throw new Error("Not authenticated");
      const body: any = { action, offerId, sellerMessage: sellerMessages[offerId] || null };
      if (action === "counter") {
        const amt = parseFloat(counterAmounts[offerId] || "0");
        if (isNaN(amt) || amt < 1) throw new Error("Enter a valid counter amount");
        body.counterAmount = Math.round(amt * 100);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/functions/handle-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");

      toast({ title: action === "accept" ? "Offer accepted! 🎉" : action === "reject" ? "Offer declined" : "Counter-offer sent! 🔄" });
      fetchOffers();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setResponding(null);
    }
  }

  const statusStyles: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    accepted: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    countered: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    expired: "bg-muted text-muted-foreground",
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
        <h3 className="font-bold mb-1">No offers yet</h3>
        <p className="text-muted-foreground text-sm">When buyers make offers on your listings, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <div key={offer.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-sm">{offer.listing_title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(offer.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[offer.status] || ""}`}>
              {offer.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asking</p>
              <p className="font-bold">${(offer.original_price / 100).toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Offer</p>
              <p className="font-bold text-primary">${(offer.offer_amount / 100).toFixed(2)}</p>
            </div>
            {offer.counter_amount && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Counter</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">${(offer.counter_amount / 100).toFixed(2)}</p>
              </div>
            )}
          </div>

          {offer.message && (
            <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 mb-3 italic">"{offer.message}"</p>
          )}

          {offer.status === "pending" && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reply message (optional)</label>
                <Input
                  placeholder="Add a message..."
                  value={sellerMessages[offer.id] || ""}
                  onChange={(e) => setSellerMessages((p) => ({ ...p, [offer.id]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => respond(offer.id, "accept")}
                  disabled={responding === offer.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => respond(offer.id, "reject")}
                  disabled={responding === offer.id}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Decline
                </Button>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      type="number"
                      placeholder="Counter"
                      value={counterAmounts[offer.id] || ""}
                      onChange={(e) => setCounterAmounts((p) => ({ ...p, [offer.id]: e.target.value }))}
                      className="h-8 text-sm w-24 pl-5"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respond(offer.id, "counter")}
                    disabled={responding === offer.id || !counterAmounts[offer.id]}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Counter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
