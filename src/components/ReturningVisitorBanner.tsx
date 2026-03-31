import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Sparkles } from "lucide-react";

const HISTORY_KEY = "opendraft_analysis_history";

interface AnalysisHistoryEntry {
  business_name: string;
  industry: string;
  url: string;
  timestamp: number;
  top_app: string;
}

export function saveToHistory(entry: Omit<AnalysisHistoryEntry, "timestamp">) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: AnalysisHistoryEntry[] = raw ? JSON.parse(raw) : [];
    // Dedupe by URL
    const filtered = history.filter((h) => h.url !== entry.url);
    filtered.unshift({ ...entry, timestamp: Date.now() });
    // Keep last 5
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 5)));
  } catch {}
}

export function getHistory(): AnalysisHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ReturningVisitorBanner({ onRestore }: { onRestore: (url: string) => void }) {
  const [entry, setEntry] = useState<AnalysisHistoryEntry | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const history = getHistory();
    if (history.length > 0) {
      setEntry(history[0]);
    }
  }, []);

  if (!entry || dismissed) return null;

  const timeAgo = getTimeAgo(entry.timestamp);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="max-w-lg mx-auto mb-4 md:mb-6"
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              Welcome back! You analyzed {entry.business_name}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {timeAgo} · Top pick: {entry.top_app}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onRestore(entry.url)}
            className="shrink-0 h-7 px-3 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-1"
          >
            Continue
            <ArrowRight className="h-3 w-3" />
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
