import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Zap, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface ConnectStatus {
  onboarded: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export function StripeConnectPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectParam = searchParams.get("connect");

  useEffect(() => {
    checkStatus();
    // Clear connect param from URL after reading it
    if (connectParam) {
      setSearchParams((p) => { p.delete("connect"); return p; }, { replace: true });
    }
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-connect-status");
      if (fnError) throw new Error(fnError.message);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-connect-account");
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start onboarding");
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (status?.onboarded) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold mb-0.5">Stripe payouts active</h3>
              <p className="text-sm text-muted-foreground">
                You receive <span className="font-semibold text-foreground">80%</span> of every sale, paid directly to your bank. The platform retains 20%.
              </p>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${status.charges_enabled ? "bg-green-500" : "bg-orange-400"}`} />
                  Charges {status.charges_enabled ? "enabled" : "pending"}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${status.payouts_enabled ? "bg-green-500" : "bg-orange-400"}`} />
                  Payouts {status.payouts_enabled ? "enabled" : "pending"}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Manage"}
          </Button>
        </div>
      </div>
    );
  }

  // Show "returned from Stripe" banner if they just finished onboarding
  const justReturned = connectParam === "success" || connectParam === "refresh";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      {justReturned && (
        <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 p-3 flex items-start gap-2 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Stripe is still verifying your account. This can take a few minutes — check back shortly or complete any outstanding steps.
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold mb-0.5">Connect Stripe to get paid</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set up payouts to receive <span className="font-semibold text-foreground">80%</span> of every sale directly to your bank. Takes 2 minutes.
          </p>
          <div className="flex flex-wrap gap-4 mb-5 text-xs text-muted-foreground">
            {["Instant payouts after each sale", "No monthly fees", "Powered by Stripe"].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full gradient-hero flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>
          {error && (
            <div className="mb-3 text-xs text-destructive">{error}</div>
          )}
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
          >
            {connecting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to Stripe…</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Connect Stripe account</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
