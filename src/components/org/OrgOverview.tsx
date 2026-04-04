import { Users, Crown, Shield, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgMember } from "@/hooks/useOrg";

const ROLE_LABELS: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-primary" },
  builder: { label: "Builder", icon: Users, color: "text-secondary" },
  member: { label: "Member", icon: Users, color: "text-muted-foreground" },
};

interface OrgOverviewProps {
  orgName: string;
  memberCount: number;
  appCount: number;
  tier: string | null;
  maxSeats: number | null;
  maxApps: number | null;
  members: OrgMember[];
}

export function OrgOverview({ orgName, memberCount, appCount, tier, maxSeats, maxApps, members }: OrgOverviewProps) {
  const stats = [
    { label: "Team members", value: memberCount, max: maxSeats },
    { label: "Apps in catalog", value: appCount, max: maxApps },
    { label: "Plan", value: (tier ?? "team").charAt(0).toUpperCase() + (tier ?? "team").slice(1) },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-card p-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-black">
              {s.value}
              {s.max && <span className="text-sm font-normal text-muted-foreground">/{s.max}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Recent members */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Team members</h3>
        <div className="space-y-2">
          {members.slice(0, 5).map((m) => {
            const roleInfo = ROLE_LABELS[m.role] ?? ROLE_LABELS.member;
            const RoleIcon = roleInfo.icon;
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                  {m.profile?.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profile?.username ?? "Unknown"}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${roleInfo.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
