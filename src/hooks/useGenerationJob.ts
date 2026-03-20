/**
 * useGenerationJob — extracted from Index.tsx
 * Manages the generate lifecycle (no auto-deploy).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GenJob {
  id: string;
  status: string;
  stage: string;
  listing_id: string | null;
  listing_title: string | null;
  error: string | null;
}

export const STAGE_MAP: Record<string, { label: string; pct: number }> = {
  queued: { label: "Queuing your build…", pct: 5 },
  researching: { label: "Researching market demand…", pct: 12 },
  adapting_brand: { label: "Adapting to brand design system…", pct: 20 },
  generating_code: { label: "Generating source code…", pct: 30 },
  validating: { label: "Validating code quality…", pct: 45 },
  generating_marketing: { label: "Creating marketing & positioning…", pct: 55 },
  generating_screenshots: { label: "Creating screenshots…", pct: 65 },
  packaging: { label: "Packaging app + marketing kit…", pct: 75 },
  uploading: { label: "Uploading files…", pct: 85 },
  creating_listing: { label: "Creating your listing…", pct: 92 },
  done: { label: "Build complete! 🎉", pct: 100 },
  error: { label: "Something went wrong", pct: 0 },
};

export function useGenerationJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [genJob, setGenJob] = useState<GenJob | null>(null);

  // Navigate to listing detail when generation completes
  useEffect(() => {
    if (genJob?.status === "complete" && genJob.listing_id) {
      const timer = setTimeout(() => {
        navigate(`/listing/${genJob.listing_id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [genJob?.status, genJob?.listing_id, navigate]);

  // Subscribe to generation job updates
  useEffect(() => {
    if (!genJob || genJob.status === "complete" || genJob.status === "failed") return;

    const channel = supabase
      .channel(`browse-job-${genJob.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "generation_jobs",
        filter: `id=eq.${genJob.id}`,
      }, (payload) => {
        const updated = payload.new as GenJob;
        setGenJob(updated);
        if (updated.status === "complete" || updated.status === "failed") setGenerating(false);
      })
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase.from("generation_jobs").select("id, status, stage, listing_id, listing_title, error").eq("id", genJob.id).single();
      if (data) {
        setGenJob(data as GenJob);
        if (data.status === "complete" || data.status === "failed") { setGenerating(false); clearInterval(poll); }
      }
    }, 5000);

    const timeout = setTimeout(() => {
      setGenJob(prev => {
        if (prev && prev.status !== "complete" && prev.status !== "failed") {
          setGenerating(false);
          return { ...prev, status: "failed", stage: "error", error: "Taking longer than expected. Check your dashboard." };
        }
        return prev;
      });
    }, 180000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); clearTimeout(timeout); };
  }, [genJob?.id, genJob?.status]);

  const handleGenerate = useCallback(async (prompt: string, brandContext?: Record<string, string>) => {
    if (!user) { navigate("/login"); return; }
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenJob(null);

    try {
      const { data: jobRow, error: jobErr } = await supabase
        .from("generation_jobs")
        .insert({ user_id: user.id, prompt, status: "pending", stage: "queued" })
        .select("id, status, stage, listing_id, listing_title, error")
        .single();

      if (jobErr || !jobRow) throw new Error("Failed to create generation job");
      setGenJob(jobRow as GenJob);

      supabase.functions.invoke("generate-template-app", {
        body: {
          count: 1,
          themes: [prompt],
          job_id: jobRow.id,
          ...(brandContext ? { brand_context: brandContext } : {}),
        },
      }).catch(console.error);
    } catch (err) {
      setGenJob({ id: "", status: "failed", stage: "error", listing_id: null, listing_title: null, error: err instanceof Error ? err.message : "Unknown error" });
      setGenerating(false);
    }
  }, [user, navigate]);

  function getCurrentStage(): { label: string; pct: number } {
    if (genJob?.status === "complete") return STAGE_MAP.done;
    return genJob ? (STAGE_MAP[genJob.stage] || STAGE_MAP.queued) : STAGE_MAP.queued;
  }

  const currentStage = getCurrentStage();
  const isInProgress = generating || (genJob != null && genJob.status !== "complete" && genJob.status !== "failed");

  const reset = useCallback(() => {
    setGenJob(null);
  }, []);

  return {
    generating,
    genJob,
    currentStage,
    isInProgress,
    handleGenerate,
    reset,
  };
}
