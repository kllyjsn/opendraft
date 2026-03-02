import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  async function fetchSubscription() {
    if (!user) { setIsSubscribed(false); setLoading(false); return; }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    setSubscription(data);
    setIsSubscribed(!!data);
    setLoading(false);
  }

  useEffect(() => { fetchSubscription(); }, [user]);

  return { isSubscribed, loading, subscription, refetch: fetchSubscription };
}
