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
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { FeaturedListings } from "@/components/FeaturedListings";
import { BrandMascot } from "@/components/BrandMascot";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";

const CATEGORIES = ["All", "SaaS Tool", "AI App", "Landing Page", "Utility", "Game", "Other"];
const COMPLETENESS = ["All", "Prototype", "MVP", "Production Ready"];
const SORT_OPTIONS = ["Newest", "Popular"];
const PAGE_SIZE = 24;

const ROTATING_WORDS = ["person", "business"];

function HeroTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-[0.95]">
      Personalized apps for every{" "}
      <br className="hidden md:block" />
      <span className="inline-block relative overflow-hidden align-bottom" style={{ minWidth: "5ch" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING_WORDS[index]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="inline-block text-gradient animate-gradient-shift"
            style={{
              backgroundImage: "linear-gradient(135deg, hsl(265 85% 58%), hsl(330 90% 60%), hsl(185 90% 45%), hsl(265 85% 58%))",
              backgroundSize: "200% 200%",
            }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>{" "}
      on the planet.
    </h1>
  );
}

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

  const jsonLdData = useMemo(() => [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "OpenDraft",
      "url": "https://opendraft.co",
      "description": "Browse 1,000+ ready-to-launch apps. Buy SaaS tools, AI products, landing pages & utilities.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://opendraft.co/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "OpenDraft",
      "url": "https://opendraft.co",
      "logo": "https://opendraft.co/mascot-icon.png",
      "sameAs": ["https://x.com/OpenDraft"],
    },
  ], []);

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
      <MetaTags
        title="Buy Ready-Made Apps & Templates — SaaS, AI, Landing Pages | OpenDraft"
        description="Browse 1,000+ production-ready apps. Buy SaaS tools, AI products, landing pages & utilities built with Lovable, Cursor, Bolt. Launch your business today."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      <Navbar />

      {/* ── LIVE ACTIVITY TICKER ── */}
      {/* ── COMPACT HERO ── */}
      <section className="relative overflow-hidden pt-4 pb-4 md:pt-6 md:pb-4">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] animate-pulse-glow pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <HeroTagline />
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-2">
            SaaS tools, AI products, landing pages & utilities — production-ready.
          </p>
          {!user && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-accent">
                ✨ Your first app is free — no credit card required
              </p>
              <div className="max-w-xs mx-auto">
                <GoogleSignInButton label="Sign up free with Google" />
              </div>
            </div>
          )}

          {/* Hero search bar */}
          <form onSubmit={handleHeroSearch} className="max-w-md mx-auto mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What kind of app do you need?"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="pl-10 pr-24 h-11 glass border-border/40 focus-visible:border-primary/50 focus-visible:shadow-glow transition-all rounded-full text-sm leading-normal [&]:py-0"
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

          {/* Popular searches */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/60 font-medium mr-1">Popular:</span>
            {["CRM", "AI Chatbot", "Dashboard", "E-commerce", "Portfolio", "Invoice Tool"].map((term) => (
              <button
                key={term}
                onClick={() => { setHeroSearch(term); setSearch(term); document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }); }}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border/20"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING (immediately visible) ── */}
      <FeaturedListings />

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
                  Your first app is free — <span className="font-bold">claim it now</span>
                </p>
              </div>
              <p className="text-sm font-medium text-foreground sm:hidden">
                First app free — no card required
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-48">
                  <GoogleSignInButton label="Claim free app" />
                </div>
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
