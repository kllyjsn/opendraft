import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FollowButton } from "@/components/FollowButton";
import { ListingCard } from "@/components/ListingCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useFollow } from "@/hooks/useFollow";
import { Calendar, Package, Users, Star } from "lucide-react";
import { BuilderStatsCard } from "@/components/BuilderStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { JsonLd } from "@/components/JsonLd";
import { CanonicalTag } from "@/components/CanonicalTag";

interface ProfileData {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_sales: number | null;
  created_at: string;
}

interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  category: string;
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  pricing_type: "one_time" | "monthly";
  demo_url: string | null;
  seller_id: string;
}

export default function BuilderProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { followersCount, followingCount } = useFollow(userId);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      const [profileRes, listingsRes] = await Promise.all([
        supabase
          .from("public_profiles")
          .select("user_id, username, avatar_url, bio, total_sales, created_at")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("listings")
          .select("id, title, description, price, completeness_badge, category, tech_stack, screenshots, sales_count, view_count, pricing_type, demo_url, seller_id")
          .eq("seller_id", userId)
          .eq("status", "live")
          .order("created_at", { ascending: false }),
      ]);

      setProfile(profileRes.data as ProfileData | null);
      setListings((listingsRes.data as ListingData[] | null) ?? []);
      setLoading(false);
    }

    load();
  }, [userId]);

  const initial = profile?.username?.[0]?.toUpperCase() ?? "?";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const personSchema = useMemo(() => {
    if (!profile) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.username ?? "Anonymous",
      url: `https://opendraft.co/builder/${profile.user_id}`,
      image: profile.avatar_url ?? undefined,
      description: profile.bio ?? `Builder on OpenDraft with ${profile.total_sales ?? 0} sales.`,
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.username ?? "Builder"} — OpenDraft`;
    return () => { document.title = "OpenDraft — Buy & Sell Vibe-Coded Projects"; };
  }, [profile]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {userId && <CanonicalTag path={`/builder/${userId}`} />}
      {personSchema && <JsonLd data={personSchema} />}

      <main className="flex-1 container mx-auto px-4 py-10 page-enter">
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-60 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : !profile ? (
          <div className="text-center py-28">
            <div className="text-5xl mb-5">🤷</div>
            <h2 className="text-2xl font-bold mb-2">Builder not found</h2>
            <p className="text-muted-foreground">This profile doesn't exist.</p>
          </div>
        ) : (
          <>
            {/* Profile header + stats card */}
            <div className="flex flex-col lg:flex-row gap-8 mb-10">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <Avatar className="h-20 w-20 text-2xl">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username ?? ""} />}
                    <AvatarFallback className="gradient-hero text-white text-2xl font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h1 className="text-2xl font-black">{profile.username ?? "Anonymous"}</h1>
                      {user && userId && <FollowButton targetUserId={userId} />}
                    </div>
                    {profile.bio && (
                      <p className="text-muted-foreground mb-3 max-w-lg">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <strong className="text-foreground">{followersCount}</strong> followers
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <strong className="text-foreground">{followingCount}</strong> following
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        <strong className="text-foreground">{listings.length}</strong> listings
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Star className="h-4 w-4" />
                        <strong className="text-foreground">{profile.total_sales ?? 0}</strong> sales
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Joined {joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shareable stats card */}
              <div className="w-full lg:w-80 shrink-0">
                <BuilderStatsCard
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  bio={profile.bio}
                  followersCount={followersCount}
                  listingsCount={listings.length}
                  totalSales={profile.total_sales ?? 0}
                  userId={profile.user_id}
                />
              </div>
            </div>

            {/* Listings gallery */}
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              {listings.length > 0 ? `${listings.length} live listings` : "No listings yet"}
            </h2>

            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center text-muted-foreground">
                This builder hasn't published any listings yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((l) => (
                  <ListingCard key={l.id} {...l} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
