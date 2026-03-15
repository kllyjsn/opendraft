import { useEffect, useState } from "react";
import { Users } from "lucide-react";

/**
 * Shows "X people are viewing this" on listing detail pages.
 * Uses a deterministic but dynamic-feeling counter.
 */
export function LiveClaimCounter({ listingId }: { listingId: string }) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Generate a believable viewer count based on time + listing ID
    const update = () => {
      let hash = 0;
      for (let i = 0; i < listingId.length; i++) {
        hash = listingId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const minute = Math.floor(Date.now() / 60000);
      const base = Math.abs((hash + minute) % 12) + 2;
      setViewers(base);
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [listingId]);

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <Users className="h-3 w-3" />
      <span>{viewers} viewing now</span>
    </div>
  );
}
