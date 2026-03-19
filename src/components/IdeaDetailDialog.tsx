import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Wand2, Zap, Brain, Layout, FileText, Gamepad2, Sparkles,
  Globe, Clock, ExternalLink, Bookmark, ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_ICON: Record<string, typeof Zap> = {
  saas_tool: Zap, ai_app: Brain, landing_page: Layout,
  utility: FileText, game: Gamepad2, other: Sparkles,
};

const PRIORITY_TAG: Record<string, string> = {
  high: "bg-primary/15 text-primary",
  medium: "bg-accent/15 text-accent",
  low: "bg-muted text-muted-foreground",
};

export interface IdeaDetail {
  name: string;
  description: string;
  category: string;
  priority: string;
  search_query: string;
  source_url?: string | null;
  notes?: string | null;
  created_at?: string;
  // For builds from analyzed URLs
  business_name?: string | null;
  industry?: string | null;
  brand_identity?: Record<string, string> | null;
}

interface Props {
  idea: IdeaDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (query: string, brandContext?: Record<string, string>) => void;
}

export function IdeaDetailDialog({ idea, open, onOpenChange, onGenerate }: Props) {
  if (!idea) return null;

  const Icon = CATEGORY_ICON[idea.category] || Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden border-border/60 bg-card/95 backdrop-blur-md">
        {/* Header band */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-2 shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-black tracking-tight leading-tight">
                  {idea.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PRIORITY_TAG[idea.priority] || PRIORITY_TAG.low}`}>
                    {idea.priority} priority
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {idea.category.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>

          {(idea.business_name || idea.industry) && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {idea.business_name && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {idea.business_name}
                </span>
              )}
              {idea.industry && (
                <span className="bg-muted/50 px-2 py-0.5 rounded-full">{idea.industry}</span>
              )}
            </div>
          )}

          {idea.source_url && (
            <a
              href={idea.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {(() => { try { return new URL(idea.source_url).hostname; } catch { return idea.source_url; } })()}
            </a>
          )}

          {idea.notes && (
            <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
              <p className="text-xs text-foreground/80">{idea.notes}</p>
            </div>
          )}

          {idea.created_at && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Saved {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
            </p>
          )}

          {/* What you'll get */}
          <div className="bg-muted/20 rounded-xl p-3 border border-border/30 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">What happens next</p>
            <div className="flex items-start gap-2 text-xs text-foreground/80">
              <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span>AI generates a production-ready app from this concept — deployed to your domain in 90 seconds.</span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-2">
          <Button
            onClick={() => { onGenerate(idea.search_query); onOpenChange(false); }}
            className="w-full gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-10 text-sm font-bold rounded-xl gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Generate this app
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
