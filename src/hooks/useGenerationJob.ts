/**
 * useGenerationJob — extracted from Index.tsx
 * Manages the full generate → deploy lifecycle.
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

type DeployPhase = "idle" | "deploying" | "polling" | "live" | "error";

export const STAGE_MAP: Record<string, { label: string; pct: number }> = {
  queued: { label: "Queuing your build…", pct: 3 },
  researching: { label: "Researching market demand…", pct: 10 },
  generating_code: { label: "Generating source code…", pct: 25 },
  generating_screenshots: { label: "Creating screenshots…", pct: 40 },
  packaging: { label: "Packaging ZIP bundle…", pct: 52 },
  uploading: { label: "Uploading files…", pct: 60 },
  creating_listing: { label: "Creating your listing…", pct: 65 },
  done: { label: "Build complete!", pct: 68 },
  deploying: { label: "Deploying to OpenDraft Cloud…", pct: 75 },
  deploy_building: { label: "Cloud build in progress…", pct: 85 },
  deploy_live: { label: "Your app is live! 🎉", pct: 100 },
  error: { label: "Something went wrong", pct: 0 },
};

export function useGenerationJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [genJob, setGenJob] = useState<GenJob | null>(null);
  const [deployPhase, setDeployPhase] = useState<DeployPhase>("idle");
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployId, setDeployId] = useState<string | null>(null);

  // Auto-deploy when generation completes
  useEffect(() => {
    if (genJob?.status === "complete" && genJob.listing_id && deployPhase === "idle") {
      handleAutoDeploy(genJob.listing_id);
    }
  }, [genJob?.status, genJob?.listing_id]);

  async function handleAutoDeploy(listingId: string) {
    setDeployPhase("deploying");
    setDeployError(null);
    try {
      const { data, error } = await supabase.functions.invoke("deploy-to-opendraft", {
        body: { listingId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.siteUrl && data?.deployId) {
        setDeployId(data.deployId);
        setDeployPhase("polling");
        pollDeployStatus(data.deployId, data.siteUrl);
      } else {
        throw new Error("Deploy returned no URL");
      }
    } catch (err) {
      console.error("Auto-deploy failed:", err);
      setDeployError(err instanceof Error ? err.message : "Deploy failed");
      setDeployPhase("error");
    }
  }

  async function pollDeployStatus(depId: string, siteUrl: string) {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke("check-vercel-deploy", {
          body: { deployId: depId, usePlatformToken: true },
        });
        if (data?.state === "ready") {
          clearInterval(interval);
          setDeployUrl(data.deployUrl || siteUrl);
          setDeployPhase("live");
          if (genJob?.listing_id) {
            supabase.from("listings").update({ demo_url: data.deployUrl || siteUrl }).eq("id", genJob.listing_id).then(() => {});
          }
        } else if (data?.state === "error" || data?.state === "canceled") {
          clearInterval(interval);
          setDeployError(data?.errorMessage || "Deploy failed during build");
          setDeployPhase("error");
        }
      } catch { /* keep polling */ }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setDeployUrl(siteUrl);
        setDeployPhase("live");
      }
    }, 5000);
  }

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

  const handleGenerate = useCallback(async (prompt: string) => {
    if (!user) { navigate("/login"); return; }
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenJob(null);
    setDeployPhase("idle");
    setDeployUrl(null);
    setDeployError(null);
    setDeployId(null);

    try {
      const { data: jobRow, error: jobErr } = await supabase
        .from("generation_jobs")
        .insert({ user_id: user.id, prompt, status: "pending", stage: "queued" })
        .select("id, status, stage, listing_id, listing_title, error")
        .single();

      if (jobErr || !jobRow) throw new Error("Failed to create generation job");
      setGenJob(jobRow as GenJob);

      supabase.functions.invoke("generate-template-app", {
        body: { count: 1, themes: [prompt], job_id: jobRow.id },
      }).catch(console.error);
    } catch (err) {
      setGenJob({ id: "", status: "failed", stage: "error", listing_id: null, listing_title: null, error: err instanceof Error ? err.message : "Unknown error" });
      setGenerating(false);
    }
  }, [user, navigate]);

  function getCurrentStage(): { label: string; pct: number } {
    if (deployPhase === "live") return STAGE_MAP.deploy_live;
    if (deployPhase === "polling") return STAGE_MAP.deploy_building;
    if (deployPhase === "deploying") return STAGE_MAP.deploying;
    if (deployPhase === "error") return STAGE_MAP.error;
    if (genJob?.status === "complete") return STAGE_MAP.done;
    return genJob ? (STAGE_MAP[genJob.stage] || STAGE_MAP.queued) : STAGE_MAP.queued;
  }

  const currentStage = getCurrentStage();
  const isInProgress = generating || (genJob != null && genJob.status !== "complete" && genJob.status !== "failed") || deployPhase === "deploying" || deployPhase === "polling";

  const reset = useCallback(() => {
    setGenJob(null);
    setDeployPhase("idle");
    setDeployUrl(null);
    setDeployId(null);
    setDeployError(null);
  }, []);

  return {
    generating,
    genJob,
    deployPhase,
    deployUrl,
    deployError,
    currentStage,
    isInProgress,
    handleGenerate,
    handleAutoDeploy,
    reset,
  };
}
