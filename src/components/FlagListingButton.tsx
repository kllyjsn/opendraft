/**
 * FlagListingButton
 * -----------------
 * Allows authenticated users to flag a listing as suspicious.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface FlagListingButtonProps {
  listingId: string;
  sellerId: string;
}

const REASONS = [
  "Seller doesn't own this project",
  "Misleading screenshots or description",
  "Stolen or plagiarized content",
  "Spam or scam listing",
  "Other",
];

export function FlagListingButton({ listingId, sellerId }: FlagListingButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Don't show to the seller themselves or unauthenticated users
  if (!user || user.id === sellerId) return null;

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await api.from("listing_flags" as any).insert({
        listing_id: listingId,
        reporter_id: user!.id,
        reason,
        details: details.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already flagged", description: "You've already reported this listing." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Report submitted", description: "Thanks for helping keep the marketplace safe." });
      }
      setSubmitted(true);
      setTimeout(() => setOpen(false), 1500);
    } catch (e) {
      toast({
        title: "Failed to submit",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive">
          <Flag className="h-3.5 w-3.5" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm">Report submitted — we'll review it shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Why are you reporting this listing? Select a reason:
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    reason === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
              Submit report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
