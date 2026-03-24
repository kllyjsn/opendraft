import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MetaTags } from "@/components/MetaTags";
import { Check, Loader2, Zap, Sparkles, Building2, ArrowRight, Shield, Headphones } from "lucide-react";
import { EnterpriseContactForm } from "@/components/EnterpriseContactForm";
import { cn } from "@/lib/utils";
import { FREE_TIER, CORE_PAID_TIERS, ENTERPRISE_TIERS, ANNUAL_DISCOUNT, type PricingTier } from "@/lib/pricing-tiers";
import { trackFunnel } from "@/hooks/useFunnelTracker";
import { PricingTierCard } from "@/components/pricing/PricingTierCard";

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, subscription, canClaimFree, purchaseCount, loading: subLoading } = useSubscription();
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true); // Default to annual for higher LTV

  async function handleSubscribe(tier: PricingTier, isAnnual: boolean) {
    if (!user) return;
    setSubscribingTier(tier.id);
    trackFunnel("subscribe_started", { tier: tier.id, price: tier.price, billing: isAnnual ? "annual" : "monthly" });
    try {
      const amount = isAnnual && tier.annualPrice ? tier.annualPrice : tier.price;
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount, mode: "subscription", tierId: tier.id, billing: isAnnual ? "annual" : "monthly" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setSubscribingTier(null);
    }
  }

  const currentPlan = subscription?.plan ?? null;
  const freeUsed = purchaseCount >= 1 && !isSubscribed;

  const sharedCardProps = {
    user,
    authLoading,
    subLoading,
    subscribingTier,
    isSubscribed,
    freeUsed,
    onSubscribe: handleSubscribe,
    annual,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Pricing — Own Production-Ready Software | OpenDraft"
        description="Get full source code, deploy configs, and direct builder messaging. Start free or scale with enterprise plans."
        path="/credits"
      />
      <Navbar />
      <main className="flex-1 page-enter">

        {/* Hero section */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-10 sm:pb-16 max-w-4xl text-center relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">
              Pricing
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
              Stop renting software.
              <br />
              <span className="text-muted-foreground">Start owning it.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every plan includes full source code, deploy configs, security audits, and direct builder messaging. You own everything — forever.
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="container mx-auto px-4 max-w-4xl mb-6 sm:mb-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {[
              "Full source code included",
              "One-click deploy to Netlify & Vercel",
              "Security-audited",
              "Cancel anytime",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Annual / Monthly toggle */}
        <section className="container mx-auto px-4 max-w-4xl mb-10 sm:mb-16">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center rounded-full bg-muted/60 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "text-sm font-semibold px-4 py-2 rounded-full transition-all",
                  !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "text-sm font-semibold px-4 py-2 rounded-full transition-all",
                  annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
              </button>
            </div>
            {annual && (
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                Save {ANNUAL_DISCOUNT}%
              </span>
            )}
          </div>
        </section>

        {/* Core pricing grid */}
        <section className="container mx-auto px-4 max-w-6xl mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <PricingTierCard
              tier={FREE_TIER}
              isCurrentPlan={currentPlan === "free"}
              {...sharedCardProps}
            />
            {CORE_PAID_TIERS.map((tier) => (
              <PricingTierCard
                key={tier.id}
                tier={tier}
                highlight={tier.popular}
                isCurrentPlan={currentPlan === tier.id}
                {...sharedCardProps}
              />
            ))}
          </div>
        </section>

        {/* Enterprise section */}
        {ENTERPRISE_TIERS.length > 0 && (
          <section id="enterprise" className="container mx-auto px-4 max-w-6xl mb-24">
            <div className="flex items-center gap-4 mb-12">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Enterprise
              </span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {ENTERPRISE_TIERS.map((tier) => (
                <PricingTierCard
                  key={tier.id}
                  tier={tier}
                  highlight={tier.badge === "Best value"}
                  isCurrentPlan={currentPlan === tier.id}
                  {...sharedCardProps}
                />
              ))}
            </div>
          </section>
        )}

        {/* SaaS Savings Calculator */}
        <section className="container mx-auto px-4 max-w-3xl mb-24">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              How much are you spending on SaaS?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              The average small business pays <strong className="text-foreground">$500–$2,000/mo</strong> for generic software they don't own. 
              With OpenDraft, build custom replacements for <strong className="text-foreground">$20–$50/mo</strong> — and own the code forever.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
              {[
                { saas: "CRM", cost: "$65/mo", save: "$780/yr" },
                { saas: "Scheduling", cost: "$75/mo", save: "$900/yr" },
                { saas: "Invoicing", cost: "$40/mo", save: "$480/yr" },
              ].map(({ saas, cost, save }) => (
                <div key={saas} className="rounded-xl border border-border/40 bg-card p-4">
                  <p className="text-xs text-muted-foreground font-medium">{saas}</p>
                  <p className="text-sm line-through text-muted-foreground">{cost}</p>
                  <p className="text-sm font-bold text-primary">Save {save}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Replace 3 SaaS tools → save <strong className="text-foreground">$2,160/yr</strong> minimum
            </p>
          </div>
        </section>

        {/* Enterprise Contact Form */}
        <section className="container mx-auto px-4 max-w-3xl mb-24">
          <EnterpriseContactForm />
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 max-w-3xl mb-24">
          <div className="rounded-2xl border border-border/40 bg-card p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              Need something custom?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              Hire the original builder for ongoing support, feature requests, and customization through a monthly retainer.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground/60">
              {["Custom features", "Priority support", "Ongoing updates"].map((tag) => (
                <span key={tag} className="rounded-full border border-border/60 px-4 py-1.5 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Fine print */}
        <section className="container mx-auto px-4 max-w-3xl pb-16 text-center">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            All plans include marketplace browsing, source code downloads, and direct builder messaging.
            No development services included — hire builders separately for custom work. Prices in USD.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
}
