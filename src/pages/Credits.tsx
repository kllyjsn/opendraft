import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, Loader2, Crown, Zap, MessageSquare, Download, Shield, Infinity, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Download, text: "Claim & download any app — unlimited" },
  { icon: Infinity, text: "Full source code on every project" },
  { icon: Shield, text: "Deploy anywhere — yours forever" },
  { icon: MessageSquare, text: "Message any builder directly" },
];

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribe() {
    if (!user) return;
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount: 2000, mode: "subscription" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setSubscribing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl page-enter">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            One plan. Every app.
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Subscribe for $20/mo and claim any project on OpenDraft. Need custom work? Hire your builder directly.
          </p>
        </div>

        {/* Pricing card */}
        <div className="rounded-3xl border-2 border-primary/30 bg-card p-8 md:p-10 shadow-card max-w-lg mx-auto mb-16">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black">$20</span>
            <span className="text-muted-foreground font-medium">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Cancel anytime. No lock-in.</p>

          <div className="space-y-3 mb-8">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {authLoading || subLoading ? (
            <div className="h-12 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : isSubscribed ? (
            <div className="rounded-xl bg-primary/8 border border-primary/20 px-5 py-4 text-center">
              <p className="font-bold text-primary flex items-center justify-center gap-2">
                <Check className="h-5 w-5" /> You're subscribed
              </p>
              <p className="text-xs text-muted-foreground mt-1">You have unlimited access to all apps.</p>
            </div>
          ) : user ? (
            <Button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
            >
              {subscribing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Subscribe — $20/mo</>
              )}
            </Button>
          ) : (
            <Link to="/login">
              <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold">
                Sign in to subscribe
              </Button>
            </Link>
          )}
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
