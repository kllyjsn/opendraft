import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";
import { Check, Crown, Download, Wrench, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const steps = [
  {
    icon: Crown,
    title: "Subscribe for $20/mo",
    desc: "One subscription gets you unlimited access to claim any app on OpenDraft.",
  },
  {
    icon: Download,
    title: "Claim & download",
    desc: "Every project gives you the full source code — yours to own, modify, and deploy forever.",
  },
  {
    icon: Wrench,
    title: "Hire your builder",
    desc: "Need customization? Set up a monthly retainer with the builder for ongoing support and features.",
  },
];

const perks = [
  "Unlimited app access",
  "Full source code on every project",
  "Deploy anywhere — yours forever",
  "Direct access to builders",
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && !user) return <Navigate to="/login" replace />;

  function done(path: string) {
    localStorage.setItem("opendraft_onboarding_done", "1");
    navigate(path);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl page-enter">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <BrandMascot size={72} variant="wave" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-4 mb-2">
              Welcome aboard! 🎉
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Here's how OpenDraft works — in 10 seconds.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-10">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 * i, duration: 0.35 }}
                  className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-0.5">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Perks */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 mb-10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What you get</p>
            <div className="space-y-2">
              {perks.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            <Button
              onClick={() => done("/credits")}
              className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold gap-2"
            >
              <Crown className="h-4 w-4" /> Subscribe — $20/mo
            </Button>
            <Button
              variant="ghost"
              onClick={() => done("/")}
              className="text-muted-foreground"
            >
              Maybe later — browse first <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
