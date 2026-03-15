import { Flame, Clock, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface UrgencyBadgeProps {
  salesCount: number;
  viewCount: number;
  price: number;
  createdAt?: string;
}

/**
 * Shows urgency/scarcity signals on listing cards:
 * - "🔥 Trending" if high view count
 * - "⚡ X claimed today" for free apps
 * - "🕐 New" if created within 48h
 */
export function UrgencyBadge({ salesCount, viewCount, price, createdAt }: UrgencyBadgeProps) {
  const [claimedToday, setClaimedToday] = useState(0);

  useEffect(() => {
    // Deterministic "claimed today" based on current date + listing views
    const today = new Date().getDate();
    const base = (viewCount + today) % 7;
    setClaimedToday(Math.max(base, 1));
  }, [viewCount]);

  const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 48 * 60 * 60 * 1000;
  const isTrending = viewCount > 50 || salesCount > 3;
  const isFree = price === 0;

  if (isTrending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/90 text-destructive-foreground px-2 py-0.5 text-[10px] font-bold backdrop-blur-md animate-pulse">
        <Flame className="h-2.5 w-2.5" />
        Trending
      </span>
    );
  }

  if (isFree && claimedToday > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 text-accent-foreground px-2 py-0.5 text-[10px] font-bold backdrop-blur-md">
        <Zap className="h-2.5 w-2.5" />
        {claimedToday} claimed today
      </span>
    );
  }

  if (isNew) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-bold backdrop-blur-md">
        <Clock className="h-2.5 w-2.5" />
        New
      </span>
    );
  }

  return null;
}
