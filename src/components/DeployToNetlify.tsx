import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Rocket, ExternalLink, Loader2, CheckCircle, AlertCircle, Key, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeployToNetlifyProps {
  listingId: string;
  listingTitle: string;
  hasFile: boolean;
  githubUrl?: string | null;
}

const NETLIFY_TOKEN_KEY = "od_netlify_token";

export function DeployToNetlify({ listingId, listingTitle, hasFile, githubUrl }: DeployToNetlifyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(NETLIFY_TOKEN_KEY) || "");
  const [saveToken, setSaveToken] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ siteUrl: string; adminUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  if (!hasFile && !githubUrl) return null;

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

    try {
      if (saveToken) {
        localStorage.setItem(NETLIFY_TOKEN_KEY, token.trim());
      }

      const { data: { session } } = await supabase.auth.getSession();
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

      setResult({
        siteUrl: data.siteUrl,
        adminUrl: data.adminUrl,
      });

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
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors gap-2">
          <Rocket className="h-4 w-4" />
          Deploy to Netlify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy to Netlify
          </DialogTitle>
          <DialogDescription>
            Deploy "{listingTitle}" to Netlify with one click. Your app will be live in seconds.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold">Deployed successfully!</h4>
                <p className="text-sm text-muted-foreground mt-1">Your app is now live on Netlify.</p>
              </div>
              <div className="space-y-2">
                <a href={result.siteUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
                    <ExternalLink className="h-4 w-4" /> Visit your site
                  </Button>
                </a>
                <a href={result.adminUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    Netlify Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
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
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleDeploy}
              disabled={!token.trim() || deploying}
              className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold gap-2"
            >
              {deploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying to Netlify…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Deploy Now
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
