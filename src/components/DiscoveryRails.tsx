import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "./ListingCard";
import { Flame, ShoppingBag } from "lucide-react";

interface RailListing {
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
  security_score?: number | null;
  agent_ready?: boolean;
  updated_at?: string;
}

const cardVariant = {
  hidden: { opacity: 0, x: 30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

async function enrichWithProfiles(listings: RailListing[]): Promise<RailListing[]> {
  if (!listings.length) return [];
  const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("user_id, username")
    .in("user_id", sellerIds);
  const map = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));
  return listings.map((l) => ({ ...l, seller_username: map[l.seller_id] }));
}

export function DiscoveryRails() {
  const [topShipped, setTopShipped] = useState<RailListing[]>([]);
  const [recentlySold, setRecentlySold] = useState<RailListing[]>([]);

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Top 10 shipped this month — newest live listings with screenshots
      const { data: shipped } = await supabase
        .from("listings")
        .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score,agent_ready,updated_at")
        .eq("status", "live")
        .gte("created_at", thirtyDaysAgo)
        .order("view_count", { ascending: false })
        .limit(10);

      if (shipped?.length) {
        const filtered = shipped.filter(
          (l) => l.screenshots?.length > 0 && l.screenshots[0] !== ""
        );
        setTopShipped(await enrichWithProfiles(filtered as RailListing[]));
      }

      // Recently sold — latest purchases joined with listing data
      const { data: purchases } = await supabase
        .from("purchases")
        .select("listing_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (purchases?.length) {
        const uniqueIds = [...new Set(purchases.map((p) => p.listing_id))].slice(0, 10);
        const { data: soldListings } = await supabase
          .from("listings")
          .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score,agent_ready,updated_at")
          .in("id", uniqueIds)
          .eq("status", "live");

        if (soldListings?.length) {
          // Preserve purchase recency order
          const listingMap = Object.fromEntries(soldListings.map((l) => [l.id, l]));
          const ordered = uniqueIds
            .map((id) => listingMap[id])
            .filter(Boolean) as RailListing[];
          setRecentlySold(await enrichWithProfiles(ordered));
        }
      }
    }
    load();
  }, []);

  return (
    <>
      {topShipped.length >= 3 && (
        <section className="container mx-auto px-4 pb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Top 10 shipped this month
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
            {topShipped.map((l, i) => (
              <motion.div
                key={l.id}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex-shrink-0 w-[200px] md:w-[240px] snap-start"
              >
                <ListingCard {...l} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {recentlySold.length >= 2 && (
        <section className="container mx-auto px-4 pb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Recently claimed
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
            {recentlySold.map((l, i) => (
              <motion.div
                key={l.id}
                custom={i}
                variants={cardVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex-shrink-0 w-[200px] md:w-[240px] snap-start"
              >
                <ListingCard {...l} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
