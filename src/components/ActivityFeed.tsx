import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  title: string;
  price: number;
  created_at: string;
  seller_id: string;
  completeness_badge: string;
  category: string;
  seller_username?: string;
  seller_avatar?: string;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadFeed() {
      setLoading(true);

      // Get who the user follows
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);

      const followingIds = (follows ?? []).map((f) => f.following_id);

      if (followingIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Get recent listings from followed users
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, created_at, seller_id, completeness_badge, category")
        .in("seller_id", followingIds)
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!listings || listings.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch seller profiles
      const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", sellerIds);

      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      setItems(
        listings.map((l) => ({
          ...l,
          seller_username: profileMap[l.seller_id]?.username ?? "Anonymous",
          seller_avatar: profileMap[l.seller_id]?.avatar_url ?? undefined,
        }))
      );
      setLoading(false);
    }

    loadFeed();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <Rss className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold mb-1">Your feed is empty</h3>
        <p className="text-sm text-muted-foreground">
          Follow builders to see their latest listings here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/listing/${item.id}`}
          className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors group"
        >
          <Avatar className="h-9 w-9 shrink-0">
            {item.seller_avatar && <AvatarImage src={item.seller_avatar} />}
            <AvatarFallback className="text-xs font-bold bg-muted">
              {item.seller_username?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link
                to={`/builder/${item.seller_id}`}
                className="font-semibold hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {item.seller_username}
              </Link>{" "}
              <span className="text-muted-foreground">listed a new project</span>
            </p>
            <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
              {item.title}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-sm">${(item.price / 100).toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
