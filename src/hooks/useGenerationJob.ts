/**
 * useGenerationJob — extracted from Index.tsx
 * Manages the generate lifecycle (no auto-deploy).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
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
  researching: { label: "Researching market demand…", pct: 10 },
  adapting_brand: { label: "Adapting to brand design system…", pct: 15 },
  generating_code: { label: "Generating source code…", pct: 25 },
  validating: { label: "Validating code quality…", pct: 45 },
  generating_marketing: { label: "Creating marketing & positioning…", pct: 55 },
  generating_screenshots: { label: "Creating screenshots…", pct: 65 },
  packaging: { label: "Packaging app, screenshots & marketing kit…", pct: 70 },
  uploading: { label: "Uploading files…", pct: 88 },
  creating_listing: { label: "Creating your listing…", pct: 95 },
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

  // Poll for generation job updates
  useEffect(() => {
    if (!genJob || genJob.status === "complete" || genJob.status === "failed") return;

    const poll = setInterval(async () => {
      try {
        const { data } = await api.get<{ data: GenJob }>(`/generation-jobs/${genJob.id}`);
        if (data) {
          setGenJob(data);
          if (data.status === "complete" || data.status === "failed") { setGenerating(false); clearInterval(poll); }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    const timeout = setTimeout(() => {
      setGenJob(prev => {
        if (prev && prev.status !== "complete" && prev.status !== "failed") {
          setGenerating(false);
          return { ...prev, status: "failed", stage: "error", error: "Taking longer than expected. Check your dashboard." };
        }
        return prev;
      });
    }, 180000);

    return () => { clearInterval(poll); clearTimeout(timeout); };
  }, [genJob?.id, genJob?.status]);

  const handleGenerate = useCallback(async (prompt: string, brandContext?: Record<string, string>) => {
    if (!user) {
      if (prompt.trim()) sessionStorage.setItem("opendraft_pending_generate", prompt);
      navigate("/login");
      return;
    }
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenJob(null);

    try {
      const { data: jobRow } = await api.post<{ data: GenJob }>("/generation-jobs", {
        prompt, status: "pending", stage: "queued",
      });

      if (!jobRow) throw new Error("Failed to create generation job");
      setGenJob(jobRow);

      // Fire-and-forget: trigger the generation function
      api.post("/functions/generate-template-app", {
        count: 1,
        themes: [prompt],
        job_id: jobRow.id,
        ...(brandContext ? { brand_context: brandContext } : {}),
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
