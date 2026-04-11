import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export interface AnalyzedUrl {
  id: string;
  url: string;
  business_name: string | null;
  industry: string | null;
  summary: string | null;
  insights: any[];
  recommended_builds: any[];
  is_fallback: boolean;
  created_at: string;
}

export function useAnalyzedUrls() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalyzedUrl[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalyses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ data: AnalyzedUrl[] }>("/analyzed-urls");
      if (data) setAnalyses(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  return { analyses, loading, refetch: fetchAnalyses };
}
