import { motion } from "framer-motion";
import { ArrowRight, Globe, Layout } from "lucide-react";

const examples = [
  { site: "novasynth.ai", app: "Usage Dashboard + Billing Portal" },
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
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-5">
        Transformations
      </p>
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.site}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-xs group hover:border-foreground/20 transition-colors duration-300"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate font-mono text-[11px]">{ex.site}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 group-hover:text-foreground/60 transition-colors" />
            <Layout className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
            <span className="text-foreground font-medium truncate">{ex.app}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
