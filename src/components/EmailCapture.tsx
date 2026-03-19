import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-logger";

export function EmailCapture() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const impressionLogged = useRef(false);

  useEffect(() => {
    if (!user && !impressionLogged.current) {
      impressionLogged.current = true;
      logActivity({ event_type: "cta:impression", event_data: { source: "email_capture" } });
    }
  }, [user]);

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

      await logActivity({
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
    <section className="py-16 md:py-24 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container mx-auto px-4 max-w-lg text-center">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="text-[15px] font-bold text-foreground">You're in.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll send you the playbook: how operators like you are shipping tools that get noticed.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
              className="space-y-5"
            >
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary/80 mb-4">
                  The operator's edge
                </p>
                <h3 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground">
                  Ship tools your team loves.
                  <br />
                  <span className="text-muted-foreground">Get the credit you deserve.</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Free playbook: how operators are cutting costs, shipping faster, and earning promotions — all from one URL.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-11 text-sm bg-card border-border/50 rounded-xl"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="gradient-hero text-primary-foreground border-0 shadow-glow h-11 px-5 shrink-0 rounded-xl font-bold"
                >
                  {loading ? "..." : <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground/40">
                No spam. Unsubscribe anytime.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
