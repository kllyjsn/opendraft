import { useSubscription } from "@/hooks/useSubscription";
import { Crown, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  unlimited: "Unlimited",
};

export function CreditBadge({ className }: { className?: string }) {
  const { isSubscribed, plan, canClaimFree, loading } = useSubscription();

  if (loading) return null;

  const label = isSubscribed
    ? (plan ? (PLAN_LABELS[plan] ?? "Pro") : "Pro")
    : canClaimFree
      ? "1 App Credit"
      : "Claimed";

  return (
    <Link
      to="/credits"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-200",
        isSubscribed
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : canClaimFree
            ? "bg-accent/10 text-accent hover:bg-accent/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
    >
      {isSubscribed ? <Crown className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
      {label}
    </Link>
  );
}
