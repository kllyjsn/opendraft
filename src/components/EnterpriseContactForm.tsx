import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAM_SIZES = ["1-10", "11-50", "51-200", "200+"];
const BUDGETS = ["$99-199/mo", "$200-499/mo", "$500+/mo", "Custom / enterprise"];

export function EnterpriseContactForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    team_size: "",
    budget: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("enterprise_inquiries" as any).insert({
        name: form.name,
        email: form.email,
        company: form.company || null,
        team_size: form.team_size || null,
        budget: form.budget || null,
        message: form.message || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-black tracking-tight mb-2">We'll be in touch!</h3>
        <p className="text-muted-foreground">Expect a response within 24 hours with a custom proposal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-8 md:p-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight">Talk to our team</h2>
          <p className="text-sm text-muted-foreground">Custom pricing for agencies & enterprises</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Your name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={100}
          />
          <Input
            type="email"
            placeholder="Work email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            maxLength={255}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Company name"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            maxLength={100}
          />
          <Select value={form.team_size} onValueChange={(v) => setForm({ ...form, team_size: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Team size" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s} employees</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGETS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Tell us about your needs — how many clients, what tools you want to replace, etc."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          maxLength={1000}
          rows={3}
        />
        <Button type="submit" disabled={loading} className="w-full gradient-hero text-white border-0 shadow-glow h-12 text-base font-bold">
          <Send className="h-4 w-4 mr-2" />
          {loading ? "Sending…" : "Get a custom quote"}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          No commitment required · We typically respond within 24 hours
        </p>
      </form>
    </div>
  );
}
