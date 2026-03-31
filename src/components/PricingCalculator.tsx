import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOCATIONS = [
  { label: "US / Western Europe", avgMonthly: 8500 },
  { label: "Eastern Europe", avgMonthly: 4000 },
  { label: "South Asia / LATAM", avgMonthly: 2000 },
] as const;

const SAAS_STACK = [
  { name: "CRM", cost: 150 },
  { name: "Helpdesk", cost: 80 },
  { name: "Scheduling", cost: 40 },
  { name: "Analytics", cost: 120 },
  { name: "Forms / Intake", cost: 30 },
  { name: "Project Mgmt", cost: 60 },
  { name: "Email Marketing", cost: 100 },
  { name: "Invoicing", cost: 50 },
];

export function PricingCalculator() {
  const [teamSize, setTeamSize] = useState(3);
  const [locationIdx, setLocationIdx] = useState(0);
  const [seatCount, setSeatCount] = useState(25);

  const loc = LOCATIONS[locationIdx];

  const devCost = useMemo(() => teamSize * loc.avgMonthly, [teamSize, loc]);
  const saasCost = useMemo(() => {
    // Typical per-seat SaaS stack cost
    const perSeat = SAAS_STACK.reduce((s, t) => s + t.cost, 0); // ~$630/seat/mo
    return Math.round((perSeat * seatCount) / 10); // simplified: not every tool charges per-seat
  }, [seatCount]);
  
  const totalTraditional = devCost + saasCost;
  const openDraftCost = 0; // One-time, no monthly
  const openDraftEquivalent = 49; // one-time build cost equivalent monthly
  const savings = totalTraditional - openDraftEquivalent;
  const savingsPercent = Math.round((savings / totalTraditional) * 100);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4 text-xs font-medium">
            Cost Comparison
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            See what you're really spending
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Compare developer salaries + SaaS subscriptions vs owning your software outright.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Team size */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Dev team size
                </span>
                <span className="text-sm font-bold text-foreground">{teamSize}</span>
              </div>
              <Slider
                value={[teamSize]}
                onValueChange={([v]) => setTeamSize(v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Location */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Developer location
              </span>
              <div className="flex flex-col gap-1.5">
                {LOCATIONS.map((l, i) => (
                  <button
                    key={l.label}
                    onClick={() => setLocationIdx(i)}
                    className={`text-left text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      i === locationIdx
                        ? "bg-foreground text-background font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seat count */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> SaaS seats
                </span>
                <span className="text-sm font-bold text-foreground">{seatCount}</span>
              </div>
              <Slider
                value={[seatCount]}
                onValueChange={([v]) => setSeatCount(v)}
                min={5}
                max={200}
                step={5}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">
                Per-seat fees across your SaaS stack
              </p>
            </div>
          </div>

          {/* Comparison bars */}
          <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Monthly cost comparison</span>
              <span className="text-[10px]">Lower is better</span>
            </div>

            {/* Traditional */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Traditional (devs + SaaS)
                </span>
                <span className="text-sm font-bold text-destructive">
                  ${totalTraditional.toLocaleString()}/mo
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-destructive/70"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span>{teamSize} dev{teamSize > 1 ? "s" : ""}: ${devCost.toLocaleString()}/mo</span>
                <span>·</span>
                <span>SaaS stack: ${saasCost.toLocaleString()}/mo</span>
              </div>
            </div>

            {/* OpenDraft */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  OpenDraft <Badge variant="secondary" className="text-[9px] px-1.5 py-0">own it</Badge>
                </span>
                <span className="text-sm font-bold text-foreground">
                  $0/mo
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  whileInView={{ width: "2%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                One-time build · Zero per-seat fees · You own the code
              </p>
            </div>

            {/* Savings highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-accent-foreground" />
                <span className="text-lg font-bold text-foreground">
                  Save ${savings.toLocaleString()}/mo
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                That's <span className="font-semibold text-foreground">{savingsPercent}% less</span> than 
                traditional development + SaaS subscriptions
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                = ${(savings * 12).toLocaleString()} saved per year
              </p>
            </motion.div>
          </div>

          <div className="text-center mt-6">
            <Button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
                if (input) {
                  input.focus();
                  input.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full h-11 px-6 text-sm font-semibold gap-2"
            >
              See your savings <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Paste your URL for a personalized cost breakdown
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
