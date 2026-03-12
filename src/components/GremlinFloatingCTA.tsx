import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { BrandMascot } from "@/components/BrandMascot";

interface Props {
  pendingCount?: number;
  score?: number;
  onClick: () => void;
}

export function GremlinFloatingCTA({ pendingCount = 0, score, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl bg-card border border-border/60 shadow-lg hover:shadow-xl px-3 py-2.5 transition-shadow group"
      aria-label="Open Gremlins improvement panel"
    >
      <div className="relative">
        <BrandMascot size={36} variant="wave" />
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center shadow-sm"
          >
            {pendingCount}
          </motion.span>
        )}
      </div>
      <div className="hidden sm:block text-left">
        <p className="text-xs font-bold leading-tight">Improve with Gremlins™</p>
        {score !== undefined ? (
          <p className="text-[10px] text-muted-foreground">Score: {score}/100</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">AI-powered suggestions</p>
        )}
      </div>
      <Sparkles className="h-3.5 w-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity hidden sm:block" />

      {/* Pulse ring */}
      {pendingCount > 0 && (
        <span className="absolute inset-0 rounded-2xl border-2 border-accent animate-ping opacity-20 pointer-events-none" />
      )}
    </motion.button>
  );
}
