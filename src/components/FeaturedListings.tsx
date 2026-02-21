import { useEffect, useState } from "react";
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
    <section className="container mx-auto px-4 pb-10">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Trending</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {listings.map((l) => (
          <ListingCard key={l.id} {...l} />
        ))}
      </div>
    </section>
  );
}
