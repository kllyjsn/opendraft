/**
 * MagicImport Component
 * ---------------------
 * A URL input that scrapes a project URL and auto-fills the listing form.
 * Designed to feel like magic — paste a URL and watch the form populate.
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { logActivity } from "@/lib/activity-logger";
import { api } from "@/lib/api";

interface ScrapedListing {
  title: string;
  description: string;
  tech_stack: string[];
  category: string;
  completeness: string;
  screenshot_url: string | null;
  screenshots: string[];
  demo_url: string;
}

interface MagicImportProps {
  onImport: (data: ScrapedListing) => void;
}

const STEPS = [
  "Connecting to URL…",
  "Scanning page content…",
  "Extracting project details…",
  "Detecting tech stack…",
  "Generating description…",
  "Almost there…",
];

export function MagicImport({ onImport }: MagicImportProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setStepIndex(0);

    // Animate through steps
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1800);

    try {
      const { data: data } = await api.post<{ data: any }>("/functions/scrape-listing", { url: url.trim() },);

      clearInterval(interval);

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Failed to scrape");

      setDone(true);

      // Log the import
      logActivity({ event_type: "magic_import", event_data: { url: url.trim(), title: data.listing?.title } });

      // Auto-create draft listing from scraped data
      try {
        const { user } = await api.get<{ user: any }>("/auth/me");
        if (user && data.listing) {
          const l = data.listing;
          const priceInCents = 0; // Draft — seller sets price later
          await api.from("listings").insert({
            seller_id: user.id,
            title: l.title || "Untitled Import",
            description: l.description || "",
            price: priceInCents,
            completeness_badge: l.completeness || "prototype",
            category: l.category || "other",
            tech_stack: l.tech_stack || [],
            demo_url: l.demo_url || null,
            screenshots: l.screenshots?.slice(0, 5) || [],
            status: "pending",
          });
        }
      } catch {
        // Non-fatal — draft creation is best-effort
      }

      // Short delay to show the success state before filling
      setTimeout(() => {
        onImport(data.listing);
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Failed to import");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 animate-in fade-in duration-300">
        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">Project imported!</p>
          <p className="text-xs text-muted-foreground">Details filled in below — review and tweak as needed.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold">Importing your project…</p>
            <p className="text-xs text-muted-foreground">{url}</p>
          </div>
        </div>
        <div className="space-y-2 ml-11">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                i < stepIndex
                  ? "text-primary"
                  : i === stepIndex
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/40"
              }`}
            >
              {i < stepIndex ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              ) : i === stepIndex ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 flex-shrink-0" />
              )}
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Magic import</p>
        <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">New</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Paste your project URL and we'll auto-fill everything — title, description, tech stack, and even grab a screenshot.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="https://your-project.lovable.app"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleScrape()}
          className="flex-1"
        />
        <Button
          onClick={handleScrape}
          disabled={!url.trim()}
          className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Import
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
