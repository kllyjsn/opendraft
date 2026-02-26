import { Bot } from "lucide-react";

interface AgentPopularBadgeProps {
  agentViewCount?: number;
  size?: "sm" | "md";
}

export function AgentPopularBadge({ agentViewCount, size = "sm" }: AgentPopularBadgeProps) {
  if (!agentViewCount || agentViewCount < 3) return null;

  return (
    <div className={`flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 ${size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"}`}>
      <Bot className={size === "sm" ? "h-2.5 w-2.5 text-primary" : "h-3 w-3 text-primary"} />
      <span className={`font-bold text-primary ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
        Popular with agents
      </span>
    </div>
  );
}
