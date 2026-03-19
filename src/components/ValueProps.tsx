import { motion } from "framer-motion";

const propositions = [
  {
    number: "01",
    headline: "You own every line.",
    body: "Full source code. No vendor lock-in. You control it, extend it, and take it with you — wherever your career goes.",
  },
  {
    number: "02",
    headline: "Kill the per-seat tax.",
    body: "One price. Unlimited users. Show leadership how you saved $50k/year and watch what happens next.",
  },
  {
    number: "03",
    headline: "Ship before standup.",
    body: "Paste a URL. Get a production app. Deploy it live. Your team thinks you spent months on it.",
  },
  {
    number: "04",
    headline: "It improves itself.",
    body: "AI agents optimize and maintain your apps 24/7. You get the credit. They do the work.",
  },
];

export function ValueProps() {
  return (
    <section className="py-24 md:py-40 relative">
      <div className="container mx-auto px-4 max-w-4xl">
        {propositions.map((prop, i) => (
          <motion.div
            key={prop.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col md:flex-row md:items-baseline gap-4 md:gap-10 ${
              i < propositions.length - 1 ? "mb-16 md:mb-24" : ""
            }`}
          >
            {/* Number — whisper scale */}
            <span className="text-xs font-mono text-primary/40 tracking-widest shrink-0 md:w-12 md:text-right">
              {prop.number}
            </span>

            <div className="flex-1">
              <h3 className="text-xl md:text-3xl lg:text-4xl font-black tracking-[-0.03em] text-foreground mb-3 leading-[1.15]">
                {prop.headline}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg">
                {prop.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
    </section>
  );
}
