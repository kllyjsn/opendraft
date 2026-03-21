import { Check, Loader2, Sparkles, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PricingTier } from "@/lib/pricing-tiers";
import { getEffectiveMonthlyPrice, getAnnualSavings } from "@/lib/pricing-tiers";

interface PricingTierCardProps {
  tier: PricingTier;
  highlight?: boolean;
  isCurrentPlan: boolean;
  isSubscribed: boolean;
  freeUsed: boolean;
  user: any;
  authLoading: boolean;
  subLoading: boolean;
  subscribingTier: string | null;
  onSubscribe: (tier: PricingTier, annual: boolean) => void;
  annual?: boolean;
}

export function PricingTierCard({
  tier,
  highlight,
  isCurrentPlan,
  isSubscribed,
  freeUsed,
  user,
  authLoading,
  subLoading,
  subscribingTier,
  onSubscribe,
  annual = false,
}: PricingTierCardProps) {
  const isLoading = subscribingTier === tier.id;
  const isFree = tier.price === 0;
  const effectivePrice = getEffectiveMonthlyPrice(tier, annual);
  const savings = getAnnualSavings(tier);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 md:p-8 flex flex-col relative transition-all duration-300",
        highlight
          ? "border-primary/40 shadow-[0_0_60px_hsl(265_90%_62%/0.15)] scale-[1.02]"
          : "border-border/60 hover:border-border",
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Recommended
          </span>
        </div>
      )}
      {tier.badge && !tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/20 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-secondary">
            {tier.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {tier.name}
        </h3>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black tracking-tight">${effectivePrice / 100}</span>
          {tier.price > 0 && (
            <span className="text-base text-muted-foreground font-medium">/month</span>
          )}
        </div>
        {annual && savings > 0 && (
          <p className="text-xs font-semibold text-primary mb-2">
            Save ${savings / 100}/yr with annual billing
          </p>
        )}
        {annual && tier.annualPrice && (
          <p className="text-xs text-muted-foreground line-through mb-2">
            ${tier.price / 100}/mo billed monthly
          </p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
      </div>

      <div className="border-t border-border/40 pt-5 mb-6 space-y-3 flex-1">
        {tier.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-foreground/80">{feature}</span>
          </div>
        ))}
      </div>

      {authLoading || subLoading ? (
        <div className="h-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : isFree ? (
        isSubscribed ? (
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground font-medium">Included in your plan</p>
          </div>
        ) : freeUsed ? (
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 text-center">
            <p className="font-semibold text-primary flex items-center justify-center gap-2 text-sm">
              <Check className="h-4 w-4" /> Claimed
            </p>
          </div>
        ) : user ? (
          <Link to="/">
            <Button variant="outline" className="w-full h-12 text-sm font-semibold">
              <Gift className="h-4 w-4 mr-2" /> Claim your free app
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="outline" className="w-full h-12 text-sm font-semibold">
              Get started free
            </Button>
          </Link>
        )
      ) : isCurrentPlan ? (
        <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 text-center">
          <p className="font-semibold text-primary flex items-center justify-center gap-2 text-sm">
            <Check className="h-4 w-4" /> Current plan
          </p>
        </div>
      ) : user ? (
        <Button
          onClick={() => onSubscribe(tier, annual)}
          disabled={!!subscribingTier}
          className={cn(
            "w-full h-12 text-sm font-semibold",
            highlight
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(265_90%_62%/0.3)]"
              : "",
          )}
          variant={highlight ? "default" : "outline"}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
          ) : isSubscribed ? (
            "Switch plan"
          ) : (
            <><Zap className="h-4 w-4 mr-2" /> Subscribe</>
          )}
        </Button>
      ) : (
        <Link to="/login">
          <Button
            className={cn(
              "w-full h-12 text-sm font-semibold",
              highlight
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(265_90%_62%/0.3)]"
                : "",
            )}
            variant={highlight ? "default" : "outline"}
          >
            Sign in to subscribe
          </Button>
        </Link>
      )}
    </div>
  );
}
