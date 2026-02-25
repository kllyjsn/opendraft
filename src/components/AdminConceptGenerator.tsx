import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, CheckCircle2, Zap } from "lucide-react";

interface GeneratedConcept {
  title: string;
  category: string;
  price: number;
}

export function AdminConceptGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedConcept[] | null>(null);
  const [count, setCount] = useState(3);

  async function generate() {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-listing-concept", {
        body: { count },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      setResults(data.concepts);
      toast({
        title: `${data.generated} concepts created`,
        description: "New draft listings are in the Pending queue for review.",
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
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
          <h3 className="font-bold">AI Concept Generator</h3>
          <p className="text-xs text-muted-foreground">
            Generate new app listing ideas based on market demand signals
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium">Concepts to generate:</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                  count === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generate}
          disabled={loading}
          className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating concepts…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {count} concept{count !== 1 ? "s" : ""}
            </>
          )}
        </Button>

        {results && results.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Created as pending drafts — review them in the queue above
            </p>
            {results.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate">{c.title}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize flex-shrink-0">
                    {c.category?.replace("_", " ")}
                  </span>
                </div>
                <span className="text-sm font-black flex-shrink-0 ml-2">
                  ${((c.price || 0) / 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
