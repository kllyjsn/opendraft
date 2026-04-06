import { useEffect, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MotionDiv = motion.div;

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) return;

    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  if (user) return null;

  const scrollToDemo = () => {
    // Click the first demo button if visible, otherwise scroll to the demo area
    const demoBtn = document.querySelector<HTMLButtonElement>('[data-demo-btn]');
    if (demoBtn) {
      demoBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => demoBtn.click(), 400);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <MotionDiv
          key="sticky-cta"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg py-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <Button
            onClick={scrollToDemo}
            className="w-full bg-foreground text-background hover:bg-foreground/90 border-0 gap-2 h-11 text-sm font-bold rounded-full"
          >
            <Zap className="h-4 w-4" />
            Free SaaS Audit — No Signup Needed
          </Button>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
