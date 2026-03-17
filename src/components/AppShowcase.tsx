import { motion } from "framer-motion";
import saas1 from "@/assets/screenshots/saas-1.png";
import saas2 from "@/assets/screenshots/saas-2.png";
import saas3 from "@/assets/screenshots/saas-3.png";
import ai1 from "@/assets/screenshots/ai-1.png";
import ai2 from "@/assets/screenshots/ai-2.png";
import ai3 from "@/assets/screenshots/ai-3.png";
import landing1 from "@/assets/screenshots/landing-1.png";
import utility1 from "@/assets/screenshots/utility-1.png";
import game1 from "@/assets/screenshots/game-1.png";

const showcaseItems = [
  { src: saas1, label: "Analytics Dashboard", cat: "SaaS" },
  { src: ai1, label: "AI Assistant", cat: "AI" },
  { src: landing1, label: "Brand Landing Page", cat: "Marketing" },
  { src: saas2, label: "CRM Platform", cat: "SaaS" },
  { src: ai2, label: "Content Studio", cat: "AI" },
  { src: utility1, label: "Dev Toolkit", cat: "Utility" },
  { src: saas3, label: "Billing Portal", cat: "SaaS" },
  { src: ai3, label: "Vision App", cat: "AI" },
  { src: game1, label: "Interactive Game", cat: "Game" },
];

export function AppShowcase() {
  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[1000px] rounded-full bg-primary/5 blur-[200px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-4">
            Crafted with precision
          </p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-[-0.03em] leading-[1]">
            Apps that look like
            <span className="text-gradient"> a million bucks.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mt-4">
            Every product is designed, tested, and polished to professional standards. Not templates — finished software.
          </p>
        </motion.div>

        {/* Showcase grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-5xl mx-auto">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
              className={`group relative rounded-xl overflow-hidden border border-border/40 bg-card cursor-pointer transition-all duration-500 hover:border-primary/20 hover:shadow-card-hover ${
                i === 0 || i === 4 ? "md:row-span-2" : ""
              }`}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className={`w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${
                    i === 0 || i === 4 ? "h-[280px] md:h-[420px]" : "h-[160px] md:h-[200px]"
                  }`}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="inline-block rounded-md bg-primary/20 backdrop-blur-xl border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider mb-1">
                    {item.cat}
                  </span>
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
