/**
 * Funnel Tracker Hook
 * -------------------
 * Tracks key conversion funnel events:
 *   visit → signup → first_claim → subscribe → purchase
 *
 * Uses the existing activity_log table. Fire-and-forget.
 */

import { useEffect, useRef } from "react";
import { logActivity } from "@/lib/activity-logger";
import { useAuth } from "@/hooks/useAuth";

type FunnelStep =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "listing_viewed"
  | "claim_started"
  | "claim_completed"
  | "subscribe_started"
  | "subscribe_completed"
  | "checkout_started"
  | "checkout_completed";

export function trackFunnel(step: FunnelStep, data?: Record<string, unknown>) {
  logActivity({
    event_type: `funnel:${step}`,
    event_data: { step, timestamp: Date.now(), ...data },
    page: window.location.pathname,
  });
}

/**
 * Auto-tracks page views and signup completion.
 * Drop this into App.tsx or Layout.
 */
export function useFunnelTracker() {
  const { user } = useAuth();
  const prevUser = useRef<string | null>(null);

  // Track page views
  useEffect(() => {
    trackFunnel("page_view", { path: window.location.pathname });
  }, []);

  // Track signup completion (user went from null → authenticated)
  useEffect(() => {
    if (user && !prevUser.current) {
      trackFunnel("signup_completed", { user_id: user.id });
    }
    prevUser.current = user?.id ?? null;
  }, [user]);
}
