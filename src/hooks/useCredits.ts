import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchBalance() {
    if (!user) { setBalance(null); setLoading(false); return; }
    const { data } = await supabase
      .from("credit_balances" as any)
      .select("balance")
      .eq("user_id", user.id)
      .single();
    setBalance((data as any)?.balance ?? 0);
    setLoading(false);
  }

  useEffect(() => { fetchBalance(); }, [user]);

  return { balance, loading, refetch: fetchBalance };
}
