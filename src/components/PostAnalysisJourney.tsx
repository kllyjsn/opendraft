import { motion } from "framer-motion";
import { Check, Search, Rocket, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  label: string;
  description: string;
  icon: typeof Search;
  done: boolean;
  active: boolean;
}

export function PostAnalysisJourney({
  stage,
  onAction,
}: {
  stage: "analyzed" | "picked" | "building" | "deployed";
  onAction?: () => void;
}) {
  const steps: Step[] = [
    {
      label: "Audit complete",
      description: "We found apps your business needs",
      icon: Search,
      done: ["analyzed", "picked", "building", "deployed"].includes(stage),
      active: stage === "analyzed",
    },
    {
      label: "Pick your app",
      description: "Choose the highest-impact build",
      icon: Wand2,
      done: ["picked", "building", "deployed"].includes(stage),
      active: stage === "picked",
    },
    {
      label: "Build & deploy",
      description: "Get your app live in 90 seconds",
      icon: Rocket,
      done: stage === "deployed",
      active: stage === "building",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 mb-6"
    >
      <div className="flex items-center gap-1 mb-3">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : step.active
                      ? "border-2 border-primary text-primary bg-primary/10"
                      : "border border-border text-muted-foreground/40 bg-muted/30"
                }`}
              >
                {step.done && !step.active ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <step.icon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p
                  className={`text-[10px] font-bold leading-tight ${
                    step.done || step.active ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[9px] text-muted-foreground/60 leading-tight truncate">
                  {step.description}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 ${
                  steps[i + 1].done || steps[i + 1].active ? "bg-primary/40" : "bg-border/40"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {stage === "analyzed" && onAction && (
        <Button
          size="sm"
          onClick={onAction}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-bold rounded-lg gap-1.5 mt-1"
        >
          Pick your top app below
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  );
}
