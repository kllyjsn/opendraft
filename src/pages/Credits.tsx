import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { Coins, Loader2, Sparkles, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_PACKS = [
  { amount: 1000, label: "$10", popular: false },
  { amount: 2500, label: "$25", popular: true },
  { amount: 5000, label: "$50", popular: false },
  { amount: 10000, label: "$100", popular: false },
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
  const [buying, setBuying] = useState<number | null>(null);

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
    setBuying(amountCents);
    try {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { amount: amountCents },
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

        {/* Top-up packs */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Add credits
          </h2>
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
                <span className="block text-xs text-muted-foreground mt-1">credits</span>
                {buying === pack.amount && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2 text-primary" />}
              </button>
            ))}
          </div>
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
                      tx.amount > 0 ? "bg-green-500/10" : "bg-muted"
                    )}>
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
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
                  <span className={cn("text-sm font-bold", tx.amount > 0 ? "text-green-600" : "text-foreground")}>
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
