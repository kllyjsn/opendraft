import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SecurityBadgeProps {
  score: number | null;
  compact?: boolean;
}

export function SecurityBadge({ score, compact = false }: SecurityBadgeProps) {
  if (score === null || score === undefined) return null;

  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const isHardened = score >= 90;
  const isGood = score >= 75;

  const Icon = isHardened ? ShieldCheck : isGood ? Shield : ShieldAlert;

  const colorClass = isHardened
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : isGood
      ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
      : score >= 60
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
        : "text-red-500 bg-red-500/10 border-red-500/20";

  const label = isHardened
    ? "Security Hardened"
    : isGood
      ? "Security Verified"
      : score >= 60
        ? "Basic Security"
        : "Needs Review";

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-tight ${colorClass}`}>
              <Icon className="h-3 w-3" />
              {grade}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">Security Score: {score}/100</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold tracking-tight ${colorClass}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold">Security Score: {score}/100 (Grade {grade})</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scanned for: hardcoded secrets, XSS vectors, eval injection, HTTPS enforcement,
            input validation, CSP headers, TypeScript strict mode, and security documentation.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
