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
    <section className="py-12 md:py-36 relative">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 md:mb-24"
        >
          <h2 className="text-2xl md:text-4xl font-bold tracking-[-0.02em] text-foreground">
            Why enterprises choose OpenDraft
          </h2>
        </motion.div>

        {propositions.map((prop, i) => (
          <motion.div
            key={prop.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 ${
              i < propositions.length - 1 ? "mb-16 md:mb-24" : ""
            }`}
          >
            <span className="text-xs font-mono tracking-widest text-muted-foreground shrink-0 md:w-14 md:text-right tabular-nums">
              {prop.number}
            </span>

            <div className="flex-1">
              <h3 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-[-0.02em] text-foreground mb-3 leading-[1.12]">
                {prop.headline}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg">
                {prop.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </section>
  );
}
