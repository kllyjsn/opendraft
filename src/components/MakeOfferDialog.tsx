import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { HandCoins, TrendingDown, DollarSign } from "lucide-react";

interface MakeOfferDialogProps {
  listingId: string;
  listingTitle: string;
  askingPrice: number; // in cents
  onOfferSent?: () => void;
  hasActiveOffer?: boolean;
}

export function MakeOfferDialog({ listingId, listingTitle, askingPrice, onOfferSent, hasActiveOffer }: MakeOfferDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minOffer = Math.ceil(askingPrice * 0.25);
  const minOfferDollars = (minOffer / 100).toFixed(2);
  const askingDollars = (askingPrice / 100).toFixed(2);

  // Smart price suggestions
  const suggestions = [
    { label: "75%", amount: Math.round(askingPrice * 0.75), pct: 75 },
    { label: "60%", amount: Math.round(askingPrice * 0.60), pct: 60 },
    { label: "50%", amount: Math.round(askingPrice * 0.50), pct: 50 },
  ].filter(s => s.amount >= minOffer);

  async function handleSubmit() {
    if (!user) return;
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < parseFloat(minOfferDollars)) {
      toast({ title: "Invalid amount", description: `Minimum bid is $${minOfferDollars}/mo`, variant: "destructive" });
      return;
    }

    const offerCents = Math.round(amountFloat * 100);
    if (offerCents >= askingPrice) {
      toast({ title: "Too high!", description: "Your bid should be less than the asking price. Just subscribe!", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "create",
          listingId,
          offerAmount: offerCents,
          message: message || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to submit bid");

      toast({ title: "Bid sent! 🎉", description: "The seller will be notified and can accept, decline, or counter." });
      setOpen(false);
      setAmount("");
      setMessage("");
      onOfferSent?.();
    } catch (e) {
      toast({ title: "Bid failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (hasActiveOffer) return null;

  const savingsPercent = amount ? Math.round((1 - (parseFloat(amount) / parseFloat(askingDollars))) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
          <HandCoins className="h-4 w-4 mr-2" />
          Suggest a Price
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary" />
            Name your price
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Suggest a monthly subscription price for <span className="font-semibold text-foreground">"{listingTitle}"</span>. The seller can accept, decline, or counter.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Current price display */}
          <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Current subscription</span>
              <span className="font-black text-lg">${askingDollars}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Minimum bid (25%)</span>
              <span className="text-sm font-medium text-muted-foreground">${minOfferDollars}/mo</span>
            </div>
          </div>

          {/* Quick pick suggestions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick pick</label>
            <div className="grid grid-cols-3 gap-2">
              {suggestions.map(s => (
                <button
                  key={s.pct}
                  type="button"
                  onClick={() => setAmount((s.amount / 100).toFixed(2))}
                  className={`rounded-lg border p-2.5 text-center transition-all hover:border-primary/40 ${
                    amount === (s.amount / 100).toFixed(2)
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <p className="font-bold text-sm">${(s.amount / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{100 - s.pct}% off</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              Your suggested price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                min={minOfferDollars}
                max={(askingPrice / 100 - 0.01).toFixed(2)}
                step="0.01"
                placeholder={minOfferDollars}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/mo</span>
            </div>
            {amount && parseFloat(amount) > 0 && parseFloat(amount) < parseFloat(askingDollars) && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-xs font-semibold text-green-600">
                  {savingsPercent}% less than asking price
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Why this price? (optional)</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-20 resize-none"
              placeholder="E.g. 'I'm a student and can't afford the full price' or 'I'd love to try it at this rate first'…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Trust line */}
          <p className="text-[11px] text-muted-foreground text-center">
            💡 Sellers accept ~40% of reasonable bids. Being polite helps!
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !amount}
            className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
          >
            {submitting ? "Sending…" : "Submit Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
