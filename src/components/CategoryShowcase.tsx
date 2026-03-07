import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, LayoutDashboard, Globe, Gamepad2, Wrench, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  screenshots: string[];
  price: number;
  tech_stack: string[];
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
      // Fetch up to 6 listings per category with screenshots
      const results: CategoryData[] = [];

      for (const cat of categories) {
        const { data: listings, count } = await supabase
          .from("listings")
          .select("id,title,screenshots,price,tech_stack", { count: "exact" })
          .eq("status", "live")
          .eq("category", cat.slug as any)
          .order("sales_count", { ascending: false })
          .limit(6);

        if (listings && listings.length > 0) {
          results.push({
            slug: cat.slug,
            listings: listings as CategoryListing[],
            total: count ?? listings.length,
          });
        }
      }

      setData(results);
    }
    load();
  }, []);

  if (data.length === 0) return null;

  return (
    <section className="pb-8 pt-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Explore by category</p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter">
            What are you looking for?
          </h2>
        </div>

        <div className="space-y-10">
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
                {/* Category header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold">{catMeta.label}</h3>
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

                {/* Horizontal scrollable app row */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {catData.listings.map((listing, i) => {
                    const screenshot = listing.screenshots?.[0];
                    const hasImage = screenshot && screenshot !== "";

                    return (
                      <motion.div
                        key={listing.id}
                        custom={i}
                        variants={cardVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                      >
                        <Link
                          to={`/listing/${listing.id}`}
                          className="group flex-shrink-0 w-[140px] md:w-[170px] block"
                        >
                          {/* App icon / screenshot thumbnail */}
                          <div className="aspect-square rounded-2xl overflow-hidden mb-2 border border-border/40 bg-muted/30 group-hover:shadow-glow group-hover:border-primary/30 transition-all duration-300">
                            {hasImage ? (
                              <img
                                src={screenshot}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon className="h-10 w-10 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          {/* App name */}
                          <p className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {listing.title}
                          </p>
                          {/* Price */}
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(0)}`}
                          </p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
