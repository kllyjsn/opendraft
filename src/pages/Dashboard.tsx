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
import { TrendingUp, Package, Eye, Trash2, Plus, ShoppingBag, HandCoins, BarChart3, Rss, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OffersManager } from "@/components/OffersManager";
import { SellerAnalytics } from "@/components/SellerAnalytics";
import { ActivityFeed } from "@/components/ActivityFeed";
import { VerifyListingPanel } from "@/components/VerifyListingPanel";

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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  live: { label: "Live", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  hidden: { label: "Hidden", className: "bg-muted text-muted-foreground" },
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SaleSummary>({ total_earned: 0, total_sales: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feed" | "listings" | "offers" | "sales" | "analytics">(
    (new URLSearchParams(window.location.search).get("tab") as "feed" | "listings" | "offers" | "sales" | "analytics") || "feed"
  );

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
      // Fetch actual purchase records for sales history
      const { data } = await supabase
        .from("purchases")
        .select("id,created_at,amount_paid,seller_amount,platform_fee,listing_id,buyer_id,listings(title)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const salesData = (data as unknown as Sale[]) ?? [];
      setSales(salesData);

      // Use profile-level counters as the source of truth for summary stats
      // (purchase records may be missing due to webhook edge cases)
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_sales")
        .eq("user_id", user!.id)
        .single();

      const profileTotalSales = profile?.total_sales ?? 0;
      const purchaseBasedSales = salesData.length;
      const purchaseBasedEarnings = salesData.reduce((s, p) => s + (p.seller_amount ?? 0), 0);

      // Use whichever is higher — profile counter or purchase records
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

  const stats = [
    {
      label: "Total earned",
      value: `$${(summary.total_earned / 100).toFixed(2)}`,
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      accent: "from-primary/10 to-primary/5",
    },
    {
      label: "Total sales",
      value: summary.total_sales,
      icon: <Package className="h-5 w-5 text-secondary" />,
      accent: "from-secondary/10 to-secondary/5",
    },
    {
      label: "Active listings",
      value: listings.filter((l) => l.status === "live").length,
      icon: <Eye className="h-5 w-5 text-accent" />,
      accent: "from-accent/10 to-accent/5",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your listings and track earnings</p>
          </div>
          <Link to="/sell">
            <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4 mr-2" /> New listing
            </Button>
          </Link>
        </div>

        {/* Stripe Connect + Product Creation */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StripeConnectPanel />
          <CreateProductPanel />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map(({ label, value, icon, accent }) => (
            <div key={label} className={`rounded-2xl border border-border/60 bg-gradient-to-br ${accent} p-5 shadow-card`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <div className="rounded-lg bg-background/60 p-1.5">{icon}</div>
              </div>
              <p className="text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-xl bg-muted/50 p-1 w-fit">
          {([
            { key: "feed" as const, label: "Feed", icon: <Rss className="h-3.5 w-3.5" /> },
            { key: "listings" as const, label: "Listings", icon: <Package className="h-3.5 w-3.5" /> },
            { key: "offers" as const, label: "Offers", icon: <HandCoins className="h-3.5 w-3.5" /> },
            { key: "sales" as const, label: "Sales", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
            { key: "analytics" as const, label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {activeTab === "feed" && <ActivityFeed />}

        {activeTab === "offers" && <OffersManager />}

        {activeTab === "listings" && (
          <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Your listings</h2>
          <span className="text-sm text-muted-foreground">{listings.length} total</span>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="font-bold mb-1">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-5">Create your first listing to start earning</p>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">Create listing</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Listing</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sales</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Views</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {listings.map((l) => (
                    <React.Fragment key={l.id}>
                      <tr className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Link to={`/listing/${l.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">
                              {l.title}
                            </Link>
                            <CompletenessBadge level={l.completeness_badge} showTooltip={false} />
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold">${(l.price / 100).toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[l.status]?.className}`}>
                            {statusConfig[l.status]?.label ?? l.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{l.sales_count}</td>
                        <td className="px-5 py-4 text-muted-foreground">{l.view_count}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/listing/${l.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Link to={`/listing/${l.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteListing(l.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {(l.demo_url || l.github_url) && !l.domain_verified && (
                        <tr>
                          <td colSpan={6} className="px-5 pb-4 pt-0">
                            <VerifyListingPanel
                              listingId={l.id}
                              demoUrl={l.demo_url}
                              githubUrl={l.github_url}
                              domainVerified={l.domain_verified}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          </>
        )}

        {activeTab === "sales" && (
          <>
        {/* Sales History */}
        <div className="flex items-center gap-2 mt-0 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Sales history</h2>
          {sales.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">{sales.length} transactions</span>
          )}
        </div>

        {sales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground text-sm">
            No sales yet — they'll appear here once a buyer completes checkout.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sale price</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Platform fee</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">You received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-medium max-w-[200px] truncate">
                        {sale.listings?.title ?? <span className="text-muted-foreground italic">Deleted listing</span>}
                      </td>
                      <td className="px-5 py-4">${(sale.amount_paid / 100).toFixed(2)}</td>
                      <td className="px-5 py-4 text-muted-foreground">−${(sale.platform_fee / 100).toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-primary">${(sale.seller_amount / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t border-border/60">
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-sm font-semibold text-muted-foreground text-right">
                      Total transferred to your account:
                    </td>
                    <td className="px-5 py-4 font-black text-primary text-base">
                      ${(summary.total_earned / 100).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === "analytics" && <SellerAnalytics />}
      </main>
      <Footer />
    </div>
  );
}
