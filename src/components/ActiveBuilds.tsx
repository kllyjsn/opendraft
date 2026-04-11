import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { STAGE_MAP } from "@/hooks/useGenerationJob";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Rocket, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

interface BuildJob {
  id: string;
  prompt: string;
  status: string;
  stage: string | null;
  listing_id: string | null;
  listing_title: string | null;
  error: string | null;
  created_at: string;
}

export function ActiveBuilds() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<BuildJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchJobs() {
      const { data } = await api.from("generation_jobs")
        .select("id, prompt, status, stage, listing_id, listing_title, error, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setJobs((data as BuildJob[]) ?? []);
      setLoading(false);
    }

    fetchJobs();

    // Poll for real-time updates (replaces Supabase realtime)
    const pollInterval = setInterval(() => { fetchJobs(); }, 5000);

    return () => { clearInterval(pollInterval); };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-14 text-center">
        <div className="text-4xl mb-4">🔨</div>
        <h3 className="font-bold mb-1">No builds yet</h3>
        <p className="text-muted-foreground text-sm mb-5">
          Describe a business on the homepage and we'll build you a full app with source code, deployment, and marketing kit.
        </p>
        <Link to="/">
          <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
            <Rocket className="h-4 w-4 mr-2" /> Start a build
          </Button>
        </Link>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status !== "complete" && j.status !== "failed");
  const completedJobs = jobs.filter(j => j.status === "complete" || j.status === "failed");

  return (
    <div className="space-y-6">
      {/* Active builds */}
      {activeJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Building now
          </h3>
          <div className="space-y-3">
            {activeJobs.map(job => {
              const stageInfo = STAGE_MAP[job.stage ?? "queued"] ?? STAGE_MAP.queued;
              return (
                <div key={job.id} className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm line-clamp-1">{job.listing_title ?? job.prompt}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Started {new Date(job.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> In progress
                    </span>
                  </div>
                  <Progress value={stageInfo.pct} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{stageInfo.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed builds */}
      {completedJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Recent builds
          </h3>
          <div className="space-y-2">
            {completedJobs.map(job => {
              const isSuccess = job.status === "complete";
              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:shadow-card transition-shadow"
                >
                  {isSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">
                      {job.listing_title ?? job.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isSuccess ? "Build complete" : (job.error ?? "Build failed")} · {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isSuccess && job.listing_id && (
                    <Link to={`/listing/${job.listing_id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                        <ExternalLink className="h-3 w-3 mr-1" /> View
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact banner for the top of the dashboard showing count of active builds */
export function ActiveBuildsBanner() {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function check() {
      const { count } = await api.from("generation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .not("status", "in", '("complete","failed")');
      setActiveCount(count ?? 0);
    }

    check();

    // Poll for updates (replaces Supabase realtime)
    const pollInterval = setInterval(() => { check(); }, 5000);

    return () => { clearInterval(pollInterval); };
  }, [user]);

  if (activeCount === 0) return null;

  return (
    <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-6 flex items-center gap-3">
      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      <p className="text-sm font-medium">
        <span className="font-bold">{activeCount} build{activeCount > 1 ? "s" : ""}</span> in progress — check the <span className="font-bold">Builds</span> tab for live status.
      </p>
    </div>
  );
}
