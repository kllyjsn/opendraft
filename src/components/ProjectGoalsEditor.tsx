import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface ProjectGoalsEditorProps {
  listingId: string;
}

export function ProjectGoalsEditor({ listingId }: ProjectGoalsEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goalsPrompt, setGoalsPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (!user || !listingId) return;
    loadGoals();
  }, [user, listingId]);

  async function loadGoals() {
    const { data } = await api.from("project_goals" as any)
      .select("goals_prompt")
      .eq("listing_id", listingId)
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setGoalsPrompt((data as any).goals_prompt || "");
      setHasExisting(true);
    }
    setLoading(false);
  }

  async function saveGoals() {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      listing_id: listingId,
      goals_prompt: goalsPrompt,
      structured_goals: { source: "manual", updated_at: new Date().toISOString() },
    };

    const { error } = hasExisting
      ? await api.from("project_goals" as any)
          .update({ goals_prompt: goalsPrompt, structured_goals: payload.structured_goals })
          .eq("listing_id", listingId)
          .eq("user_id", user.id)
      : await api.from("project_goals" as any).insert(payload);

    if (error) {
      toast({ title: "Failed to save goals", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goals saved ✓" });
      setHasExisting(true);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="h-24 rounded-xl bg-muted animate-pulse" />;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Project Goals</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">Used by AI for self-improvement</span>
      </div>
      <textarea
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-24 resize-none"
        placeholder="Describe what this app should do, who it's for, and what success looks like. The AI will use this to suggest improvements..."
        value={goalsPrompt}
        onChange={(e) => setGoalsPrompt(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={saveGoals}
          disabled={saving || !goalsPrompt.trim()}
          className="gradient-hero text-white border-0 gap-1.5"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : hasExisting ? "Update Goals" : "Save Goals"}
        </Button>
      </div>
    </div>
  );
}
