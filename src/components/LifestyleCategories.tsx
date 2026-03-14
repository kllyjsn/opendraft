import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import homeKitchenImg from "@/assets/category-home-kitchen.jpg";
import healthFitnessImg from "@/assets/category-health-fitness.jpg";
import personalFinanceImg from "@/assets/category-personal-finance.jpg";
import productivityImg from "@/assets/category-productivity.jpg";
import builtForAgentsImg from "@/assets/category-built-for-agents.jpg";

const LIFESTYLE_CATEGORIES = [
  {
    slug: "home-kitchen",
    label: "Home & Kitchen",
    tagline: "Cook smarter. Live better.",
    image: homeKitchenImg,
  },
  {
    slug: "health-fitness",
    label: "Health & Fitness",
    tagline: "Your wellness, automated.",
    image: healthFitnessImg,
  },
  {
    slug: "personal-finance",
    label: "Personal Finance",
    tagline: "Master your money.",
    image: personalFinanceImg,
  },
  {
    slug: "productivity",
    label: "Productivity & Work",
    tagline: "Do more. Stress less.",
    image: productivityImg,
  },
  {
    slug: "built-for-agents",
    label: "Built for Agents",
    tagline: "Software agents want to buy.",
    image: builtForAgentsImg,
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function LifestyleCategories() {
  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Browse by lifestyle
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {LIFESTYLE_CATEGORIES.map((cat, i) => {
          const isLast = i === LIFESTYLE_CATEGORIES.length - 1;
          const isOddCount = LIFESTYLE_CATEGORIES.length % 2 === 1;

          return (
            <motion.div
              key={cat.slug}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className={isLast && isOddCount ? "col-span-2 lg:col-span-1" : ""}
            >
              <Link
                to={`/lifestyle/${cat.slug}`}
                className={`group relative block overflow-hidden rounded-2xl bg-muted ${
                  isLast && isOddCount ? "aspect-[8/3] md:aspect-[4/3]" : "aspect-[4/3]"
                }`}
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm md:text-base font-bold text-white mb-0.5 leading-tight">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] md:text-xs text-white/70 font-medium">
                    {cat.tagline}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-white/90 group-hover:text-white transition-colors">
                    Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
