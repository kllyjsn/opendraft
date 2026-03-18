import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Zap } from "lucide-react";
import { getVariant, trackImpression, trackClick } from "@/lib/ab-test";

const COPY_VARIANTS = {
  a: {
    compact: { title: "Build this yourself — free", sub: "Paste your website URL and get a custom app in 90 seconds." },
    full: { title: "Stop reading about it. Build it.", sub: "Paste your website and get a custom app you own — deployed in 90 seconds, zero per-seat fees.", btn: "Get your free app" },
  },
  b: {
    compact: { title: "Try it — paste your URL", sub: "Get a custom app built from your site in 90 seconds." },
    full: { title: "Your website → your app. Free.", sub: "We'll turn your site into a custom app you own. No subscriptions, no per-seat pricing.", btn: "Build my app free" },
  },
} as const;

type Variant = keyof typeof COPY_VARIANTS;

interface BlogInlineCTAProps {
  variant?: "default" | "compact";
}

export function BlogInlineCTA({ variant = "default" }: BlogInlineCTAProps) {
  const { user } = useAuth();
  const [abVariant] = useState<Variant>(() => getVariant("blog_cta", ["a", "b"]));
  const impressionLogged = useRef(false);

  useEffect(() => {
    if (!user && !impressionLogged.current) {
      impressionLogged.current = true;
      trackImpression("blog_cta", abVariant, variant === "compact" ? "blog_inline" : "blog_bottom");
    }
  }, [user, abVariant, variant]);

  if (user) return null;

  const copy = COPY_VARIANTS[abVariant];

  const handleClick = () => {
    trackClick("blog_cta", abVariant, variant === "compact" ? "blog_inline" : "blog_bottom");
  };

  if (variant === "compact") {
    return (
      <div className="my-8 rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            {copy.compact.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {copy.compact.sub}
          </p>
        </div>
        <div className="w-full sm:w-auto sm:shrink-0" onClick={handleClick}>
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
        {copy.full.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        {copy.full.sub}
      </p>
      <div className="max-w-xs mx-auto" onClick={handleClick}>
        <GoogleSignInButton label={copy.full.btn} />
      </div>
    </div>
  );
}
