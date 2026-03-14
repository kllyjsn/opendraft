import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentReadyBadgeProps {
  compact?: boolean;
  className?: string;
}

export function AgentReadyBadge({ compact = false, className }: AgentReadyBadgeProps) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-[hsl(185_90%_45%/0.12)] border border-[hsl(185_90%_45%/0.25)] px-1.5 py-0.5 text-[10px] text-[hsl(185_90%_45%)] font-semibold tracking-tight",
          className
        )}
      >
        <Bot className="h-3 w-3" />
        Agent Ready
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[hsl(185_90%_45%/0.1)] border border-[hsl(185_90%_45%/0.3)] px-3 py-1 text-xs text-[hsl(185_90%_45%)] font-bold",
        className
      )}
    >
      <Bot className="h-3.5 w-3.5" />
      Agent Ready
    </span>
  );
}
