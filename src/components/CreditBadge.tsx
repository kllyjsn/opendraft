import { useCredits } from "@/hooks/useCredits";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function CreditBadge({ className }: { className?: string }) {
  const { balance, loading } = useCredits();

  if (loading || balance === null) return null;

  const dollars = (balance / 100).toFixed(0);

  return (
    <Link
      to="/credits"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors duration-200",
        className
      )}
    >
      <Coins className="h-3.5 w-3.5" />
      ${dollars}
    </Link>
  );
}
