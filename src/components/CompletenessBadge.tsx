import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FlaskConical, Layers, Rocket } from "lucide-react";

type Completeness = "prototype" | "mvp" | "production_ready";

const config: Record<Completeness, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}> = {
  prototype: {
    label: "Prototype",
    shortLabel: "Proto",
    icon: <FlaskConical className="h-3 w-3" />,
    gradient: "from-yellow-400 to-orange-400",
    description: "Early-stage concept. Expect rough edges, incomplete features, and limited polish — but the core idea is there.",
  },
  mvp: {
    label: "MVP",
    shortLabel: "MVP",
    icon: <Layers className="h-3 w-3" />,
    gradient: "from-cyan-400 to-blue-500",
    description: "Minimum viable product. Core features work end-to-end. A solid starting point for shipping.",
  },
  production_ready: {
    label: "Production Ready",
    shortLabel: "Prod",
    icon: <Rocket className="h-3 w-3" />,
    gradient: "from-green-400 to-emerald-500",
    description: "Fully polished and deployable. Battle-tested, documented, and ready to ship.",
  },
};

interface CompletenessBadgeProps {
  level: Completeness;
  showTooltip?: boolean;
}

export function CompletenessBadge({ level, showTooltip = true }: CompletenessBadgeProps) {
  const { label, shortLabel, icon, gradient, description } = config[level];

  const badge = (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradient} px-2 py-0.5 text-[10px] md:text-xs font-semibold text-white cursor-default whitespace-nowrap`}>
      {icon}
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">{shortLabel}</span>
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
