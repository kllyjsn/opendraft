import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift, ArrowRight, Sparkles } from "lucide-react";

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("exit_popup_dismissed");
    if (dismissed) return;

    let triggered = false;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !triggered) {
        triggered = true;
        // Only show after 15s on page
        const timeOnPage = performance.now();
        if (timeOnPage > 15000) {
          setShow(true);
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("exit_popup_dismissed", "1");
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-md text-center border-primary/20">
        <DialogTitle className="sr-only">Special offer before you go</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Wait — free credits inside 👀</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sign up now and get <span className="font-bold text-foreground">3 free app claims</span> to start building your portfolio. No coding experience needed.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={dismiss} className="flex-1">
              Maybe later
            </Button>
            <Link to="/login" className="flex-1" onClick={dismiss}>
              <Button className="w-full gradient-hero text-white border-0 shadow-glow gap-2">
                <Sparkles className="h-4 w-4" />
                Claim Free Credits
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground">Join 500+ builders already on OpenDraft</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
