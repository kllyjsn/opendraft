import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Rocket, ExternalLink, Loader2, CheckCircle, AlertCircle, Key, ArrowRight, Globe, Upload, Server, Sparkles } from "lucide-react";
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
  { id: "done", label: "Live!", icon: Sparkles },
] as const;

type StepId = typeof DEPLOY_STEPS[number]["id"];

export function DeployToNetlify({ listingId, listingTitle, hasFile, githubUrl }: DeployToNetlifyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(NETLIFY_TOKEN_KEY) || "");
  const [saveToken, setSaveToken] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>("auth");
  const [result, setResult] = useState<{ siteUrl: string; adminUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  if (!user) return null;

  // Show a disabled teaser when no deployable file exists
  if (!hasFile && !githubUrl) {
    return (
      <Button variant="outline" disabled className="w-full border-border/60 gap-2 opacity-60 cursor-not-allowed">
        <Rocket className="h-4 w-4" />
        Deploy to Netlify
        <span className="text-[10px] text-muted-foreground ml-1">(no file uploaded yet)</span>
      </Button>
    );
  }

  // For GitHub-only listings, just link to Netlify's deploy button
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

  async function handleDeploy() {
    if (!token.trim()) return;
    setDeploying(true);
    setError(null);
    setResult(null);
    setCurrentStep("auth");

    try {
      if (saveToken) {
        localStorage.setItem(NETLIFY_TOKEN_KEY, token.trim());
      }

      // Simulate step progression with the actual API call
      setCurrentStep("auth");
      const { data: { session } } = await supabase.auth.getSession();

      setCurrentStep("download");
      // Small delay to make the step visible
      await new Promise(r => setTimeout(r, 400));

      setCurrentStep("create");
      await new Promise(r => setTimeout(r, 300));

      setCurrentStep("deploy");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-netlify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          listingId,
          netlifyToken: token.trim(),
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
      setShowConfetti(true);

      setResult({ siteUrl: data.siteUrl, adminUrl: data.adminUrl });

      toast({
        title: "Deployed successfully! 🚀",
        description: `${listingTitle} is now live on Netlify.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      if (msg.includes("Invalid Netlify token")) {
        localStorage.removeItem(NETLIFY_TOKEN_KEY);
      }
    } finally {
      setDeploying(false);
    }
  }

  function resetDialog() {
    setResult(null);
    setError(null);
    setDeploying(false);
    setShowConfetti(false);
    setCurrentStep("auth");
  }

  const currentStepIndex = DEPLOY_STEPS.findIndex(s => s.id === currentStep);

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
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-4 py-2 relative"
            >
              {/* Confetti particles */}
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
                  <motion.h4
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-lg"
                  >
                    You're live! 🎉
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-sm text-muted-foreground mt-1"
                  >
                    Your app is deployed and ready for the world.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
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
          ) : deploying ? (
            /* Deploying state - animated steps */
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
                        <motion.div
                          className="ml-auto flex gap-0.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
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
            </motion.div>
          ) : (
            /* Input state */
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 py-2"
            >
              {/* Token input */}
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
                  onKeyDown={(e) => e.key === "Enter" && token.trim() && handleDeploy()}
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
                onClick={handleDeploy}
                disabled={!token.trim() || deploying}
                className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2 group"
              >
                <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Deploy Now
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
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
