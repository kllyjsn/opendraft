import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitFork } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestForkDialogProps {
  listingId: string;
  listingTitle: string;
  builderId: string;
  builderName: string;
}

export function RequestForkDialog({ listingId, listingTitle, builderId, builderName }: RequestForkDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");

      const budgetCents = budget ? Math.round(parseFloat(budget) * 100) : null;

      const { error } = await supabase.from("fork_requests" as any).insert({
        listing_id: listingId,
        requester_id: user.id,
        builder_id: builderId,
        description: description.trim(),
        budget: budgetCents,
      });

      if (error) throw new Error(error.message);

      toast({ title: "Fork request sent! 🎉", description: `${builderName} will review your request and send a quote.` });
      setOpen(false);
      setDescription("");
      setBudget("");
    } catch (err) {
      toast({ title: "Failed to submit", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
          <GitFork className="h-4 w-4 mr-2" />
          Request Custom Fork
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            Request a Custom Fork
          </DialogTitle>
          <DialogDescription>
            Ask <strong>{builderName}</strong> to build a customized version of <strong>{listingTitle}</strong> for your needs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fork-desc">What do you need?</Label>
            <Textarea
              id="fork-desc"
              placeholder="Describe the customizations you want — features, integrations, branding, industry-specific changes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fork-budget">Your budget (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="fork-budget"
                type="number"
                min="0"
                step="1"
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">The builder will send you a quote. No commitment until you accept.</p>
          </div>

          <Button type="submit" disabled={submitting || !description.trim()} className="w-full gradient-hero text-white border-0">
            {submitting ? "Sending…" : "Send Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
