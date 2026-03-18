import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Zap } from "lucide-react";

interface BlogInlineCTAProps {
  variant?: "default" | "compact";
}

export function BlogInlineCTA({ variant = "default" }: BlogInlineCTAProps) {
  const { user } = useAuth();

  if (user) return null;

  if (variant === "compact") {
    return (
      <div className="my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            Build this yourself — free
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Paste your website URL and get a custom app in 90 seconds.
          </p>
        </div>
        <div className="w-full sm:w-auto sm:shrink-0">
          <GoogleSignInButton label="Try it free" className="!h-9 !text-xs sm:!w-[160px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
        <Zap className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-black mb-2">
        Stop reading about it. Build it.
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        Paste your website and get a custom app you own — deployed in 90 seconds, zero per-seat fees.
      </p>
      <div className="max-w-xs mx-auto">
        <GoogleSignInButton label="Get your free app" />
      </div>
    </div>
  );
}
