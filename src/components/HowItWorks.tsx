import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GitFork, Code, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: GitFork,
    number: "01",
    title: "Fork the Code",
    description: "Find an AI-built app you like and buy the fork. You get the full source code — yours to own, modify, and deploy forever.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Code,
    number: "02",
    title: "Ship on Day One",
    description: "Deploy to Vercel, Netlify, or your own infra. No lock-in, no proprietary runtime. It's a standard React + Supabase stack.",
    gradient: "from-accent to-secondary",
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "Subscribe for Updates",
    description: "Optionally subscribe to maintenance. Your builder ships new features, bug fixes, and improvements — merged directly into your fork.",
    gradient: "from-secondary to-primary",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">How it works</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.05]">
            Fork it. Ship it.
            <br className="hidden md:block" />
            <span className="text-gradient"> We keep building.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="relative rounded-2xl glass p-7 hover:shadow-glow transition-shadow group cursor-default"
              >
                {/* Top gradient line */}
                <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${step.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-xl gradient-hero flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest">{step.number}</span>
                </div>
                <h3 className="font-bold text-lg mb-2.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Connector arrow (visible on desktop between cards) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="h-6 w-6 rounded-full glass flex items-center justify-center text-muted-foreground/40">
                      →
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/faq"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Learn more about forks & maintenance →
          </Link>
        </div>
      </div>
    </section>
  );
}
