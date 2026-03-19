import { motion } from "framer-motion";
import { Code2, Zap, Shield, DollarSign, Rocket, Layers } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Paste. Build. Live.",
    description: "Enter a URL. Get a production app — deployed to your domain in 90 seconds flat.",
  },
  {
    icon: Code2,
    title: "Own every line.",
    description: "Full source. No lock-in. Fork it, extend it, sell it. It's yours.",
  },
  {
    icon: DollarSign,
    title: "Kill the per-seat tax.",
    description: "One price. Unlimited users. Stop paying more as your team grows.",
  },
  {
    icon: Shield,
    title: "Audited before you ship.",
    description: "Automated vulnerability scans on every deploy. Security isn't optional.",
  },
  {
    icon: Layers,
    title: "Built for what's next.",
    description: "TypeScript, React, Tailwind. Agent-ready APIs from day one.",
  },
  {
    icon: Rocket,
    title: "Gets better while you sleep.",
    description: "AI agents monitor, optimize, and ship improvements — your app evolves on autopilot.",
  },
];

export function ValueProps() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary/80 mb-4">
            The ownership advantage
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-[2.75rem] font-black tracking-[-0.03em] leading-[1.1]">
            Better software.
            <br />
            <span className="text-muted-foreground">Better margins.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-background p-8 md:p-10 group hover:bg-card/50 transition-colors duration-500"
              >
                <div className="mb-5">
                  <div className="h-10 w-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                    <Icon className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                  </div>
                </div>
                <h3 className="text-[15px] font-bold tracking-[-0.01em] mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </section>
  );
}
