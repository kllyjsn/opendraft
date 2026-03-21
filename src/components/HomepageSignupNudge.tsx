import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { EmailAuthForm } from "@/components/EmailAuthForm";
import { Sparkles } from "lucide-react";

export function HomepageSignupNudge() {
  const { user } = useAuth();
  const [showEmail, setShowEmail] = useState(false);

  if (user) return null;

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container mx-auto px-4 max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="space-y-5"
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">
            <Sparkles className="h-3 w-3" />
            Free to start
          </div>

          <h3 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground">
            Ready to build your first app?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create your free account — no credit card, no commitment.
            <br />Your first app is on us.
          </p>

          <div className="max-w-sm mx-auto space-y-3 pt-2">
            <GoogleSignInButton label="Continue with Google" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="bg-background px-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-semibold"
                >
                  {showEmail ? "hide" : "or use email"}
                </button>
              </div>
            </div>

            {showEmail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <EmailAuthForm defaultMode="signup" />
              </motion.div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/40">
            No spam. No per-seat fees. You own the code.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
