import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { ChatDrawer } from "@/components/ChatDrawer";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Builder {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_sales: number | null;
  followers_count: number | null;
  listing_count: number;
}

export default function Builders() {
  const { user } = useAuth();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ userId: string; username: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("public_profiles")
        .select("user_id, username, avatar_url, bio, total_sales, followers_count")
        .order("total_sales", { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike("username", `%${search}%`);
      }

      const { data: profiles } = await query;
      if (!profiles?.length) { setBuilders([]); setLoading(false); return; }

      // Get listing counts
      const userIds = profiles.map((p) => p.user_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("status", "live")
        .in("seller_id", userIds);

      const countMap: Record<string, number> = {};
      (listings ?? []).forEach((l) => { countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1; });

      setBuilders(profiles.map((p) => ({ ...p, listing_count: countMap[p.user_id] || 0 })));
      setLoading(false);
    }
    load();
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-10 flex-1 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Discover Builders</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse the community's top creators</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search builders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : builders.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No builders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builders.map((b) => (
              <div key={b.user_id} className="rounded-2xl border border-border/50 bg-card p-5 flex items-start gap-4 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                <Link to={`/builder/${b.user_id}`} className="shrink-0">
                  {b.avatar_url ? (
                    <img src={b.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
                      {(b.username?.[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/builder/${b.user_id}`} className="font-bold text-sm hover:text-primary transition-colors line-clamp-1">
                    {b.username || "Anonymous"}
                  </Link>
                  {b.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{b.bio}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{b.listing_count} projects</span>
                    <span>{b.total_sales ?? 0} sales</span>
                    <span>{b.followers_count ?? 0} followers</span>
                  </div>
                </div>
                {(!user || user.id !== b.user_id) && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <FollowButton targetUserId={b.user_id} />
                    {user && user.id !== b.user_id && <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setChatTarget({ userId: b.user_id, username: b.username || "Anonymous" });
                        setChatOpen(true);
                      }}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Message
                    </Button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ChatDrawer
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={null}
          recipientId={chatTarget?.userId}
          otherUsername={chatTarget?.username}
          otherUserId={chatTarget?.userId}
        />
      </main>
      <Footer />
    </div>
  );
}
