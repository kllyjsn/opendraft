import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";
import { Check, ArrowRight, Sparkles, Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const POPULAR_APPS = [
  { name: "Notion", cost: 10, icon: "📝" },
  { name: "Slack", cost: 13, icon: "💬" },
  { name: "Figma", cost: 15, icon: "🎨" },
  { name: "Linear", cost: 10, icon: "📊" },
  { name: "Vercel", cost: 20, icon: "▲" },
  { name: "Airtable", cost: 20, icon: "📋" },
  { name: "Zapier", cost: 20, icon: "⚡" },
  { name: "Canva", cost: 13, icon: "🖼" },
  { name: "Intercom", cost: 74, icon: "🗨" },
  { name: "Typeform", cost: 25, icon: "📄" },
  { name: "Calendly", cost: 10, icon: "📅" },
  { name: "Mailchimp", cost: 13, icon: "📧" },
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"apps" | "result">("apps");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customApps, setCustomApps] = useState<{ name: string; cost: number }[]>([]);
  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState("");

  if (!loading && !user) return <Navigate to="/login" replace />;

  function toggleApp(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addCustomApp() {
    const name = customName.trim();
    const cost = parseInt(customCost);
    if (!name || isNaN(cost) || cost <= 0) return;
    setCustomApps((prev) => [...prev, { name, cost }]);
    setSelected((prev) => new Set(prev).add(name));
    setCustomName("");
    setCustomCost("");
  }

  function removeCustomApp(name: string) {
    setCustomApps((prev) => prev.filter((a) => a.name !== name));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  const totalMonthlyCost = [...POPULAR_APPS.filter((a) => selected.has(a.name)), ...customApps.filter((a) => selected.has(a.name))]
    .reduce((sum, a) => sum + a.cost, 0);

  const savings = Math.max(0, totalMonthlyCost - 20);
  const yearlySavings = savings * 12;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl page-enter">
        <AnimatePresence mode="wait">
          {step === "apps" ? (
            <motion.div
              key="apps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <BrandMascot size={72} variant="wave" />
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-4 mb-2">
                  Welcome aboard! 🎉
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  What apps are you using right now? Select the tools you pay for monthly so we can show you how much you'll save.
                </p>
              </div>

              {/* App grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                {POPULAR_APPS.map((app) => {
                  const isSelected = selected.has(app.name);
                  return (
                    <button
                      key={app.name}
                      onClick={() => toggleApp(app.name)}
                      className={cn(
                        "relative rounded-xl border p-3.5 text-left transition-all duration-200 hover:shadow-sm",
                        isSelected
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-border/80"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-xl mb-1 block">{app.icon}</span>
                      <span className="text-sm font-bold block">{app.name}</span>
                      <span className="text-xs text-muted-foreground">${app.cost}/mo</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom apps */}
              {customApps.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {customApps.map((app) => (
                    <span
                      key={app.name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {app.name} · ${app.cost}/mo
                      <button onClick={() => removeCustomApp(app.name)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add custom app */}
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add other apps</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="App name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    maxLength={30}
                  />
                  <input
                    type="number"
                    placeholder="$/mo"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    min={1}
                    max={999}
                  />
                  <Button variant="outline" size="sm" onClick={addCustomApp} disabled={!customName.trim() || !customCost}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Running total */}
              {selected.size > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selected.size} app{selected.size !== 1 ? "s" : ""} selected</p>
                    <p className="text-xs text-muted-foreground">You're paying ~${totalMonthlyCost}/mo</p>
                  </div>
                  <span className="text-lg font-black text-destructive">${totalMonthlyCost}/mo</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.setItem("opendraft_onboarding_done", "1");
                    navigate("/");
                  }}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => setStep("result")}
                  disabled={selected.size === 0}
                  className="flex-1 gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 text-base font-bold gap-2"
                >
                  Show my savings <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              {/* Savings reveal */}
              <div className="mb-8">
                <BrandMascot size={80} variant="happy" />
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-4 mb-2">
                  {savings > 0 ? "You could save big." : "One price for everything."}
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {savings > 0
                    ? `You're spending $${totalMonthlyCost}/mo on ${selected.size} app${selected.size !== 1 ? "s" : ""}. With OpenDraft, you get access to all of them — and more — for just $20/mo.`
                    : `For $20/mo, get unlimited access to every app on OpenDraft. Claim, download, and deploy — all included.`
                  }
                </p>
              </div>

              {/* Comparison card */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 max-w-md mx-auto mb-8 text-left">
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You're paying now</p>
                    <p className="text-3xl font-black text-destructive line-through decoration-2">${totalMonthlyCost}<span className="text-sm font-medium text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">With OpenDraft</p>
                    <p className="text-3xl font-black text-primary">$20<span className="text-sm font-medium text-muted-foreground">/mo</span></p>
                  </div>
                </div>

                {savings > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", damping: 15 }}
                    className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-black text-primary">${savings}/mo saved</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      That's <span className="font-bold text-foreground">${yearlySavings}/year</span> back in your pocket
                    </p>
                  </motion.div>
                )}

                <div className="mt-5 space-y-2">
                  {[
                    "Unlimited app access",
                    "Full source code on every project",
                    "Deploy anywhere — yours forever",
                    "Direct access to builders",
                  ].map((item) => (
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
                  onClick={() => {
                    localStorage.setItem("opendraft_onboarding_done", "1");
                    navigate("/credits");
                  }}
                  className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold gap-2"
                >
                  <Crown className="h-4 w-4" /> Subscribe — $20/mo
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.setItem("opendraft_onboarding_done", "1");
                    navigate("/");
                  }}
                  className="text-muted-foreground"
                >
                  Maybe later — browse first
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
