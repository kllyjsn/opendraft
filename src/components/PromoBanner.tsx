import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DISMISSED_KEY = "opendraft_promo_dismissed";
const PROMO_CODE = "WELCOME20";

export function PromoBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Don't show to users who already purchased
    if (user) {
      supabase
        .from("purchases")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", user.id)
        .then(({ count }) => {
          setHasPurchased((count ?? 0) > 0);
          if ((count ?? 0) === 0) setVisible(true);
        });
    } else {
      setVisible(true);
    }
  }, [user]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  function copyCode() {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (hasPurchased) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="relative bg-primary/10 border-b border-primary/20">
            <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">
                First purchase? Use code{" "}
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline underline-offset-2"
                >
                  {PROMO_CODE}
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>{" "}
                for 20% off any project
              </span>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
