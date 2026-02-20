import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { ArrowRight, Sparkles, Loader2, ShoppingCart, X } from "lucide-react";
import { logActivity } from "@/lib/activity-logger";

const PLACEHOLDERS = [
  "an AI email writer SaaS...",
  "a Stripe subscription boilerplate...",
  "a landing page for my startup...",
  "a full-stack todo app with auth...",
  "a React dashboard with charts...",
  "a Twitter clone with Supabase...",
];

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

export function BuildSearch() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchedListing[] | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults(null);
    setNoMatch(false);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("match-listings", {
        body: { prompt: prompt.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      // Log search query
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
    setNoMatch(false);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
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
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
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
            <p className="text-xs text-muted-foreground">Press Enter or click → to find matching projects</p>
            <Button
              type="submit"
              size="sm"
              disabled={!prompt.trim() || loading}
              className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-7 px-3 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>Find it <ArrowRight className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Results */}
      <div ref={resultsRef}>
        {loading && (
          <div className="mt-6 text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Searching for matching projects…</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="h-5 w-5 rounded-full gradient-hero flex items-center justify-center text-white text-xs">{results.length}</span>
              matching projects found — buy & ship today
            </p>
            {results.map((listing) => (
              <div
                key={listing.id}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-card transition-all duration-200"
              >
                <div className="flex gap-4 p-4">
                  {listing.screenshots?.[0] && (
                    <div className="flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden bg-muted">
                      <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm leading-snug line-clamp-1">{listing.title}</h3>
                      <span className="flex-shrink-0 text-sm font-black text-foreground">
                        ${(listing.price / 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{listing.reason}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                        {listing.tech_stack?.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                        ))}
                      </div>
                      <Link to={`/listing/${listing.id}`}>
                        <Button size="sm" className="gradient-hero text-white border-0 hover:opacity-90 h-7 px-3 text-xs">
                          <ShoppingCart className="h-3 w-3 mr-1" /> Buy this
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {noMatch && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
            <div className="text-3xl mb-3">🔮</div>
            <h3 className="font-bold mb-1">No exact match found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to build and sell <span className="text-foreground font-medium">"{prompt}"</span> on OpenDraft.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/sell">
                <Button size="sm" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                  List it for sale
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={reset}>
                Try a different idea
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
