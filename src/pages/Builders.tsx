import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { ChatDrawer } from "@/components/ChatDrawer";
import { BrandMascot } from "@/components/BrandMascot";

import { useAuth } from "@/hooks/useAuth";
import { Search, Users, MessageCircle, ArrowRight, Sparkles, TrendingUp, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Builder {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_sales: number | null;
  followers_count: number | null;
  listing_count: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Builders() {
  const { user } = useAuth();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ userId: string; username: string } | null>(null);
  const [totalListings, setTotalListings] = useState(0);

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

      const userIds = profiles.map((p) => p.user_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("status", "live")
        .in("seller_id", userIds);

      const countMap: Record<string, number> = {};
      let total = 0;
      (listings ?? []).forEach((l) => {
        countMap[l.seller_id] = (countMap[l.seller_id] || 0) + 1;
        total++;
      });

      setTotalListings(total);
      // Only show users who have at least one live listing
      setBuilders(
        profiles
          .map((p) => ({ ...p, listing_count: countMap[p.user_id] || 0 }))
          .filter((p) => p.listing_count > 0)
      );
      setLoading(false);
    }
    load();
  }, [search]);

  const topBuilders = builders.filter((b) => b.listing_count > 0).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-4">
              <BrandMascot size={72} variant="wave" />
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
              <Users className="h-3.5 w-3.5" />
              Community Directory
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2} className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-[0.95]">
              Find your next
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                builder
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground max-w-lg mx-auto mb-8 text-sm md:text-base leading-relaxed">
              Browse top creators shipping production-ready apps. Follow builders, discover projects, and fork their code to launch your own.
            </motion.p>

            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/sell">
                <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
                  <Sparkles className="h-4 w-4" /> Start selling
                </Button>
              </Link>
              <Link to="/#browse">
                <Button size="lg" variant="outline" className="gap-2 border-border/60">
                  <Package className="h-4 w-4" /> Browse apps
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Highlighted top builders */}
      {topBuilders.length > 0 && (
        <section className="container mx-auto px-4 -mt-8 relative z-20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topBuilders.map((b, i) => (
              <motion.div
                key={b.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Link
                  to={`/builder/${b.user_id}`}
                  className="block rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 hover:shadow-glow hover:border-primary/40 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {i === 0 && (
                      <div className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-glow">
                        #1
                      </div>
                    )}
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all" />
                    ) : (
                      <div className="h-11 w-11 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
                        {(b.username?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{b.username || "Anonymous"}</p>
                      {b.bio && <p className="text-[11px] text-muted-foreground truncate">{b.bio}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />{b.total_sales ?? 0} sales</span>
                    <span>{b.listing_count} projects</span>
                    <span>{b.followers_count ?? 0} followers</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <main className="container mx-auto px-4 pb-10 flex-1">
        {/* Search + stats bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight">All Builders</h2>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
              {builders.length} creators · {totalListings} projects
            </span>
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
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : builders.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No builders found</p>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0 gap-2">
                <Sparkles className="h-4 w-4" /> Be the first — list your app
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builders.map((b, i) => (
              <motion.div
                key={b.user_id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="rounded-2xl border border-border/50 bg-card p-5 flex items-start gap-4 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
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
                      {user && user.id !== b.user_id && (
                        <Button
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
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Inline CTA card */}
            {builders.length >= 3 && (
              <motion.div
                custom={builders.length}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
                  <Sparkles className="h-6 w-6 text-primary mb-2" />
                  <p className="font-bold text-sm mb-1">Got an app to sell?</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    List your project and join {builders.length}+ creators earning on OpenDraft.
                  </p>
                  <Link to="/sell">
                    <Button size="sm" className="gradient-hero text-white border-0 gap-1.5 shadow-glow">
                      Start selling <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>


      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={null}
        recipientId={chatTarget?.userId}
        otherUsername={chatTarget?.username}
        otherUserId={chatTarget?.userId}
      />
      <Footer />
    </div>
  );
}
