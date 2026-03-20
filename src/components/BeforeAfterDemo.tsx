import { motion } from "framer-motion";
import { ArrowRight, Globe, Layout } from "lucide-react";

const examples = [
  { site: "acmeplumbing.com", app: "Customer Portal + Scheduling" },
  { site: "modernlaw.co", app: "Client Intake + Case Tracker" },
  { site: "peakfitness.com", app: "Member Dashboard + Booking" },
];

export function BeforeAfterDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="max-w-lg mx-auto"
    >
      <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/30 mb-5">
        fig. 02 — transformations
      </p>
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.site}
            initial={{ opacity: 0, x: -8, filter: "blur(3px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/20 px-4 py-3 text-xs group hover:border-border/50 transition-colors duration-500"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            <span className="text-muted-foreground/60 truncate font-mono text-[11px]">{ex.site}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/20 shrink-0 group-hover:text-primary/40 transition-colors duration-500" />
            <Layout className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span className="text-foreground/80 font-medium truncate">{ex.app}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
