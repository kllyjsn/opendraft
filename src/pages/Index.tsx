import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, SlidersHorizontal, X, Loader2, ChevronDown, Wand2, CheckCircle, AlertCircle, ExternalLink, Rocket, Globe, Pencil } from "lucide-react";
import { BusinessAnalyzer } from "@/components/BusinessAnalyzer";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { StaffPicks } from "@/components/StaffPicks";
import { BrandMascot } from "@/components/BrandMascot";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { CTA_COPY } from "@/lib/pricing-tiers";
import { AppShowcase } from "@/components/AppShowcase";
import { useGenerationJob } from "@/hooks/useGenerationJob";

const CATEGORIES = ["All", "SaaS Tool", "AI App", "Landing Page", "Utility", "Game", "Other"];
const COMPLETENESS = ["All", "Prototype", "MVP", "Production Ready"];
const SORT_OPTIONS = ["Newest", "Popular"];
const PAGE_SIZE = 24;

const ROTATING_WORDS = ["restaurant", "agency", "clinic", "startup"];

function HeroTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-4xl md:text-6xl lg:text-[5rem] font-black tracking-[-0.04em] mb-4 leading-[0.92]">
      Your idea.{" "}
      <br className="hidden md:block" />
      <span className="inline-block relative overflow-hidden align-bottom" style={{ minWidth: "7ch" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING_WORDS[index]}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block text-gradient animate-gradient-shift"
            style={{
              backgroundImage: "linear-gradient(135deg, hsl(265 90% 62%), hsl(320 95% 60%), hsl(175 95% 50%), hsl(265 90% 62%))",
              backgroundSize: "200% 200%",
            }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>{" "}
      ready.
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

  // Generation & deploy — extracted hook
  const { generating, genJob, deployPhase, deployUrl, deployError, currentStage, isInProgress, handleGenerate, handleAutoDeploy, reset } = useGenerationJob();

  // Auto-trigger generation from ?generate= param or pending session storage
  useEffect(() => {
    if (!user) return;

    // Check URL param first
    const params = new URLSearchParams(window.location.search);
    const genParam = params.get("generate");
    if (genParam) {
      // Clean the URL
      params.delete("generate");
      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      window.history.replaceState({}, "", newUrl);
      handleGenerate(genParam);
      return;
    }

    // Check pending generation from pre-login flow
    const pending = sessionStorage.getItem("opendraft_pending_generate");
    if (pending) {
      sessionStorage.removeItem("opendraft_pending_generate");
      handleGenerate(pending);
    }
  }, [user]);

  const jsonLdData = useMemo(() => [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "OpenDraft",
      "url": "https://opendraft.co",
      "description": "Expert-built, production-ready apps. SaaS tools, AI products, landing pages & business software — designed, coded, and tested by professionals.",
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
      .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score,agent_ready,updated_at", { count: "exact" })
      .eq("status", "live");
    if (category !== "All" && categoryMap[category]) query = query.eq("category", categoryMap[category] as any);
    if (completeness !== "All" && completenessMap[completeness]) query = query.eq("completeness_badge", completenessMap[completeness] as any);
    if (freeOnly) query = query.eq("price", 0);
    if (sort === "Newest") query = query.order("created_at", { ascending: false });
    else query = query.order("sales_count", { ascending: false });
    return query;
  }, [category, completeness, sort, freeOnly]);

  async function fetchListings(pageNum: number, resetList: boolean = false) {
    if (resetList) setLoading(true);
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

    if (resetList) setListings(enriched);
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
  const searchQuery = search || heroSearch;

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Production-Ready Apps — Expertly Built SaaS, AI & More | OpenDraft"
        description="We build extraordinary apps. Browse expertly crafted SaaS tools, AI products, and business software — designed, tested, and ready to launch."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-28 md:pb-16">
        {/* Cinematic background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-primary/8 blur-[200px]" />
          <div className="absolute -bottom-20 -right-40 w-[500px] h-[500px] rounded-full bg-accent/6 blur-[160px]" />
          <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[120px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Expertly crafted software
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroTagline />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Enter your website — we'll analyze your business and recommend the perfect apps.
          </motion.p>

          {/* Business URL Analyzer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <BusinessAnalyzer onGenerate={handleGenerate} />
          </motion.div>

          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mb-6"
            >
              <div className="max-w-xs mx-auto">
                <GoogleSignInButton label="Get started" />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground"
          >
            {[
              { label: "Full source code ownership", color: "bg-primary" },
              { label: "Security audited", color: "bg-accent" },
              { label: "Deploy-ready in minutes", color: "bg-secondary" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span className={`h-1 w-1 rounded-full ${item.color}/60`} />
                {item.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── APP SHOWCASE ── */}
      <AppShowcase />

      {/* ── STAFF PICKS ── */}
      <StaffPicks />

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
              {totalCount > 0 && !loading ? `${totalCount} projects` : "Our collection"}
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
            className="text-center py-16"
          >
            {isInProgress ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="relative h-16 w-16 mx-auto">
                  <div className="absolute inset-0 rounded-full gradient-hero animate-spin" style={{ animationDuration: "2s" }} />
                  <div className="absolute inset-[2px] rounded-full bg-card" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {deployPhase === "deploying" || deployPhase === "polling" ? (
                      <Rocket className="h-6 w-6 text-primary" />
                    ) : (
                      <Wand2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold">{currentStage.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {genJob?.listing_title ? `"${genJob.listing_title}"` : "This usually takes 60–90 seconds"}
                  </p>
                </div>
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-hero transition-all duration-1000 ease-out" style={{ width: `${currentStage.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {deployPhase === "deploying" || deployPhase === "polling" ? "Deploying to cloud" : "Building your app"}
                    </span>
                    <span className="text-[10px] font-semibold text-primary">{currentStage.pct}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className={`flex items-center gap-1 ${genJob?.status === "complete" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {genJob?.status === "complete" ? <CheckCircle className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />}
                    Build
                  </span>
                  <span className="text-border">→</span>
                  <span className={`flex items-center gap-1 ${deployPhase === "polling" || deployPhase === "live" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {deployPhase === "live" ? <CheckCircle className="h-3 w-3" /> : <Rocket className="h-3 w-3" />}
                    Deploy
                  </span>
                  <span className="text-border">→</span>
                  <span className={`flex items-center gap-1 ${deployPhase === "live" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    <Globe className="h-3 w-3" />
                    Live
                  </span>
                </div>
              </div>

            ) : deployPhase === "live" && deployUrl ? (
              <div className="max-w-md mx-auto space-y-5">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">🎉 Your app is live!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    "{genJob?.listing_title || searchQuery}" has been built and deployed to OpenDraft Cloud.
                  </p>
                </div>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors mx-auto"
                >
                  <Globe className="h-4 w-4" />
                  {deployUrl.replace("https://", "")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <div className="flex gap-2 justify-center flex-wrap">
                  {genJob?.listing_id && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/listing/${genJob.listing_id}/edit`)}
                      className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit your app
                    </Button>
                  )}
                  {genJob?.listing_id && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${genJob.listing_id}`)} className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> View listing
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={reset}>
                    Build another
                  </Button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden shadow-card mt-4">
                  <div className="bg-muted/50 px-3 py-1.5 flex items-center gap-2 border-b border-border">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive/50" />
                      <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
                      <span className="h-2 w-2 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate flex-1">{deployUrl}</span>
                  </div>
                  <iframe
                    src={deployUrl}
                    className="w-full h-[300px] bg-background"
                    title="Live preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>

            ) : (deployPhase === "error" || genJob?.status === "failed") ? (
              <div className="max-w-md mx-auto rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 mx-auto">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm font-semibold">
                  {deployPhase === "error" ? "Deploy failed" : "Build failed"}
                </p>
                <p className="text-xs text-muted-foreground">{deployError || genJob?.error}</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {deployPhase === "error" && genJob?.listing_id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleAutoDeploy(genJob.listing_id!)} className="gap-2">
                        <Rocket className="h-3.5 w-3.5" /> Retry deploy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/listing/${genJob.listing_id}`)}>
                        View listing instead
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleGenerate(searchQuery)} className="gap-2">
                      <Wand2 className="h-3.5 w-3.5" /> Try again
                    </Button>
                  )}
                </div>
              </div>

            ) : (
              <>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-hero shadow-glow mx-auto text-3xl mb-4">
                  🛠️
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {hasFilters ? `No results for "${search}"` : "No listings found"}
                </h3>
                <p className="text-muted-foreground mb-2 text-sm max-w-md mx-auto">
                  {hasFilters
                    ? "We don't have that yet — but the Gremlins™ can build it and deploy it for you in ~90 seconds."
                    : "Be the first to list a project!"}
                </p>
                {hasFilters && searchQuery && (
                  <p className="text-xs text-muted-foreground mb-4">Full source code + auto-deployed to OpenDraft Cloud</p>
                )}
                <div className="flex gap-3 justify-center flex-wrap">
                  {hasFilters && searchQuery && (
                    <Button onClick={() => handleGenerate(searchQuery)} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
                      <Wand2 className="h-4 w-4" /> Build & deploy "{search || heroSearch}"
                    </Button>
                  )}
                  <Link to="/sell">
                    <Button variant="outline">List your own project</Button>
                  </Link>
                </div>
              </>
            )}
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
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Expertly crafted apps — <span className="font-bold">ready to launch</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {CTA_COPY.card}
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground sm:hidden">
                🚀 Expert-built apps · Launch today
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-48">
                  <GoogleSignInButton label="Get started" />
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
