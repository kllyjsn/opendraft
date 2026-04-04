/**
 * Admin Revenue Dashboard
 * -----------------------
 * Enterprise "Okta for Owned Apps" revenue model
 * Real-time MRR + multi-scenario ARR forecasting
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, TrendingUp, Users, DollarSign, ShoppingBag, ArrowUpRight,
  ArrowDownRight, BarChart3, Target, Building2, Layers, Calculator,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──

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
  orgCount: number;
  orgMemberCount: number;
  orgListingCount: number;
}

// ── Plan economics (monthly) ──
const PLAN_MRR: Record<string, number> = {
  free: 0, starter: 29, team: 99, enterprise: 499,
};

// ── Forecast scenarios ──
interface Scenario {
  name: string;
  description: string;
  months: number;
  // Monthly new customer acquisition by plan
  newTeamPerMonth: number;
  newEnterprisePerMonth: number;
  newStarterPerMonth: number;
  // Expansion: % of existing Team that upgrade to Enterprise per month
  teamToEnterpriseRate: number;
  // Churn: monthly logo churn rate
  monthlyChurnRate: number;
  // Marketplace tx revenue per month (platform fees from app purchases)
  marketplaceTxPerMonth: number;
}

const SCENARIOS: Scenario[] = [
  {
    name: "Conservative",
    description: "Organic growth, minimal outbound. 1 enterprise deal/quarter.",
    months: 18,
    newTeamPerMonth: 3,
    newEnterprisePerMonth: 0.33,
    newStarterPerMonth: 8,
    teamToEnterpriseRate: 0.05,
    monthlyChurnRate: 0.04,
    marketplaceTxPerMonth: 500,
  },
  {
    name: "Base Case",
    description: "Active enterprise sales + content engine. 1 enterprise deal/month by M6.",
    months: 18,
    newTeamPerMonth: 6,
    newEnterprisePerMonth: 1,
    newStarterPerMonth: 15,
    teamToEnterpriseRate: 0.08,
    monthlyChurnRate: 0.03,
    marketplaceTxPerMonth: 1500,
  },
  {
    name: "Aggressive",
    description: "Strong product-market fit. 2+ enterprise deals/month. Viral team adoption.",
    months: 18,
    newTeamPerMonth: 12,
    newEnterprisePerMonth: 2.5,
    newStarterPerMonth: 25,
    teamToEnterpriseRate: 0.12,
    monthlyChurnRate: 0.025,
    marketplaceTxPerMonth: 3000,
  },
];

function runForecast(s: Scenario, currentMrr: number) {
  const months: {
    month: number;
    starterCount: number;
    teamCount: number;
    enterpriseCount: number;
    subscriptionMrr: number;
    txRevenue: number;
    totalMrr: number;
    arr: number;
  }[] = [];

  let starter = 0, team = 0, enterprise = 0;
  // Seed from current MRR roughly
  if (currentMrr > 0) {
    team = Math.floor(currentMrr / 99); // rough approximation
  }

  for (let m = 1; m <= s.months; m++) {
    // New logos
    starter += s.newStarterPerMonth;
    team += s.newTeamPerMonth;
    enterprise += s.newEnterprisePerMonth;

    // Expansion: Team → Enterprise
    const upgrades = Math.floor(team * s.teamToEnterpriseRate);
    team -= upgrades;
    enterprise += upgrades;

    // Churn
    starter = Math.max(0, starter * (1 - s.monthlyChurnRate));
    team = Math.max(0, team * (1 - s.monthlyChurnRate));
    enterprise = Math.max(0, enterprise * (1 - s.monthlyChurnRate));

    const subMrr = Math.round(
      starter * PLAN_MRR.starter +
      team * PLAN_MRR.team +
      enterprise * PLAN_MRR.enterprise
    );
    const totalMrr = subMrr + s.marketplaceTxPerMonth;

    months.push({
      month: m,
      starterCount: Math.round(starter),
      teamCount: Math.round(team),
      enterpriseCount: Math.round(enterprise),
      subscriptionMrr: subMrr,
      txRevenue: s.marketplaceTxPerMonth,
      totalMrr,
      arr: totalMrr * 12,
    });
  }
  return months;
}

// ── Components ──

function StatCard({ label, value, subvalue, icon: Icon, trend, trendUp }: {
  label: string; value: string; subvalue?: string; icon: any; trend?: string; trendUp?: boolean;
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
        <div className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-lg transition-all duration-500" style={{ width: `${width}%` }} />
        <span className="absolute inset-0 flex items-center px-3 text-xs font-bold">
          {count.toLocaleString()} {rate > 0 && `(${rate.toFixed(1)}%)`}
        </span>
      </div>
    </div>
  );
}

function ForecastTable({ scenario, currentMrr }: { scenario: Scenario; currentMrr: number }) {
  const forecast = runForecast(scenario, currentMrr);
  const milestones = [
    { label: "$10K MRR", target: 10000 },
    { label: "$50K MRR", target: 50000 },
    { label: "$100K MRR", target: 100000 },
    { label: "$1M ARR", target: 83334 },
    { label: "$3M ARR", target: 250000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-base">{scenario.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{scenario.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">M18 ARR</p>
          <p className="text-xl font-black text-primary">
            ${(forecast[forecast.length - 1]?.arr || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Milestones */}
      <div className="flex flex-wrap gap-2">
        {milestones.map((ms) => {
          const hitMonth = forecast.find(f => f.totalMrr >= ms.target);
          return (
            <div key={ms.label} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${hitMonth ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border bg-muted text-muted-foreground"}`}>
              {ms.label}: {hitMonth ? `Month ${hitMonth.month}` : "Beyond M18"}
            </div>
          );
        })}
      </div>

      {/* Timeline chart */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Starter</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Team ($99)</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Enterprise ($499)</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Sub MRR</th>
              <th className="text-right py-2 font-medium text-muted-foreground">Tx Rev</th>
              <th className="text-right py-2 font-bold">Total MRR</th>
              <th className="text-right py-2 font-bold">ARR</th>
            </tr>
          </thead>
          <tbody>
            {forecast.filter((_, i) => i % 3 === 0 || i === forecast.length - 1).map((f) => (
              <tr key={f.month} className="border-b border-border/30 hover:bg-muted/30">
                <td className="py-2 font-medium">M{f.month}</td>
                <td className="text-right py-2">{f.starterCount}</td>
                <td className="text-right py-2 font-medium">{f.teamCount}</td>
                <td className="text-right py-2 font-medium text-primary">{f.enterpriseCount}</td>
                <td className="text-right py-2">${f.subscriptionMrr.toLocaleString()}</td>
                <td className="text-right py-2 text-muted-foreground">${f.txRevenue.toLocaleString()}</td>
                <td className="text-right py-2 font-bold">${f.totalMrr.toLocaleString()}</td>
                <td className="text-right py-2 font-bold text-primary">${f.arr.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue mix at M18 */}
      {forecast.length > 0 && (() => {
        const last = forecast[forecast.length - 1];
        const enterpriseRev = last.enterpriseCount * PLAN_MRR.enterprise;
        const teamRev = last.teamCount * PLAN_MRR.team;
        const starterRev = last.starterCount * PLAN_MRR.starter;
        const totalSub = last.subscriptionMrr;
        return (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold mb-3">M18 Revenue Mix</p>
            <div className="space-y-2">
              {[
                { label: "Enterprise ($499/mo)", value: enterpriseRev, count: last.enterpriseCount, color: "bg-primary" },
                { label: "Team ($99/mo)", value: teamRev, count: last.teamCount, color: "bg-primary/60" },
                { label: "Starter ($29/mo)", value: starterRev, count: last.starterCount, color: "bg-primary/30" },
                { label: "Marketplace Tx", value: last.txRevenue, count: null, color: "bg-muted-foreground/40" },
              ].map((seg) => (
                <div key={seg.label} className="flex items-center gap-3">
                  <div className="w-36 text-xs truncate">{seg.label}</div>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div className={`h-full ${seg.color} rounded`} style={{ width: `${Math.max((seg.value / last.totalMrr) * 100, 2)}%` }} />
                  </div>
                  <div className="text-xs font-bold w-20 text-right">${seg.value.toLocaleString()}/mo</div>
                  {seg.count !== null && <div className="text-xs text-muted-foreground w-16 text-right">{seg.count} accts</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Key assumptions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "New Team/mo", value: scenario.newTeamPerMonth },
          { label: "New Enterprise/mo", value: scenario.newEnterprisePerMonth },
          { label: "Team→Enterprise", value: `${(scenario.teamToEnterpriseRate * 100).toFixed(0)}%/mo` },
          { label: "Monthly churn", value: `${(scenario.monthlyChurnRate * 100).toFixed(1)}%` },
        ].map((a) => (
          <div key={a.label} className="rounded-lg bg-muted/50 p-2.5">
            <p className="text-[10px] text-muted-foreground">{a.label}</p>
            <p className="text-sm font-bold">{a.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitEconomics() {
  const acvTeam = 99 * 12;
  const acvEnterprise = 499 * 12;
  const ltv36Team = 99 * 36 * 0.88; // 36 months, ~88% retention over period
  const ltv36Enterprise = 499 * 36 * 0.91;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" /> Unit Economics
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-3">TEAM PLAN ($99/mo)</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ACV</span><span className="font-bold">${acvTeam.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">36-mo LTV (est.)</span><span className="font-bold">${Math.round(ltv36Team).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Target CAC</span><span className="font-bold">{"<"} ${Math.round(acvTeam * 0.4).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">LTV:CAC target</span><span className="font-bold text-primary">{">"} 3:1</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expansion potential</span><span className="font-bold text-primary">→ Enterprise ($499)</span></div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-3">ENTERPRISE PLAN ($499/mo)</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ACV</span><span className="font-bold">${acvEnterprise.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">36-mo LTV (est.)</span><span className="font-bold">${Math.round(ltv36Enterprise).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Target CAC</span><span className="font-bold">{"<"} ${Math.round(acvEnterprise * 0.5).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">LTV:CAC target</span><span className="font-bold text-primary">{">"} 3:1</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Land strategy</span><span className="font-bold">Team → expand</span></div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <strong>Key insight:</strong> 10 Enterprise accounts = $59,880 ARR. 50 Team accounts = $59,400 ARR. 
        Enterprise concentration drives faster path to $1M ARR with lower support load. Land with Team, expand to Enterprise.
      </div>
    </div>
  );
}

function PathToTargets({ currentMrr }: { currentMrr: number }) {
  const targets = [
    { label: "$10K MRR", mrr: 10000 },
    { label: "$50K MRR", mrr: 50000 },
    { label: "$100K MRR", mrr: 100000 },
    { label: "$1M ARR", mrr: 83334 },
    { label: "$3M ARR", mrr: 250000 },
  ];

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" /> Path to Key Milestones
      </h3>
      <div className="grid md:grid-cols-5 gap-4">
        {targets.map((t) => {
          const gap = Math.max(0, t.mrr - currentMrr);
          const pctDone = t.mrr > 0 ? Math.min((currentMrr / t.mrr) * 100, 100) : 0;
          // How many accounts needed
          const enterpriseNeeded = Math.ceil(gap / 499);
          const teamNeeded = Math.ceil(gap / 99);
          const mixNeeded = `${Math.ceil(gap * 0.6 / 499)}E + ${Math.ceil(gap * 0.4 / 99)}T`;
          return (
            <div key={t.label} className="text-center">
              <p className="text-sm font-bold mb-2">{t.label}</p>
              <div className="w-full h-2 bg-muted rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pctDone}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{pctDone.toFixed(1)}% done</p>
              <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                <p><strong>{enterpriseNeeded}</strong> Enterprise accts</p>
                <p>or <strong>{teamNeeded}</strong> Team accts</p>
                <p>or mix: {mixNeeded}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──

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
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

      const [
        subsResult, profilesResult, purchasesResult, recentPurchasesResult,
        funnelResult, orgsResult, orgMembersResult, orgListingsResult,
      ] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("status", "active"),
        supabase.from("profiles").select("user_id, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("purchases").select("buyer_id, listing_id, amount_paid, created_at, platform_fee").order("created_at", { ascending: false }).limit(1000),
        supabase.from("purchases").select("buyer_id, listing_id, amount_paid, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("activity_log").select("event_type, created_at").like("event_type", "funnel:%").gte("created_at", thirtyDaysAgo.toISOString()).limit(1000),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("org_members").select("id", { count: "exact", head: true }),
        supabase.from("org_listings").select("id", { count: "exact", head: true }),
      ]);

      const subs = subsResult.data || [];
      const profiles = profilesResult.data || [];
      const purchases = purchasesResult.data || [];
      const recentPurchases = recentPurchasesResult.data || [];
      const funnelEvents = funnelResult.data || [];

      const planBreakdown: Record<string, number> = {};
      let mrr = 0;
      for (const sub of subs) {
        const plan = sub.plan || "starter";
        planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
        mrr += PLAN_MRR[plan] || 0;
      }

      const totalRevenue = purchases.reduce((sum, p) => sum + (p.platform_fee || 0), 0) / 100;
      const signupsThisWeek = profiles.filter(p => new Date(p.created_at) >= weekAgo).length;
      const signupsLastWeek = profiles.filter(p => { const d = new Date(p.created_at); return d >= twoWeeksAgo && d < weekAgo; }).length;
      const purchasesThisWeek = purchases.filter(p => new Date(p.created_at) >= weekAgo).length;
      const purchasesLastWeek = purchases.filter(p => { const d = new Date(p.created_at); return d >= twoWeeksAgo && d < weekAgo; }).length;
      const freeClaimsThisWeek = purchases.filter(p => new Date(p.created_at) >= weekAgo && p.amount_paid === 0).length;

      const subUserIds = new Set(subs.map(s => s.user_id));
      const paidConversions = profiles.filter(p => subUserIds.has(p.user_id)).length;
      const conversionRate = profiles.length > 0 ? (paidConversions / profiles.length) * 100 : 0;
      const avgRevenuePerUser = profiles.length > 0 ? (mrr + totalRevenue) / profiles.length : 0;

      const funnelCounts: Record<string, number> = {};
      for (const e of funnelEvents) { funnelCounts[e.event_type.replace("funnel:", "")] = (funnelCounts[e.event_type.replace("funnel:", "")] || 0) + 1; }
      const funnelOrder = ["page_view", "signup_completed", "listing_viewed", "claim_started", "claim_completed", "subscribe_started", "subscribe_completed"];
      const funnelSteps = funnelOrder.map((step, i) => {
        const count = funnelCounts[step] || 0;
        const prevCount = i === 0 ? count : (funnelCounts[funnelOrder[i - 1]] || 1);
        return { step: step.replace(/_/g, " "), count, rate: i === 0 ? 100 : (count / prevCount) * 100 };
      });

      const dailySignups: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const dateStr = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
        dailySignups.push({ date: dateStr, count: profiles.filter(p => p.created_at.startsWith(dateStr)).length });
      }

      const recentSubs = subs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map(s => ({ user_id: s.user_id, plan: s.plan, created_at: s.created_at }));

      setMetrics({
        mrr, totalRevenue, activeSubscribers: subs.length, totalSignups: profiles.length,
        signupsThisWeek, signupsLastWeek, totalPurchases: purchases.length,
        purchasesThisWeek, purchasesLastWeek, freeClaimsThisWeek, paidConversions,
        conversionRate, avgRevenuePerUser, planBreakdown, funnelSteps,
        recentSubscribers: recentSubs,
        recentPurchases: recentPurchases.map(p => ({ buyer_id: p.buyer_id, listing_id: p.listing_id, amount_paid: p.amount_paid, created_at: p.created_at })),
        dailySignups,
        orgCount: orgsResult.count ?? 0,
        orgMemberCount: orgMembersResult.count ?? 0,
        orgListingCount: orgListingsResult.count ?? 0,
      });
    } catch (err) {
      console.error("Failed to load revenue metrics:", err);
    }
    setLoading(false);
  }

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Revenue — Okta for Owned Apps</h1>
            <p className="text-sm text-muted-foreground mt-1">Enterprise subscription model + marketplace transaction fees</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current MRR</p>
            <p className="text-2xl font-black text-primary">${metrics ? metrics.mrr.toLocaleString() : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">ARR: ${metrics ? (metrics.mrr * 12).toLocaleString() : "—"}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : metrics ? (
          <>
            {/* Key metrics row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="MRR" value={`$${metrics.mrr.toLocaleString()}`} subvalue={`${metrics.activeSubscribers} subscribers`} icon={DollarSign} />
              <StatCard label="Signups This Week" value={metrics.signupsThisWeek.toString()} subvalue={`${metrics.totalSignups} total`} icon={Users} trend={signupTrend} trendUp={metrics.signupsThisWeek >= metrics.signupsLastWeek} />
              <StatCard label="Claims This Week" value={metrics.purchasesThisWeek.toString()} subvalue={`${metrics.freeClaimsThisWeek} free · ${metrics.purchasesThisWeek - metrics.freeClaimsThisWeek} paid`} icon={ShoppingBag} trend={purchaseTrend} trendUp={metrics.purchasesThisWeek >= metrics.purchasesLastWeek} />
              <StatCard label="Conversion Rate" value={`${metrics.conversionRate.toFixed(1)}%`} subvalue={`${metrics.paidConversions} paid of ${metrics.totalSignups}`} icon={Target} />
            </div>

            {/* Enterprise health row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Team Workspaces" value={metrics.orgCount.toString()} subvalue="Active organizations" icon={Building2} />
              <StatCard label="Workspace Members" value={metrics.orgMemberCount.toString()} subvalue="Across all orgs" icon={Users} />
              <StatCard label="Catalog Apps" value={metrics.orgListingCount.toString()} subvalue="Apps in org catalogs" icon={Layers} />
              <StatCard label="Avg Revenue / User" value={`$${metrics.avgRevenuePerUser.toFixed(2)}`} icon={BarChart3} />
            </div>

            {/* Tabs: Forecast | Funnel | Activity */}
            <Tabs defaultValue="forecast" className="space-y-6">
              <TabsList>
                <TabsTrigger value="forecast" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Forecast</TabsTrigger>
                <TabsTrigger value="funnel" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Funnel</TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Activity</TabsTrigger>
              </TabsList>

              {/* ── FORECAST TAB ── */}
              <TabsContent value="forecast" className="space-y-8">
                <PathToTargets currentMrr={metrics.mrr} />
                <UnitEconomics />

                <div>
                  <h3 className="font-bold text-lg mb-1">18-Month Scenario Models</h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Three scenarios modeling subscription growth + marketplace tx revenue. 
                    Key lever: Team ($99) → Enterprise ($499) expansion. Annual billing at 20% discount factored into ACV.
                  </p>
                  <div className="space-y-10">
                    {SCENARIOS.map((s) => (
                      <div key={s.name} className="rounded-2xl border border-border bg-card p-6">
                        <ForecastTable scenario={s} currentMrr={metrics.mrr} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic notes */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-3">Strategic Assumptions</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">Land & Expand Model</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>Free → Starter → Team → Enterprise progression</li>
                        <li>Team accounts are primary land — 1 workspace, compliance tags</li>
                        <li>Enterprise expansion via SSO, custom domain, SLA needs</li>
                        <li>5-12% monthly Team→Enterprise upgrade rate</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Revenue Mix Target (M18)</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>Enterprise subscriptions: 60%+ of subscription MRR</li>
                        <li>Team subscriptions: 25-30%</li>
                        <li>Starter + Marketplace: ~10-15%</li>
                        <li>Net Revenue Retention target: 120%+ (expansion driven)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">GTM Channels</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>Content engine → SEO → Team signup (inbound)</li>
                        <li>Outbound to IT leaders via Business Analyzer</li>
                        <li>White-label partnerships (agencies, consultants)</li>
                        <li>Product-led growth via free tier viral loop</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Competitive Moat</p>
                      <ul className="space-y-1 text-xs list-disc list-inside">
                        <li>"Okta for owned apps" — no direct competitor</li>
                        <li>AI maintenance layer eliminates ownership objection</li>
                        <li>Governed catalog with compliance = enterprise trust</li>
                        <li>Network effects: more apps → more value → more orgs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── FUNNEL TAB ── */}
              <TabsContent value="funnel" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-bold mb-4">Subscription Breakdown</h3>
                    {Object.entries(metrics.planBreakdown).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(metrics.planBreakdown).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                          <div key={plan} className="flex items-center justify-between">
                            <span className="text-sm capitalize font-medium">{plan}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${(count / metrics.activeSubscribers) * 100}%` }} />
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
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-bold mb-4">Daily Signups (14 days)</h3>
                    <div className="flex items-end gap-1 h-32">
                      {metrics.dailySignups.map((d) => {
                        const max = Math.max(...metrics.dailySignups.map(x => x.count), 1);
                        const height = Math.max((d.count / max) * 100, 4);
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                            <span className="text-[10px] text-muted-foreground">{d.count || ""}</span>
                            <div className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary" style={{ height: `${height}%` }} />
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

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-4">Conversion Funnel (Last 30 Days)</h3>
                  {metrics.funnelSteps.some(s => s.count > 0) ? (
                    <div className="space-y-2.5">
                      {metrics.funnelSteps.map((step) => (
                        <FunnelBar key={step.step} step={step.step} count={step.count} rate={step.rate} maxCount={metrics.funnelSteps[0]?.count || 1} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Funnel data will appear as users interact. Events tracked automatically.</p>
                  )}
                </div>
              </TabsContent>

              {/* ── ACTIVITY TAB ── */}
              <TabsContent value="activity" className="space-y-6">
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
                              <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No subscribers yet</p>}
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
                              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No claims yet</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
