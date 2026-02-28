import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, LayoutDashboard, Globe, Gamepad2, Wrench, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("listings")
      .select("category", { count: "exact", head: false })
      .eq("status", "live")
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((row: any) => {
          map[row.category] = (map[row.category] || 0) + 1;
        });
        setCounts(map);
      });
  }, []);

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
          const hasListings = (counts[cat.slug] ?? 0) > 0;
          const content = (
            <div className={`flex flex-col items-center gap-3 rounded-2xl glass p-5 transition-all duration-300 ${
              hasListings
                ? "group hover:shadow-glow hover:-translate-y-1 cursor-pointer"
                : "opacity-40 cursor-default"
            }`}>
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center ${hasListings ? "group-hover:scale-110" : ""} transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-foreground/80" />
              </div>
              <span className={`text-xs font-semibold transition-colors ${
                hasListings
                  ? "text-muted-foreground group-hover:text-foreground"
                  : "text-muted-foreground"
              }`}>
                {cat.label}
              </span>
            </div>
          );

          return (
            <motion.div
              key={cat.slug}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {hasListings ? (
                <Link to={`/category/${cat.slug}`}>{content}</Link>
              ) : (
                content
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
