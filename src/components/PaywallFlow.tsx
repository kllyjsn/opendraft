/**
 * PaywallFlow — 3-screen paywall inspired by Cal AI's conversion tactics.
 *
 * Screen 1: Personalized value recap (what they'll get)
 * Screen 2: Plan selector — annual default with free trial, monthly as decoy
 * Screen 3: Final CTA — "Try for $0.00" with reassurance
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Crown,
  Sparkles,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CORE_PAID_TIERS, type PricingTier, getEffectiveMonthlyPrice } from "@/lib/pricing-tiers";

interface PaywallFlowProps {
  onSelectPlan: (tier: PricingTier, annual: boolean) => void;
  onDismiss?: () => void;
  loading?: boolean;
  /** Context for personalization */
  context?: {
    appsViewed?: number;
    industry?: string;
  };
}

/* ── Screen 1: Value recap ── */
function ValueScreen({ onNext }: { onNext: () => void }) {
  const perks = [
    "Full source code — React + TypeScript",
    "Deploy anywhere in 90 seconds",
    "Security-audited & compliance-ready",
    "Direct access to the builder",
    "No per-seat fees, ever",
    "Yours forever — even if you cancel",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">
        Here's what you're unlocking
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Every app includes everything you need to ship — no upsells, no hidden costs.
      </p>

      <div className="space-y-2.5 max-w-xs mx-auto text-left mb-8">
        {perks.map((p) => (
          <div key={p} className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-foreground">{p}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-12 font-bold gap-2 w-full max-w-xs"
      >
        See plans <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

/* ── Screen 2: Plan selector ── */
function PlanScreen({
  selectedTier,
  setSelectedTier,
  annual,
  setAnnual,
  onNext,
  onBack,
}: {
  selectedTier: PricingTier;
  setSelectedTier: (t: PricingTier) => void;
  annual: boolean;
  setAnnual: (a: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Show starter + team (monthly as decoy, annual as default)
  const visibleTiers = CORE_PAID_TIERS.filter((t) => t.id !== "enterprise");

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <h2 className="text-2xl font-black tracking-tight mb-1">Choose your plan</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Start your free trial — cancel anytime.
      </p>

      {/* Billing toggle — annual default */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="inline-flex items-center rounded-full bg-muted/60 p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
              !annual
                ? "bg-muted-foreground/20 text-foreground"
                : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
              annual
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            Annual
          </button>
        </div>
        {annual && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Save 20% + free trial
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-6">
        {visibleTiers.map((tier) => {
          const monthly = getEffectiveMonthlyPrice(tier, annual);
          const isSelected = selectedTier.id === tier.id;
          const isPopular = tier.popular;

          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier)}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/40 bg-card hover:border-border"
              )}
            >
              {isPopular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {tier.id === "team" ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : (
                  <Crown className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-bold text-sm">{tier.name}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-black">
                  ${(monthly / 100).toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              {!annual && tier.annualPrice && (
                <p className="text-[10px] text-muted-foreground">
                  ${((tier.annualPrice / 12 / 100)).toFixed(0)}/mo if billed annually
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {tier.appLimitLabel} · {tier.description.split(".")[0]}
              </p>

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 max-w-md mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-full h-11 font-bold gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ── Screen 3: Final CTA ── */
function ConfirmScreen({
  tier,
  annual,
  onConfirm,
  onBack,
  loading,
}: {
  tier: PricingTier;
  annual: boolean;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}) {
  const monthly = getEffectiveMonthlyPrice(tier, annual);
  const hasFreeTrial = annual; // Free trial tied to annual plan

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Shield className="h-7 w-7 text-primary" />
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-2">
        {hasFreeTrial ? "Try for $0.00" : `Start ${tier.name} plan`}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        {hasFreeTrial
          ? "Your free trial starts today. You won't be charged until it ends — cancel anytime before."
          : `$${(monthly / 100).toFixed(0)}/mo billed monthly. Cancel anytime.`}
      </p>

      {/* Order summary */}
      <div className="rounded-xl border border-border/40 bg-muted/30 p-4 max-w-xs mx-auto mb-6 text-left">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">{tier.name} plan</span>
          <span className="text-sm font-bold">
            {hasFreeTrial ? "$0.00 today" : `$${(monthly / 100).toFixed(0)}/mo`}
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• {tier.appLimitLabel} with full source code</p>
          {hasFreeTrial && (
            <p className="text-primary font-medium">
              • 7-day free trial included
            </p>
          )}
          <p>
            • Then ${(monthly / 100).toFixed(0)}/mo{" "}
            {annual ? "(billed annually)" : ""}
          </p>
          <p>• Cancel anytime — keep what you've claimed</p>
        </div>
      </div>

      {/* Reassurance badges */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground mb-6">
        <span className="flex items-center gap-1">
          <Shield className="h-2.5 w-2.5" /> SSL secured
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-2.5 w-2.5" /> Cancel anytime
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-2.5 w-2.5" /> Keep code if you cancel
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full h-12 font-bold text-base"
        >
          {loading
            ? "Processing…"
            : hasFreeTrial
            ? "Try for $0.00"
            : `Start for $${(monthly / 100).toFixed(0)}/mo`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground text-xs"
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Change plan
        </Button>
      </div>
    </motion.div>
  );
}

/* ── Main 3-screen paywall ── */
export function PaywallFlow({ onSelectPlan, onDismiss, loading, context }: PaywallFlowProps) {
  const [screen, setScreen] = useState(0);
  const defaultTier = CORE_PAID_TIERS.find((t) => t.popular) ?? CORE_PAID_TIERS[0];
  const [selectedTier, setSelectedTier] = useState<PricingTier>(defaultTier);
  const [annual, setAnnual] = useState(true); // Annual is default (free trial tied here)

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === screen
                ? "w-6 bg-primary"
                : i < screen
                ? "w-1.5 bg-primary/40"
                : "w-1.5 bg-muted-foreground/20"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {screen === 0 && <ValueScreen key="val" onNext={() => setScreen(1)} />}
        {screen === 1 && (
          <PlanScreen
            key="plan"
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            annual={annual}
            setAnnual={setAnnual}
            onNext={() => setScreen(2)}
            onBack={() => setScreen(0)}
          />
        )}
        {screen === 2 && (
          <ConfirmScreen
            key="confirm"
            tier={selectedTier}
            annual={annual}
            onConfirm={() => onSelectPlan(selectedTier, annual)}
            onBack={() => setScreen(1)}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Dismiss link */}
      {onDismiss && (
        <div className="text-center mt-6">
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  );
}
