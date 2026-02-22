import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "./ListingCard";
import { TrendingUp } from "lucide-react";

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
      const { data } = await supabase
        .from("listings")
        .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id")
        .eq("status", "live")
        .order("sales_count", { ascending: false })
        .limit(4);

      if (!data?.length) return;

      const sellerIds = [...new Set(data.map((l) => l.seller_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", sellerIds);
      const map = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));

      setListings(data.map((l) => ({ ...l, seller_username: map[l.seller_id] })) as FeaturedListing[]);
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
