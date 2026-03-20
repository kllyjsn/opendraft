import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { StripeConnectPanel } from "@/components/StripeConnectPanel";
import { CreateProductPanel } from "@/components/CreateProductPanel";
import {
  TrendingUp, Eye, Trash2, Plus,
  BarChart3, Rss, Pencil, GitFork, Hammer, ArrowUpRight,
  DollarSign, Layers, ChevronDown, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SellerAnalytics } from "@/components/SellerAnalytics";
import { ActivityFeed } from "@/components/ActivityFeed";
import { VerifyListingPanel } from "@/components/VerifyListingPanel";
import { AgentDemandFeed } from "@/components/AgentDemandFeed";
import { ForkRequestsManager } from "@/components/ForkRequestsManager";
import { ImprovementDashboard } from "@/components/ImprovementDashboard";
import { ActiveBuilds, ActiveBuildsBanner } from "@/components/ActiveBuilds";

interface Sale {
  id: string;
  created_at: string;
  amount_paid: number;
  seller_amount: number;
  platform_fee: number;
  listing_id: string;
  buyer_id: string;
  listings: { title: string } | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  status: "pending" | "live" | "hidden";
  sales_count: number;
  view_count: number;
  created_at: string;
  demo_url: string | null;
  github_url: string | null;
  domain_verified: boolean;
}

interface SaleSummary {
  total_earned: number;
  total_sales: number;
}

type TabKey = "builds" | "projects" | "improve";

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  live: "bg-emerald-400",
  hidden: "bg-muted-foreground/40",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SaleSummary>({ total_earned: 0, total_sales: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(
    (new URLSearchParams(window.location.search).get("tab") as TabKey) || "builds"
  );
  const [sellerOpen, setSellerOpen] = useState(false);
  const [sellerSection, setSellerSection] = useState<"revenue" | "analytics" | "forks" | "feed">("revenue");

  useEffect(() => {
    if (!user) return;

    async function fetchListings() {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,completeness_badge,status,sales_count,view_count,created_at,demo_url,github_url,domain_verified")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) ?? []);
      setDataLoading(false);
    }

    async function fetchSales() {
      const { data } = await supabase
        .from("purchases")
        .select("id,created_at,amount_paid,seller_amount,platform_fee,listing_id,buyer_id,listings(title)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const salesData = (data as unknown as Sale[]) ?? [];
      setSales(salesData);

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_sales")
        .eq("user_id", user!.id)
        .single();

      const profileTotalSales = profile?.total_sales ?? 0;
      const purchaseBasedSales = salesData.length;
      const purchaseBasedEarnings = salesData.reduce((s, p) => s + (p.seller_amount ?? 0), 0);
      const actualSales = Math.max(profileTotalSales, purchaseBasedSales);

      setSummary({
        total_earned: purchaseBasedEarnings,
        total_sales: actualSales,
      });
    }

    fetchListings();
    fetchSales();
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  async function deleteListing(id: string) {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Listing deleted" });
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "builds", label: "Builds", icon: <Hammer className="h-4 w-4" /> },
    { key: "projects", label: "Projects", icon: <Layers className="h-4 w-4" /> },
    { key: "improve", label: "Improve", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const sellerSections = [
    { key: "revenue" as const, label: "Revenue", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { key: "analytics" as const, label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "forks" as const, label: "Forks", icon: <GitFork className="h-3.5 w-3.5" /> },
    { key: "feed" as const, label: "Feed", icon: <Rss className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 page-enter">
        <ActiveBuildsBanner />

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Your apps
              </h1>
            </div>
            <Link to="/">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New build</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-border/40 mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-0 min-w-max">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        {activeTab === "builds" && <ActiveBuilds />}

        {activeTab === "projects" && (
          <ListingsTab
            listings={listings}
            dataLoading={dataLoading}
            onDelete={deleteListing}
          />
        )}

        {activeTab === "improve" && <ImprovementDashboard />}

        {/* ── Collapsible seller tools ── */}
        <div className="mt-16 border-t border-border/30 pt-8">
          <button
            onClick={() => setSellerOpen(!sellerOpen)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            {sellerOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Seller tools</span>
            {summary.total_sales > 0 && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full tabular-nums">
                {summary.total_sales} sale{summary.total_sales !== 1 ? "s" : ""}
              </span>
            )}
          </button>

          {sellerOpen && (
            <div className="mt-6 space-y-6">
              {/* Stripe + Product panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StripeConnectPanel />
                <CreateProductPanel />
              </div>

              {/* Seller sub-nav */}
              <div className="flex gap-1 flex-wrap">
                {sellerSections.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setSellerSection(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      sellerSection === key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Seller content */}
              {sellerSection === "revenue" && (
                <SalesTab sales={sales} summary={summary} />
              )}
              {sellerSection === "analytics" && <SellerAnalytics />}
              {sellerSection === "forks" && <ForkRequestsManager />}
              {sellerSection === "feed" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ActivityFeed />
                  </div>
                  <div>
                    <AgentDemandFeed />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── Listings sub-tab ── */
function ListingsTab({
  listings,
  dataLoading,
  onDelete,
}: {
  listings: Listing[];
  dataLoading: boolean;
  onDelete: (id: string) => void;
}) {
  if (dataLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 py-16 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="font-semibold mb-1">No projects yet</h3>
        <p className="text-muted-foreground text-sm mb-5">
          Build your first app from the homepage
        </p>
        <Link to="/">
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start a build
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {listings.map((l) => (
        <div key={l.id} className="group">
          <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 px-4 py-3.5 hover:border-border/60 transition-colors">
            <div className={`h-2 w-2 rounded-full shrink-0 ${statusDot[l.status] ?? "bg-muted-foreground/40"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/listing/${l.id}`}
                  className="font-medium text-sm hover:text-primary transition-colors truncate"
                >
                  {l.title}
                </Link>
                <CompletenessBadge level={l.completeness_badge} showTooltip={false} />
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{l.view_count} views</span>
                <span className="text-border">·</span>
                <span>{l.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/listing/${l.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to={`/listing/${l.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(l.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {(l.demo_url || l.github_url) && !l.domain_verified && (
            <div className="ml-6 mt-1 mb-2">
              <VerifyListingPanel
                listingId={l.id}
                demoUrl={l.demo_url}
                githubUrl={l.github_url}
                domainVerified={l.domain_verified}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Sales sub-tab ── */
function SalesTab({ sales, summary }: { sales: Sale[]; summary: SaleSummary }) {
  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 py-16 text-center">
        <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          No revenue yet — sales appear here once a buyer completes checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 bg-card/50 p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total transferred</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            ${(summary.total_earned / 100).toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold tabular-nums mt-1">{sales.length}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 px-4 py-3 text-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {sale.listings?.title ?? <span className="text-muted-foreground italic">Deleted</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(sale.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold tabular-nums">
                +${(sale.seller_amount / 100).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                of ${(sale.amount_paid / 100).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
