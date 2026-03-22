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
      transition={{ duration: 1.2, delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-8 gap-y-1 md:gap-y-2 text-[9px] md:text-[10px] tracking-[0.08em] uppercase text-muted-foreground/40 font-medium"
    >
      {proofs.map((p, i) => (
        <motion.span
          key={p.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.08 }}
          className="flex items-center gap-1"
        >
          <p.icon className="h-2.5 md:h-3 w-2.5 md:w-3" />
          {p.text}
        </motion.span>
      ))}
    </motion.div>
  );
}
