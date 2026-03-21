import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Check, Sparkles } from "lucide-react";

interface PostClaimUpsellProps {
  open: boolean;
  onClose: () => void;
  claimedTitle?: string;
}

const UPGRADE_REASONS = [
  "Claim up to 20 apps per month",
  "Priority builder messaging",
  "Security audits on every app",
  "Deploy to your own domain",
];

export function PostClaimUpsell({ open, onClose, claimedTitle }: PostClaimUpsellProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center border-primary/20">
        <DialogTitle className="sr-only">Upgrade your plan</DialogTitle>
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">
              Nice claim! 🎉
            </h2>
            {claimedTitle && (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{claimedTitle}</strong> is yours forever.
              </p>
            )}
          </div>

          <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-5 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Unlock more with Growth — $30/mo
            </p>
            {UPGRADE_REASONS.map((reason) => (
              <div key={reason} className="flex items-center gap-2.5 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-foreground/80">{reason}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe later
            </Button>
            <Link to="/credits" className="flex-1" onClick={onClose}>
              <Button className="w-full gradient-hero text-white border-0 shadow-glow gap-2">
                <Zap className="h-4 w-4" />
                See plans
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Save 20% with annual billing · Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
