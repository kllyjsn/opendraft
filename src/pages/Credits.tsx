import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { Coins, Loader2, Sparkles, ArrowUpRight, ArrowDownLeft, Zap, Crown, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_PACKS = [
  { amount: 1000, label: "$10", popular: false },
  { amount: 2500, label: "$25", popular: true },
  { amount: 5000, label: "$50", popular: false },
  { amount: 10000, label: "$100", popular: false },
];

const SUBSCRIPTION_TIERS = [
  { price: 1500, credits: 2000, label: "Starter", icon: Zap, savings: "25% bonus", popular: false },
  { price: 3000, credits: 5000, label: "Builder", icon: Crown, savings: "67% bonus", popular: true },
  { price: 5000, credits: 10000, label: "Studio", icon: Rocket, savings: "100% bonus", popular: false },
];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: balLoading, refetch } = useCredits();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [tab, setTab] = useState<"packs" | "subscribe">("subscribe");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("credit_transactions" as any)
      .select("id,amount,type,description,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setTransactions((data as any) ?? []));
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  async function handleBuyPack(amountCents: number) {
    setBuying(`pack-${amountCents}`);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount: amountCents, mode: "payment" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setBuying(null);
    }
  }

  async function handleSubscribe(priceCents: number) {
    setBuying(`sub-${priceCents}`);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount: priceCents, mode: "subscription" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      setBuying(null);
    }
  }

  const dollars = balance !== null ? (balance / 100).toFixed(2) : "—";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl page-enter">
        {/* Balance card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Coins className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-1">
            {balLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : `$${dollars}`}
          </h1>
          <p className="text-sm text-muted-foreground">Available credits</p>
        </div>

        {/* Add credits section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Add credits
          </h2>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg bg-muted p-1 mb-5">
            <button
              onClick={() => setTab("subscribe")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200",
                tab === "subscribe" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly plans
            </button>
            <button
              onClick={() => setTab("packs")}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200",
                tab === "packs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              One-time packs
            </button>
          </div>

          {tab === "subscribe" ? (
            <div className="grid gap-3">
              {SUBSCRIPTION_TIERS.map((tier) => {
                const Icon = tier.icon;
                const priceDollars = (tier.price / 100).toFixed(0);
                const creditDollars = (tier.credits / 100).toFixed(0);
                const isLoading = buying === `sub-${tier.price}`;
                return (
                  <button
                    key={tier.price}
                    onClick={() => handleSubscribe(tier.price)}
                    disabled={buying !== null}
                    className={cn(
                      "relative rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 hover:shadow-card transition-all duration-200 flex items-center gap-4",
                      tier.popular && "ring-2 ring-primary/30"
                    )}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Best value
                      </span>
                    )}
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      tier.popular ? "bg-primary/15" : "bg-muted"
                    )}>
                      <Icon className={cn("h-5 w-5", tier.popular ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{tier.label}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {tier.savings}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        ${creditDollars} in credits every month
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black">${priceDollars}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1 text-primary" />}
                    </div>
                  </button>
                );
              })}
              <p className="text-xs text-muted-foreground text-center mt-1">Cancel anytime. Unused credits roll over.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.amount}
                  onClick={() => handleBuyPack(pack.amount)}
                  disabled={buying !== null}
                  className={cn(
                    "relative rounded-xl border border-border bg-card p-5 text-center hover:border-primary/50 hover:shadow-card transition-all duration-200",
                    pack.popular && "ring-2 ring-primary/30"
                  )}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Popular
                    </span>
                  )}
                  <span className="text-xl font-black">{pack.label}</span>
                  <span className="block text-xs text-muted-foreground mt-1">one-time</span>
                  {buying === `pack-${pack.amount}` && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-lg font-bold mb-4">Transaction history</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      tx.amount > 0 ? "bg-primary/10" : "bg-muted"
                    )}>
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold", tx.amount > 0 ? "text-primary" : "text-foreground")}>
                    {tx.amount > 0 ? "+" : ""}${(tx.amount / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
