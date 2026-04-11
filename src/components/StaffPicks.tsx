import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListingCard } from "./ListingCard";
import { Award } from "lucide-react";
import { api } from "@/lib/api";

interface StaffPickListing {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: "one_time" | "monthly";
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  built_with: string | null;
  seller_id: string;
  security_score: number | null;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function StaffPicks() {
  const [listings, setListings] = useState<StaffPickListing[]>([]);

  useEffect(() => {
    async function load() {
      // Fetch staff picks that have real screenshots (no empty/SVG placeholders)
      const { data } = await api.from("listings")
        .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
        .eq("status", "live")
        .eq("staff_pick", true)
        .order("completeness_badge", { ascending: false })
        .order("sales_count", { ascending: false })
        .limit(12);

      // Filter to only listings with real PNG screenshots (not empty, not SVGs)
      const withScreenshots = (data ?? []).filter(
        (l) => l.screenshots?.[0] && l.screenshots[0] !== "" && !l.screenshots[0].endsWith(".svg")
      );

      if (withScreenshots.length >= 4) {
        setListings(withScreenshots.slice(0, 8) as StaffPickListing[]);
        return;
      }

      // Fallback: top listings with real screenshots
      const { data: fallback } = await api.from("listings")
        .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
        .eq("status", "live")
        .eq("completeness_badge", "production_ready" as any)
        .order("sales_count", { ascending: false })
        .limit(20);

      const filtered = (fallback ?? []).filter(
        (l) => l.screenshots?.[0] && l.screenshots[0] !== "" && !l.screenshots[0].endsWith(".svg")
      );
      setListings(filtered.slice(0, 8) as StaffPickListing[]);
    }
    load();
  }, []);

  if (listings.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
          <Award className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Staff Picks
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
        {listings.map((l, i) => (
          <motion.div
            key={l.id}
            custom={i}
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex-shrink-0 w-[170px] md:w-[220px] lg:w-auto"
          >
            <ListingCard {...l} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
