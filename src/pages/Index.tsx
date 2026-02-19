import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BuildSearch } from "@/components/BuildSearch";

const CATEGORIES = ["All", "SaaS Tool", "AI App", "Landing Page", "Utility", "Game", "Other"];
const COMPLETENESS = ["All", "Prototype", "MVP", "Production Ready"];
const SORT_OPTIONS = ["Newest", "Popular"];

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
}

export default function Index() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [completeness, setCompleteness] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [freeOnly, setFreeOnly] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchListings();
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

  async function fetchListings() {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("id,title,description,price,completeness_badge,tech_stack,screenshots,sales_count,view_count", { count: "exact" })
      .eq("status", "live");

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category !== "All" && categoryMap[category]) {
      query = query.eq("category", categoryMap[category] as "saas_tool" | "ai_app" | "landing_page" | "utility" | "game" | "other");
    }
    if (completeness !== "All" && completenessMap[completeness]) {
      query = query.eq("completeness_badge", completenessMap[completeness] as "prototype" | "mvp" | "production_ready");
    }
    if (freeOnly) {
      query = query.eq("price", 0);
    }
    if (sort === "Newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("sales_count", { ascending: false });
    }

    const { data, count } = await query.limit(48);
    setListings((data as Listing[]) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }

  const hasFilters = search || category !== "All" || completeness !== "All" || freeOnly;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Ambient orbs */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-secondary/8 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary mb-7 backdrop-blur-sm">
            ⚡ Yours to create.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-5 leading-[1.05]">
            What do you want<br />
            <span className="text-gradient">to build?</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            Describe your idea — we'll find a ready-made project to buy and ship today.
          </p>

          <BuildSearch />

          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>or</span>
            <a href="#browse" className="underline underline-offset-4 hover:text-foreground transition-colors">browse all projects</a>
            <span>·</span>
            <Link to={user ? "/sell" : "/login"} className="underline underline-offset-4 hover:text-foreground transition-colors">
              {user ? "list your project" : "start selling"}
            </Link>
          </div>
        </div>
      </section>

      {/* Browse */}
      <section id="browse" className="container mx-auto px-4 pb-24">
        {/* Section label */}
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {totalCount > 0 && !loading ? `${totalCount} projects` : "All projects"}
          </h2>
        </div>

        {/* Search + filters bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60 focus-visible:border-primary/50 focus-visible:shadow-glow transition-all"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 border-border/60 transition-colors ${filtersOpen ? "border-primary/50 text-primary bg-primary/5" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
          </Button>
          {/* Sort */}
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sort === s ? "default" : "outline"}
                onClick={() => setSort(s)}
                className={sort === s
                  ? "gradient-hero text-white border-0 shadow-glow hover:opacity-90"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
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
          <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-card">
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
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-5xl mb-5">🔮</div>
            <h3 className="text-xl font-bold mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {hasFilters ? "Try adjusting your filters" : "Be the first to list a project!"}
            </p>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                List your project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} {...listing} owned={ownedIds.has(listing.id)} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
