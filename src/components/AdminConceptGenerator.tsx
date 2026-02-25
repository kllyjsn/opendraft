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
}

interface TemplateResult {
  title: string;
  category: string;
  price: number;
  file_count: number;
  zip_size_kb: number;
  listing_id: string;
}

type Mode = "concepts" | "templates";

export function AdminConceptGenerator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("templates");
  const [loading, setLoading] = useState(false);
  const [conceptResults, setConceptResults] = useState<GeneratedConcept[] | null>(null);
  const [templateResult, setTemplateResult] = useState<TemplateResult | null>(null);
  const [count, setCount] = useState(3);
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
      const { data, error } = await supabase.functions.invoke("generate-template-app", {
        body: { theme: theme.trim() || "modern SaaS dashboard" },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Generation failed");
      setTemplateResult(data);
      toast({ title: `Template "${data.title}" created`, description: `${data.file_count} files, ${data.zip_size_kb}KB ZIP — in Pending queue.` });
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
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1.5">App theme / idea</label>
              <Input
                placeholder="e.g. AI-powered recipe finder, fitness tracker dashboard, crypto portfolio…"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generateTemplate()}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank for a random trending concept</p>
            </div>
            <Button onClick={generateTemplate} disabled={loading} className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating source code…
                </>
              ) : (
                <>
                  <FileCode2 className="h-4 w-4" />
                  Generate Full Template
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
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate">{c.title}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize flex-shrink-0">{c.category?.replace("_", " ")}</span>
                </div>
                <span className="text-sm font-black flex-shrink-0 ml-2">${((c.price || 0) / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Template result */}
        {templateResult && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Template created!</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{templateResult.title}</span>
                <span className="font-black">${((templateResult.price || 0) / 100).toFixed(0)}</span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{templateResult.file_count} files</span>
                <span>{templateResult.zip_size_kb}KB ZIP</span>
                <span className="capitalize">{templateResult.category?.replace("_", " ")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Listing is in the Pending queue — review and approve above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
