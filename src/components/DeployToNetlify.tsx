import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Rocket, ExternalLink, Loader2, CheckCircle, AlertCircle, Key, ArrowRight, Globe, Upload, Server, Sparkles, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DeployToNetlifyProps {
  listingId: string;
  listingTitle: string;
  hasFile: boolean;
  githubUrl?: string | null;
}

const NETLIFY_TOKEN_KEY = "od_netlify_token";

const DEPLOY_STEPS = [
  { id: "auth", label: "Authenticating", icon: Key },
  { id: "download", label: "Fetching project files", icon: Upload },
  { id: "create", label: "Creating Netlify site", icon: Server },
  { id: "deploy", label: "Deploying to the edge", icon: Globe },
  { id: "building", label: "Building on Netlify…", icon: Loader2 },
  { id: "done", label: "Live!", icon: Sparkles },
] as const;

type StepId = typeof DEPLOY_STEPS[number]["id"];

type DeployState = "idle" | "submitting" | "polling" | "ready" | "error";

interface PollResult {
  state: string;
  errorMessage: string | null;
  deployUrl: string | null;
  adminUrl: string | null;
  buildLog: string | null;
}

export function DeployToNetlify({ listingId, listingTitle, hasFile, githubUrl }: DeployToNetlifyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(NETLIFY_TOKEN_KEY) || "");
  const [saveToken, setSaveToken] = useState(true);
  const [deployState, setDeployState] = useState<DeployState>("idle");
  const [currentStep, setCurrentStep] = useState<StepId>("auth");
  const [result, setResult] = useState<{ siteUrl: string; adminUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buildLog, setBuildLog] = useState<string | null>(null);
  const [netlifyStatus, setNetlifyStatus] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  if (!user) return null;

  if (!hasFile && !githubUrl) {
    return (
      <Button variant="outline" disabled className="w-full border-border/60 gap-2 opacity-60 cursor-not-allowed">
        <Rocket className="h-4 w-4" />
        Deploy to Netlify
        <span className="text-[10px] text-muted-foreground ml-1">(no file uploaded yet)</span>
      </Button>
    );
  }

  if (!hasFile && githubUrl) {
    const deployUrl = `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(githubUrl)}`;
    return (
      <a href={deployUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors gap-2">
          <Rocket className="h-4 w-4" />
          Deploy to Netlify
        </Button>
      </a>
    );
  }

  function startPolling(siteId: string, deployId: string, netlifyToken: string, siteUrl: string, adminUrl: string) {
    stopPolling();
    setDeployState("polling");
    setCurrentStep("building");
    setNetlifyStatus("building");

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Timeout after ~3 minutes (36 polls × 5s)
      if (pollCountRef.current > 36) {
        stopPolling();
        setDeployState("ready");
        setCurrentStep("done");
        setResult({ siteUrl, adminUrl });
        setNetlifyStatus("timeout — check Netlify dashboard");
        toast({ title: "Build is taking longer than expected", description: "Check your Netlify dashboard for the latest status." });
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/functions/check-netlify-deploy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, deployId, netlifyToken }),
        });

        if (!res.ok) return; // retry next tick

        const data: PollResult = await res.json();
        setNetlifyStatus(data.state);

        if (data.state === "ready") {
          stopPolling();
          setDeployState("ready");
          setCurrentStep("done");
          setShowConfetti(true);
          setResult({
            siteUrl: data.deployUrl || siteUrl,
            adminUrl: data.adminUrl || adminUrl,
          });
          toast({ title: "Deployed successfully! 🚀", description: `${listingTitle} is now live on Netlify.` });
        } else if (data.state === "error" || data.state === "failed") {
          stopPolling();
          setDeployState("error");
          setError(data.errorMessage || "Netlify build failed");
          setBuildLog(data.buildLog || null);
        }
      } catch {
        // network blip — retry on next tick
      }
    }, 5000);
  }

  async function handleDeploy() {
    if (!token.trim()) return;
    setDeployState("submitting");
    setError(null);
    setResult(null);
    setBuildLog(null);
    setNetlifyStatus(null);
    setCurrentStep("auth");

    try {
      if (saveToken) localStorage.setItem(NETLIFY_TOKEN_KEY, token.trim());

      setCurrentStep("auth");
      const session = { access_token: localStorage.getItem("opendraft_token") };
      if (!localStorage.getItem("opendraft_token")) throw new Error("Not authenticated");

      setCurrentStep("download");
      await new Promise(r => setTimeout(r, 400));

      setCurrentStep("create");
      await new Promise(r => setTimeout(r, 300));

      setCurrentStep("deploy");

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/functions/deploy-to-netlify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId, netlifyToken: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Deploy failed");

      if (data.method === "github_redirect") {
        window.open(data.deployUrl, "_blank");
        setOpen(false);
        return;
      }

      // Start polling for build status
      startPolling(data.siteId, data.deployId, token.trim(), data.siteUrl, data.adminUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setDeployState("error");
      if (msg.includes("Invalid Netlify token")) localStorage.removeItem(NETLIFY_TOKEN_KEY);
    }
  }

  function resetDialog() {
    stopPolling();
    setResult(null);
    setError(null);
    setBuildLog(null);
    setNetlifyStatus(null);
    setDeployState("idle");
    setShowConfetti(false);
    setCurrentStep("auth");
  }

  const currentStepIndex = DEPLOY_STEPS.findIndex(s => s.id === currentStep);
  const isDeploying = deployState === "submitting" || deployState === "polling";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-all gap-2 group">
          <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-10deg]" />
          Deploy to Netlify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy to Netlify
          </DialogTitle>
          <DialogDescription>
            Deploy "{listingTitle}" to Netlify with one click. Your app will be live in seconds.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Success state */}
          {result ? (
            <SuccessView result={result} showConfetti={showConfetti} />
          ) : deployState === "error" ? (
            /* Error state with build log */
            <ErrorView error={error} buildLog={buildLog} onRetry={() => { resetDialog(); }} />
          ) : isDeploying ? (
            /* Deploying + polling state */
            <DeployingView
              currentStepIndex={currentStepIndex}
              netlifyStatus={netlifyStatus}
            />
          ) : (
            /* Input state */
            <InputView
              token={token}
              setToken={setToken}
              saveToken={saveToken}
              setSaveToken={setSaveToken}
              deploying={false}
              onDeploy={handleDeploy}
              error={null}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Sub-components ---------- */

function SuccessView({ result, showConfetti }: { result: { siteUrl: string; adminUrl: string }; showConfetti: boolean }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4 py-2 relative"
    >
      {showConfetti && <ConfettiEffect />}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mx-auto"
        >
          <CheckCircle className="h-7 w-7 text-primary" />
        </motion.div>
        <div>
          <motion.h4 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-bold text-lg">
            You're live! 🎉
          </motion.h4>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-sm text-muted-foreground mt-1">
            Your app is deployed and ready for the world.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
          <a href={result.siteUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 h-11 font-bold">
              <ExternalLink className="h-4 w-4" /> Visit your site
            </Button>
          </a>
          <a href={result.adminUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              Netlify Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ErrorView({ error, buildLog, onRetry }: { error: string | null; buildLog: string | null; onRetry: () => void }) {
  const isAuthError = error?.toLowerCase().includes("token") || error?.toLowerCase().includes("auth") || error?.toLowerCase().includes("401");
  const errorTitle = isAuthError ? "Authentication Failed" : "Netlify Build Failed";

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 py-2"
    >
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-destructive">{errorTitle}</h4>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>

        {isAuthError && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              💡 Your Netlify token appears to be invalid or expired. Please generate a new Personal Access Token.
            </p>
            <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium mt-1 inline-block">
              Get a new Netlify token →
            </a>
          </div>
        )}

        {buildLog && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Build Log (last lines):</p>
            <pre className="text-[10px] leading-relaxed bg-background/80 border border-border/50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-muted-foreground">
              {buildLog}
            </pre>
          </div>
        )}
      </div>

      <Button onClick={onRetry} variant="outline" className="w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </motion.div>
  );
}

function DeployingView({ currentStepIndex, netlifyStatus }: { currentStepIndex: number; netlifyStatus: string | null }) {
  return (
    <motion.div
      key="deploying"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-4 space-y-3"
    >
      <div className="space-y-1">
        {DEPLOY_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          const isPending = i > currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300",
                isActive && "bg-primary/10",
                isDone && "opacity-60",
                isPending && "opacity-30"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                isActive && "bg-primary text-primary-foreground",
                isDone && "bg-primary/20 text-primary",
                isPending && "bg-muted text-muted-foreground"
              )}>
                {isDone ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                isActive && "text-foreground",
                isDone && "text-muted-foreground line-through",
                isPending && "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {isActive && (
                <motion.div className="ml-auto flex gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStepIndex + 1) / DEPLOY_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Live Netlify status badge */}
      {netlifyStatus && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Netlify status: <span className="font-mono font-medium text-foreground">{netlifyStatus}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function InputView({
  token, setToken, saveToken, setSaveToken, deploying, onDeploy, error,
}: {
  token: string;
  setToken: (v: string) => void;
  saveToken: boolean;
  setSaveToken: (v: boolean) => void;
  deploying: boolean;
  onDeploy: () => void;
  error: string | null;
}) {
  return (
    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          Netlify Personal Access Token
        </label>
        <Input
          type="password"
          placeholder="nfp_xxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && token.trim() && onDeploy()}
          disabled={deploying}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="save-token"
            checked={saveToken}
            onChange={(e) => setSaveToken(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          <label htmlFor="save-token" className="text-xs text-muted-foreground">
            Remember token for future deploys
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Get your token from{" "}
          <a
            href="https://app.netlify.com/user/applications#personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Netlify → User Settings → Applications
          </a>
          . Your token is stored locally, never on our servers.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </motion.div>
      )}

      <Button
        onClick={onDeploy}
        disabled={!token.trim() || deploying}
        className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2 group"
      >
        <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        Deploy Now
      </Button>
    </motion.div>
  );
}

/** Tiny confetti particles using CSS animations */
function ConfettiEffect() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 0.8 + Math.random() * 0.6,
    color: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#facc15", "#34d399", "#f472b6"][i % 6],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: "50%", x: `${p.x}%`, scale: 1 }}
          animate={{ opacity: 0, y: "-100%", scale: 0.5 }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 6 ? "2px" : "50%",
            backgroundColor: p.color,
            left: 0,
          }}
        />
      ))}
    </div>
  );
}
