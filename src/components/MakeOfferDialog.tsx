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
import { HandCoins } from "lucide-react";

interface MakeOfferDialogProps {
  listingId: string;
  listingTitle: string;
  askingPrice: number; // in cents
  onOfferSent?: () => void;
}

export function MakeOfferDialog({ listingId, listingTitle, askingPrice, onOfferSent }: MakeOfferDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minOffer = Math.ceil(askingPrice * 0.25);
  const minOfferDollars = (minOffer / 100).toFixed(2);
  const askingDollars = (askingPrice / 100).toFixed(2);

  async function handleSubmit() {
    if (!user) return;
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < parseFloat(minOfferDollars)) {
      toast({ title: "Invalid amount", description: `Minimum offer is $${minOfferDollars}`, variant: "destructive" });
      return;
    }

    const offerCents = Math.round(amountFloat * 100);
    if (offerCents >= askingPrice) {
      toast({ title: "Too high!", description: "Your offer should be less than the asking price. Just buy it!", variant: "destructive" });
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
      if (!res.ok) throw new Error(result.error ?? "Failed to submit offer");

      toast({ title: "Offer sent! 🎉", description: "The seller will be notified and can accept, reject, or counter." });
      setOpen(false);
      setAmount("");
      setMessage("");
      onOfferSent?.();
    } catch (e) {
      toast({ title: "Offer failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
          <HandCoins className="h-4 w-4 mr-2" />
          Make an Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an offer on "{listingTitle}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-muted/50 border border-border/40 p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Asking price</span>
              <span className="font-bold">${askingDollars}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum offer (25%)</span>
              <span className="font-medium text-muted-foreground">${minOfferDollars}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Your offer *</label>
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
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Message (optional)</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-20 resize-none"
              placeholder="Tell the seller why you're interested or why this price makes sense…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
          </div>
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
            {submitting ? "Sending…" : "Submit Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
