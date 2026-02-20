/**
 * Activity Logger
 * ---------------
 * Lightweight utility to log user interactions to the activity_log table.
 * Fire-and-forget — errors are silently caught so they never break the UI.
 */

import { supabase } from "@/integrations/supabase/client";

interface LogEvent {
  event_type: string;
  event_data?: Record<string, unknown>;
  page?: string;
}

export async function logActivity({ event_type, event_data = {}, page }: LogEvent) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("activity_log").insert({
      user_id: user?.id ?? null,
      event_type,
      event_data,
      page: page ?? window.location.pathname,
    });
  } catch {
    // Silent — never break the UI for analytics
  }
}
