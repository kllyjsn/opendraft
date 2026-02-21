import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

interface TrendingBuilder {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_sales: number | null;
  listing_count: number;
}

export function TrendingBuilders() {
  const [builders, setBuilders] = useState<TrendingBuilder[]>([]);

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, total_sales")
        .order("total_sales", { ascending: false })
        .limit(8);

      if (!profiles?.length) return;

      const userIds = profiles.map((p) => p.user_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("status", "live")
        .in("seller_id", userIds);

      const countMap: Record<string, number> = {};
      (listings ?? []).forEach((l) => { countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1; });

      // Only show builders with at least 1 listing
      const withListings = profiles
        .map((p) => ({ ...p, listing_count: countMap[p.user_id] || 0 }))
        .filter((p) => p.listing_count > 0);

      setBuilders(withListings);
    }
    load();
  }, []);

  if (builders.length < 2) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Top Builders
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-8">
          {builders.map((b) => (
            <Link
              key={b.user_id}
              to={`/builder/${b.user_id}`}
              className="flex-shrink-0 w-28 md:w-auto flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card p-4 hover:shadow-card hover:border-primary/30 transition-all group"
            >
              {b.avatar_url ? (
                <img src={b.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
                  {(b.username?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <div className="text-center min-w-0 w-full">
                <p className="font-semibold text-xs truncate">{b.username || "Anonymous"}</p>
                <p className="text-[10px] text-muted-foreground">{b.listing_count} projects</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
