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
  const tracked = useRef(false);

  // Track page views
  useEffect(() => {
    trackFunnel("page_view", { path: window.location.pathname });
  }, []);

  // Track signup completion — only for genuinely new users
  // Uses created_at to detect accounts made in the last 60 seconds
  useEffect(() => {
    if (user && !prevUser.current && !tracked.current) {
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const now = Date.now();
      const isNewUser = now - createdAt < 60_000; // created within last 60s

      if (isNewUser) {
        trackFunnel("signup_completed", { user_id: user.id });
      } else {
        trackFunnel("login_completed", { user_id: user.id });
      }
      tracked.current = true;
    }
    prevUser.current = user?.id ?? null;
  }, [user]);
}
