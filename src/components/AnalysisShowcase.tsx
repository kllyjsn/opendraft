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
    <section className="py-24 md:py-40 relative">
      <div className="container mx-auto px-4">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mb-16 md:mb-24"
        >
          <p className="text-xs font-mono text-primary/60 tracking-widest uppercase mb-4">
            The work
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-[-0.04em] leading-[1.1]">
            One URL.
            <br />
            <span className="text-muted-foreground">Production app. Live.</span>
          </h2>
        </motion.div>

        {/* Gallery — oversized, gallery-print treatment */}
        <div className="space-y-16 md:space-y-28">
          {showcases.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              {/* Screenshot — framed with gallery reverence */}
              <div className="relative rounded-xl overflow-hidden border border-border/30 shadow-card group-hover:shadow-card-hover transition-shadow duration-700">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border-b border-border/30">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-foreground/10" />
                    <span className="h-2 w-2 rounded-full bg-foreground/10" />
                    <span className="h-2 w-2 rounded-full bg-foreground/10" />
                  </div>
                </div>
                <img
                  src={item.image}
                  alt={`${item.label} — built by OpenDraft`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>

              {/* Caption — editorial, understated */}
              <div className="flex items-baseline justify-between mt-4 md:mt-6 gap-4">
                <div>
                  <p className="text-xs font-mono text-primary/50 tracking-widest uppercase mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg">
                    {item.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 md:mt-32 text-center"
        >
          <Button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-sm font-bold rounded-xl transition-all duration-300"
          >
            Try it with your site
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
    </section>
  );
}
