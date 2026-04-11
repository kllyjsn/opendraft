import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [purchaseCount, setPurchaseCount] = useState(0);

  async function fetchSubscription() {
    if (!user) { setIsSubscribed(false); setLoading(false); setPurchaseCount(0); return; }

    try {
      const [subResult, countResult] = await Promise.all([
        api.get<{ data: any }>("/subscriptions/me"),
        api.get<{ count: number }>("/purchases/count"),
      ]);

      setSubscription(subResult.data);
      setIsSubscribed(!!subResult.data);
      setPurchaseCount(countResult.count ?? 0);
    } catch {
      setIsSubscribed(false);
      setPurchaseCount(0);
    }
    setLoading(false);
  }

  useEffect(() => { fetchSubscription(); }, [user]);

  const plan = subscription?.plan as string | null;
  const appLimit = plan === "unlimited" || plan === "agency" || plan === "enterprise" || plan === "pro" ? Infinity : plan === "growth" ? 20 : plan === "starter" ? 5 : 1;
  const canClaimFree = !isSubscribed && purchaseCount < 1;

  return { isSubscribed, loading, subscription, plan, appLimit, purchaseCount, canClaimFree, refetch: fetchSubscription };
}
