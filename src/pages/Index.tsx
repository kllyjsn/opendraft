import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, SlidersHorizontal, X, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FeaturedListings } from "@/components/FeaturedListings";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { HowItWorks } from "@/components/HowItWorks";
import { LiveActivityTicker } from "@/components/LiveActivityTicker";
import { LiveStatsBar } from "@/components/LiveStatsBar";
import { BrandMascot } from "@/components/BrandMascot";
import { MascotPeek } from "@/components/MascotPeek";
import { IndustryVerticals } from "@/components/IndustryVerticals";
import { JsonLd } from "@/components/JsonLd";
import { CanonicalTag } from "@/components/CanonicalTag";

const CATEGORIES = ["All", "SaaS Tool", "AI App", "Landing Page", "Utility", "Game", "Other"];
const COMPLETENESS = ["All", "Prototype", "MVP", "Production Ready"];
const SORT_OPTIONS = ["Newest", "Popular"];
const PAGE_SIZE = 24;

const categoryMap: Record<string, string> = {
  "SaaS Tool": "saas_tool",
  "AI App": "ai_app",
  "Landing Page": "landing_page",
  "Utility": "utility",
  "Game": "game",
  "Other": "other",
};
const completenessMap: Record<string, string> = {
  "Prototype": "prototype",
  "MVP": "mvp",
  "Production Ready": "production_ready",
};

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  built_with: string | null;
  seller_id: string;
  seller_username?: string;
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [completeness, setCompleteness] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [freeOnly, setFreeOnly] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");

  useEffect(() => {
    if (user || stickyDismissed) return;
    const onScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, stickyDismissed]);

  useEffect(() => {
    setPage(0);
    setListings([]);
    fetchListings(0, true);
  }, [search, category, completeness, sort, freeOnly]);

  useEffect(() => {
    if (!user) { setOwnedIds(new Set()); return; }
    supabase
      .from("purchases")
      .select("listing_id")
      .eq("buyer_id", user.id)
      .then(({ data }) => {
        setOwnedIds(new Set((data ?? []).map((p) => p.listing_id)));
      });
  }, [user]);

  const buildQuery = useCallback(() => {
    let query = supabase
      .from("listings")
      .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score", { count: "exact" })
      .eq("status", "live");
    if (category !== "All" && categoryMap[category]) query = query.eq("category", categoryMap[category] as any);
    if (completeness !== "All" && completenessMap[completeness]) query = query.eq("completeness_badge", completenessMap[completeness] as any);
    if (freeOnly) query = query.eq("price", 0);
    if (sort === "Newest") query = query.order("created_at", { ascending: false });
    else query = query.order("sales_count", { ascending: false });
    return query;
  }, [category, completeness, sort, freeOnly]);

  async function fetchListings(pageNum: number, reset: boolean = false) {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    const from = pageNum * PAGE_SIZE;
    let listingsData: Listing[] = [];
    let count: number = 0;

    if (search.trim()) {
      const { data, error } = await supabase.rpc("search_listings", {
        search_query: search.trim(),
        category_filter: category !== "All" && categoryMap[category] ? categoryMap[category] : null,
        completeness_filter: completeness !== "All" && completenessMap[completeness] ? completenessMap[completeness] : null,
        free_only: freeOnly,
        sort_by: sort === "Popular" ? "popular" : "relevance",
        page_offset: from,
        page_limit: PAGE_SIZE,
      });
      if (!error && data && data.length > 0) {
        count = (data[0] as any).total_count ?? data.length;
        listingsData = data as unknown as Listing[];
      }
    } else {
      const to = from + PAGE_SIZE - 1;
      const result = await buildQuery().range(from, to);
      listingsData = (result.data as Listing[]) ?? [];
      count = result.count ?? 0;
    }

    const sellerIds = [...new Set(listingsData.map((l) => l.seller_id))];
    let profileMap: Record<string, string> = {};
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, username").in("user_id", sellerIds);
      profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));
    }

    const enriched = listingsData
      .map((l) => ({ ...l, seller_username: profileMap[l.seller_id] }))
      .sort((a, b) => {
        const aHasImg = a.screenshots?.length > 0 && a.screenshots[0] !== "" ? 1 : 0;
        const bHasImg = b.screenshots?.length > 0 && b.screenshots[0] !== "" ? 1 : 0;
        return bHasImg - aHasImg;
      });

    if (reset) setListings(enriched);
    else setListings((prev) => [...prev, ...enriched]);
    setTotalCount(count);
    setLoading(false);
    setLoadingMore(false);
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, false);
  }

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    if (heroSearch.trim()) {
      setSearch(heroSearch.trim());
      document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const hasMore = listings.length < totalCount;
  const hasFilters = search || category !== "All" || completeness !== "All" || freeOnly;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── LIVE ACTIVITY TICKER ── */}
      <LiveActivityTicker />

      {/* ── COMPACT HERO ── */}
      <section className="relative overflow-hidden pt-4 pb-4 md:pt-8 md:pb-6">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4 text-xs font-semibold"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-muted-foreground">Ready-made apps for every business</span>
          </motion.div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-[0.95]">
            Your idea.{" "}
            <br className="hidden md:block" />
            <span
              className="text-gradient animate-gradient-shift inline-block"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(265 85% 58%), hsl(330 90% 60%), hsl(185 90% 45%), hsl(265 85% 58%))",
                backgroundSize: "200% 200%",
              }}
            >
              Already built.
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-5">
            Browse thousands of ready-to-launch apps — from SaaS tools to AI products. <span className="text-foreground font-semibold">Pick one, make it yours, and go live today.</span>
          </p>

          {/* Hero search bar */}
          <form onSubmit={handleHeroSearch} className="max-w-md mx-auto mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What kind of app do you need? e.g. 'CRM', 'AI chatbot'..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="pl-10 pr-24 h-11 glass border-border/40 focus-visible:border-primary/50 focus-visible:shadow-glow transition-all rounded-full text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 gradient-hero text-white border-0 shadow-glow hover:opacity-90 rounded-full h-8 px-4 text-xs font-bold"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Quick category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
            {["AI Apps", "SaaS Tools", "Landing Pages", "Utilities"].map((label) => {
              const slugMap: Record<string, string> = {
                "AI Apps": "ai-app",
                "SaaS Tools": "saas-tool",
                "Landing Pages": "landing-page",
                "Utilities": "utility",
              };
              return (
                <Link
                  key={label}
                  to={`/category/${slugMap[label]}`}
                  className="rounded-full px-3 py-1 text-xs font-semibold bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border/30"
                >
                  {label}
                </Link>
              );
            })}
            <Link
              to={user ? "/sell" : "/login"}
              className="rounded-full px-3 py-1 text-xs font-semibold text-primary hover:underline"
            >
              Or sell yours →
            </Link>
          </div>

          {/* Live stats */}
          <LiveStatsBar />
        </div>
      </section>

      {/* ── TRENDING (immediately visible) ── */}
      <FeaturedListings />

      {/* ── INDUSTRIES WE SERVE ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <IndustryVerticals />
      </motion.div>

      {/* ── CATEGORIES ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <CategoryShowcase />
      </motion.div>

      {/* ── HOW IT WORKS (before browse for visibility) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <HowItWorks />
      </motion.div>

      {/* ── BROWSE ALL ── */}
      <section id="browse" className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {totalCount > 0 && !loading ? `${totalCount} projects` : "All projects"}
            </h2>
            {totalCount > PAGE_SIZE && (
              <span className="text-xs text-muted-foreground">
                Showing {Math.min(listings.length, totalCount)} of {totalCount}
              </span>
            )}
          </div>

          {/* Search + filters bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 glass border-border/40 focus-visible:border-primary/50 focus-visible:shadow-glow transition-all"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 border-border/40 transition-colors ${filtersOpen ? "border-primary/50 text-primary bg-primary/5" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            </Button>
            <div className="flex gap-1.5">
              {SORT_OPTIONS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sort === s ? "default" : "outline"}
                  onClick={() => setSort(s)}
                  className={sort === s
                    ? "gradient-hero text-white border-0 shadow-glow hover:opacity-90"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                  }
                >
                  {s === "Popular" && <TrendingUp className="h-3.5 w-3.5 mr-1" />}
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-2xl border border-border/40 glass-strong p-5 space-y-4"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        category === c
                          ? "gradient-hero text-white shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Completeness</p>
                <div className="flex flex-wrap gap-2">
                  {COMPLETENESS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCompleteness(c)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        completeness === c
                          ? "gradient-hero text-white shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setCategory("All"); setCompleteness("All"); setFreeOnly(false); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <X className="h-3 w-3" /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <BrandMascot size={80} variant="thinking" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Finding the best apps for you…</p>
          </div>
        ) : listings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <BrandMascot size={100} variant="confused" />
            <h3 className="text-xl font-bold mb-2 mt-4">No listings found</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {hasFilters ? "Try adjusting your filters — I'll keep looking!" : "Be the first to list a project!"}
            </p>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                List your project
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {listings.map((listing) => (
                <div key={listing.id}>
                  <ListingCard {...listing} owned={ownedIds.has(listing.id)} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="gap-2 border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {loadingMore ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" /> Load more ({totalCount - listings.length} remaining)</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>




      <Footer />

      {/* Sticky sign-up bar for visitors */}
      <AnimatePresence>
        {showStickyBar && !user && !stickyDismissed && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <BrandMascot size={32} variant="wave" />
                <p className="text-sm font-medium text-foreground">
                  Find the perfect app for your business — <span className="font-bold">sign up free</span>
                </p>
              </div>
              <p className="text-sm font-medium text-foreground sm:hidden">
                Find your perfect app — sign up free
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/login">
                  <Button size="sm" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 font-bold gap-1.5">
                    Get started free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <button
                  onClick={() => setStickyDismissed(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
