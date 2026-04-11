import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { ArrowRight, Sparkles, Loader2, ShoppingCart, X, Wand2, CheckCircle, AlertCircle, ExternalLink, Search, Zap, TrendingUp, Clock, Star, Filter } from "lucide-react";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const PLACEHOLDERS = [
  "an AI email writer SaaS...",
  "a Stripe subscription boilerplate...",
  "a landing page for my startup...",
  "a full-stack todo app with auth...",
  "a React dashboard with charts...",
  "a Twitter clone with Supabase...",
];

const TRENDING_SEARCHES = [
  { label: "AI Tools", query: "AI powered tool" },
  { label: "SaaS Starter", query: "SaaS boilerplate with auth" },
  { label: "Dashboard", query: "admin dashboard" },
  { label: "Landing Page", query: "startup landing page" },
  { label: "MCP Server", query: "MCP server agent" },
  { label: "E-commerce", query: "online store shopping cart" },
];

const STAGE_MAP: Record<string, { label: string; pct: number }> = {
  queued: { label: "Queuing your build…", pct: 5 },
  researching: { label: "Researching market demand…", pct: 15 },
  generating_code: { label: "Generating source code…", pct: 35 },
  generating_screenshots: { label: "Creating screenshots…", pct: 60 },
  packaging: { label: "Packaging ZIP bundle…", pct: 78 },
  uploading: { label: "Uploading files…", pct: 88 },
  creating_listing: { label: "Creating your listing…", pct: 95 },
  done: { label: "Complete!", pct: 100 },
  error: { label: "Something went wrong", pct: 0 },
};

interface MatchedListing {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  category: string;
  sales_count: number;
  score: number;
  reason: string;
}

interface GenerationJob {
  id: string;
  status: string;
  stage: string;
  listing_id: string | null;
  listing_title: string | null;
  error: string | null;
}

const RECENT_SEARCHES_KEY = "od_recent_searches";
function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]").slice(0, 5);
  } catch { return []; }
}
function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter(s => s.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function BuildSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [results, setResults] = useState<MatchedListing[] | null>(null);
  const [instantResults, setInstantResults] = useState<MatchedListing[] | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCacheRef = useRef<Map<string, MatchedListing[]>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Debounced instant text search — 200ms for speed
  const runInstantSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setInstantResults(null);
      setIsTyping(false);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCacheRef.current.has(cacheKey)) {
      setInstantResults(searchCacheRef.current.get(cacheKey)!);
      setIsTyping(false);
      return;
    }

    try {
      await api.post("/rpc/search_listings", {
        search_query: query,
        page_limit: 8,
        page_offset: 0,
        sort_by: "relevance",
      });

      if (data && data.length > 0) {
        // Filter: only show listings with real screenshots and deliverables
        const quality = data
          .filter((l: any) => {
            const hasScreenshot = l.screenshots && l.screenshots.length > 0 
              && l.screenshots[0] !== '' && !l.screenshots[0]?.endsWith('.svg');
            return hasScreenshot;
          })
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            price: l.price,
            completeness_badge: l.completeness_badge,
            tech_stack: l.tech_stack || [],
            screenshots: l.screenshots || [],
            category: "other",
            sales_count: l.sales_count || 0,
            score: l.relevance_score || 0.5,
            reason: "Keyword match",
          }));

        if (quality.length > 0) {
          searchCacheRef.current.set(cacheKey, quality);
          setInstantResults(quality);
        } else {
          setInstantResults(null);
        }
      } else {
        setInstantResults(null);
      }
    } catch {
      // Silent fail for instant search
    } finally {
      setIsTyping(false);
    }
  }, []);

  function handlePromptChange(value: string) {
    setPrompt(value);
    setShowRecent(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length >= 2 && !results) {
      setIsTyping(true);
      debounceRef.current = setTimeout(() => {
        runInstantSearch(value.trim());
      }, 200);
    } else {
      setInstantResults(null);
      setIsTyping(false);
    }
  }

  function handleFocus() {
    setFocused(true);
    if (!prompt.trim() && !results) {
      setShowRecent(true);
    }
  }

  function handleBlur() {
    // Delay to allow clicks on dropdown items
    setTimeout(() => {
      setFocused(false);
      setShowRecent(false);
    }, 200);
  }

  function handleTrendingClick(query: string) {
    setPrompt(query);
    setShowRecent(false);
    setInstantResults(null);
    // Trigger instant search immediately
    setIsTyping(true);
    runInstantSearch(query);
  }

  // Subscribe to job updates via realtime
  useEffect(() => {
    if (!job || job.status === "complete" || job.status === "failed") return;

    // Poll for job updates (replaces Supabase realtime)
    const pollInterval = setInterval(async () => {
      const { data } = await api.from("generation_jobs")
        .select("id, status, stage, listing_id, listing_title, error")
        .eq("id", job.id)
        .single();
      if (data) {
        setJob(data as GenerationJob);
        if (data.status === "complete" || data.status === "failed") {
          setGenerating(false);
          clearInterval(pollInterval);
        }
      }
    }, 5000);

    const safetyTimeout = setTimeout(() => {
      setJob(prev => {
        if (prev && prev.status !== "complete" && prev.status !== "failed") {
          setGenerating(false);
          return { ...prev, status: "failed", stage: "error", error: "Generation is taking longer than expected. Check your dashboard — your app may still be building." };
        }
        return prev;
      });
    }, 180000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(safetyTimeout);
    };
  }, [job?.id, job?.status]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults(null);
    setInstantResults(null);
    setShowRecent(false);
    setNoMatch(false);
    setError(null);
    setJob(null);

    addRecentSearch(prompt.trim());

    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/match-listings", { prompt: prompt.trim() },);

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      logActivity({ event_type: "search", event_data: { query: prompt.trim(), has_results: !!data?.hasResults, result_count: data?.matches?.length ?? 0 } });

      if (data?.hasResults) {
        setResults(data.matches);
      } else {
        setNoMatch(true);
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  function reset() {
    setPrompt("");
    setResults(null);
    setInstantResults(null);
    setShowRecent(false);
    setNoMatch(false);
    setError(null);
    setJob(null);
    setGenerating(false);
    inputRef.current?.focus();
  }

  async function handleGenerate() {
    if (!user) {
      navigate("/login");
      return;
    }
    setGenerating(true);
    setJob(null);

    try {
      const { data: jobRow, error: jobErr } = await api.from("generation_jobs")
        .insert({
          user_id: user.id,
          prompt: prompt.trim(),
          status: "pending",
          stage: "queued",
        })
        .select("id, status, stage, listing_id, listing_title, error")
        .single();

      if (jobErr || !jobRow) {
        throw new Error("Failed to create generation job");
      }

      setJob(jobRow as GenerationJob);

      api.post("/functions/generate-template-app", { count: 1, themes: [prompt.trim()], job_id: jobRow.id }).catch((err: any) => {
        console.error("Edge function call failed:", err);
        setJob(prev => prev ? { ...prev, status: "failed", stage: "error", error: "Network error — check your dashboard, the build may still complete." } : prev);
        setGenerating(false);
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setJob({ id: "", status: "failed", stage: "error", listing_id: null, listing_title: null, error: message });
      setGenerating(false);
    }
  }

  const currentStage = job ? (STAGE_MAP[job.stage] || STAGE_MAP.queued) : STAGE_MAP.queued;

  const generateCta = generating || (job && job.status === "processing") || (job && job.status === "pending") ? (
    <div className="flex flex-col items-center gap-4 py-3">
      <div className="flex items-center gap-3 w-full max-w-sm">
        <div className="relative h-10 w-10 shrink-0">
          <div className="absolute inset-0 rounded-full gradient-hero animate-spin" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-[2px] rounded-full bg-card" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-bold">{currentStage.label}</p>
          <p className="text-xs text-muted-foreground">
            {job?.listing_title ? `Building "${job.listing_title}"` : "This usually takes 30–60 seconds"}
          </p>
        </div>
      </div>
      <div className="w-full max-w-sm">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full gradient-hero transition-all duration-1000 ease-out"
            style={{ width: `${currentStage.pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">Building your app</span>
          <span className="text-[10px] font-semibold text-primary">{currentStage.pct}%</span>
        </div>
      </div>
    </div>
  ) : job?.status === "complete" && job.listing_id ? (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
        <CheckCircle className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h4 className="font-bold text-foreground">🎉 The Gremlins built "{job.listing_title || prompt}"!</h4>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Your app is ready with full source code, screenshots, and a downloadable ZIP.
        </p>
        <div className="mt-3 rounded-lg bg-muted/60 border border-border p-3 text-left max-w-sm mx-auto">
          <p className="text-xs font-semibold text-foreground mb-1">📍 Where to find it:</p>
          <p className="text-xs text-muted-foreground">
            Go to <span className="font-bold text-foreground">Dashboard → My Listings</span> to edit details, update screenshots, set pricing, or publish it live.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button size="sm" onClick={() => navigate(`/listing/${job.listing_id}/edit`)} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
          <ExternalLink className="h-3.5 w-3.5" /> Edit listing now
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/dashboard?tab=listings")} className="gap-2">
          Open Dashboard
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Build another
        </Button>
      </div>
    </div>
  ) : job?.status === "failed" ? (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 mx-auto">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Generation failed</p>
        <p className="text-xs text-muted-foreground mt-1">{job.error || "Unknown error"}</p>
      </div>
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="outline" onClick={handleGenerate} className="gap-2">
          <Wand2 className="h-3.5 w-3.5" /> Try again
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard?tab=listings")}>
          Check Dashboard
        </Button>
      </div>
    </div>
  ) : (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
      onClick={handleGenerate}
    >
      <Wand2 className="h-3.5 w-3.5" /> 🛠️ Let the Gremlins build it
    </Button>
  );

  const displayResults = results || null;
  const showInstant = !results && !loading && instantResults && instantResults.length > 0;
  const recentSearches = getRecentSearches();
  const showRecentDropdown = showRecent && !prompt.trim() && !results && !loading && (recentSearches.length > 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Trending search chips */}
      {!results && !loading && !prompt && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Trending:
          </span>
          {TRENDING_SEARCHES.map((t) => (
            <button
              key={t.query}
              onClick={() => handleTrendingClick(t.query)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSearch} className="relative">
        <div className="relative rounded-2xl border border-border bg-card shadow-card overflow-hidden focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-300">
          <div className="flex items-start gap-3 p-4">
            <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <textarea
              ref={inputRef}
              rows={2}
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={`I want to build ${PLACEHOLDERS[placeholderIdx]}`}
              className="flex-1 bg-transparent resize-none text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            />
            {prompt && (
              <button type="button" onClick={reset} className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {isTyping ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</span>
              ) : prompt.trim().length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> Press Enter for AI deep search
                </span>
              ) : (
                "Describe what you want to build"
              )}
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!prompt.trim() || loading}
              className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-7 px-3 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" /> Deep search
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Recent searches dropdown */}
      {showRecentDropdown && (
        <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent searches</span>
          </div>
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(s);
                setShowRecent(false);
                setIsTyping(true);
                runInstantSearch(s);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0 text-left"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{s}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Instant results dropdown */}
      {showInstant && (
        <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick matches</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Enter ↵ for AI deep search</span>
          </div>
          {instantResults!.slice(0, 6).map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0 group"
            >
              {listing.screenshots?.[0] && (
                <div className="flex-shrink-0 h-10 w-14 rounded-md overflow-hidden bg-muted ring-1 ring-border">
                  <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-foreground">
                    {listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(0)}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">{listing.sales_count} claimed</span>
                  {listing.tech_stack?.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] text-muted-foreground bg-muted rounded px-1">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          {instantResults!.length > 6 && (
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2.5 text-xs text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3 w-3" /> See all {instantResults!.length} results with AI ranking
            </button>
          )}
        </div>
      )}

      {/* Full results */}
      <div ref={resultsRef}>
        {loading && (
          <div className="mt-6 text-center py-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full gradient-hero animate-ping opacity-20" style={{ animationDuration: "1.5s" }} />
              <div className="relative h-12 w-12 rounded-full gradient-hero flex items-center justify-center mx-auto">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mt-4">AI is analyzing your request…</p>
            <p className="text-xs text-muted-foreground mt-1">Semantic matching across the entire marketplace</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        {displayResults && displayResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-5 w-5 rounded-full gradient-hero flex items-center justify-center text-white text-xs">{displayResults.length}</span>
                AI-ranked matches
              </p>
              <p className="text-[10px] text-muted-foreground">Sorted by relevance</p>
            </div>
            {displayResults.map((listing, idx) => {
              const scoreColor = listing.score >= 0.8 ? "text-green-500" : listing.score >= 0.6 ? "text-yellow-500" : "text-muted-foreground";
              const scoreLabel = listing.score >= 0.8 ? "Excellent" : listing.score >= 0.6 ? "Good" : "Related";
              return (
                <div
                  key={listing.id}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-card transition-all duration-200 group"
                >
                  <div className="flex gap-4 p-4">
                    {listing.screenshots?.[0] && (
                      <div className="flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                        <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Score indicator */}
                            <div className="flex items-center gap-1">
                              <div className="flex gap-px">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <div key={s} className={`h-1.5 w-3 rounded-sm ${s <= Math.round(listing.score * 5) ? 'gradient-hero' : 'bg-muted'}`} />
                                ))}
                              </div>
                              <span className={`text-[10px] font-bold ${scoreColor}`}>{scoreLabel}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-black text-foreground flex-shrink-0">
                          {listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(0)}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{listing.reason}</p>
                      {listing.sales_count <= 3 && (
                        <p className="text-[10px] font-bold text-accent flex items-center gap-1 mb-1.5">
                          🚀 {listing.sales_count === 0 ? "No buyers yet — be first & shape the roadmap" : "Early adopter — influence future features"}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                          {listing.tech_stack?.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{t}</span>
                          ))}
                        </div>
                        <Link to={`/listing/${listing.id}`}>
                          <Button size="sm" className="gradient-hero text-white border-0 hover:opacity-90 h-7 px-3 text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" /> View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gremlins build CTA */}
            <div className="rounded-xl border border-dashed border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Not quite right? <span className="text-foreground font-semibold">Let the Gremlins™ build exactly what you need.</span>
              </p>
              <p className="text-xs text-muted-foreground">Full source code, screenshots & ZIP — ready in ~60 seconds</p>
              {generateCta}
            </div>
          </div>
        )}

        {noMatch && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-hero shadow-glow mx-auto text-2xl">
                🛠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">No match — let the Gremlins™ build it!</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Our AI agents will generate a full-stack app from your description in ~60 seconds — source code, screenshots, and a downloadable ZIP included.
                </p>
              </div>
              {generateCta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
