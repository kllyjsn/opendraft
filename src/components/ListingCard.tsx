import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CompletenessBadge } from "./CompletenessBadge";
import { Star, Eye } from "lucide-react";

interface ListingCardProps {
  id: string;
  title: string;
  description: string;
  price: number; // cents
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  avg_rating?: number;
}

export function ListingCard({
  id, title, description, price, completeness_badge,
  tech_stack, screenshots, sales_count, view_count, avg_rating,
}: ListingCardProps) {
  const thumbnail = screenshots?.[0];
  const priceLabel = `$${(price / 100).toFixed(2)}`;

  return (
    <Link to={`/listing/${id}`} className="group block">
      <Card className="overflow-hidden border-border/60 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Thumbnail */}
        <div className="relative h-44 bg-muted overflow-hidden">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full gradient-hero opacity-60 flex items-center justify-center">
              <span className="text-4xl">⚡</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <CompletenessBadge level={completeness_badge} showTooltip={false} />
          </div>
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-black/70 text-white px-2.5 py-0.5 text-sm font-bold backdrop-blur-sm">
              {priceLabel}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-base leading-tight line-clamp-1 mb-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>

          {/* Tech stack */}
          {tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tech_stack.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-medium">
                  {tag}
                </span>
              ))}
              {tech_stack.length > 4 && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">+{tech_stack.length - 4}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
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
            <span>{sales_count} sold</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
