/**
 * Activity Logger
 * ---------------
 * Lightweight utility to log user interactions to the activity_log table.
 * Fire-and-forget — errors are silently caught so they never break the UI.
 */

import { api } from "@/lib/api";

interface LogEvent {
  event_type: string;
  event_data?: Record<string, unknown>;
  page?: string;
}

export async function logActivity({ event_type, event_data = {}, page }: LogEvent) {
  try {
    await api.post("/activity-log", {
      event_type,
      event_data,
      page: page ?? window.location.pathname,
    });
  } catch {
    // Silent — never break the UI for analytics
  }
}
