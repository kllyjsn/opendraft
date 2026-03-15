import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Gift, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Countdown banner for non-logged-in users.
 * Shows a ticking timer creating urgency to sign up.
 * Resets daily at midnight UTC.
 */
export function CountdownBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem("countdown_dismissed")) {
      setDismissed(true);
      return;
    }

    const tick = () => {
      const now = new Date();
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = endOfDay.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (user || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("countdown_dismissed", "1");
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative bg-primary text-primary-foreground overflow-hidden"
      >
        <div className="flex items-center justify-center gap-3 py-2 px-4 text-xs md:text-sm font-bold">
          <Gift className="h-4 w-4 shrink-0" />
          <span>Free credits expire in</span>
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}</span>
            <span>:</span>
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}</span>
            <span>:</span>
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}</span>
          </div>
          <span className="hidden md:inline">— Sign up now</span>
          <button onClick={dismiss} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/20 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
