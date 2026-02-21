import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Clock, Users, DollarSign } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  saas_tool: "SaaS Tool",
  ai_app: "AI App",
  landing_page: "Landing Page",
  utility: "Utility",
  game: "Game",
  other: "Other",
};

interface BountyCardProps {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  tech_stack: string[];
  status: string;
  submissions_count: number;
  created_at: string;
  poster_id?: string;
  poster_username?: string;
}

export function BountyCard({
  id, title, description, budget, category, tech_stack,
  status, submissions_count, created_at, poster_id, poster_username,
}: BountyCardProps) {
  const daysAgo = Math.floor((Date.now() - new Date(created_at).getTime()) / 86400000);
  const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;

  return (
    <Link to={`/bounty/${id}`} className="group block">
      <Card className="overflow-hidden border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 h-full bg-card">
        <CardContent className="p-5 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Bounty
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {CATEGORY_LABELS[category] || category}
                </span>
              </div>
              <h3 className="font-bold text-[0.95rem] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xl font-black text-primary">${(budget / 100).toFixed(0)}</span>
              <p className="text-[10px] text-muted-foreground font-medium">budget</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

          {/* Tech stack */}
          {tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tech_stack.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                  {tag}
                </span>
              ))}
              {tech_stack.length > 4 && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">+{tech_stack.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {submissions_count} {submissions_count === 1 ? "submission" : "submissions"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeLabel}
              </span>
            </div>
            {poster_username && poster_id ? (
              <Link
                to={`/builder/${poster_id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium truncate max-w-[100px] hover:text-primary transition-colors"
              >
                by {poster_username}
              </Link>
            ) : poster_username ? (
              <span className="font-medium truncate max-w-[100px]">by {poster_username}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
