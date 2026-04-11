import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
      try {
        const [subRes, purchaseRes, deployRes] = await Promise.all([
          api.get<{ data: any }>("/subscriptions/me"),
          api.get<{ count: number }>("/purchases/count"),
          api.get<{ data: any[] }>("/deployed-sites"),
        ]);

        setHasSubscription(!!subRes.data);
        setHasPurchase((purchaseRes.count ?? 0) > 0);
        setHasDeploy((deployRes.data?.length ?? 0) > 0);
      } catch {
        // ignore
      }
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
      id: "claim",
      label: "Claim your first app free",
      description: "Browse the store and claim any app — full source code, yours forever. No card required.",
      completed: hasPurchase,
      cta: { label: "Browse apps", path: "/" },
    },
    {
      id: "deploy",
      label: "Deploy your app",
      description: "Ship it live to the world with one click. Netlify or Vercel — your call.",
      completed: hasDeploy,
      cta: { label: "View your apps", path: "/profile" },
    },
    {
      id: "subscribe",
      label: "Unlock more apps",
      description: "Love it? Subscribe to claim unlimited apps and unlock the full marketplace.",
      completed: hasSubscription,
      cta: { label: "See plans", path: "/credits" },
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
