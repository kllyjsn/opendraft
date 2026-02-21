import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { value: "saas_tool", label: "SaaS Tool" },
  { value: "ai_app", label: "AI App" },
  { value: "landing_page", label: "Landing Page" },
  { value: "utility", label: "Utility" },
  { value: "game", label: "Game" },
  { value: "other", label: "Other" },
];

interface Props {
  onCreated?: () => void;
}

export function CreateBountyDialog({ onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("other");
  const [techStack, setTechStack] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const budgetCents = Math.round(parseFloat(budget) * 100);
    if (!title.trim() || !description.trim() || budgetCents < 500) {
      toast({ title: "Please fill all fields", description: "Budget must be at least $5.00", variant: "destructive" });
      return;
    }

    setSaving(true);
    const tags = techStack.split(",").map((t) => t.trim()).filter(Boolean);

    const { error } = await supabase.from("bounties").insert({
      poster_id: user.id,
      title: title.trim(),
      description: description.trim(),
      budget: budgetCents,
      category: category as any,
      tech_stack: tags,
    });

    if (error) {
      toast({ title: "Failed to create bounty", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bounty posted! 🎯" });
      setOpen(false);
      setTitle(""); setDescription(""); setBudget(""); setTechStack("");
      onCreated?.();
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Post a Bounty
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Post a Bounty</DialogTitle>
          <p className="text-sm text-muted-foreground">Describe what you need built. Sellers will compete to build it.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. Stripe subscription SaaS starter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Description</label>
            <Textarea
              placeholder="Describe exactly what you need — features, tech requirements, delivery format..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Budget ($)</label>
              <Input
                type="number"
                min="5"
                step="0.01"
                placeholder="200.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Tech stack (comma-separated)</label>
            <Input
              placeholder="React, Supabase, Tailwind"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 font-bold">
            {saving ? "Posting…" : "Post Bounty — Sellers will see this"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
