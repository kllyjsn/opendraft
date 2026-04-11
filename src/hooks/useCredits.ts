import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchBalance() {
    if (!user) { setBalance(null); setLoading(false); return; }
    try {
      const { balance: b } = await api.get<{ balance: number }>("/credits/balance");
      setBalance(b ?? 0);
    } catch {
      setBalance(0);
    }
    setLoading(false);
  }

  useEffect(() => { fetchBalance(); }, [user]);

  return { balance, loading, refetch: fetchBalance };
}
