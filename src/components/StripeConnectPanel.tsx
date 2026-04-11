/**
 * StripeConnectPanel Component
 * ------------------------------------
 * Displays the seller's Stripe Connect onboarding status and
 * allows them to start/continue the onboarding flow.
 *
 * Onboarding states:
 *  1. No account → Show "Connect Stripe account" CTA
 *  2. Account exists, not fully onboarded → Show progress with status
 *  3. Fully onboarded (readyToReceivePayments) → Show "Active" badge
 *
 * Status is always fetched LIVE from the API (no caching) to ensure accuracy.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Zap, AlertCircle, Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

interface ConnectStatus {
  onboarded: boolean;
  readyToReceivePayments?: boolean;
  onboardingComplete?: boolean;
  requirementsStatus?: string | null;
  accountId?: string;
  pendingEarnings?: number;
}

export function StripeConnectPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read and clear the ?connect= query param (set by Stripe's return_url)
  const connectParam = searchParams.get("connect");

  useEffect(() => {
    checkStatus();
    // Clear the connect param from URL after reading it (clean URL)
    if (connectParam) {
      setSearchParams((p) => { p.delete("connect"); p.delete("accountId"); return p; }, { replace: true });
    }
  }, []);

  /**
   * Fetches live onboarding status from the check-connect-status edge function.
   * We always call the API (not a cached value) so status is always accurate.
   */
  async function checkStatus() {
    setLoading(true);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/check-connect-status");
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setStatus(data);
    } catch (err) {
      // Don't surface a scary error if the user simply has no account yet —
      // fall back to the "not connected" state so the CTA is shown instead.
      console.error("check-connect-status:", err);
      setStatus({ onboarded: false, readyToReceivePayments: false });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Starts the Connect onboarding flow by calling create-connect-account.
   * On success, redirects to Stripe's hosted onboarding page.
   */
  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/create-connect-account");
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      // Redirect to Stripe's hosted onboarding UI
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start onboarding");
      setConnecting(false);
    }
  }

  // Loading skeleton
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

  // Fully onboarded — ready to receive payments
  if (status?.readyToReceivePayments) {
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
              {status.accountId && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Account: {status.accountId}
                </p>
              )}
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Transfers active
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  No pending requirements
                </div>
              </div>
            </div>
          </div>
          {/* "Manage" button re-generates an onboarding link for the seller's Stripe dashboard */}
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Manage"}
          </Button>
        </div>
      </div>
    );
  }

  // Account exists but not yet ready — onboarding in progress
  if (status?.accountId && !status?.readyToReceivePayments) {
    const isPendingRequirements = status.requirementsStatus === "currently_due" || status.requirementsStatus === "past_due";

    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold mb-0.5">Onboarding in progress</h3>
              <p className="text-sm text-muted-foreground">
                {isPendingRequirements
                  ? "Stripe needs more information before you can receive payments."
                  : "Your account is being verified by Stripe. This can take a few minutes."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: <span className="font-medium capitalize">{status.requirementsStatus?.replace("_", " ") ?? "pending"}</span>
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleConnect} disabled={connecting} className="gradient-hero text-white border-0">
            {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isPendingRequirements ? "Complete setup" : "Check status"}
          </Button>
        </div>
        {error && <div className="mt-3 text-xs text-destructive">{error}</div>}
      </div>
    );
  }

  // No account yet — show "returned from Stripe" banner if applicable
  const justReturned = connectParam === "success" || connectParam === "refresh";
  const pendingEarnings = status?.pendingEarnings ?? 0;
  const hasPendingEarnings = pendingEarnings > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      {justReturned && (
        <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 p-3 flex items-start gap-2 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Stripe is still verifying your account. This can take a few minutes — check back shortly or complete any outstanding steps.
        </div>
      )}

      {/* Pending earnings banner — shown when seller has sales but no Stripe yet */}
      {hasPendingEarnings && (
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              ${(pendingEarnings / 100).toFixed(2)} waiting for you
            </p>
            <p className="text-xs text-muted-foreground">
              You have sales! Connect Stripe to receive your earnings instantly.
            </p>
          </div>
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
          {error && <div className="mb-3 text-xs text-destructive">{error}</div>}
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
          >
            {connecting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to Stripe…</>
            ) : hasPendingEarnings ? (
              <><Zap className="h-4 w-4 mr-2" /> Collect ${(pendingEarnings / 100).toFixed(2)} now</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Connect Stripe account</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
