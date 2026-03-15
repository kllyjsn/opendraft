import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [purchaseCount, setPurchaseCount] = useState(0);

  async function fetchSubscription() {
    if (!user) { setIsSubscribed(false); setLoading(false); setPurchaseCount(0); return; }

    // Fetch subscription and purchase count in parallel
    const [subResult, countResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("purchases")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", user.id),
    ]);

    setSubscription(subResult.data);
    setIsSubscribed(!!subResult.data);
    setPurchaseCount(countResult.count ?? 0);
    setLoading(false);
  }

  useEffect(() => { fetchSubscription(); }, [user]);

  // Derived helpers
  const plan = subscription?.plan as string | null;
  const appLimit = plan === "unlimited" || plan === "agency" || plan === "enterprise" || plan === "pro" ? Infinity : plan === "growth" ? 20 : plan === "starter" ? 5 : 1;
  const canClaimFree = !isSubscribed && purchaseCount < 1;

  return { isSubscribed, loading, subscription, plan, appLimit, purchaseCount, canClaimFree, refetch: fetchSubscription };
}
