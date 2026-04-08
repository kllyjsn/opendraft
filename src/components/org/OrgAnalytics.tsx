import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  DollarSign,
  BarChart3,
  Package,
  Download,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AppSaving {
  id: string;
  listingId: string;
  title: string;
  category: string;
  price: number; // one-time cost in cents
  estimatedMonthlySaas: number; // estimated equivalent SaaS cost/mo in cents
  claimedAt: string;
}

interface AnalyticsData {
  apps: AppSaving[];
  memberCount: number;
  totalSavingsPerMonth: number; // cents
  totalSpent: number; // cents (one-time)
  roiMultiple: number;
  breakEvenMonths: number;
}

/* ------------------------------------------------------------------ */
/*  Estimated SaaS equivalents by category                             */
/* ------------------------------------------------------------------ */

const SAAS_MONTHLY_ESTIMATES: Record<string, number> = {
  crm: 6500, // $65/user/mo — typical CRM
  "project-management": 3000, // $30/user/mo
  analytics: 4000, // $40/user/mo
  marketing: 5000, // $50/user/mo
  "customer-support": 3500,
  communication: 2500,
  finance: 4500,
  hr: 3000,
  design: 4000,
  development: 5500,
  security: 6000,
  productivity: 2000,
  default: 3500, // fallback
};

function estimateMonthlySaas(category: string, memberCount: number): number {
  const perUser =
    SAAS_MONTHLY_ESTIMATES[category.toLowerCase()] ??
    SAAS_MONTHLY_ESTIMATES.default;
  // Estimate for team: at least 5 seats or actual member count
  return perUser * Math.max(memberCount, 5);
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  highlight,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-colors",
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border/40 bg-card",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {trend && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              trend === "down"
                ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                : "text-rose-600 border-rose-200 bg-rose-50",
            )}
          >
            {trend === "down" ? (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            )}
            {trend === "down" ? "Saving" : "Cost"}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {subtext && (
        <p className="text-[10px] text-muted-foreground/70 mt-1">{subtext}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-app savings row                                                */
/* ------------------------------------------------------------------ */

function AppSavingsRow({ app }: { app: AppSaving }) {
  const monthlySaving = app.estimatedMonthlySaas;
  const annualSaving = monthlySaving * 12;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{
          backgroundColor: `hsl(${Math.abs(app.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 55%, 52%)`,
        }}
      >
        {app.title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{app.title}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {app.category.replace(/-/g, " ")}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-600">
          ${(monthlySaving / 100).toLocaleString()}/mo
        </p>
        <p className="text-[10px] text-muted-foreground">
          ${(annualSaving / 100).toLocaleString()}/yr saved
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export helper                                                       */
/* ------------------------------------------------------------------ */

function exportCsv(data: AnalyticsData) {
  const headers = [
    "App",
    "Category",
    "One-time Cost ($)",
    "Est. SaaS Monthly ($)",
    "Est. SaaS Annual ($)",
    "Claimed Date",
  ];
  const rows = data.apps.map((a) => [
    a.title,
    a.category,
    (a.price / 100).toFixed(2),
    (a.estimatedMonthlySaas / 100).toFixed(2),
    ((a.estimatedMonthlySaas * 12) / 100).toFixed(2),
    new Date(a.claimedAt).toLocaleDateString(),
  ]);

  const summary = [
    [],
    ["Summary"],
    ["Total Apps", data.apps.length.toString()],
    ["Team Members", data.memberCount.toString()],
    [
      "Total Monthly Savings",
      `$${(data.totalSavingsPerMonth / 100).toLocaleString()}`,
    ],
    [
      "Total Annual Savings",
      `$${((data.totalSavingsPerMonth * 12) / 100).toLocaleString()}`,
    ],
    ["Total Spent (one-time)", `$${(data.totalSpent / 100).toLocaleString()}`],
    ["ROI Multiple", `${data.roiMultiple.toFixed(1)}x`],
    [
      "Break-even",
      data.breakEvenMonths <= 0
        ? "Immediate"
        : `${data.breakEvenMonths} month${data.breakEvenMonths !== 1 ? "s" : ""}`,
    ],
  ];

  const csv = [headers, ...rows, ...summary]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `opendraft-roi-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface OrgAnalyticsProps {
  orgId: string;
  memberCount: number;
}

export function OrgAnalytics({ orgId, memberCount }: OrgAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [orgId, memberCount]);

  async function loadAnalytics() {
    setLoading(true);

    // Fetch approved org listings with their listing details
    const { data: orgListings } = await supabase
      .from("org_listings")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "approved");

    if (!orgListings || orgListings.length === 0) {
      setData({
        apps: [],
        memberCount,
        totalSavingsPerMonth: 0,
        totalSpent: 0,
        roiMultiple: 0,
        breakEvenMonths: 0,
      });
      setLoading(false);
      return;
    }

    // Fetch listing details
    const listingIds = orgListings.map((l) => l.listing_id);
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, price, category")
      .in("id", listingIds);

    const listingMap = new Map(listings?.map((l) => [l.id, l]) ?? []);

    // Build per-app savings data
    const apps: AppSaving[] = orgListings.map((ol) => {
      const listing = listingMap.get(ol.listing_id);
      const category = listing?.category ?? "default";
      return {
        id: ol.id,
        listingId: ol.listing_id,
        title: listing?.title ?? "Unknown App",
        category,
        price: listing?.price ?? 0,
        estimatedMonthlySaas: estimateMonthlySaas(category, memberCount),
        claimedAt: ol.created_at,
      };
    });

    const totalSavingsPerMonth = apps.reduce(
      (sum, a) => sum + a.estimatedMonthlySaas,
      0,
    );
    const totalSpent = apps.reduce((sum, a) => sum + a.price, 0);
    const annualSavings = totalSavingsPerMonth * 12;
    const roiMultiple =
      totalSpent > 0 ? annualSavings / totalSpent : 0;
    const breakEvenMonths =
      totalSavingsPerMonth > 0
        ? Math.ceil(totalSpent / totalSavingsPerMonth)
        : 0;

    setData({
      apps,
      memberCount,
      totalSavingsPerMonth,
      totalSpent,
      roiMultiple,
      breakEvenMonths,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const hasApps = data.apps.length > 0;
  const annualSavings = data.totalSavingsPerMonth * 12;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">ROI & Savings Dashboard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track how much your org saves by owning software instead of renting
            SaaS
          </p>
        </div>
        {hasApps && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(data)}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingDown}
          value={`$${(data.totalSavingsPerMonth / 100).toLocaleString()}`}
          label="Estimated monthly savings"
          subtext={`$${(annualSavings / 100).toLocaleString()}/yr`}
          trend="down"
          highlight
        />
        <StatCard
          icon={DollarSign}
          value={`$${(data.totalSpent / 100).toLocaleString()}`}
          label="Total spent (one-time)"
          subtext={
            data.breakEvenMonths > 0
              ? `Break-even in ${data.breakEvenMonths} mo`
              : "Immediate ROI"
          }
        />
        <StatCard
          icon={BarChart3}
          value={hasApps ? `${data.roiMultiple.toFixed(1)}x` : "—"}
          label="Annual ROI multiple"
          subtext="First-year return on investment"
          trend={hasApps ? "down" : undefined}
        />
        <StatCard
          icon={Package}
          value={data.apps.length.toString()}
          label="Apps replacing SaaS"
          subtext={`${data.memberCount} team members`}
        />
      </div>

      {/* Per-app savings breakdown */}
      {hasApps ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Per-app savings breakdown
            </h4>
            <span className="text-xs text-muted-foreground">
              vs. estimated SaaS equivalent
            </span>
          </div>
          <div className="space-y-2">
            {[...data.apps]
              .sort((a, b) => b.estimatedMonthlySaas - a.estimatedMonthlySaas)
              .map((app) => (
                <AppSavingsRow key={app.id} app={app} />
              ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/50">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No apps in your catalog yet
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add apps to your org catalog to start tracking ROI and savings
            against SaaS equivalents.
          </p>
        </div>
      )}

      {/* Methodology note */}
      {hasApps && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>How we calculate savings:</strong> Estimated monthly SaaS
            costs are based on industry-average per-seat pricing for each app
            category, multiplied by your team size (minimum 5 seats). Actual
            savings depend on the specific SaaS tools you're replacing. Export
            the CSV report to customize these estimates for your leadership
            review.
          </p>
        </div>
      )}
    </div>
  );
}
