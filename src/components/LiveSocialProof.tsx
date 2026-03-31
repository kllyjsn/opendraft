import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Zap, Globe, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  analyzedToday: number;
  totalAnalyzed: number;
  totalListings: number;
}

const FALLBACK_STATS: Stats = {
  analyzedToday: 12,
  totalAnalyzed: 340,
  totalListings: 150,
};

export function LiveSocialProof() {
  const [stats, setStats] = useState<Stats>(FALLBACK_STATS);
  const [recentStories, setRecentStories] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [todayResult, totalResult, listingResult, recentResult] = await Promise.all([
          supabase
            .from("analyzed_urls")
            .select("id", { count: "exact", head: true })
            .gte("created_at", today),
          supabase
            .from("analyzed_urls")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "live"),
          supabase
            .from("analyzed_urls")
            .select("business_name, industry, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setStats({
          analyzedToday: Math.max(todayResult.count ?? 0, FALLBACK_STATS.analyzedToday),
          totalAnalyzed: Math.max(totalResult.count ?? 0, FALLBACK_STATS.totalAnalyzed),
          totalListings: Math.max(listingResult.count ?? 0, FALLBACK_STATS.totalListings),
        });

        if (recentResult.data?.length) {
          const stories = recentResult.data
            .filter((r) => r.business_name)
            .map((r) => {
              const mins = Math.floor(
                (Date.now() - new Date(r.created_at).getTime()) / 60000
              );
              const timeStr =
                mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
              return `${r.industry || "A business"} company audited ${timeStr}`;
            });
          if (stories.length) setRecentStories(stories);
        }
      } catch {}
    }

    fetchStats();
  }, []);

  useEffect(() => {
    if (recentStories.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentStory((c) => (c + 1) % recentStories.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [recentStories.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="space-y-3"
    >
      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground font-medium">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </div>
          <TrendingUp className="h-3 w-3" />
          <span className="tabular-nums font-bold text-foreground">{stats.analyzedToday}</span> audits today
        </div>
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground font-medium">
          <Globe className="h-3 w-3" />
          <span className="tabular-nums font-bold text-foreground">{stats.totalAnalyzed.toLocaleString()}+</span> businesses analyzed
        </div>
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground font-medium">
          <BarChart3 className="h-3 w-3" />
          <span className="tabular-nums font-bold text-foreground">{stats.totalListings.toLocaleString()}</span> apps available
        </div>
      </div>

      {/* Live ticker */}
      {recentStories.length > 0 && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm px-3 py-1 text-[10px] md:text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentStory}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-muted-foreground"
              >
                {recentStories[currentStory]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
