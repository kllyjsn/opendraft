import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";
import { Check, Lock, ArrowRight, Sparkles, Rocket, Crown, Download, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGremlinProgress, type GremlinStep } from "@/hooks/useGremlinProgress";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Zap, Crown, Download, Rocket];

const MASCOT_VARIANTS: Record<string, "default" | "wave" | "happy" | "thinking"> = {
  egg: "thinking",
  hatchling: "wave",
  explorer: "default",
  full_gremlin: "happy",
};

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const progress = useGremlinProgress();

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  const nextStep = progress.steps.find((s) => !s.completed);
  const isFullGremlin = progress.percentage === 100;

  // Auto-skip onboarding for users who already completed everything
  useEffect(() => {
    if (!progress.loading && isFullGremlin) {
      localStorage.setItem("opendraft_onboarding_done", "1");
      navigate("/", { replace: true });
    }
  }, [progress.loading, isFullGremlin, navigate]);

  function done(path: string) {
    localStorage.setItem("opendraft_onboarding_done", "1");
    navigate(path);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 md:py-16 max-w-xl page-enter">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mascot + Level Badge */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <BrandMascot
                size={96}
                variant={MASCOT_VARIANTS[progress.level] ?? "default"}
              />
              {isFullGremlin && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                {progress.levelLabel}
              </span>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-3 mb-1">
              {isFullGremlin ? "You're a Full Gremlin!" : "Become a Full Gremlin"}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {isFullGremlin
                ? "You've unlocked everything. Go build something legendary."
                : "Complete each step to level up your gremlin and unlock the full OpenDraft experience."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Progress</span>
              <span className="text-xs font-bold text-primary">{progress.completedCount}/{progress.totalSteps}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-10">
            {progress.steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                icon={STEP_ICONS[i]}
                isNext={nextStep?.id === step.id}
                onNavigate={(path) => done(path)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            {nextStep?.cta ? (
              <Button
                onClick={() => done(nextStep.cta!.path)}
                className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold gap-2"
              >
                {nextStep.cta.label} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : isFullGremlin ? (
              <Button
                onClick={() => done("/")}
                className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold gap-2"
              >
                Start building <Rocket className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={() => done("/")}
              className="text-muted-foreground text-sm"
            >
              Skip for now
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

function StepCard({
  step,
  index,
  icon: Icon,
  isNext,
  onNavigate,
}: {
  step: GremlinStep;
  index: number;
  icon: React.ElementType;
  isNext: boolean;
  onNavigate: (path: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index + 0.2, duration: 0.35 }}
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-200",
        step.completed
          ? "border-primary/20 bg-primary/5"
          : isNext
          ? "border-primary/40 bg-card shadow-sm ring-1 ring-primary/10"
          : "border-border/40 bg-card opacity-60"
      )}
    >
      {/* Step indicator */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          step.completed
            ? "bg-primary text-primary-foreground"
            : isNext
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {step.completed ? (
          <Check className="h-5 w-5" />
        ) : isNext ? (
          <Icon className="h-5 w-5" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-bold text-sm", step.completed && "line-through text-muted-foreground")}>
            {step.label}
          </h3>
          {step.completed && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 uppercase tracking-wider">
              Done
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>

        {/* CTA for next step */}
        {isNext && step.cta && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.4 }}>
            <Button
              size="sm"
              onClick={() => onNavigate(step.cta!.path)}
              className="mt-2.5 h-8 text-xs font-bold gap-1.5 gradient-hero text-white border-0 shadow-glow hover:opacity-90"
            >
              {step.cta.label} <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Step number */}
      <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
    </motion.div>
  );
}
