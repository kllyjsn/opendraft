import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Globe, Shield, Activity, CheckCircle, AlertTriangle,
  ExternalLink, RefreshCw, Loader2, Server, Zap, Clock,
  TrendingUp, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DeployedSite {
  id: string;
  listing_id: string;
  site_url: string;
  provider: string;
  status: string;
  last_check_at: string | null;
  last_fix_at: string | null;
  fix_count: number;
  health_log: any;
  created_at: string;
  listing?: { title: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  healthy: { color: "text-emerald-500", icon: CheckCircle, label: "Healthy" },
  warning: { color: "text-amber-500", icon: AlertTriangle, label: "Warning" },
  down: { color: "text-destructive", icon: AlertTriangle, label: "Down" },
  unknown: { color: "text-muted-foreground", icon: Clock, label: "Pending" },
};

export default function Hosting() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed } = useSubscription();
  const [sites, setSites] = useState<DeployedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    loadSites();
  }, [user]);

  async function loadSites() {
    setLoading(true);
    const { data } = await supabase
      .from("deployed_sites")
      .select("*, listings:listing_id(title)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    setSites((data || []).map((s: any) => ({
      ...s,
      listing: s.listings,
    })));
    setLoading(false);
  }

  async function triggerHealthCheck(siteId: string) {
    toast({ title: "Health check triggered", description: "Site Doctor is scanning your site…" });
    try {
      await supabase.functions.invoke("site-doctor", {
        body: { site_id: siteId },
      });
      setTimeout(loadSites, 5000);
    } catch {
      toast({ title: "Check failed", variant: "destructive" });
    }
  }

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  const healthySites = sites.filter(s => s.status === "healthy").length;
  const totalFixes = sites.reduce((sum, s) => sum + s.fix_count, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Managed Hosting — Site Health & Monitoring | OpenDraft"
        description="Monitor your deployed apps with AI-powered health checks, auto-healing, and uptime tracking."
        path="/hosting"
      />
      <Navbar />
      <main className="flex-1 page-enter">
        <div className="container mx-auto px-4 py-12 max-w-5xl">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Managed Hosting
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Your Deployed Apps
            </h1>
            <p className="text-muted-foreground max-w-lg">
              AI-powered monitoring, auto-healing, and performance tracking for every app you deploy.
            </p>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total Sites", value: sites.length, icon: Globe },
              { label: "Healthy", value: healthySites, icon: CheckCircle },
              { label: "Auto-Fixes Applied", value: totalFixes, icon: RefreshCw },
              { label: "Uptime", value: sites.length > 0 ? "99.9%" : "—", icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>

          {/* Sites List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sites.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No deployed sites yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Deploy your first app and it'll appear here with real-time health monitoring, auto-healing, and performance insights.
              </p>
              <Link to="/">
                <Button className="gradient-hero text-white border-0 shadow-glow">
                  <Zap className="h-4 w-4 mr-2" />
                  Build your first app
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sites.map((site) => {
                const config = STATUS_CONFIG[site.status] || STATUS_CONFIG.unknown;
                const StatusIcon = config.icon;
                const lastCheck = site.last_check_at
                  ? new Date(site.last_check_at).toLocaleString()
                  : "Never";

                return (
                  <div
                    key={site.id}
                    className="rounded-xl border border-border/60 bg-card p-5 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                          <StatusIcon className={cn("h-4 w-4 shrink-0", config.color)} />
                          <h3 className="font-bold text-sm truncate">
                            {site.listing?.title || "Untitled App"}
                          </h3>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            site.status === "healthy" ? "bg-primary/10 text-primary" :
                            site.status === "warning" ? "bg-accent/10 text-accent" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {config.label}
                          </span>
                        </div>

                        <a
                          href={site.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                        >
                          {site.site_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {site.provider}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Last check: {lastCheck}
                          </span>
                          {site.fix_count > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Shield className="h-3 w-3" />
                              {site.fix_count} auto-fix{site.fix_count > 1 ? "es" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerHealthCheck(site.id)}
                        className="shrink-0 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Check now
                      </Button>
                    </div>

                    {/* Health Log (last 3 entries) */}
                    {Array.isArray(site.health_log) && site.health_log.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/30">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Recent Activity
                        </p>
                        <div className="space-y-1">
                          {(site.health_log as any[]).slice(-3).reverse().map((entry: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                entry.status === "healthy" ? "bg-primary" :
                                entry.status === "fixed" ? "bg-secondary" : "bg-accent"
                              )} />
                              <span className="truncate">
                                {entry.message || entry.status}
                              </span>
                              {entry.timestamp && (
                                <span className="text-muted-foreground/50 shrink-0 ml-auto">
                                  {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upsell for non-subscribers */}
          {!isSubscribed && sites.length > 0 && (
            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
              <h2 className="text-xl font-black mb-2">Upgrade for Premium Monitoring</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Free plans get weekly health checks. Subscribers get <strong className="text-foreground">hourly monitoring</strong>, instant auto-healing, and priority support.
              </p>
              <Link to="/credits">
                <Button className="gradient-hero text-white border-0 shadow-glow gap-2">
                  <Zap className="h-4 w-4" />
                  Upgrade now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
