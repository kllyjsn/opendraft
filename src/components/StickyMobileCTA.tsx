import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Sparkles, Wand2 } from "lucide-react";
import { getVariant, trackImpression, trackClick } from "@/lib/ab-test";

const COPY_VARIANTS = {
  a: { headline: "Get your first app free", sub: "Own the code · No per-seat fees" },
  b: { headline: "Build your custom app now", sub: "90 seconds · You own everything" },
  c: { headline: "Replace your SaaS today", sub: "Own the code · Zero monthly fees" },
} as const;

const RESULTS_COPY = { headline: "Your apps are ready", sub: "Pick one and build it in 90 seconds" };

type Variant = keyof typeof COPY_VARIANTS;

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();
  const [variant] = useState<Variant>(() => getVariant("sticky_cta", ["a", "b", "c"]));
  const [hasResults, setHasResults] = useState(false);
  const impressionLogged = useRef(false);

  useEffect(() => {
    if (user) return;

    const handleScroll = () => {
      setVisible(window.scrollY > 300);
      // Check if analysis results are showing
      try {
        setHasResults(!!sessionStorage.getItem("opendraft_biz_analysis"));
      } catch {}
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  useEffect(() => {
    if (visible && !impressionLogged.current && !user) {
      impressionLogged.current = true;
      trackImpression("sticky_cta", variant, "mobile_bar");
    }
  }, [visible, variant, user]);

  if (user) return null;

  const copy = hasResults ? RESULTS_COPY : COPY_VARIANTS[variant];

  const handleClick = () => {
    trackClick("sticky_cta", variant, "mobile_bar");
    if (hasResults) {
      // Scroll to results
      const results = document.querySelector('[data-results-section]');
      results?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-card/95 backdrop-blur-xl border-t border-border px-4 py-3 safe-area-bottom">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {hasResults
                    ? <Wand2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    : <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />}
                  {copy.headline}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {copy.sub}
                </p>
              </div>
              <div className="shrink-0 w-[180px]" onClick={handleClick}>
                <GoogleSignInButton label={hasResults ? "Sign up to build" : "Sign up free"} className="!h-9 !text-xs" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
