import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import screenshot1 from "@/assets/screenshots/saas-1.png";
import screenshot2 from "@/assets/screenshots/ai-1.png";
import screenshot3 from "@/assets/screenshots/saas-2.png";

const showcases = [
  {
    label: "Goldman Sachs",
    caption: "Client Onboarding Portal — KYC, compliance, milestone tracking. Built in 90 seconds.",
    image: screenshot1,
  },
  {
    label: "Mike's Bikes",
    caption: "Service Scheduler — online booking, calendar sync, automated reminders. One URL.",
    image: screenshot2,
  },
  {
    label: "Acme Corp",
    caption: "AI Lead Qualifier — score inbound leads and auto-route to sales. Deployed live.",
    image: screenshot3,
  },
];

export function AnalysisShowcase() {
  return (
    <section className="py-28 md:py-44 relative">
      <div className="container mx-auto px-4">
        {/* Section heading — editorial weight */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9 }}
          className="max-w-2xl mb-20 md:mb-32"
        >
          <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.3em] uppercase mb-5">
            fig. 03 — the work
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-[-0.04em] leading-[1.08]">
            One URL.
            <br />
            <span className="text-muted-foreground/60">Production app. Live.</span>
          </h2>
        </motion.div>

        {/* Gallery — generous spacing, gallery-print treatment */}
        <div className="space-y-20 md:space-y-36">
          {showcases.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              {/* Screenshot with browser chrome */}
              <div className="relative rounded-xl overflow-hidden border border-border/20 shadow-card group-hover:shadow-card-hover transition-shadow duration-700">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card/60 border-b border-border/20">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-foreground/8" />
                    <span className="h-2 w-2 rounded-full bg-foreground/8" />
                    <span className="h-2 w-2 rounded-full bg-foreground/8" />
                  </div>
                </div>
                <img
                  src={item.image}
                  alt={`${item.label} — built by OpenDraft`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>

              {/* Caption — restrained, specimen-like */}
              <div className="mt-5 md:mt-7">
                <p className="text-[10px] font-mono text-muted-foreground/25 tracking-[0.2em] uppercase mb-1.5">
                  {item.label}
                </p>
                <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-lg">
                  {item.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA — minimal, authoritative */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-24 md:mt-40 text-center"
        >
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-7 text-sm font-semibold rounded-lg transition-all duration-300 active:scale-[0.97]"
          >
            Try it with your site
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />
    </section>
  );
}
