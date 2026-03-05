import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CompletenessBadge } from "./CompletenessBadge";
import { Star, Eye, CheckCircle } from "lucide-react";

interface ListingCardProps {
  id: string;
  title: string;
  description: string;
  price: number; // cents
  pricing_type?: "one_time" | "monthly";
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  avg_rating?: number;
  owned?: boolean;
  built_with?: string | null;
  seller_id?: string;
  seller_username?: string;
}

export type { ListingCardProps };

const BUILT_WITH_LABELS: Record<string, string> = {
  lovable: "Lovable",
  claude_code: "Claude Code",
  cursor: "Cursor",
  bolt: "Bolt",
  replit: "Replit",
  other: "Other",
};

export function ListingCard({
  id, title, description, price, pricing_type, completeness_badge,
  tech_stack, screenshots, sales_count, view_count, avg_rating, owned, built_with,
  seller_id, seller_username,
}: ListingCardProps) {
  const navigate = useNavigate();
  const thumbnail = screenshots?.[0];

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/listing/${id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/listing/${id}`)}
      className="group block cursor-pointer"
    >
      <Card className="overflow-hidden border-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 h-full bg-card">
        {/* Thumbnail */}
        <div className="relative h-32 md:h-44 bg-muted overflow-hidden">
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt={title}
                loading="lazy"
                width={400}
                height={225}
                decoding="async"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                srcSet={`${thumbnail}?width=300 300w, ${thumbnail}?width=400 400w, ${thumbnail}?width=600 600w`}
                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.parentElement?.querySelector(".img-fallback") as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="img-fallback w-full h-full items-center justify-center gradient-hero opacity-80 hidden absolute inset-0">
                <span className="text-4xl">⚡</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center gradient-hero opacity-80">
              <span className="text-4xl">⚡</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

          {owned && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-glow animate-scale-up">
              <CheckCircle className="h-3 w-3" />
              Owned
            </div>
          )}

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-1">
            <CompletenessBadge level={completeness_badge} showTooltip={false} />
            {!owned && (
              <span className="rounded-full bg-black/70 text-white px-2.5 py-0.5 text-xs md:text-sm font-bold backdrop-blur-md tracking-tight shrink-0 border border-white/10">
                $15/mo
              </span>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-2.5">
          <div>
            <h3 className="font-bold text-[0.9rem] leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{description}</p>
            {built_with && BUILT_WITH_LABELS[built_with] && (
              <span className="inline-flex items-center gap-1 mt-1.5 rounded-md bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[10px] text-accent font-semibold tracking-tight">
                🛠 {BUILT_WITH_LABELS[built_with]}
              </span>
            )}
          </div>

          {tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tech_stack.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium tracking-tight"
                >
                  {tag}
                </span>
              ))}
              {tech_stack.length > 4 && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  +{tech_stack.length - 4}
                </span>
              )}
            </div>
          )}


          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-2.5">
              {avg_rating !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {avg_rating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {view_count}
              </span>
            </div>
            {seller_id && seller_username ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/builder/${seller_id}`);
                }}
                className="font-medium truncate max-w-[100px] hover:text-primary transition-colors duration-200"
              >
                by {seller_username}
              </button>
            ) : (
              <span className="font-medium capitalize">{completeness_badge === "production_ready" ? "Full App" : completeness_badge === "mvp" ? "MVP" : "Prototype"}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
