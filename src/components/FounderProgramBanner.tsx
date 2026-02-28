import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export function FounderProgramBanner() {
  return (
    <Link
      to="/founders"
      className="block mb-8 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 p-5 hover:shadow-glow transition-shadow group"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            🎉 Founder First Program — 0% fees for 6 months
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Be one of our first 100 creators. Keep 100% of every sale. No commission, no catch.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}
