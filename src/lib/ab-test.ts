/**
 * Lightweight A/B testing utility.
 * Assigns a sticky variant per experiment using localStorage.
 * Logs impressions and clicks to activity_log for analysis.
 */

import { logActivity } from "@/lib/activity-logger";

export function getVariant<T extends string>(experimentId: string, variants: T[]): T {
  const key = `ab_${experimentId}`;
  const stored = localStorage.getItem(key);
  if (stored && variants.includes(stored as T)) return stored as T;

  const picked = variants[Math.floor(Math.random() * variants.length)];
  localStorage.setItem(key, picked);
  return picked;
}

export function trackImpression(experimentId: string, variant: string, source: string) {
  logActivity({
    event_type: "ab:impression",
    event_data: { experiment: experimentId, variant, source },
  });
}

export function trackClick(experimentId: string, variant: string, source: string) {
  logActivity({
    event_type: "ab:click",
    event_data: { experiment: experimentId, variant, source },
  });
}
