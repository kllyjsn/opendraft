import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

const SAVINGS_KEY = "opendraft_roi_savings";

interface SavingsData {
  monthly_savings: number;
  tools_replaced: string[];
  started_at: string;
}

export function addSavings(monthlySavings: number, toolsReplaced: string[]) {
  try {
    const raw = localStorage.getItem(SAVINGS_KEY);
    const existing: SavingsData = raw ? JSON.parse(raw) : { monthly_savings: 0, tools_replaced: [], started_at: new Date().toISOString() };
    existing.monthly_savings += monthlySavings;
    existing.tools_replaced = [...new Set([...existing.tools_replaced, ...toolsReplaced])];
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(existing));
  } catch {}
}

export function getSavings(): SavingsData | null {
  try {
    const raw = localStorage.getItem(SAVINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ROISavingsTracker() {
  const [savings, setSavings] = useState<SavingsData | null>(null);

  useEffect(() => {
    setSavings(getSavings());
  }, []);

  if (!savings || savings.monthly_savings === 0) return null;

  const monthsActive = Math.max(
    1,
    Math.ceil((Date.now() - new Date(savings.started_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
  );
  const totalSaved = savings.monthly_savings * monthsActive;
  const annualProjected = savings.monthly_savings * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-green-500/10 p-2">
          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Your savings so far</p>
          <p className="text-[10px] text-muted-foreground">
            By owning instead of renting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-black text-green-600 dark:text-green-400 tabular-nums">
            ${savings.monthly_savings}
          </p>
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">/ month</p>
        </div>
        <div className="text-center border-x border-green-500/10">
          <p className="text-lg sm:text-2xl font-black text-green-600 dark:text-green-400 tabular-nums">
            ${totalSaved}
          </p>
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">saved</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-black text-green-600 dark:text-green-400 tabular-nums">
            ${annualProjected}
          </p>
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">/ year</p>
        </div>
      </div>

      {savings.tools_replaced.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[9px] text-muted-foreground font-medium">Replaced:</span>
          {savings.tools_replaced.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 rounded-full px-2 py-0.5 line-through decoration-1"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
