import { Link } from "react-router-dom";
import { MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export function MessageAlert() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const [dismissed, setDismissed] = useState(false);

  if (!user || unreadCount === 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-16 z-40 overflow-hidden"
      >
        <div className="bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <Link
              to="/messages"
              className="flex items-center gap-3 flex-1 min-w-0 group"
            >
              <div className="relative shrink-0">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                You have{" "}
                <span className="text-primary font-bold">
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                </span>
              </p>
              <span className="text-xs text-primary font-semibold group-hover:underline underline-offset-2 shrink-0">
                View →
              </span>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setDismissed(true);
              }}
              className="shrink-0 p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
