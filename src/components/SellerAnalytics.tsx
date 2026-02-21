import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from "recharts";
import { TrendingUp, Eye, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingAnalytics {
  id: string;
  title: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

interface EarningsOverTime {
  date: string;
  earnings: number;
  sales: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

const TIME_RANGES = ["7d", "30d", "90d", "All"] as const;
type TimeRange = typeof TIME_RANGES[number];

function getDateThreshold(range: TimeRange): Date | null {
  if (range === "All") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function SellerAnalytics() {
  const { user } = useAuth();
  const [listingData, setListingData] = useState<ListingAnalytics[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsOverTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      setLoading(true);
      const threshold = getDateThreshold(timeRange);

      let purchaseQuery = supabase
        .from("purchases")
        .select("listing_id, seller_amount, created_at")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: true });

      if (threshold) {
        purchaseQuery = purchaseQuery.gte("created_at", threshold.toISOString());
      }

      const [{ data: listings }, { data: purchases }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, view_count, sales_count")
          .eq("seller_id", user!.id),
        purchaseQuery,
      ]);

      const listingMap = new Map<string, ListingAnalytics>();
      (listings ?? []).forEach((l) => {
        listingMap.set(l.id, {
          id: l.id,
          title: l.title.length > 25 ? l.title.slice(0, 25) + "…" : l.title,
          views: l.view_count ?? 0,
          sales: l.sales_count ?? 0,
          revenue: 0,
          conversionRate: (l.view_count ?? 0) > 0
            ? ((l.sales_count ?? 0) / (l.view_count ?? 1)) * 100
            : 0,
        });
      });

      const earningsByDate = new Map<string, { earnings: number; sales: number }>();
      (purchases ?? []).forEach((p) => {
        const item = listingMap.get(p.listing_id);
        if (item) item.revenue += p.seller_amount ?? 0;

        const date = new Date(p.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const existing = earningsByDate.get(date) ?? { earnings: 0, sales: 0 };
        existing.earnings += (p.seller_amount ?? 0);
        existing.sales += 1;
        earningsByDate.set(date, existing);
      });

      setListingData(
        Array.from(listingMap.values()).sort((a, b) => b.revenue - a.revenue)
      );
      setEarningsData(
        Array.from(earningsByDate.entries()).map(([date, d]) => ({
          date,
          earnings: d.earnings / 100,
          sales: d.sales,
        }))
      );
      setLoading(false);
    }

    fetchAnalytics();
  }, [user, timeRange]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const totalViews = listingData.reduce((s, l) => s + l.views, 0);
  const totalSales = listingData.reduce((s, l) => s + l.sales, 0);
  const totalRevenue = listingData.reduce((s, l) => s + l.revenue, 0);
  const avgConversion = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
  const periodSales = earningsData.reduce((s, d) => s + d.sales, 0);
  const periodRevenue = earningsData.reduce((s, d) => s + d.earnings, 0);

  const summaryCards = [
    { label: "Total views", value: totalViews.toLocaleString(), icon: <Eye className="h-4 w-4" />, color: "text-primary" },
    { label: "Conversion rate", value: `${avgConversion.toFixed(1)}%`, icon: <ArrowUpRight className="h-4 w-4" />, color: "text-secondary" },
    { label: `Sales (${timeRange})`, value: periodSales, icon: <ShoppingCart className="h-4 w-4" />, color: "text-accent" },
    { label: `Revenue (${timeRange})`, value: `$${periodRevenue.toFixed(2)}`, icon: <DollarSign className="h-4 w-4" />, color: "text-primary" },
  ];

  if (listingData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-bold mb-1">No analytics yet</h3>
        <p className="text-muted-foreground text-sm">Analytics will appear once you have listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {TIME_RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={timeRange === r ? "default" : "outline"}
              onClick={() => setTimeRange(r)}
              className={timeRange === r
                ? "gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-7 px-3 text-xs"
                : "border-border/60 text-muted-foreground hover:text-foreground h-7 px-3 text-xs"
              }
            >
              {r === "All" ? "All time" : r}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <span className={c.color}>{c.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-2xl font-black">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend (area chart) */}
      {earningsData.length > 1 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Revenue trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 13,
                }}
                formatter={(value: number, name: string) => [
                  name === "earnings" ? `$${value.toFixed(2)}` : value,
                  name === "earnings" ? "Revenue" : "Sales",
                ]}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--secondary))" }}
                yAxisId={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Views vs Sales bar chart */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Views vs Sales per listing</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={listingData.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Views" />
              <Bar dataKey="sales" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue pie chart */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Revenue by listing</h3>
          {listingData.filter((l) => l.revenue > 0).length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={listingData.filter((l) => l.revenue > 0)}
                  dataKey="revenue"
                  nameKey="title"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                  label={({ title, percent }) => `${title} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {listingData.filter((l) => l.revenue > 0).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Conversion table */}
      <div className="rounded-2xl border border-border/60 overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/60">
            <tr>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Listing</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Views</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sales</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conv. Rate</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {listingData.map((l) => (
              <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 font-medium">{l.title}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{l.views.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{l.sales}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`inline-flex items-center gap-0.5 font-semibold ${l.conversionRate > 5 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {l.conversionRate > 5 ? <ArrowUpRight className="h-3 w-3" /> : l.conversionRate > 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {l.conversionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-bold text-primary">${(l.revenue / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
