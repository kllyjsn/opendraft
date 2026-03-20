import { motion } from "framer-motion";
import { Shield, Code, Users, Zap } from "lucide-react";

const proofs = [
  { icon: Code, text: "You own the code" },
  { icon: Users, text: "No per-seat fees" },
  { icon: Zap, text: "Live in 90 seconds" },
  { icon: Shield, text: "Enterprise-grade" },
];

export function SocialProofBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] md:text-xs text-muted-foreground/60"
    >
      {proofs.map((p) => (
        <span key={p.text} className="flex items-center gap-1.5">
          <p.icon className="h-3 w-3 text-primary/50" />
          {p.text}
        </span>
      ))}
    </motion.div>
  );
}
