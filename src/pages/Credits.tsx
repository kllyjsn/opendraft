import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MetaTags } from "@/components/MetaTags";
import { Check, Loader2, Crown, Zap, Wrench, Sparkles, Gift, Building2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { FREE_TIER, CORE_PAID_TIERS, ENTERPRISE_TIERS, type PricingTier } from "@/lib/pricing-tiers";
import { trackFunnel } from "@/hooks/useFunnelTracker";

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, subscription, canClaimFree, purchaseCount, loading: subLoading } = useSubscription();
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);

  async function handleSubscribe(tier: PricingTier) {
    if (!user) return;
    setSubscribingTier(tier.id);
    trackFunnel("subscribe_started", { tier: tier.id, price: tier.price });
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount: tier.price, mode: "subscription", tierId: tier.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setSubscribingTier(null);
    }
  }

  const currentPlan = subscription?.plan ?? null;
  const freeUsed = purchaseCount >= 1 && !isSubscribed;

  function TierCard({ tier, highlight }: { tier: PricingTier; highlight?: boolean }) {
    const isCurrentPlan = currentPlan === tier.id;
    const isLoading = subscribingTier === tier.id;
    const isFree = tier.price === 0;

    return (
      <div
        className={cn(
          "rounded-3xl border-2 bg-card p-6 md:p-7 shadow-card flex flex-col relative transition-shadow hover:shadow-lg",
          highlight ? "border-primary/50 shadow-glow" : "border-border"
        )}
      >
        {tier.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full gradient-hero px-3 py-1 text-xs font-bold text-white shadow-glow">
              <Sparkles className="h-3 w-3" /> Most Popular
            </span>
          </div>
        )}
        {tier.badge && !tier.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              {tier.badge}
            </span>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
        </div>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-black">${tier.price / 100}</span>
          {tier.price > 0 && <span className="text-muted-foreground font-medium">/mo</span>}
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {isFree ? `${tier.appLimitLabel} · No card required` : `${tier.appLimitLabel} · Cancel anytime`}
        </p>

        <div className="space-y-2.5 mb-6 flex-1">
          {tier.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {authLoading || subLoading ? (
          <div className="h-11 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : isFree ? (
          isSubscribed ? (
            <div className="rounded-xl bg-muted px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground font-medium">Included in your plan</p>
            </div>
          ) : freeUsed ? (
            <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
              <p className="font-bold text-primary flex items-center justify-center gap-2 text-sm">
                <Check className="h-4 w-4" /> Used
              </p>
            </div>
          ) : user ? (
            <Link to="/">
              <Button variant="outline" className="w-full h-11 text-sm font-bold">
                <Gift className="h-4 w-4 mr-2" /> Browse & claim your free app
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" className="w-full h-11 text-sm font-bold">
                Sign up free
              </Button>
            </Link>
          )
        ) : isCurrentPlan ? (
          <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
            <p className="font-bold text-primary flex items-center justify-center gap-2 text-sm">
              <Check className="h-4 w-4" /> Current plan
            </p>
          </div>
        ) : user ? (
          <Button
            onClick={() => handleSubscribe(tier)}
            disabled={!!subscribingTier}
            className={cn(
              "w-full h-11 text-sm font-bold",
              highlight ? "gradient-hero text-white border-0 shadow-glow hover:opacity-90" : ""
            )}
            variant={highlight ? "default" : "outline"}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
            ) : isSubscribed ? "Switch plan" : (
              <><Zap className="h-4 w-4 mr-2" /> Subscribe</>
            )}
          </Button>
        ) : (
          <Link to="/login">
            <Button
              className={cn(
                "w-full h-11 text-sm font-bold",
                highlight ? "gradient-hero text-white border-0 shadow-glow hover:opacity-90" : ""
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl page-enter">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Pick your plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Every plan includes full source code, deploy configs, security audits, auto-generated READMEs, and direct builder messaging.
          </p>
        </div>

        {/* Core pricing grid — Free + 3 paid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 max-w-5xl mx-auto">
          <TierCard tier={FREE_TIER} />
          {CORE_PAID_TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} highlight={tier.popular} />
          ))}
        </div>

        {/* Enterprise tiers */}
        {ENTERPRISE_TIERS.length > 0 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent-foreground mb-4">
                <Building2 className="h-4 w-4" /> For agencies & enterprises
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                Scale with volume pricing
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                White-label apps for your clients. Unlimited access, bulk deploy, and dedicated support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16 max-w-3xl mx-auto">
              {ENTERPRISE_TIERS.map((tier) => (
                <TierCard key={tier.id} tier={tier} highlight={tier.badge === "Best value"} />
              ))}
            </div>
          </>
        )}

        {/* All plans include */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            All plans include marketplace browsing, source code downloads, and direct builder messaging. No development services included — hire builders separately for custom work.
          </p>
        </div>

        {/* Builder support section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight mb-2">Need custom work?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Hire the original builder for ongoing support, feature requests, and customization through a monthly retainer.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Wrench className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Builder Support Retainer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                After claiming an app, message the builder to set up a monthly support plan. They'll customize, maintain, and ship features tailored to your needs.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1 font-medium">Custom features</span>
                <span className="rounded-full bg-muted px-3 py-1 font-medium">Priority support</span>
                <span className="rounded-full bg-muted px-3 py-1 font-medium">Ongoing updates</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
