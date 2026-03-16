import { motion } from "framer-motion";
import { Code2, Palette, Shield, Gauge } from "lucide-react";

const pillars = [
  { icon: Palette, label: "Design-first", desc: "Every pixel intentional" },
  { icon: Code2, label: "Production code", desc: "TypeScript + React + Tailwind" },
  { icon: Shield, label: "Security audited", desc: "Automated vulnerability scans" },
  { icon: Gauge, label: "Performance tuned", desc: "Sub-second load times" },
];

export function ExpertiseBar() {
  return (
    <section className="py-10 border-y border-border/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <p.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{p.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
