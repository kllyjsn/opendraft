import { motion } from "framer-motion";
import { Shield, Code, Zap, TrendingUp } from "lucide-react";

const proofs = [
  { icon: TrendingUp, text: "340+ businesses analyzed" },
  { icon: Code, text: "You own the code" },
  { icon: Zap, text: "Ready in 90 sec" },
  { icon: Shield, text: "Free forever plan" },
];

export function SocialProofBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-x-5 md:gap-x-8 gap-y-2 text-[10px] md:text-xs tracking-wide text-muted-foreground font-medium"
    >
      {proofs.map((p, i) => (
        <motion.span
          key={p.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.08 }}
          className="flex items-center gap-1.5"
        >
          <p.icon className="h-3 w-3" />
          {p.text}
        </motion.span>
      ))}
    </motion.div>
  );
}
