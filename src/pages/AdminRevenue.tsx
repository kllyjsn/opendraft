/**
 * Admin Revenue Dashboard
 * -----------------------
 * Real-time MRR, signups, funnel conversion, and cohort metrics.
 * Admin-only — protected by useAdmin hook.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Users, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, BarChart3, Target, Zap } from "lucide-react";

interface RevenueMetrics {
  mrr: number;
  totalRevenue: number;
  activeSubscribers: number;
  totalSignups: number;
  signupsThisWeek: number;
  signupsLastWeek: number;
  totalPurchases: number;
  purchasesThisWeek: number;
  purchasesLastWeek: number;
  freeClaimsThisWeek: number;
  paidConversions: number;
  conversionRate: number;
  avgRevenuePerUser: number;
  planBreakdown: Record<string, number>;
  funnelSteps: { step: string; count: number; rate: number }[];
  recentSubscribers: { user_id: string; plan: string; created_at: string }[];
  recentPurchases: { buyer_id: string; listing_id: string; amount_paid: number; created_at: string }[];
  dailySignups: { date: string; count: number }[];
}

function StatCard({ label, value, subvalue, icon: Icon, trend, trendUp }: {
  label: string;
  value: string;
  subvalue?: string;
  icon: any;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trendUp ? "text-emerald-500" : "text-red-400"}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {subvalue && <p className="text-xs text-muted-foreground mt-1 opacity-70">{subvalue}</p>}
    </div>
  );
}

function FunnelBar({ step, count, rate, maxCount }: { step: string; count: number; rate: number; maxCount: number }) {
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, 4) : 4;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-muted-foreground truncate text-right">{step}</div>
      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-lg transition-all duration-500"
          style={{ width: `${width}%` }}
        />
        <span className="absolute inset-0 flex items-center px-3 text-xs font-bold">
          {count.toLocaleString()} {rate > 0 && `(${rate.toFixed(1)}%)`}
        </span>
      </div>
    </div>
  );
}

export default function AdminRevenue() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    loadMetrics();
  }, [isAdmin]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        subsResult,
        profilesResult,
        purchasesResult,
        recentPurchasesResult,
        funnelResult,
      ] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("status", "active"),
        supabase.from("profiles").select("user_id, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("purchases").select("buyer_id, listing_id, amount_paid, created_at, platform_fee").order("created_at", { ascending: false }).limit(1000),
        supabase.from("purchases").select("buyer_id, listing_id, amount_paid, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("activity_log").select("event_type, created_at").like("event_type", "funnel:%").gte("created_at", thirtyDaysAgo.toISOString()).limit(1000),
      ]);

      const subs = subsResult.data || [];
      const profiles = profilesResult.data || [];
      const purchases = purchasesResult.data || [];
      const recentPurchases = recentPurchasesResult.data || [];
      const funnelEvents = funnelResult.data || [];

      // MRR calculation
      const planPrices: Record<string, number> = {
        starter: 20, growth: 30, unlimited: 50, pro: 50, agency: 99, enterprise: 199,
      };
      const planBreakdown: Record<string, number> = {};
      let mrr = 0;
      for (const sub of subs) {
        const plan = sub.plan || "pro";
        planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
        mrr += planPrices[plan] || 0;
      }

      // Total revenue from purchases (platform fees)
      const totalRevenue = purchases.reduce((sum, p) => sum + (p.platform_fee || 0), 0) / 100;

      // Signups
      const signupsThisWeek = profiles.filter(p => new Date(p.created_at) >= weekAgo).length;
      const signupsLastWeek = profiles.filter(p => {
        const d = new Date(p.created_at);
        return d >= twoWeeksAgo && d < weekAgo;
      }).length;

      // Purchases this week / last week
      const purchasesThisWeek = purchases.filter(p => new Date(p.created_at) >= weekAgo).length;
      const purchasesLastWeek = purchases.filter(p => {
        const d = new Date(p.created_at);
        return d >= twoWeeksAgo && d < weekAgo;
      }).length;

      // Free claims (amount_paid = 0)
      const freeClaimsThisWeek = purchases.filter(p => new Date(p.created_at) >= weekAgo && p.amount_paid === 0).length;

      // Conversion: signups that became subscribers
      const subUserIds = new Set(subs.map(s => s.user_id));
      const paidConversions = profiles.filter(p => subUserIds.has(p.user_id)).length;
      const conversionRate = profiles.length > 0 ? (paidConversions / profiles.length) * 100 : 0;
      const avgRevenuePerUser = profiles.length > 0 ? (mrr + totalRevenue) / profiles.length : 0;

      // Funnel from activity_log
      const funnelCounts: Record<string, number> = {};
      for (const e of funnelEvents) {
        const step = e.event_type.replace("funnel:", "");
        funnelCounts[step] = (funnelCounts[step] || 0) + 1;
      }
      const funnelOrder = ["page_view", "signup_completed", "listing_viewed", "claim_started", "claim_completed", "subscribe_started", "subscribe_completed"];
      const funnelSteps = funnelOrder.map((step, i) => {
        const count = funnelCounts[step] || 0;
        const prevCount = i === 0 ? count : (funnelCounts[funnelOrder[i - 1]] || 1);
        return { step: step.replace(/_/g, " "), count, rate: i === 0 ? 100 : (count / prevCount) * 100 };
      });

      // Daily signups (last 14 days)
      const dailySignups: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        const count = profiles.filter(p => p.created_at.startsWith(dateStr)).length;
        dailySignups.push({ date: dateStr, count });
      }

      // Recent subscribers
      const recentSubs = subs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(s => ({ user_id: s.user_id, plan: s.plan, created_at: s.created_at }));

      setMetrics({
        mrr,
        totalRevenue,
        activeSubscribers: subs.length,
        totalSignups: profiles.length,
        signupsThisWeek,
        signupsLastWeek,
        totalPurchases: purchases.length,
        purchasesThisWeek,
        purchasesLastWeek,
        freeClaimsThisWeek,
        paidConversions,
        conversionRate,
        avgRevenuePerUser,
        planBreakdown,
        funnelSteps,
        recentSubscribers: recentSubs,
        recentPurchases: recentPurchases.map(p => ({
          buyer_id: p.buyer_id,
          listing_id: p.listing_id,
          amount_paid: p.amount_paid,
          created_at: p.created_at,
        })),
        dailySignups,
      });
    } catch (err) {
      console.error("Failed to load revenue metrics:", err);
    }
    setLoading(false);
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const signupTrend = metrics && metrics.signupsLastWeek > 0
    ? `${((metrics.signupsThisWeek - metrics.signupsLastWeek) / metrics.signupsLastWeek * 100).toFixed(0)}% WoW`
    : undefined;
  const purchaseTrend = metrics && metrics.purchasesLastWeek > 0
    ? `${((metrics.purchasesThisWeek - metrics.purchasesLastWeek) / metrics.purchasesLastWeek * 100).toFixed(0)}% WoW`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Revenue Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time metrics for the $10K/mo goal</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Goal Progress</p>
            <p className="text-2xl font-black text-primary">
              ${metrics ? metrics.mrr.toLocaleString() : "—"} <span className="text-sm text-muted-foreground font-normal">/ $10,000 MRR</span>
            </p>
            {metrics && (
              <div className="w-48 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.mrr / 10000) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : metrics ? (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Monthly Recurring Revenue"
                value={`$${metrics.mrr.toLocaleString()}`}
                subvalue={`${metrics.activeSubscribers} active subs`}
                icon={DollarSign}
              />
              <StatCard
                label="Signups This Week"
                value={metrics.signupsThisWeek.toString()}
                subvalue={`${metrics.totalSignups} total`}
                icon={Users}
                trend={signupTrend}
                trendUp={metrics.signupsThisWeek >= metrics.signupsLastWeek}
              />
              <StatCard
                label="Claims This Week"
                value={metrics.purchasesThisWeek.toString()}
                subvalue={`${metrics.freeClaimsThisWeek} free · ${metrics.purchasesThisWeek - metrics.freeClaimsThisWeek} paid`}
                icon={ShoppingBag}
                trend={purchaseTrend}
                trendUp={metrics.purchasesThisWeek >= metrics.purchasesLastWeek}
              />
              <StatCard
                label="Conversion Rate"
                value={`${metrics.conversionRate.toFixed(1)}%`}
                subvalue={`${metrics.paidConversions} paid of ${metrics.totalSignups} signups`}
                icon={Target}
              />
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Platform Revenue (Fees)"
                value={`$${metrics.totalRevenue.toFixed(0)}`}
                icon={TrendingUp}
              />
              <StatCard
                label="Avg Revenue / User"
                value={`$${metrics.avgRevenuePerUser.toFixed(2)}`}
                icon={BarChart3}
              />
              <StatCard
                label="Total Claims"
                value={metrics.totalPurchases.toString()}
                icon={Zap}
              />
              <StatCard
                label="Active Subscribers"
                value={metrics.activeSubscribers.toString()}
                icon={Users}
              />
            </div>

            {/* Plan breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">Subscription Breakdown</h3>
                {Object.entries(metrics.planBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(metrics.planBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <span className="text-sm capitalize font-medium">{plan}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(count / metrics.activeSubscribers) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active subscriptions yet</p>
                )}
              </div>

              {/* Daily signups chart */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">Daily Signups (14 days)</h3>
                <div className="flex items-end gap-1 h-32">
                  {metrics.dailySignups.map((d) => {
                    const max = Math.max(...metrics.dailySignups.map(x => x.count), 1);
                    const height = Math.max((d.count / max) * 100, 4);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                        <span className="text-[10px] text-muted-foreground">{d.count || ""}</span>
                        <div
                          className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">14d ago</span>
                  <span className="text-[10px] text-muted-foreground">Today</span>
                </div>
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-8">
              <h3 className="font-bold mb-4">Conversion Funnel (Last 30 Days)</h3>
              {metrics.funnelSteps.some(s => s.count > 0) ? (
                <div className="space-y-2.5">
                  {metrics.funnelSteps.map((step) => (
                    <FunnelBar
                      key={step.step}
                      step={step.step}
                      count={step.count}
                      rate={step.rate}
                      maxCount={metrics.funnelSteps[0]?.count || 1}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Funnel data will appear as users interact with the platform. Events are tracked automatically.</p>
              )}
            </div>

            {/* Recent activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">Recent Subscribers</h3>
                {metrics.recentSubscribers.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recentSubscribers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{s.user_id.slice(0, 8)}…</span>
                        <div className="flex items-center gap-3">
                          <span className="capitalize font-medium text-primary">{s.plan}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No subscribers yet</p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">Recent Claims</h3>
                {metrics.recentPurchases.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recentPurchases.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{p.buyer_id.slice(0, 8)}…</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{p.amount_paid === 0 ? "Free" : `$${(p.amount_paid / 100).toFixed(0)}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No claims yet</p>
                )}
              </div>
            </div>

            {/* $10K Roadmap */}
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 mt-8">
              <h3 className="font-bold text-lg mb-3">📊 Path to $10K MRR</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-bold text-primary mb-1">Subscriptions needed</p>
                  <p className="text-muted-foreground">
                    {Math.ceil((10000 - metrics.mrr) / 30)} Growth subs or {Math.ceil((10000 - metrics.mrr) / 99)} Agency subs
                  </p>
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">At current conversion</p>
                  <p className="text-muted-foreground">
                    {metrics.conversionRate > 0
                      ? `Need ${Math.ceil(Math.ceil((10000 - metrics.mrr) / 30) / (metrics.conversionRate / 100))} signups`
                      : "Start converting signups to subs"}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-primary mb-1">Weekly signup target</p>
                  <p className="text-muted-foreground">
                    {metrics.conversionRate > 0
                      ? `${Math.ceil(Math.ceil((10000 - metrics.mrr) / 30) / (metrics.conversionRate / 100) / 12)} signups/week for 3 months`
                      : "Focus on converting first users"}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
