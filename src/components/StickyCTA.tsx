import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) return; // Don't show to logged-in users

    const handleScroll = () => {
      setVisible(window.scrollY > 600);
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
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg py-3 px-4 md:hidden"
        >
          <Link to="/login" className="block">
            <Button className="w-full gradient-hero text-white border-0 shadow-glow gap-2 h-11 text-sm font-bold">
              <Rocket className="h-4 w-4" />
              Get 3 Free Apps — Sign Up Now
            </Button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
