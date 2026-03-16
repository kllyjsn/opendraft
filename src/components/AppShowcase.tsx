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
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">
            Crafted with precision
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.05]">
            Apps that look like
            <span className="text-gradient"> a million bucks.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mt-3">
            Every product in our catalog is designed, tested, and polished to professional standards. Not templates — finished software.
          </p>
        </motion.div>

        {/* Masonry-style showcase grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              className={`group relative rounded-xl overflow-hidden border border-border/30 bg-card shadow-card hover:shadow-card-hover transition-shadow cursor-pointer ${
                i === 0 || i === 4 ? "md:row-span-2" : ""
              }`}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    i === 0 || i === 4 ? "h-[280px] md:h-[420px]" : "h-[160px] md:h-[200px]"
                  }`}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="inline-block rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary-foreground uppercase tracking-wider mb-1">
                    {item.cat}
                  </span>
                  <p className="text-sm font-bold text-primary-foreground">{item.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
