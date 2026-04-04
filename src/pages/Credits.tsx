import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MetaTags } from "@/components/MetaTags";
import { Check, Loader2, Building2, ArrowRight, Shield, Users, LayoutGrid, Lock, Globe } from "lucide-react";
import { EnterpriseContactForm } from "@/components/EnterpriseContactForm";
import { cn } from "@/lib/utils";
import { FREE_TIER, CORE_PAID_TIERS, ANNUAL_DISCOUNT, type PricingTier } from "@/lib/pricing-tiers";
import { trackFunnel } from "@/hooks/useFunnelTracker";
import { PricingTierCard } from "@/components/pricing/PricingTierCard";

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, subscription, canClaimFree, purchaseCount, loading: subLoading } = useSubscription();
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);

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
        title="Pricing — Own Your Software Stack | OpenDraft"
        description="Stop paying per-seat SaaS fees. Own production-ready software with full source code. Team workspaces and enterprise plans available."
        path="/credits"
      />
      <Navbar />
      <main className="flex-1 page-enter">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-10 sm:pb-16 max-w-4xl text-center relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">
              Pricing
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
              Own your software.
              <br />
              <span className="text-muted-foreground">Kill the per-seat tax.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              From solo builders to enterprise teams — get full source code, team workspaces, and compliance-ready apps you own forever.
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="container mx-auto px-4 max-w-4xl mb-6 sm:mb-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {[
              { icon: Lock, text: "Full source code included" },
              { icon: LayoutGrid, text: "Team app workspaces" },
              { icon: Shield, text: "Compliance tagging" },
              { icon: Globe, text: "Deploy anywhere" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Toggle */}
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

        {/* Pricing grid */}
        <section className="container mx-auto px-4 max-w-6xl mb-16">
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

        {/* Team workspace showcase */}
        <section className="container mx-auto px-4 max-w-5xl mb-24">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
                <Building2 className="h-3.5 w-3.5" /> Team & Enterprise
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                Your private app marketplace
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Like Okta for software you own. Give every team member access to approved, compliant apps — no per-seat fees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: LayoutGrid,
                  title: "App Launcher",
                  desc: "Okta-style dashboard with all approved apps in one place. Search, filter by department, launch instantly.",
                },
                {
                  icon: Users,
                  title: "Team Management",
                  desc: "Invite members, assign roles (Owner, Admin, Builder, Member), and control access at every level.",
                },
                {
                  icon: Shield,
                  title: "Compliance Built-In",
                  desc: "Tag apps with SOC2, HIPAA, GDPR. Admin approval workflow before any app enters the catalog.",
                },
                {
                  icon: Lock,
                  title: "You Own Everything",
                  desc: "Full source code, deploy configs, security audits. No vendor lock-in, no subscription creep.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border/30 bg-card p-5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/enterprise">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 font-semibold group">
                  Explore team workspaces
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SaaS Savings Calculator */}
        <section className="container mx-auto px-4 max-w-3xl mb-24">
          <div className="rounded-2xl border border-border/40 bg-card p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              How much is your team spending on SaaS?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              The average team pays <strong className="text-foreground">$2,000–$10,000/mo</strong> for per-seat software they don't own.
              With OpenDraft, build custom replacements and <strong className="text-foreground">own the code forever</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
              {[
                { saas: "CRM (10 seats)", cost: "$650/mo", save: "$7,800/yr" },
                { saas: "PM Tool (10 seats)", cost: "$300/mo", save: "$3,600/yr" },
                { saas: "Analytics (10 seats)", cost: "$400/mo", save: "$4,800/yr" },
              ].map(({ saas, cost, save }) => (
                <div key={saas} className="rounded-xl border border-border/40 bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground font-medium">{saas}</p>
                  <p className="text-sm line-through text-muted-foreground">{cost}</p>
                  <p className="text-sm font-bold text-primary">Save {save}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Replace 3 SaaS tools for a team of 10 → save <strong className="text-foreground">$16,200/yr</strong>
            </p>
          </div>
        </section>

        {/* Enterprise Contact */}
        <section className="container mx-auto px-4 max-w-3xl mb-24">
          <EnterpriseContactForm />
        </section>

        {/* Custom work CTA */}
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
            Team workspace available on Team plan and above. Prices in USD.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
}
