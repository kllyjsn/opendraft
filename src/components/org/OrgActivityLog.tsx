import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ScrollText, UserPlus, UserMinus, ShieldCheck, ShieldOff,
  Package, Check, X, Settings, Mail, MailX, ArrowUpDown, ChevronDown,
} from "lucide-react";

interface AuditEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_username?: string;
}

interface OrgActivityLogProps {
  orgId: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof ScrollText; color: string }> = {
  "member.invited": { label: "Invited member", icon: UserPlus, color: "text-blue-500" },
  "member.joined": { label: "Member joined", icon: UserPlus, color: "text-emerald-500" },
  "member.removed": { label: "Removed member", icon: UserMinus, color: "text-destructive" },
  "member.role_changed": { label: "Changed role", icon: ShieldCheck, color: "text-amber-500" },
  "app.submitted": { label: "App submitted", icon: Package, color: "text-blue-500" },
  "app.approved": { label: "App approved", icon: Check, color: "text-emerald-500" },
  "app.rejected": { label: "App rejected", icon: X, color: "text-destructive" },
  "invitation.sent": { label: "Invitation sent", icon: Mail, color: "text-blue-500" },
  "invitation.revoked": { label: "Invitation revoked", icon: MailX, color: "text-amber-500" },
  "invitation.resent": { label: "Invitation resent", icon: Mail, color: "text-blue-500" },
  "settings.updated": { label: "Settings updated", icon: Settings, color: "text-muted-foreground" },
  "org.created": { label: "Workspace created", icon: ShieldCheck, color: "text-emerald-500" },
  "compliance.updated": { label: "Compliance updated", icon: ShieldOff, color: "text-amber-500" },
};

const TARGET_FILTERS = [
  { value: "all", label: "All events" },
  { value: "member", label: "Members" },
  { value: "app", label: "Apps" },
  { value: "invitation", label: "Invitations" },
  { value: "settings", label: "Settings" },
];

const PAGE_SIZE = 25;

export function OrgActivityLog({ orgId }: OrgActivityLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [hasMore, setHasMore] = useState(false);

  const loadEntries = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    let query = supabase
      .from("org_audit_log")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (filter !== "all") {
      query = query.eq("target_type", filter);
    }

    if (append && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      query = query.lt("created_at", lastEntry.created_at);
    }

    const { data } = await query;
    const rows = (data ?? []) as AuditEntry[];
    const hasMoreRows = rows.length > PAGE_SIZE;
    const pageRows = hasMoreRows ? rows.slice(0, PAGE_SIZE) : rows;

    // Fetch actor usernames
    const actorIds = [...new Set(pageRows.map((r) => r.actor_id).filter(Boolean))] as string[];
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", actorIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) ?? []);
      for (const row of pageRows) {
        if (row.actor_id) {
          row.actor_username = profileMap.get(row.actor_id) ?? "Unknown user";
        }
      }
    }

    if (append) {
      setEntries((prev) => [...prev, ...pageRows]);
    } else {
      setEntries(pageRows);
    }
    setHasMore(hasMoreRows);
    setLoading(false);
    setLoadingMore(false);
  }, [orgId, filter, entries]);

  useEffect(() => {
    loadEntries(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, filter]);

  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { label: action, icon: ScrollText, color: "text-muted-foreground" };
  }

  function renderMetadata(entry: AuditEntry) {
    const meta = entry.metadata;
    const parts: string[] = [];

    if (meta.email) parts.push(String(meta.email));
    if (meta.app_name) parts.push(String(meta.app_name));
    if (meta.old_role && meta.new_role) {
      parts.push(`${String(meta.old_role)} → ${String(meta.new_role)}`);
    }
    if (meta.member_name) parts.push(String(meta.member_name));
    if (meta.field) parts.push(`changed ${String(meta.field)}`);

    return parts.length > 0 ? parts.join(" · ") : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Activity Log</h3>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              ({entries.length}{hasMore ? "+" : ""} events)
            </span>
          )}
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">
            Actions like inviting members, approving apps, and changing settings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const config = getActionConfig(entry.action);
            const Icon = config.icon;
            const metaText = renderMetadata(entry);

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className={`mt-0.5 shrink-0 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{entry.actor_username ?? "System"}</span>
                    {" "}
                    <span className="text-muted-foreground">{config.label.toLowerCase()}</span>
                  </p>
                  {metaText && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {metaText}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                  {formatTime(entry.created_at)}
                </span>
              </div>
            );
          })}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => loadEntries(true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                )}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
