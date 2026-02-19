import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { StripeConnectPanel } from "@/components/StripeConnectPanel";
import { CreateProductPanel } from "@/components/CreateProductPanel";
import { TrendingUp, Package, Eye, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  status: "pending" | "live" | "hidden";
  sales_count: number;
  view_count: number;
  created_at: string;
}

interface SaleSummary {
  total_earned: number;
  total_sales: number;
}

const statusStyle: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  live: "bg-green-100 text-green-700",
  hidden: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [summary, setSummary] = useState<SaleSummary>({ total_earned: 0, total_sales: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchListings() {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,completeness_badge,status,sales_count,view_count,created_at")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) ?? []);
      setDataLoading(false);
    }

    async function fetchSummary() {
      const { data } = await supabase
        .from("purchases")
        .select("seller_amount")
        .eq("seller_id", user!.id);
      if (data) {
        setSummary({
          total_earned: data.reduce((s, p) => s + (p.seller_amount ?? 0), 0),
          total_sales: data.length,
        });
      }
    }

    fetchListings();
    fetchSummary();
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your listings and track earnings</p>
          </div>
          <Link to="/sell">
            <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> New listing
            </Button>
          </Link>
        </div>

        {/* Stripe Connect + Product Creation */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StripeConnectPanel />
          <CreateProductPanel />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              label: "Total earned",
              value: `$${(summary.total_earned / 100).toFixed(2)}`,
              icon: <TrendingUp className="h-5 w-5 text-primary" />,
            },
            {
              label: "Total sales",
              value: summary.total_sales,
              icon: <Package className="h-5 w-5 text-secondary" />,
            },
            {
              label: "Active listings",
              value: listings.filter((l) => l.status === "live").length,
              icon: <Eye className="h-5 w-5 text-accent" />,
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                {icon}
              </div>
              <p className="text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Listings table */}
        <h2 className="text-xl font-bold mb-4">Your listings</h2>
        {dataLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold mb-1">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first listing to start earning</p>
            <Link to="/sell">
              <Button className="gradient-hero text-white border-0">Create listing</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Listing</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sales</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Views</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/listing/${l.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                            {l.title}
                          </Link>
                          <CompletenessBadge level={l.completeness_badge} showTooltip={false} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">${(l.price / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[l.status]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{l.sales_count}</td>
                      <td className="px-4 py-3">{l.view_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link to={`/listing/${l.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteListing(l.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
