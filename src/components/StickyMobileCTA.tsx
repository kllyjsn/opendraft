import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Sparkles } from "lucide-react";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) return;

    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  if (user) return null;

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
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  Get your first app free
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Own the code · No per-seat fees
                </p>
              </div>
              <div className="shrink-0 w-[180px]">
                <GoogleSignInButton label="Sign up free" className="!h-9 !text-xs" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
