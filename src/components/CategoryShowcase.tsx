import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, LayoutDashboard, Globe, Gamepad2, Wrench, Sparkles } from "lucide-react";

const categories = [
  { icon: Bot, label: "AI Apps", slug: "ai_app", color: "from-violet-500/20 to-purple-500/20" },
  { icon: LayoutDashboard, label: "SaaS Tools", slug: "saas_tool", color: "from-blue-500/20 to-cyan-500/20" },
  { icon: Globe, label: "Landing Pages", slug: "landing_page", color: "from-emerald-500/20 to-teal-500/20" },
  { icon: Gamepad2, label: "Games", slug: "game", color: "from-pink-500/20 to-rose-500/20" },
  { icon: Wrench, label: "Utilities", slug: "utility", color: "from-amber-500/20 to-orange-500/20" },
  { icon: Sparkles, label: "Other", slug: "other", color: "from-fuchsia-500/20 to-pink-500/20" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function CategoryShowcase() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Explore by category</p>
        <h2 className="text-2xl md:text-4xl font-black tracking-tighter">
          What are you looking for?
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.slug}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl glass p-5 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-foreground/80" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {cat.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
