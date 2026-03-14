import { Shield, Clock, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrustBadgesProps {
  securityScore?: number | null;
  updatedAt?: string;
  /** Average hours to first message response */
  responseHours?: number | null;
  compact?: boolean;
}

function recencyLabel(updatedAt: string): { label: string; color: string } {
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return { label: "Updated this week", color: "text-emerald-500" };
  if (days <= 30) return { label: "Updated this month", color: "text-accent" };
  if (days <= 90) return { label: "Updated recently", color: "text-muted-foreground" };
  return { label: `${days}d ago`, color: "text-muted-foreground/60" };
}

function securityGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "text-emerald-500" };
  if (score >= 80) return { grade: "A", color: "text-emerald-400" };
  if (score >= 70) return { grade: "B", color: "text-accent" };
  if (score >= 50) return { grade: "C", color: "text-yellow-500" };
  return { grade: "D", color: "text-destructive" };
}

function responseLabel(hours: number): { label: string; color: string } {
  if (hours <= 2) return { label: "<2h response", color: "text-emerald-500" };
  if (hours <= 12) return { label: "<12h response", color: "text-accent" };
  if (hours <= 24) return { label: "<24h response", color: "text-muted-foreground" };
  return { label: `~${Math.round(hours)}h response`, color: "text-muted-foreground/60" };
}

export function TrustBadges({ securityScore, updatedAt, responseHours, compact }: TrustBadgesProps) {
  const badges: React.ReactNode[] = [];

  if (securityScore != null && securityScore > 0) {
    const { grade, color } = securityGrade(securityScore);
    badges.push(
      <TooltipProvider key="sec" delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 ${color}`}>
              <Shield className="h-3 w-3" />
              <span className="text-[10px] font-bold">{grade}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Security score: {securityScore}/100
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (updatedAt) {
    const { label, color } = recencyLabel(updatedAt);
    badges.push(
      <TooltipProvider key="upd" delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 ${color}`}>
              <Clock className="h-3 w-3" />
              {!compact && <span className="text-[10px] font-medium">{label}</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (responseHours != null) {
    const { label, color } = responseLabel(responseHours);
    badges.push(
      <TooltipProvider key="resp" delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 ${color}`}>
              <MessageCircle className="h-3 w-3" />
              {!compact && <span className="text-[10px] font-medium">{label}</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Builder typically responds in {label.replace("response", "").trim()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex items-center gap-2">{badges}</div>;
}
