import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function EmailCapture() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await supabase.from("cloud_waitlist").insert({
        email: email.trim(),
        message: "homepage_email_capture",
      });
      setSubmitted(true);

      // Track in activity log
      await supabase.from("activity_log").insert({
        event_type: "funnel:email_capture",
        event_data: { email: email.trim(), source: "homepage" },
        page: "/",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-lg text-center">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">You're in.</p>
              <p className="text-xs text-muted-foreground">
                We'll send you our best tips on replacing SaaS with apps you own.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 mx-auto">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Not ready yet? Get the free guide.
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Learn how teams are cutting SaaS costs 80% by owning their tools.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-10 text-sm bg-card border-border/50"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="gradient-hero text-white border-0 shadow-glow h-10 px-4 shrink-0"
                >
                  {loading ? "..." : <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground/50">
                No spam. Unsubscribe anytime.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
