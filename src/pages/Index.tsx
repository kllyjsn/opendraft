import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, SlidersHorizontal, X, Loader2, ChevronDown, ArrowRight, Wand2, CheckCircle, AlertCircle, ExternalLink, Rocket, Globe, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LifestyleCategories } from "@/components/LifestyleCategories";
import { StaffPicks } from "@/components/StaffPicks";
import { DiscoveryRails } from "@/components/DiscoveryRails";
import { BrandMascot } from "@/components/BrandMascot";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { CTA_COPY } from "@/lib/pricing-tiers";
import { AppShowcase } from "@/components/AppShowcase";
import { ExpertiseBar } from "@/components/ExpertiseBar";


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
    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-[0.95]">
      Your idea.{" "}
      <br className="hidden md:block" />
      <span className="inline-block relative overflow-hidden align-bottom" style={{ minWidth: "7ch" }}>
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
  const [generating, setGenerating] = useState(false);
  const [genJob, setGenJob] = useState<{ id: string; status: string; stage: string; listing_id: string | null; listing_title: string | null; error: string | null } | null>(null);
  // Deploy state
  const [deployPhase, setDeployPhase] = useState<"idle" | "deploying" | "polling" | "live" | "error">("idle");
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployId, setDeployId] = useState<string | null>(null);

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
      .select("id,title,description,price,pricing_type,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score,agent_ready,updated_at", { count: "exact" })
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
  const searchQuery = search || heroSearch;

  const STAGE_MAP: Record<string, { label: string; pct: number }> = {
    queued: { label: "Queuing your build…", pct: 3 },
    researching: { label: "Researching market demand…", pct: 10 },
    generating_code: { label: "Generating source code…", pct: 25 },
    generating_screenshots: { label: "Creating screenshots…", pct: 40 },
    packaging: { label: "Packaging ZIP bundle…", pct: 52 },
    uploading: { label: "Uploading files…", pct: 60 },
    creating_listing: { label: "Creating your listing…", pct: 65 },
    done: { label: "Build complete!", pct: 68 },
    // Deploy stages
    deploying: { label: "Deploying to OpenDraft Cloud…", pct: 75 },
    deploy_building: { label: "Cloud build in progress…", pct: 85 },
    deploy_live: { label: "Your app is live! 🎉", pct: 100 },
    error: { label: "Something went wrong", pct: 0 },
  };

  // Auto-deploy when generation completes
  useEffect(() => {
    if (genJob?.status === "complete" && genJob.listing_id && deployPhase === "idle") {
      handleAutoDeploy(genJob.listing_id);
    }
  }, [genJob?.status, genJob?.listing_id]);

  async function handleAutoDeploy(listingId: string) {
    setDeployPhase("deploying");
    setDeployError(null);
    try {
      const { data, error } = await supabase.functions.invoke("deploy-to-opendraft", {
        body: { listingId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.siteUrl && data?.deployId) {
        setDeployId(data.deployId);
        setDeployPhase("polling");
        pollDeployStatus(data.deployId, data.siteUrl);
      } else {
        throw new Error("Deploy returned no URL");
      }
    } catch (err) {
      console.error("Auto-deploy failed:", err);
      setDeployError(err instanceof Error ? err.message : "Deploy failed");
      setDeployPhase("error");
    }
  }

  async function pollDeployStatus(depId: string, siteUrl: string) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke("check-vercel-deploy", {
          body: { deployId: depId, usePlatformToken: true },
        });
        if (data?.state === "ready") {
          clearInterval(interval);
          setDeployUrl(data.deployUrl || siteUrl);
          setDeployPhase("live");
          // Update listing demo_url
          if (genJob?.listing_id) {
            supabase.from("listings").update({ demo_url: data.deployUrl || siteUrl }).eq("id", genJob.listing_id).then(() => {});
          }
        } else if (data?.state === "error" || data?.state === "canceled") {
          clearInterval(interval);
          setDeployError(data?.errorMessage || "Deploy failed during build");
          setDeployPhase("error");
        }
      } catch { /* keep polling */ }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setDeployUrl(siteUrl);
        setDeployPhase("live"); // Assume it'll be ready
      }
    }, 5000);
  }

  // Subscribe to generation job updates
  useEffect(() => {
    if (!genJob || genJob.status === "complete" || genJob.status === "failed") return;

    const channel = supabase
      .channel(`browse-job-${genJob.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "generation_jobs",
        filter: `id=eq.${genJob.id}`,
      }, (payload) => {
        const updated = payload.new as typeof genJob;
        setGenJob(updated);
        if (updated.status === "complete" || updated.status === "failed") setGenerating(false);
      })
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase.from("generation_jobs").select("id, status, stage, listing_id, listing_title, error").eq("id", genJob.id).single();
      if (data) {
        setGenJob(data as typeof genJob);
        if (data.status === "complete" || data.status === "failed") { setGenerating(false); clearInterval(poll); }
      }
    }, 5000);

    const timeout = setTimeout(() => {
      setGenJob(prev => {
        if (prev && prev.status !== "complete" && prev.status !== "failed") {
          setGenerating(false);
          return { ...prev, status: "failed", stage: "error", error: "Taking longer than expected. Check your dashboard." };
        }
        return prev;
      });
    }, 180000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); clearTimeout(timeout); };
  }, [genJob?.id, genJob?.status]);

  async function handleGenerate() {
    if (!user) { navigate("/login"); return; }
    const prompt = searchQuery.trim();
    if (!prompt) return;
    setGenerating(true);
    setGenJob(null);
    setDeployPhase("idle");
    setDeployUrl(null);
    setDeployError(null);
    setDeployId(null);

    try {
      const { data: jobRow, error: jobErr } = await supabase
        .from("generation_jobs")
        .insert({ user_id: user.id, prompt, status: "pending", stage: "queued" })
        .select("id, status, stage, listing_id, listing_title, error")
        .single();

      if (jobErr || !jobRow) throw new Error("Failed to create generation job");
      setGenJob(jobRow as typeof genJob);

      supabase.functions.invoke("generate-template-app", {
        body: { count: 1, themes: [prompt], job_id: jobRow.id },
      }).catch(console.error);
    } catch (err) {
      setGenJob({ id: "", status: "failed", stage: "error", listing_id: null, listing_title: null, error: err instanceof Error ? err.message : "Unknown error" });
      setGenerating(false);
    }
  }

  // Compute current visual stage
  function getCurrentStage(): { label: string; pct: number } {
    if (deployPhase === "live") return STAGE_MAP.deploy_live;
    if (deployPhase === "polling") return STAGE_MAP.deploy_building;
    if (deployPhase === "deploying") return STAGE_MAP.deploying;
    if (deployPhase === "error") return STAGE_MAP.error;
    if (genJob?.status === "complete") return STAGE_MAP.done;
    return genJob ? (STAGE_MAP[genJob.stage] || STAGE_MAP.queued) : STAGE_MAP.queued;
  }

  const currentStage = getCurrentStage();
  const isInProgress = generating || (genJob && genJob.status !== "complete" && genJob.status !== "failed") || deployPhase === "deploying" || deployPhase === "polling";

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Production-Ready Apps — Expertly Built SaaS, AI & More | OpenDraft"
        description="We build extraordinary apps. Browse expertly crafted SaaS tools, AI products, and business software — designed, tested, and ready to launch."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      
      <Navbar />

      {/* ── ART-FORWARD HERO ── */}
      <section className="relative overflow-hidden pt-8 pb-6 md:pt-14 md:pb-8">
        {/* Ambient blurs */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/12 blur-[140px] animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Studio badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Expertly crafted software
            </span>
          </motion.div>

          <HeroTagline />

          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            We don't do templates. Every app is designed, coded, and stress-tested 
            by experts — so you can launch a real business, not a prototype.
          </p>

          {/* Search bar */}
          <form onSubmit={handleHeroSearch} className="max-w-md mx-auto mb-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What does your business need?"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="pl-10 pr-24 h-11 glass border-border/40 focus-visible:border-primary/50 focus-visible:shadow-glow transition-all rounded-full text-sm leading-normal [&]:py-0"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 rounded-full h-8 px-4 text-xs font-bold"
              >
                Explore
              </Button>
            </div>
          </form>

          {!user && (
            <div className="mb-4 space-y-2">
              <div className="max-w-xs mx-auto">
                <GoogleSignInButton label="Get started" />
              </div>
            </div>
          )}

          {/* Craft signals instead of marketplace stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              Full source code ownership
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              Security audited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-secondary/60" />
              Deploy-ready in minutes
            </span>
          </div>
        </div>
      </section>

      {/* ── EXPERTISE BAR ── */}
      <ExpertiseBar />

      {/* ── LIFESTYLE CATEGORIES ── */}
      <LifestyleCategories />

      {/* ── DISCOVERY RAILS ── */}
      <DiscoveryRails />

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
            className="text-center py-16"
          >
            {isInProgress ? (
              /* ── UNIFIED PROGRESS: Build → Deploy → Live ── */
              <div className="max-w-md mx-auto space-y-6">
                {/* Spinning icon */}
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

                {/* Phase label */}
                <div>
                  <p className="text-base font-bold">{currentStage.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {genJob?.listing_title ? `"${genJob.listing_title}"` : "This usually takes 60–90 seconds"}
                  </p>
                </div>

                {/* Progress bar */}
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

                {/* Step indicators */}
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
              /* ── LIVE: App is deployed ── */
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

                {/* Live URL */}
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

                {/* Action buttons */}
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
                  <Button size="sm" variant="ghost" onClick={() => {
                    setGenJob(null);
                    setDeployPhase("idle");
                    setDeployUrl(null);
                    setDeployId(null);
                  }}>
                    Build another
                  </Button>
                </div>

                {/* Inline iframe preview */}
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
              /* ── ERROR STATE ── */
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
                    <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-2">
                      <Wand2 className="h-3.5 w-3.5" /> Try again
                    </Button>
                  )}
                </div>
              </div>

            ) : (
              /* ── DEFAULT: No results, offer to build ── */
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
                    <Button onClick={handleGenerate} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
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
                    1,000+ production-ready apps — <span className="font-bold">claim & deploy</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {CTA_COPY.card}
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground sm:hidden">
                🚀 1,000+ apps · Start building now
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
