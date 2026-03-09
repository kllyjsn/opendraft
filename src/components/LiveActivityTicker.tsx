import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Eye, Users } from "lucide-react";

interface ActivityItem {
  id: string;
  icon: typeof ShoppingBag;
  text: string;
  time: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LiveActivityTicker() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function load() {
      // Fetch recent purchases (public-safe: just listing title + time)
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, created_at, listing_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!purchases?.length) return;

      const listingIds = [...new Set(purchases.map((p) => p.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      const titleMap = Object.fromEntries((listings ?? []).map((l) => [l.id, l.title]));

      const activities: ActivityItem[] = purchases.map((p) => ({
        id: p.id,
        icon: ShoppingBag,
        text: `Someone purchased "${titleMap[p.listing_id]?.slice(0, 30) ?? "an app"}${(titleMap[p.listing_id]?.length ?? 0) > 30 ? "…" : ""}"`,
        time: timeAgo(p.created_at),
      }));

      // Add some browsing activity flavor
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "live");

      if (count && count > 0) {
        activities.push({
          id: "live-count",
          icon: Eye,
          text: `${count.toLocaleString()} apps available right now`,
          time: "live",
        });
      }

      setItems(activities);
    }
    load();
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[current];
  const Icon = item.icon;

  return (
    <div className="flex items-center justify-center py-2">
      <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={item.id + current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <Icon className="h-3 w-3 text-primary" />
            <span>{item.text}</span>
            <span className="text-muted-foreground/50">· {item.time}</span>
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
