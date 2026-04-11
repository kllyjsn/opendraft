/**
 * VerifyListingPanel
 * ------------------
 * Shown on the seller dashboard for each listing.
 * Allows sellers to verify ownership via meta tag or GitHub file.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Copy, CheckCircle2, Loader2, AlertCircle, Code, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerifyListingPanelProps {
  listingId: string;
  demoUrl?: string | null;
  githubUrl?: string | null;
  domainVerified?: boolean;
}

export function VerifyListingPanel({ listingId, demoUrl, githubUrl, domainVerified }: VerifyListingPanelProps) {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [method, setMethod] = useState<"meta_tag" | "github_file">("meta_tag");
  const [status, setStatus] = useState<"idle" | "loading" | "checking" | "verified" | "failed">(
    domainVerified ? "verified" : "idle"
  );
  const [copied, setCopied] = useState(false);

  async function getToken(selectedMethod: "meta_tag" | "github_file") {
    setMethod(selectedMethod);
    setStatus("loading");
    try {
      const session = { access_token: localStorage.getItem("opendraft_token") };
      if (!localStorage.getItem("opendraft_token")) throw new Error("Not authenticated");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/functions/verify-listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId, method: selectedMethod }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setToken(result.token);
      setStatus(result.status === "verified" ? "verified" : "idle");
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to get token", variant: "destructive" });
      setStatus("idle");
    }
  }

  async function checkVerification() {
    setStatus("checking");
    try {
      const session = { access_token: localStorage.getItem("opendraft_token") };
      if (!localStorage.getItem("opendraft_token")) throw new Error("Not authenticated");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/functions/verify-listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId, method, checkNow: true }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (result.verified) {
        setStatus("verified");
        toast({ title: "Verified! ✅", description: "Your ownership has been confirmed." });
      } else {
        setStatus("failed");
        toast({ title: "Not found", description: "We couldn't find the verification token. Make sure it's deployed and try again.", variant: "destructive" });
      }
    } catch (e) {
      setStatus("failed");
      toast({ title: "Verification failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  }

  function copySnippet() {
    const snippet = method === "meta_tag"
      ? `<meta name="opendraft-verify" content="${token}" />`
      : token || "";
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "verified" || domainVerified) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Ownership verified</span>
      </div>
    );
  }

  // Initial state — choose method
  if (!token) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Verify ownership</span>
          <Badge variant="secondary" className="text-[10px]">Optional</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Prove you own this project to earn a verified badge. Choose a method:
        </p>
        <div className="flex flex-wrap gap-2">
          {demoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => getToken("meta_tag")}
              disabled={status === "loading"}
              className="gap-1.5"
            >
              <Code className="h-3.5 w-3.5" />
              Meta tag
            </Button>
          )}
          {githubUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => getToken("github_file")}
              disabled={status === "loading"}
              className="gap-1.5"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub file
            </Button>
          )}
          {!demoUrl && !githubUrl && (
            <p className="text-xs text-muted-foreground italic">
              Add a demo URL or GitHub URL to your listing to enable verification.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Token received — show instructions
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {method === "meta_tag" ? "Add this meta tag" : "Add this file to your repo"}
        </span>
      </div>

      {method === "meta_tag" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Add this tag to the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> of your site at <strong>{demoUrl}</strong>:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono break-all">
              {`<meta name="opendraft-verify" content="${token}" />`}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySnippet}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Create a file called <code className="bg-muted px-1 rounded">.opendraft-verify</code> in the root of your repo with this content:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono break-all">
              {token}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySnippet}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={checkVerification}
          disabled={status === "checking"}
          className="gap-1.5"
        >
          {status === "checking" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {status === "checking" ? "Checking…" : "Verify now"}
        </Button>
        {status === "failed" && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Token not found — deploy it and try again
          </span>
        )}
      </div>
    </div>
  );
}
