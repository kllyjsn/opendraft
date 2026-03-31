import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Wand2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function DashboardWelcomeBack() {
  const [pendingBuild, setPendingBuild] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<{ business_name: string; top_app: string } | null>(null);

  useEffect(() => {
    try {
      // Check for pending generation
      const pending = sessionStorage.getItem("opendraft_pending_generate");
      if (pending) setPendingBuild(pending);

      // Check for last analysis from history
      const raw = localStorage.getItem("opendraft_analysis_history");
      if (raw) {
        const history = JSON.parse(raw);
        if (history.length > 0) {
          setLastAnalysis({
            business_name: history[0].business_name,
            top_app: history[0].top_app,
          });
        }
      }
    } catch {}
  }, []);

  if (!pendingBuild && !lastAnalysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6"
    >
      {pendingBuild ? (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              You were building something
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              "{pendingBuild}" — ready to finish?
            </p>
          </div>
          <Link to={`/?generate=${encodeURIComponent(pendingBuild)}`}>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 text-xs font-bold">
              Resume build
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ) : lastAnalysis ? (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              Welcome back!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last audit: {lastAnalysis.business_name} · Top pick: {lastAnalysis.top_app}
            </p>
          </div>
          <Link to="/">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-bold">
              New audit
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
