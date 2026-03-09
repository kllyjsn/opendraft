import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Loader2, ShieldCheck, Clock, BarChart3, Flag, Archive, Bot, Globe, Crown, ImageIcon, Mail } from "lucide-react";
import { AdminDiscountCodes } from "@/components/AdminDiscountCodes";
import { AdminFlagReview } from "@/components/AdminFlagReview";
import { AdminConceptGenerator } from "@/components/AdminConceptGenerator";
import { AdminMarketResearch } from "@/components/AdminMarketResearch";

interface PendingListing {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  category: string;
  tech_stack: string[];
  screenshots: string[];
  demo_url: string | null;
  github_url: string | null;
  created_at: string;
  seller_id: string;
}

interface Stats {
  pending: number;
  live: number;
  hidden: number;
  total: number;
}

function BackfillZipsPanel() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ message: string; results?: { id: string; title: string; status: string }[] } | null>(null);

  async function runBackfill() {
    setRunning(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backfill-template-zips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      toast({ title: "Backfill complete", description: data.message });
    } catch (e) {
      toast({ title: "Backfill failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Backfill Template ZIPs
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Generate deployable template ZIPs for all live listings that are missing a file download.
          </p>
        </div>
        <Button onClick={runBackfill} disabled={running} className="gradient-hero text-white border-0 shadow-glow">
          {running ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running…</> : "Run Backfill"}
        </Button>
      </div>
      {result && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <p className="text-sm font-medium">{result.message}</p>
          {result.results && result.results.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {result.results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  {r.status === "success" ? (
                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground ml-auto">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PatchDeployConfigsPanel() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ message: string; results?: { id: string; title: string; status: string; details?: string }[] } | null>(null);

  async function runPatch() {
    setRunning(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/patch-deploy-configs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ limit: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      toast({ title: "Patch complete", description: data.message });
    } catch (e) {
      toast({ title: "Patch failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Patch Deploy Configs
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add netlify.toml, _redirects & vercel.json to the last 10 project ZIPs so they deploy correctly.
          </p>
        </div>
        <Button onClick={runPatch} disabled={running} className="gradient-hero text-white border-0 shadow-glow">
          {running ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Patching…</> : "Patch Last 10"}
        </Button>
      </div>
      {result && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <p className="text-sm font-medium">{result.message}</p>
          {result.results && result.results.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {result.results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  {r.status === "patched" ? (
                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                  ) : r.status === "already_patched" ? (
                    <CheckCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                  <span className="truncate">{r.title}</span>
                  <span className="text-muted-foreground ml-auto">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GenerateScreenshotsPanel() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"all" | "duplicates_only" | "missing_only">("duplicates_only");
  const [progress, setProgress] = useState<{ processed: number; updated: number; errors: number; total: number }>({ processed: 0, updated: 0, errors: 0, total: 0 });

  async function runGenerate() {
    setRunning(true);
    setProgress({ processed: 0, updated: 0, errors: 0, total: 1020 });
    let offset = 0;
    const batchSize = 1; // AI generation is slow - 1 at a time to avoid timeouts
    let totalUpdated = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      while (true) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-unique-screenshots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ batch_size: batchSize, offset, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        totalProcessed += data.processed || 0;
        totalUpdated += data.updated || 0;
        totalErrors += data.errors || 0;
        setProgress({ processed: totalProcessed, updated: totalUpdated, errors: totalErrors, total: 1020 });

        if ((data.processed || 0) < batchSize) break;
        offset = data.next_offset || offset + batchSize;

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
      toast({ title: "AI Screenshots generated!", description: `${totalUpdated} listings updated with unique AI-generated previews` });
    } catch (e) {
      toast({ title: "Generation paused", description: `${totalUpdated} updated so far. ${e instanceof Error ? e.message : "Error"} — you can resume later.`, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Generate AI Screenshots
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Generate unique, AI-powered app preview images for each listing based on its title, description, and category. Replaces SVG mockups and shared pool images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "all" | "duplicates_only" | "missing_only")}
            disabled={running}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="duplicates_only">Fix Duplicates & SVGs</option>
            <option value="missing_only">Missing Only</option>
            <option value="all">Regenerate All</option>
          </select>
          <Button onClick={runGenerate} disabled={running} className="gradient-hero text-white border-0 shadow-glow">
            {running ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {progress.processed}/{progress.total}</> : mode === "duplicates_only" ? "Fix Duplicates" : "Generate All"}
          </Button>
        </div>
      </div>
      {(running || progress.processed > 0) && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span>Processed: <strong>{progress.processed}</strong></span>
            <span className="text-primary">Updated: <strong>{progress.updated}</strong></span>
            <span className="text-destructive">Errors: <strong>{progress.errors}</strong></span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="gradient-hero h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (progress.processed / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [filter, setFilter] = useState<"pending" | "live" | "hidden">("pending");
  const [stats, setStats] = useState<Stats>({ pending: 0, live: 0, hidden: 0, total: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
    fetchListings();
  }, [isAdmin, filter]);

  async function fetchStats() {
    const { data } = await supabase
      .from("listings")
      .select("status");
    if (data) {
      const pending = data.filter((l) => l.status === "pending").length;
      const live = data.filter((l) => l.status === "live").length;
      const hidden = data.filter((l) => l.status === "hidden").length;
      setStats({ pending, live, hidden, total: data.length });
    }
  }

  async function fetchListings() {
    setDataLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    setListings((data as PendingListing[]) ?? []);
    setDataLoading(false);
  }

  async function updateStatus(id: string, status: "live" | "hidden" | "pending") {
    setActionLoading(id + status);
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const labels: Record<string, string> = { live: "Approved ✓", hidden: "Rejected", pending: "Reset to pending" };
      toast({ title: labels[status] });
      setListings((prev) => prev.filter((l) => l.id !== id));
      fetchStats();
    }
    setActionLoading(null);
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const FILTERS: { key: "pending" | "live" | "hidden"; label: string; count: number }[] = [
    { key: "pending", label: "Pending Review", count: stats.pending },
    { key: "live", label: "Live", count: stats.live },
    { key: "hidden", label: "Rejected", count: stats.hidden },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Marketplace moderation</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link to="/boardroom">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Crown className="h-3.5 w-3.5" /> Board Room
              </Button>
            </Link>
            <Link to="/admin/outreach">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Outreach
              </Button>
            </Link>
            <Link to="/swarm">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bot className="h-3.5 w-3.5" /> AI Swarm
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total listings", value: stats.total, icon: <BarChart3 className="h-4 w-4 text-primary" /> },
            { label: "Pending", value: stats.pending, icon: <Clock className="h-4 w-4 text-orange-500" /> },
            { label: "Live", value: stats.live, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
            { label: "Rejected", value: stats.hidden, icon: <XCircle className="h-4 w-4 text-destructive" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                {icon}
              </div>
              <p className="text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                filter === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  key === "pending" ? "bg-orange-100 text-orange-700" :
                  key === "live" ? "bg-green-100 text-green-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings */}
        {dataLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-bold mb-1">All clear!</h3>
            <p className="text-sm text-muted-foreground">No {filter} listings to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
                <div className="flex gap-4 p-5">
                  {/* Thumbnail */}
                  {listing.screenshots?.[0] ? (
                    <div className="flex-shrink-0 h-20 w-28 rounded-xl overflow-hidden bg-muted">
                      <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-20 w-28 rounded-xl gradient-hero opacity-40 flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold leading-snug">{listing.title}</h3>
                      <span className="flex-shrink-0 font-black text-lg">${(listing.price / 100).toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{listing.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize">{listing.category.replace("_", " ")}</span>
                      {listing.tech_stack?.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/listing/${listing.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                          <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                      </Link>
                      {filter !== "live" && (
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                          disabled={actionLoading === listing.id + "live"}
                          onClick={() => updateStatus(listing.id, "live")}
                        >
                          {actionLoading === listing.id + "live" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                      )}
                      {filter !== "hidden" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-3 text-xs"
                          disabled={actionLoading === listing.id + "hidden"}
                          onClick={() => updateStatus(listing.id, "hidden")}
                        >
                          {actionLoading === listing.id + "hidden" ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          Reject
                        </Button>
                      )}
                      {filter !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          disabled={actionLoading === listing.id + "pending"}
                          onClick={() => updateStatus(listing.id, "pending")}
                        >
                          Reset to pending
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Flagged Listings Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold">Community Flags</h2>
          </div>
          <AdminFlagReview />
        </div>

        {/* Deep Market Research */}
        <div className="mt-12 pt-8 border-t border-border">
          <AdminMarketResearch />
        </div>

        {/* AI Concept Generator */}
        <div className="mt-12 pt-8 border-t border-border">
          <AdminConceptGenerator />
        </div>

        {/* Backfill Template ZIPs */}
        <div className="mt-12 pt-8 border-t border-border">
          <BackfillZipsPanel />
        </div>

        {/* Patch Deploy Configs */}
        <div className="mt-12 pt-8 border-t border-border">
          <PatchDeployConfigsPanel />
        </div>

        {/* Generate Unique Screenshots */}
        <div className="mt-12 pt-8 border-t border-border">
          <GenerateScreenshotsPanel />
        </div>

        {/* Discount Codes Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <AdminDiscountCodes />
        </div>
      </main>
      <Footer />
    </div>
  );
}
