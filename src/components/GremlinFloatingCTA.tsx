import { Bot, Sparkles } from "lucide-react";

interface Props {
  pendingCount?: number;
  onClick: () => void;
}

export function GremlinFloatingCTA({ pendingCount = 0, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
      aria-label="Open Gremlins improvement panel"
    >
      <div className="relative">
        <Bot className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
            {pendingCount}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold hidden sm:inline">Improve with Gremlins™</span>
      <Sparkles className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
