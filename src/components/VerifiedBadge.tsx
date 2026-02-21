import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function VerifiedBadge({ className = "", size = "sm" }: VerifiedBadgeProps) {
  const sizeClass = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck className={`${sizeClass} text-primary fill-primary/20 shrink-0 ${className}`} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Verified seller
      </TooltipContent>
    </Tooltip>
  );
}
