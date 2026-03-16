/**
 * SignupPrompt — Shows after user has viewed 2+ listing pages without being logged in.
 * Uses sessionStorage to track views. Non-intrusive bottom bar, dismissible.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

const VIEWS_KEY = "od_listing_views";
const DISMISSED_KEY = "od_signup_dismissed";
const THRESHOLD = 2;

export function SignupPrompt() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Track listing page views
    if (pathname.startsWith("/listing/")) {
      const views = parseInt(sessionStorage.getItem(VIEWS_KEY) || "0", 10) + 1;
      sessionStorage.setItem(VIEWS_KEY, String(views));
      if (views >= THRESHOLD) {
        setShow(true);
      }
    }
  }, [pathname, user]);

  if (user || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl shadow-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0 hidden sm:block" />
            <p className="text-xs sm:text-sm text-muted-foreground flex-1">
              <span className="font-bold text-foreground">Like what you see?</span>{" "}
              Sign up to claim your first app free — full source code, yours forever.
            </p>
            <div className="shrink-0 w-40 sm:w-48">
              <GoogleSignInButton label="Get started free" />
            </div>
            <button
              onClick={() => {
                setShow(false);
                sessionStorage.setItem(DISMISSED_KEY, "1");
              }}
              className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
