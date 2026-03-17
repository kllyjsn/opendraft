import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BountyCard } from "@/components/BountyCard";
import { CreateBountyDialog } from "@/components/CreateBountyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MetaTags } from "@/components/MetaTags";
import { Search, Target, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", "SaaS Tool", "AI App", "Landing Page", "Utility", "Game", "Other"];
const categoryMap: Record<string, string> = {
  "SaaS Tool": "saas_tool", "AI App": "ai_app", "Landing Page": "landing_page",
  "Utility": "utility", "Game": "game", "Other": "other",
};

interface Bounty {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  tech_stack: string[];
  status: string;
  submissions_count: number;
  created_at: string;
  poster_id: string;
}

export default function Bounties() {
  const { user } = useAuth();
  const [bounties, setBounties] = useState<(Bounty & { poster_username?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { fetchBounties(); }, [search, category]);

  async function fetchBounties() {
    setLoading(true);
    let query = supabase
      .from("bounties")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category !== "All" && categoryMap[category]) {
      query = query.eq("category", categoryMap[category] as any);
    }

    const { data } = await query.limit(48);
    const bountyData = (data ?? []) as Bounty[];

    // Fetch poster usernames
    const posterIds = [...new Set(bountyData.map((b) => b.poster_id))];
    let profileMap: Record<string, string> = {};
    if (posterIds.length > 0) {
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, username")
        .in("user_id", posterIds);
      profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"]));
    }

    setBounties(bountyData.map((b) => ({ ...b, poster_username: profileMap[b.poster_id] })));
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="App Bounties — Request Custom Software | OpenDraft"
        description="Post what you need, set a budget, and expert builders compete to build it for you. Get custom SaaS tools, AI apps, and more."
        path="/bounties"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[100px] pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-sm font-semibold text-accent mb-6">
            <Target className="h-4 w-4" /> Bounty Board
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.05]">
            Describe it.<br />
            <span className="text-gradient">Someone will build it.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Post what you need — set a budget — sellers compete to build it for you.
          </p>
          {user ? (
            <CreateBountyDialog onCreated={fetchBounties} />
          ) : (
            <Link to="/login">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
                Sign in to post a bounty
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Browse */}
      <section className="container mx-auto px-4 pb-24">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {bounties.length > 0 ? `${bounties.length} open bounties` : "Open bounties"}
          </h2>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bounties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60 focus-visible:border-primary/50 focus-visible:shadow-glow"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 border-border/60 ${filtersOpen ? "border-primary/50 text-primary bg-primary/5" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        {filtersOpen && (
          <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
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
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-5xl mb-5">🎯</div>
            <h3 className="text-xl font-bold mb-2">No bounties yet</h3>
            <p className="text-muted-foreground mb-6 text-sm">Be the first to post what you need built!</p>
            {user && <CreateBountyDialog onCreated={fetchBounties} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bounties.map((b) => (
              <BountyCard key={b.id} {...b} poster_id={b.poster_id} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
