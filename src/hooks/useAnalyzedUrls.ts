import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const { data } = await (supabase as any)
      .from("analyzed_urls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setAnalyses(data as AnalyzedUrl[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  return { analyses, loading, refetch: fetchAnalyses };
}
