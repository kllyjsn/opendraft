import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "./ListingCard";
import { TrendingUp } from "lucide-react";

// Curated hero listings — hand-picked for visual impact & category variety
const CURATED_IDS = [
  "4006c20d-db35-4aee-97bc-80327929ec07", // Cook Better (SaaS)
  "76e09538-2529-48b7-8478-739bb6169e8f", // LinguaGPT (AI)
  "8ec98630-92fa-40e1-9f6f-c0d5ebda9e0e", // FinFlow (SaaS/Finance)
  "0a3cbc70-7af8-4992-9122-05be0ce7c01a", // Gemize (Landing Page)
];

interface FeaturedListing {
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
  seller_username?: string;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function FeaturedListings() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);

  useEffect(() => {
    async function load() {
      // Try curated picks first
      const { data: curated } = await supabase
        .from("listings")
        .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
        .in("id", CURATED_IDS)
        .eq("status", "live");

      let results = curated ?? [];

      // If curated list is incomplete, backfill with popular listings
      if (results.length < 4) {
        const excludeIds = results.map((l) => l.id);
        const { data: fallback } = await supabase
          .from("listings")
          .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
          .eq("status", "live")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .gt("view_count", 0)
          .order("sales_count", { ascending: false })
          .limit(4 - results.length);
        results = [...results, ...(fallback ?? [])];
      }

      // Preserve curated order
      results.sort((a, b) => {
        const ai = CURATED_IDS.indexOf(a.id);
        const bi = CURATED_IDS.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

      if (!results.length) return;

      const sellerIds = [...new Set(results.map((l) => l.seller_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, username")
        .in("user_id", sellerIds);
      const map = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));

      setListings(results.map((l) => ({ ...l, seller_username: map[l.seller_id] })) as FeaturedListing[]);
    }
    load();
  }, []);

  if (listings.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Trending</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {listings.map((l, i) => (
          <motion.div
            key={l.id}
            custom={i}
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <ListingCard {...l} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
