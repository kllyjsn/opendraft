import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GremlinStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  cta?: { label: string; path: string };
}

export interface GremlinProgress {
  steps: GremlinStep[];
  completedCount: number;
  totalSteps: number;
  level: "egg" | "hatchling" | "explorer" | "full_gremlin";
  levelLabel: string;
  percentage: number;
  loading: boolean;
}

const LEVEL_MAP: Record<number, { level: GremlinProgress["level"]; label: string }> = {
  0: { level: "egg", label: "Gremlin Egg" },
  1: { level: "hatchling", label: "Hatchling" },
  2: { level: "explorer", label: "Explorer" },
  3: { level: "explorer", label: "Explorer" },
  4: { level: "full_gremlin", label: "Full Gremlin 🎉" },
};

export function useGremlinProgress(): GremlinProgress {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasPurchase, setHasPurchase] = useState(false);
  const [hasDeploy, setHasDeploy] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function check() {
      const [subRes, purchaseRes, deployRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .limit(1),
        supabase
          .from("purchases")
          .select("id")
          .eq("buyer_id", user!.id)
          .limit(1),
        supabase
          .from("deployed_sites")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1),
      ]);

      setHasSubscription((subRes.data?.length ?? 0) > 0);
      setHasPurchase((purchaseRes.data?.length ?? 0) > 0);
      setHasDeploy((deployRes.data?.length ?? 0) > 0);
      setLoading(false);
    }

    check();
  }, [user]);

  const steps: GremlinStep[] = [
    {
      id: "account",
      label: "Create your account",
      description: "You're in! Welcome to OpenDraft.",
      completed: !!user,
    },
    {
      id: "subscribe",
      label: "Subscribe to OpenDraft",
      description: "Unlock unlimited access to every app in the store.",
      completed: hasSubscription,
      cta: { label: "Subscribe — $20/mo", path: "/credits" },
    },
    {
      id: "claim",
      label: "Claim your first app",
      description: "Browse the store and claim any app — full source code, yours forever.",
      completed: hasPurchase,
      cta: { label: "Browse apps", path: "/" },
    },
    {
      id: "deploy",
      label: "Deploy an app",
      description: "Ship it live to the world with one click. Netlify or Vercel — your call.",
      completed: hasDeploy,
      cta: { label: "View your apps", path: "/dashboard" },
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const levelInfo = LEVEL_MAP[Math.min(completedCount, 4)] ?? LEVEL_MAP[0];

  return {
    steps,
    completedCount,
    totalSteps,
    level: levelInfo.level,
    levelLabel: levelInfo.label,
    percentage: Math.round((completedCount / totalSteps) * 100),
    loading,
  };
}
