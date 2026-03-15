import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Eye, UserPlus } from "lucide-react";

const PROOF_EVENTS = [
  { icon: ShoppingCart, text: "Someone just claimed a SaaS dashboard", time: "2 min ago" },
  { icon: UserPlus, text: "New builder joined from San Francisco", time: "5 min ago" },
  { icon: Eye, text: "AI agent browsing productivity templates", time: "1 min ago" },
  { icon: ShoppingCart, text: "FitPulse template claimed in Lagos", time: "8 min ago" },
  { icon: UserPlus, text: "New seller listing a React app", time: "3 min ago" },
  { icon: Eye, text: "12 people viewing landing pages now", time: "just now" },
  { icon: ShoppingCart, text: "QuickChat template purchased", time: "6 min ago" },
  { icon: UserPlus, text: "Agency from London signed up", time: "4 min ago" },
];

export function SocialProofToast() {
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    // Don't show on first 30s
    const initial = setTimeout(() => {
      setCurrent(0);
    }, 30000);

    return () => clearTimeout(initial);
  }, []);

  useEffect(() => {
    if (current === null) return;

    const hide = setTimeout(() => setCurrent(null), 4000);
    const next = setTimeout(() => {
      setCurrent((prev) => {
        if (prev === null) return null;
        return (prev + 1) % PROOF_EVENTS.length;
      });
    }, 25000 + Math.random() * 20000); // 25-45s random interval

    return () => {
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [current]);

  return (
    <AnimatePresence>
      {current !== null && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-50 max-w-xs"
        >
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {(() => {
                const Icon = PROOF_EVENTS[current].icon;
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {PROOF_EVENTS[current].text}
              </p>
              <p className="text-[10px] text-muted-foreground">{PROOF_EVENTS[current].time}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
