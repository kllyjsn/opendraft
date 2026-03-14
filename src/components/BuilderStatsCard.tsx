import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Package, Users, Star, Share2, Check, Clock, Wrench } from "lucide-react";
import { useState } from "react";

interface BuilderStatsCardProps {
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  listingsCount: number;
  totalSales: number;
  userId: string;
  /** Average response time in hours (null = unknown) */
  avgResponseHours?: number | null;
  /** Days since last listing update */
  lastUpdateDays?: number | null;
}

function responseLabel(hours: number): string {
  if (hours <= 2) return "<2h";
  if (hours <= 12) return "<12h";
  if (hours <= 24) return "<1d";
  return `~${Math.round(hours / 24)}d`;
}

function maintenanceLabel(days: number): { label: string; color: string } {
  if (days <= 7) return { label: "Active", color: "text-emerald-500" };
  if (days <= 30) return { label: "Monthly", color: "text-accent" };
  if (days <= 90) return { label: "Quarterly", color: "text-muted-foreground" };
  return { label: "Inactive", color: "text-muted-foreground/60" };
}

export function BuilderStatsCard({
  username,
  avatarUrl,
  bio,
  followersCount,
  listingsCount,
  totalSales,
  userId,
  avgResponseHours,
  lastUpdateDays,
}: BuilderStatsCardProps) {
  const [copied, setCopied] = useState(false);
  const initial = username?.[0]?.toUpperCase() ?? "?";
  const profileUrl = `${window.location.origin}/builder/${userId}`;

  const handleShare = async () => {
    const text = `Check out ${username ?? "this builder"} on OpenDraft — ${totalSales} sales, ${listingsCount} projects listed!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} on OpenDraft`, text, url: profileUrl });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maintenance = lastUpdateDays != null ? maintenanceLabel(lastUpdateDays) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 glass-strong p-6">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14 text-lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={username ?? ""} />}
            <AvatarFallback className="gradient-hero text-white font-bold">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg truncate">{username ?? "Anonymous"}</h3>
            {bio && <p className="text-xs text-muted-foreground truncate">{bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <Star className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-black">{totalSales}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sales</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-black">{listingsCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Projects</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-black">{followersCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Followers</p>
          </div>
        </div>

        {/* Response & maintenance metrics */}
        {(avgResponseHours != null || maintenance) && (
          <div className="flex items-center gap-3 mb-4 px-1">
            {avgResponseHours != null && (
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">{responseLabel(avgResponseHours)}</span>
                <span className="text-muted-foreground">response</span>
              </div>
            )}
            {maintenance && (
              <div className="flex items-center gap-1.5 text-xs">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className={`font-semibold ${maintenance.color}`}>{maintenance.label}</span>
                <span className="text-muted-foreground">maintainer</span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="w-full border-border/40 gap-2"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? "Link copied!" : "Share profile"}
        </Button>
      </div>
    </div>
  );
}
