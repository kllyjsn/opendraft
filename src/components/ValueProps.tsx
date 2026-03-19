import { motion } from "framer-motion";
import { Code2, Zap, Shield, DollarSign, Rocket, Layers } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "90-second deploys",
    description: "Paste a URL. Get a production app. Deployed to your own domain, instantly.",
  },
  {
    icon: Code2,
    title: "Own every line",
    description: "Full source code. No vendor lock-in. Fork, customize, and extend without limits.",
  },
  {
    icon: DollarSign,
    title: "Zero per-seat fees",
    description: "One price, unlimited users. Replace SaaS subscriptions that scale against you.",
  },
  {
    icon: Shield,
    title: "Security-first",
    description: "Automated vulnerability scans. Production-grade code audited before every deploy.",
  },
  {
    icon: Layers,
    title: "AI-native architecture",
    description: "Built with TypeScript, React, and Tailwind. Agent-ready APIs from day one.",
  },
  {
    icon: Rocket,
    title: "Continuous improvement",
    description: "AI agents monitor, optimize, and ship improvements — your app gets better on autopilot.",
  },
];

export function ValueProps() {
  return (
    <section className="py-20 md:py-32 relative">
      {/* Subtle divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Why OpenDraft
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-[2.75rem] font-black tracking-[-0.03em] leading-[1.1]">
            Software you own.
            <br />
            <span className="text-muted-foreground">Infrastructure you don't manage.</span>
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

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </section>
  );
}
