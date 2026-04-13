import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  org_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert an entry into the org_audit_log table.
 * Fires-and-forgets — errors are silently swallowed so audit logging
 * never blocks the primary action.
 */
export function logOrgAction(entry: AuditLogEntry): void {
  const userId = supabase.auth.getSession().then((s) => s.data.session?.user?.id);

  userId.then((actorId) => {
    supabase
      .from("org_audit_log")
      .insert({
        org_id: entry.org_id,
        actor_id: actorId ?? null,
        action: entry.action,
        target_type: entry.target_type ?? null,
        target_id: entry.target_id ?? null,
        metadata: entry.metadata ?? {},
      } as Record<string, unknown>)
      .then(({ error }) => {
        if (error) console.warn("[audit-log] insert failed:", error.message);
      });
  });
}
