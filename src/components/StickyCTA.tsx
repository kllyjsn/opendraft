import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function StickyCTA() {
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

  const scrollToInput = () => {
    const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-cta"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg py-3 px-4 md:hidden"
        >
          <Button
            onClick={scrollToInput}
            className="w-full bg-foreground text-background hover:bg-foreground/90 border-0 gap-2 h-11 text-sm font-bold rounded-full"
          >
            <Zap className="h-4 w-4" />
            Analyze Your Website — Free
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
