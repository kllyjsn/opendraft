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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="max-w-lg mx-auto"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium mb-4">
        What people are building
      </p>
      <div className="space-y-2.5">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.site}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm px-4 py-2.5 text-xs"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground truncate">{ex.site}</span>
            <ArrowRight className="h-3 w-3 text-primary/60 shrink-0" />
            <Layout className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground font-medium truncate">{ex.app}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
