import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, CheckCircle2, Zap, Package, FileCode2 } from "lucide-react";

interface GeneratedConcept {
  title: string;
  category: string;
  price: number;
  trend_inspiration?: string;
  buyer_persona?: string;
  key_differentiator?: string;
}

interface TemplateResultItem {
  success: boolean;
  title?: string;
  category?: string;
  listing_id?: string;
  file_count?: number;
  zip_size_kb?: number;
  error?: string;
}

interface TemplateBatchResult {
  generated: number;
  requested: number;
  results: TemplateResultItem[];
}

type Mode = "concepts" | "templates";

export function AdminConceptGenerator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("templates");
  const [loading, setLoading] = useState(false);
  const [conceptResults, setConceptResults] = useState<GeneratedConcept[] | null>(null);
  const [templateResult, setTemplateResult] = useState<TemplateBatchResult | null>(null);
  const [count, setCount] = useState(3);
  const [templateCount, setTemplateCount] = useState(3);
  const [theme, setTheme] = useState("");

  async function generateConcepts() {
    setLoading(true);
    setConceptResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-listing-concept", {
        body: { count },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Generation failed");
      setConceptResults(data.concepts);
      toast({ title: `${data.generated} concepts created`, description: "Drafts added to Pending queue." });
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function generateTemplate() {
    setLoading(true);
    setTemplateResult(null);
    try {
      const themes = theme.trim() ? [theme.trim()] : [];
      const { data, error } = await supabase.functions.invoke("generate-template-app", {
        body: { count: templateCount, themes },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Generation failed");
      setTemplateResult(data);
      toast({ title: `${data.generated}/${data.requested} templates created`, description: `All in Pending queue.` });
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold">AI Content Pipeline</h3>
          <p className="text-xs text-muted-foreground">Generate listing concepts or full template apps with source code</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "templates" as Mode, label: "Full Templates", icon: <Package className="h-3.5 w-3.5" />, desc: "Source code + ZIP" },
          { key: "concepts" as Mode, label: "Concepts Only", icon: <Sparkles className="h-3.5 w-3.5" />, desc: "Metadata drafts" },
        ]).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setConceptResults(null); setTemplateResult(null); }}
            className={`flex-1 rounded-xl border p-3 text-left transition-all ${
              mode === m.key
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              {m.icon}
              <span className="text-sm font-semibold">{m.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {mode === "concepts" ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">How many:</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                      count === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={generateConcepts} disabled={loading} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate {count} concept{count !== 1 ? "s" : ""}</>}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">How many:</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTemplateCount(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                      templateCount === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">free to claim</span>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1.5">Override theme (optional)</label>
              <Input
                placeholder="Leave blank → AI picks from live Reddit, HN, Product Hunt trends"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generateTemplate()}
              />
              <p className="text-xs text-muted-foreground mt-1">When blank, fetches this week's trending ideas from Reddit, Hacker News & Product Hunt</p>
            </div>
            <Button onClick={generateTemplate} disabled={loading} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating {templateCount} template{templateCount !== 1 ? "s" : ""}…
                </>
              ) : (
                <>
                  <FileCode2 className="h-4 w-4" />
                  Generate {templateCount} Template{templateCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </>
        )}

        {/* Concept results */}
        {conceptResults && conceptResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Created as pending drafts
            </p>
            {conceptResults.map((c, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/50 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate">{c.title}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize flex-shrink-0">{c.category?.replace("_", " ")}</span>
                  </div>
                  <span className="text-sm font-black flex-shrink-0 ml-2">${((c.price || 0) / 100).toFixed(0)}</span>
                </div>
                {c.trend_inspiration && (
                  <p className="text-[10px] text-primary flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> {c.trend_inspiration}
                  </p>
                )}
                {c.buyer_persona && (
                  <p className="text-[10px] text-muted-foreground">Target: {c.buyer_persona}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Template results */}
        {templateResult && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {templateResult.generated}/{templateResult.requested} templates created
            </p>
            {templateResult.results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                r.success ? "border-border bg-muted/50" : "border-destructive/30 bg-destructive/5"
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {r.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 text-destructive flex-shrink-0">✗</span>
                  )}
                  <span className="text-sm font-semibold truncate">{r.title || r.error || "Failed"}</span>
                </div>
                {r.success && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{r.file_count} files</span>
                    <span className="text-sm font-black">$15/mo</span>
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              All listings in the Pending queue with AI-generated screenshots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
