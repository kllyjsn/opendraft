import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Loader2, CheckCircle, AlertCircle, Key, ArrowRight, Globe, Upload, Server, Sparkles, Triangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DeployToVercelProps {
  listingId: string;
  listingTitle: string;
  hasFile: boolean;
  githubUrl?: string | null;
}

const VERCEL_TOKEN_KEY = "od_vercel_token";

const DEPLOY_STEPS = [
  { id: "auth", label: "Authenticating", icon: Key },
  { id: "download", label: "Fetching project files", icon: Upload },
  { id: "create", label: "Creating Vercel project", icon: Server },
  { id: "deploy", label: "Deploying to the edge", icon: Globe },
  { id: "done", label: "Live!", icon: Sparkles },
] as const;

type StepId = typeof DEPLOY_STEPS[number]["id"];

export function DeployToVercel({ listingId, listingTitle, hasFile, githubUrl }: DeployToVercelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(VERCEL_TOKEN_KEY) || "");
  const [saveToken, setSaveToken] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>("auth");
  const [result, setResult] = useState<{ siteUrl: string; adminUrl: string; sourceDownloadUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  if (!hasFile && !githubUrl) {
    return (
      <Button variant="outline" disabled className="w-full border-border/60 gap-2 opacity-60 cursor-not-allowed">
        <Triangle className="h-4 w-4" />
        Deploy to Vercel
        <span className="text-[10px] text-muted-foreground ml-1">(no file uploaded yet)</span>
      </Button>
    );
  }

  if (!hasFile && githubUrl) {
    const deployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(githubUrl)}`;
    return (
      <a href={deployUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors gap-2">
          <Triangle className="h-4 w-4" />
          Deploy to Vercel
        </Button>
      </a>
    );
  }

  async function handleDeploy() {
    if (!token.trim()) return;
    setDeploying(true);
    setError(null);
    setResult(null);
    setCurrentStep("auth");

    try {
      if (saveToken) {
        localStorage.setItem(VERCEL_TOKEN_KEY, token.trim());
      }

      setCurrentStep("auth");
      const { data: { session } } = await supabase.auth.getSession();

      setCurrentStep("download");
      await new Promise(r => setTimeout(r, 400));

      setCurrentStep("create");
      await new Promise(r => setTimeout(r, 300));

      setCurrentStep("deploy");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-vercel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          listingId,
          vercelToken: token.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Deploy failed");
      }

      if (data.method === "github_redirect") {
        window.open(data.deployUrl, "_blank");
        setOpen(false);
        return;
      }

      setCurrentStep("done");

      setResult({
        siteUrl: data.siteUrl,
        adminUrl: data.adminUrl,
        sourceDownloadUrl: data.sourceDownloadUrl,
      });

      toast({
        title: "Deployed successfully! 🚀",
        description: `${listingTitle} is now live on Vercel.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      if (msg.includes("Invalid Vercel token")) {
        localStorage.removeItem(VERCEL_TOKEN_KEY);
      }
    } finally {
      setDeploying(false);
    }
  }

  function resetDialog() {
    setResult(null);
    setError(null);
    setDeploying(false);
    setCurrentStep("auth");
  }

  const currentStepIndex = DEPLOY_STEPS.findIndex(s => s.id === currentStep);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-all gap-2 group">
          <Triangle className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-10deg]" />
          Deploy to Vercel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Triangle className="h-5 w-5 text-primary" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription>
            Deploy "{listingTitle}" to Vercel with one click. Your app will be live in seconds.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-4 py-2"
            >
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
                  <h4 className="font-bold text-lg">You're live! 🎉</h4>
                  <p className="text-sm text-muted-foreground mt-1">Your app is deployed on Vercel.</p>
                </div>
                <div className="space-y-2">
                  <a href={result.siteUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 h-11 font-bold">
                      <ExternalLink className="h-4 w-4" /> Visit your site
                    </Button>
                  </a>
                  {result.sourceDownloadUrl && (
                    <a href={result.sourceDownloadUrl} download>
                      <Button variant="outline" className="w-full gap-2">
                        ⬇ Download Source Code
                      </Button>
                    </a>
                  )}
                  <a href={result.adminUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-2">
                      Vercel Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          ) : deploying ? (
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
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStepIndex + 1) / DEPLOY_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 py-2"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  Vercel Access Token
                </label>
                <Input
                  type="password"
                  placeholder="vercel_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && token.trim() && handleDeploy()}
                  disabled={deploying}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="save-vercel-token"
                    checked={saveToken}
                    onChange={(e) => setSaveToken(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  <label htmlFor="save-vercel-token" className="text-xs text-muted-foreground">
                    Remember token for future deploys
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Get your token from{" "}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Vercel → Settings → Tokens
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
                onClick={handleDeploy}
                disabled={!token.trim() || deploying}
                className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2 group"
              >
                <Triangle className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Deploy Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
