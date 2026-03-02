import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Rocket, ExternalLink, Loader2, CheckCircle, AlertCircle, Key,
  ArrowRight, Globe, Upload, Server, Sparkles, RotateCcw, Github, Triangle, Copy, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DeployPanelProps {
  listingId: string;
  listingTitle: string;
  hasFile: boolean;
  githubUrl?: string | null;
}

const TOKEN_KEYS = {
  netlify: "od_netlify_token",
  vercel: "od_vercel_token",
} as const;

type Provider = "netlify" | "vercel" | "github";

const DEPLOY_STEPS = [
  { id: "auth", label: "Authenticating", icon: Key },
  { id: "download", label: "Fetching project files", icon: Upload },
  { id: "create", label: "Creating project", icon: Server },
  { id: "deploy", label: "Deploying to the edge", icon: Globe },
  { id: "building", label: "Building…", icon: Loader2 },
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

export function DeployPanel({ listingId, listingTitle, hasFile, githubUrl }: DeployPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Provider>("netlify");

  // Token state
  const [netlifyToken, setNetlifyToken] = useState(() => localStorage.getItem(TOKEN_KEYS.netlify) || "");
  const [vercelToken, setVercelToken] = useState(() => localStorage.getItem(TOKEN_KEYS.vercel) || "");
  const [saveToken, setSaveToken] = useState(true);

  // Deploy state
  const [deployState, setDeployState] = useState<DeployState>("idle");
  const [currentStep, setCurrentStep] = useState<StepId>("auth");
  const [result, setResult] = useState<{ siteUrl: string; adminUrl: string; provider: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buildLog, setBuildLog] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // GitHub copy state
  const [copied, setCopied] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  if (!user) return null;

  const token = activeTab === "netlify" ? netlifyToken : vercelToken;
  const setToken = activeTab === "netlify" ? setNetlifyToken : setVercelToken;

  function resetDialog() {
    stopPolling();
    setResult(null);
    setError(null);
    setBuildLog(null);
    setBuildStatus(null);
    setDeployState("idle");
    setShowConfetti(false);
    setCurrentStep("auth");
  }

  // ---- Netlify polling ----
  function startNetlifyPolling(siteId: string, deployId: string, nToken: string, siteUrl: string, adminUrl: string) {
    stopPolling();
    setDeployState("polling");
    setCurrentStep("building");
    setBuildStatus("building");

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 36) {
        stopPolling();
        setDeployState("ready");
        setCurrentStep("done");
        setResult({ siteUrl, adminUrl, provider: "Netlify" });
        setBuildStatus("timeout — check dashboard");
        toast({ title: "Build is taking longer than expected", description: "Check your Netlify dashboard for the latest status." });
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-netlify-deploy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, deployId, netlifyToken: nToken }),
        });
        if (!res.ok) return;
        const data: PollResult = await res.json();
        setBuildStatus(data.state);

        if (data.state === "ready") {
          stopPolling();
          setDeployState("ready");
          setCurrentStep("done");
          setShowConfetti(true);
          setResult({ siteUrl: data.deployUrl || siteUrl, adminUrl: data.adminUrl || adminUrl, provider: "Netlify" });
          toast({ title: "Deployed successfully! 🚀", description: `${listingTitle} is now live on Netlify.` });
        } else if (data.state === "error" || data.state === "failed") {
          stopPolling();
          setDeployState("error");
          setError(data.errorMessage || "Netlify build failed");
          setBuildLog(data.buildLog || null);
        }
      } catch { /* retry */ }
    }, 5000);
  }

  // ---- Vercel polling ----
  function startVercelPolling(deployId: string, vToken: string, siteUrl: string, adminUrl: string) {
    stopPolling();
    setDeployState("polling");
    setCurrentStep("building");
    setBuildStatus("building");

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 36) {
        stopPolling();
        setDeployState("ready");
        setCurrentStep("done");
        setResult({ siteUrl, adminUrl, provider: "Vercel" });
        setBuildStatus("timeout — check dashboard");
        toast({ title: "Build is taking longer than expected", description: "Check your Vercel dashboard for the latest status." });
        return;
      }

      try {
        const res = await fetch(`https://api.vercel.com/v13/deployments/${deployId}`, {
          headers: { Authorization: `Bearer ${vToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const state = data.readyState?.toLowerCase() || data.state?.toLowerCase() || "unknown";
        setBuildStatus(state);

        if (state === "ready") {
          stopPolling();
          setDeployState("ready");
          setCurrentStep("done");
          setShowConfetti(true);
          const liveSiteUrl = data.url ? `https://${data.url}` : siteUrl;
          setResult({ siteUrl: liveSiteUrl, adminUrl, provider: "Vercel" });
          toast({ title: "Deployed successfully! 🚀", description: `${listingTitle} is now live on Vercel.` });
        } else if (state === "error" || state === "canceled") {
          stopPolling();
          setDeployState("error");
          setError(data.errorMessage || "Vercel build failed");
          // Try to get error logs
          try {
            const logRes = await fetch(`https://api.vercel.com/v2/deployments/${deployId}/events`, {
              headers: { Authorization: `Bearer ${vToken}` },
            });
            if (logRes.ok) {
              const events = await logRes.json();
              if (Array.isArray(events)) {
                const errLines = events
                  .filter((e: any) => e.type === "stderr" || e.type === "error")
                  .map((e: any) => e.text || e.payload?.text || "")
                  .filter(Boolean)
                  .slice(-30);
                if (errLines.length > 0) setBuildLog(errLines.join("\n"));
              }
            }
          } catch { /* ignore */ }
        }
      } catch { /* retry */ }
    }, 5000);
  }

  // ---- Deploy handler ----
  async function handleDeploy() {
    const currentToken = activeTab === "netlify" ? netlifyToken : vercelToken;
    if (!currentToken.trim()) return;
    setDeployState("submitting");
    setError(null);
    setResult(null);
    setBuildLog(null);
    setBuildStatus(null);
    setCurrentStep("auth");

    try {
      if (saveToken) localStorage.setItem(TOKEN_KEYS[activeTab as "netlify" | "vercel"], currentToken.trim());

      const { data: { session } } = await supabase.auth.getSession();

      setCurrentStep("download");
      await new Promise(r => setTimeout(r, 400));
      setCurrentStep("create");
      await new Promise(r => setTimeout(r, 300));
      setCurrentStep("deploy");

      const fnName = activeTab === "netlify" ? "deploy-to-netlify" : "deploy-to-vercel";
      const tokenField = activeTab === "netlify" ? "netlifyToken" : "vercelToken";

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId, [tokenField]: currentToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deploy failed");

      if (data.method === "github_redirect") {
        window.open(data.deployUrl, "_blank");
        setOpen(false);
        return;
      }

      if (activeTab === "netlify") {
        startNetlifyPolling(data.siteId, data.deployId, currentToken.trim(), data.siteUrl, data.adminUrl);
      } else {
        startVercelPolling(data.deployId, currentToken.trim(), data.siteUrl, data.adminUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setDeployState("error");
      if (msg.includes("Invalid") && msg.includes("token")) {
        localStorage.removeItem(TOKEN_KEYS[activeTab as "netlify" | "vercel"]);
      }
    }
  }

  function handleCopyGithub() {
    if (!githubUrl) return;
    navigator.clipboard.writeText(githubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentStepIndex = DEPLOY_STEPS.findIndex(s => s.id === currentStep);
  const isDeploying = deployState === "submitting" || deployState === "polling";

  const providerLabel = activeTab === "netlify" ? "Netlify" : "Vercel";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2 group">
          <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-10deg]" />
          Deploy to Cloud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy "{listingTitle}"
          </DialogTitle>
          <DialogDescription>
            Choose your cloud provider and deploy in one click.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {result ? (
            <SuccessView result={result} showConfetti={showConfetti} />
          ) : deployState === "error" ? (
            <ErrorView error={error} buildLog={buildLog} provider={providerLabel} onRetry={resetDialog} />
          ) : isDeploying ? (
            <DeployingView
              currentStepIndex={currentStepIndex}
              buildStatus={buildStatus}
              provider={providerLabel}
            />
          ) : (
            <motion.div key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-1">
              <Tabs value={activeTab} onValueChange={(v) => { resetDialog(); setActiveTab(v as Provider); }}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="netlify" className="gap-1.5 text-xs font-bold">
                    <Rocket className="h-3.5 w-3.5" />
                    Netlify
                  </TabsTrigger>
                  <TabsTrigger value="vercel" className="gap-1.5 text-xs font-bold">
                    <Triangle className="h-3.5 w-3.5" />
                    Vercel
                  </TabsTrigger>
                  <TabsTrigger value="github" className="gap-1.5 text-xs font-bold">
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </TabsTrigger>
                </TabsList>

                {/* Netlify & Vercel share token input */}
                <TabsContent value="netlify" className="space-y-4 mt-4">
                  <TokenInput
                    provider="Netlify"
                    placeholder="nfp_xxxxxxxxxxxx"
                    helpUrl="https://app.netlify.com/user/applications#personal-access-tokens"
                    helpLabel="Netlify → User Settings → Applications"
                    token={netlifyToken}
                    setToken={setNetlifyToken}
                    saveToken={saveToken}
                    setSaveToken={setSaveToken}
                    onDeploy={handleDeploy}
                    deploying={false}
                    icon={<Rocket className="h-4 w-4" />}
                  />
                </TabsContent>

                <TabsContent value="vercel" className="space-y-4 mt-4">
                  <TokenInput
                    provider="Vercel"
                    placeholder="vercel_xxxxxxxxxxxx"
                    helpUrl="https://vercel.com/account/tokens"
                    helpLabel="Vercel → Settings → Tokens"
                    token={vercelToken}
                    setToken={setVercelToken}
                    saveToken={saveToken}
                    setSaveToken={setSaveToken}
                    onDeploy={handleDeploy}
                    deploying={false}
                    icon={<Triangle className="h-4 w-4" />}
                  />
                </TabsContent>

                <TabsContent value="github" className="space-y-4 mt-4">
                  <GitHubTab
                    githubUrl={githubUrl}
                    hasFile={hasFile}
                    copied={copied}
                    onCopy={handleCopyGithub}
                    listingTitle={listingTitle}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Sub-components ---------- */

function TokenInput({
  provider, placeholder, helpUrl, helpLabel, token, setToken, saveToken, setSaveToken, onDeploy, deploying, icon,
}: {
  provider: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
  token: string;
  setToken: (v: string) => void;
  saveToken: boolean;
  setSaveToken: (v: boolean) => void;
  onDeploy: () => void;
  deploying: boolean;
  icon: React.ReactNode;
}) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          {provider} Access Token
        </label>
        <Input
          type="password"
          placeholder={placeholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && token.trim() && onDeploy()}
          disabled={deploying}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`save-${provider.toLowerCase()}-token`}
            checked={saveToken}
            onChange={(e) => setSaveToken(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          <label htmlFor={`save-${provider.toLowerCase()}-token`} className="text-xs text-muted-foreground">
            Remember token for future deploys
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Get your token from{" "}
          <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
            {helpLabel}
          </a>
          . Stored locally, never on our servers.
        </p>
      </div>
      <Button
        onClick={onDeploy}
        disabled={!token.trim() || deploying}
        className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2 group"
      >
        {icon}
        Deploy to {provider}
      </Button>
    </>
  );
}

function GitHubTab({
  githubUrl, hasFile, copied, onCopy, listingTitle,
}: {
  githubUrl?: string | null;
  hasFile: boolean;
  copied: boolean;
  onCopy: () => void;
  listingTitle: string;
}) {
  if (githubUrl) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-foreground" />
            <p className="font-semibold text-sm">Source Repository</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-background border border-border/50 px-3 py-2">
            <code className="text-xs text-muted-foreground flex-1 truncate">{githubUrl}</code>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 h-10 text-sm">
              <Github className="h-4 w-4" />
              View Repo
            </Button>
          </a>
          <a href={`${githubUrl}/fork`} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 h-10 text-sm font-bold">
              <Github className="h-4 w-4" />
              Fork Repo
            </Button>
          </a>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground font-medium">Quick deploy from GitHub:</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={`https://app.netlify.com/start/deploy?repository=${encodeURIComponent(githubUrl)}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-1.5 text-xs h-9">
                <Rocket className="h-3.5 w-3.5" />
                Netlify
              </Button>
            </a>
            <a href={`https://vercel.com/new/clone?repository-url=${encodeURIComponent(githubUrl)}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-1.5 text-xs h-9">
                <Triangle className="h-3.5 w-3.5" />
                Vercel
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasFile) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center space-y-3">
        <Github className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <div>
          <p className="font-semibold text-sm">No GitHub repo linked</p>
          <p className="text-xs text-muted-foreground mt-1">
            This project has a downloadable ZIP but no linked repository. Download the source and push it to your own GitHub repo, then deploy from there.
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tip: Use <span className="font-mono font-medium">git init && gh repo create</span> to create a repo from the command line.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center space-y-2">
      <Github className="h-8 w-8 text-muted-foreground/40 mx-auto" />
      <p className="font-semibold text-sm">No source available</p>
      <p className="text-xs text-muted-foreground">No file or GitHub repository is linked to this project yet.</p>
    </div>
  );
}

function SuccessView({ result, showConfetti }: { result: { siteUrl: string; adminUrl: string; provider: string }; showConfetti: boolean }) {
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
            You're live on {result.provider}! 🎉
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
              {result.provider} Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ErrorView({ error, buildLog, provider, onRetry }: { error: string | null; buildLog: string | null; provider: string; onRetry: () => void }) {
  return (
    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-2">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-destructive">{provider} Build Failed</h4>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
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

function DeployingView({ currentStepIndex, buildStatus, provider }: { currentStepIndex: number; buildStatus: string | null; provider: string }) {
  return (
    <motion.div key="deploying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-3">
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
                {isDone ? <CheckCircle className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <StepIcon className="h-4 w-4" />}
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
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStepIndex + 1) / DEPLOY_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {buildStatus && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          {provider} status: <span className="font-mono font-medium text-foreground">{buildStatus}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

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
