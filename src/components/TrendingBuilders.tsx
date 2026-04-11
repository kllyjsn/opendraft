import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

interface TrendingBuilder {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_sales: number | null;
  listing_count: number;
}

const itemVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function TrendingBuilders() {
  const [builders, setBuilders] = useState<TrendingBuilder[]>([]);

  useEffect(() => {
    async function load() {
      const { data: profiles } = await api.from("public_profiles")
        .select("user_id, username, avatar_url, total_sales")
        .order("total_sales", { ascending: false })
        .limit(8);

      if (!profiles?.length) return;

      const userIds = profiles.map((p) => p.user_id);
      const { data: listings } = await api.from("listings")
        .select("seller_id")
        .eq("status", "live")
        .in("seller_id", userIds);

      const countMap: Record<string, number> = {};
      (listings ?? []).forEach((l) => { countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1; });

      const withListings = profiles
        .map((p) => ({ ...p, listing_count: countMap[p.user_id] || 0 }))
        .filter((p) => p.listing_count > 0);

      setBuilders(withListings);
    }
    load();
  }, []);

  if (builders.length < 2) return null;

  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-7">
          <div className="h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Top Builders
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-8">
          {builders.map((b, i) => (
            <motion.div
              key={b.user_id}
              custom={i}
              variants={itemVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link
                to={`/builder/${b.user_id}`}
                className="flex-shrink-0 w-28 md:w-auto flex flex-col items-center gap-2.5 rounded-2xl glass p-4 hover:shadow-glow hover:border-primary/30 transition-all group"
              >
                {b.avatar_url ? (
                  <img src={b.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-border/30 group-hover:ring-primary/40 group-hover:scale-110 transition-all duration-300" />
                ) : (
                  <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm ring-2 ring-border/30 group-hover:ring-primary/40 group-hover:scale-110 transition-all duration-300">
                    {(b.username?.[0] ?? "U").toUpperCase()}
                  </div>
                )}
                <div className="text-center min-w-0 w-full">
                  <p className="font-semibold text-xs truncate">{b.username || "Anonymous"}</p>
                  <p className="text-[10px] text-muted-foreground">{b.listing_count} projects</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
