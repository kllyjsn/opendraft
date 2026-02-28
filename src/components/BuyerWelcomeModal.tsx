import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, DollarSign, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";

const STORAGE_KEY = "opendraft_welcome_seen";

const steps = [
  {
    icon: Search,
    title: "Fork the source code",
    desc: "When you buy, you get a full fork of the codebase — yours to own, modify, and deploy forever.",
  },
  {
    icon: DollarSign,
    title: "Bid or buy instantly",
    desc: "Every listing has a price. Make an offer or purchase outright — no subscriptions required to start.",
  },
  {
    icon: Download,
    title: "Subscribe for updates",
    desc: "Optionally subscribe to maintenance. Your builder ships new features and fixes directly to your fork.",
  },
];

export function BuyerWelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Delay 5s so user has time to read the listing first
      const timer = setTimeout(() => setOpen(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={dismiss} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-3xl border border-border/40 bg-card p-8 shadow-xl"
          >
            <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <BrandMascot size={64} variant="wave" />
              <h2 className="text-2xl font-black tracking-tight mt-3">Welcome to OpenDraft!</h2>
              <p className="text-sm text-muted-foreground mt-1">Here's how it works — in 10 seconds.</p>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-border/40 bg-muted/30 p-5 text-center"
              >
                {(() => {
                  const Icon = steps[step].icon;
                  return (
                    <>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{steps[step].title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{steps[step].desc}</p>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={dismiss} className="flex-1 text-muted-foreground">
                Skip
              </Button>
              <Button onClick={next} className="flex-1 gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2">
                {step < steps.length - 1 ? (
                  <>Next <ArrowRight className="h-4 w-4" /></>
                ) : (
                  "Start browsing"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
