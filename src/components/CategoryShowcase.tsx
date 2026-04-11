import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, LayoutDashboard, Globe, Gamepad2, Wrench, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";
import { api } from "@/lib/api";

const categories = [
  { icon: Bot, label: "AI Apps", slug: "ai_app", urlSlug: "ai-app" },
  { icon: LayoutDashboard, label: "SaaS Tools", slug: "saas_tool", urlSlug: "saas-tool" },
  { icon: Globe, label: "Landing Pages", slug: "landing_page", urlSlug: "landing-page" },
  { icon: Wrench, label: "Utilities", slug: "utility", urlSlug: "utility" },
  { icon: Gamepad2, label: "Games", slug: "game", urlSlug: "game" },
  { icon: Sparkles, label: "Other", slug: "other", urlSlug: "other" },
];

interface CategoryListing {
  id: string;
  title: string;
  description: string;
  screenshots: string[];
  price: number;
  tech_stack: string[];
  completeness_badge: "prototype" | "mvp" | "production_ready";
  sales_count: number;
  view_count: number;
  built_with: string | null;
  seller_id: string;
  security_score: number | null;
}

interface CategoryData {
  slug: string;
  listings: CategoryListing[];
  total: number;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function CategoryShowcase() {
  const [data, setData] = useState<CategoryData[]>([]);

  useEffect(() => {
    async function load() {
      // Parallel queries instead of sequential for-loop
      const promises = categories.map((cat) =>
        api.from("listings")
          .select("id,title,description,screenshots,price,tech_stack,completeness_badge,sales_count,view_count,built_with,seller_id,security_score", { count: "exact" })
          .eq("status", "live")
          .eq("category", cat.slug as any)
          .order("sales_count", { ascending: false })
          .limit(6)
          .then(({ data: listings, count }) => ({
            slug: cat.slug,
            listings: (listings ?? []) as CategoryListing[],
            total: count ?? (listings?.length ?? 0),
          }))
      );

      const results = await Promise.all(promises);
      setData(results.filter((r) => r.listings.length > 0));
    }
    load();
  }, []);

  if (data.length === 0) return null;

  return (
    <section className="pb-8 pt-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Browse by category</h2>
        </div>

        <div className="space-y-8">
          {data.map((catData, catIndex) => {
            const catMeta = categories.find((c) => c.slug === catData.slug);
            if (!catMeta) return null;
            const Icon = catMeta.icon;

            return (
              <motion.div
                key={catData.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: catIndex * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg gradient-hero flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold">{catMeta.label}</h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      {catData.total} {catData.total === 1 ? "app" : "apps"}
                    </span>
                  </div>
                  <Link
                    to={`/category/${catMeta.urlSlug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {catData.listings.map((listing, i) => (
                    <motion.div
                      key={listing.id}
                      custom={i}
                      variants={cardVariant}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="flex-shrink-0 w-[170px] md:w-[220px]"
                    >
                      <ListingCard {...listing} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
