import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { useAnalyzedUrls, AnalyzedUrl } from "@/hooks/useAnalyzedUrls";
import { useSavedIdeas, SavedIdea } from "@/hooks/useSavedIdeas";
import { useAuth } from "@/hooks/useAuth";
import { useGenerationJob } from "@/hooks/useGenerationJob";
import { IdeaDetailDialog, IdeaDetail } from "@/components/IdeaDetailDialog";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, Wand2, Rocket, Globe, Zap, Brain, Layout, FileText,
  Gamepad2, Sparkles, ArrowRight, ExternalLink, Clock, Bookmark,
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

function AnalysisCard({ analysis, onGenerate, onClickBuild }: { analysis: AnalyzedUrl; onGenerate: (q: string) => void; onClickBuild: (build: IdeaDetail) => void }) {
  const [expanded, setExpanded] = useState(false);
  const domain = (() => {
    try { return new URL(analysis.url).hostname.replace("www.", ""); } catch { return analysis.url; }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 shrink-0">
          <Globe className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-bold">{analysis.business_name || domain}</h3>
            {analysis.industry && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {analysis.industry}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-0.5 truncate">
              {domain} <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
            </span>
          </div>
          {analysis.summary && (
            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{analysis.summary}</p>
          )}
        </div>
      </div>

      {/* Always-visible Generate button for the top recommended build */}
      {analysis.recommended_builds?.length > 0 && (
        <div className="mb-3">
          <Button
            size="sm"
            onClick={() => onGenerate(analysis.recommended_builds[0].search_query)}
            className="w-full gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-8 text-[11px] font-bold rounded-lg gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Generate top pick: {analysis.recommended_builds[0].name}
          </Button>
        </div>
      )}

      {/* Expandable recommended builds */}
      {analysis.recommended_builds?.length > 1 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1 hover:opacity-80"
          >
            <Rocket className="h-3 w-3" />
            {analysis.recommended_builds.length - 1} more build{analysis.recommended_builds.length > 2 ? "s" : ""}
            <span className="text-muted-foreground font-normal ml-1">{expanded ? "▲" : "▼"}</span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 mb-2">
                  {analysis.recommended_builds.slice(1).map((build: any, i: number) => {
                    const Icon = CATEGORY_ICON[build.category] || Sparkles;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl border border-border/40 bg-muted/20">
                        <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold truncate">{build.name}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full ${PRIORITY_TAG[build.priority] || PRIORITY_TAG.low}`}>
                              {build.priority}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{build.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onGenerate(build.search_query)}
                          className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-6 text-[9px] font-bold rounded-md px-2 shrink-0"
                        >
                          <Wand2 className="h-2.5 w-2.5 mr-0.5" />
                          Generate
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

export default function Ideas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { analyses, loading: analysesLoading } = useAnalyzedUrls();
  const { ideas, loading: ideasLoading } = useSavedIdeas();
  const { handleGenerate } = useGenerationJob();
  const [tab, setTab] = useState<"analyses" | "saved">("analyses");

  const loading = tab === "analyses" ? analysesLoading : ideasLoading;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <MetaTags title="Your Analyses | OpenDraft" description="View all your analyzed URLs and saved app ideas." path="/ideas" />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Lightbulb className="h-12 w-12 text-primary/40 mx-auto" />
            <h1 className="text-2xl font-black">Your Idea Vault</h1>
            <p className="text-sm text-muted-foreground">Sign in to view your analyzed URLs and saved ideas.</p>
            <Button onClick={() => navigate("/login")} className="gradient-hero text-primary-foreground border-0 shadow-glow">
              Sign in
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags title="Your Analyses | OpenDraft" description="View all your analyzed URLs and saved app ideas." path="/ideas" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Idea Vault
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Every URL you've analyzed and ideas you've saved
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/")} className="gap-1.5 text-xs">
              <ArrowRight className="h-3 w-3" />
              Analyze a site
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-6">
            <button
              onClick={() => setTab("analyses")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                tab === "analyses"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Globe className="h-3 w-3 inline mr-1 -mt-0.5" />
              Analyzed URLs ({analyses.length})
            </button>
            <button
              onClick={() => setTab("saved")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                tab === "saved"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Bookmark className="h-3 w-3 inline mr-1 -mt-0.5" />
              Saved Ideas ({ideas.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Loading…</p>
            </div>
          ) : tab === "analyses" ? (
            analyses.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No URLs analyzed yet. Enter a company URL on the homepage to get started.</p>
                <Button size="sm" onClick={() => navigate("/")} className="gradient-hero text-primary-foreground border-0 shadow-glow gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  Get started
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {analyses.map((a) => (
                    <AnalysisCard key={a.id} analysis={a} onGenerate={handleGenerate} />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            ideas.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No ideas bookmarked yet. Save ideas from your analysis results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {ideas.map((idea) => {
                    const Icon = CATEGORY_ICON[idea.category] || Sparkles;
                    return (
                      <motion.div
                        key={idea.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-bold">{idea.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{idea.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(idea.search_query)}
                          className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-7 text-[10px] font-bold rounded-lg gap-1 w-full"
                        >
                          <Wand2 className="h-3 w-3" />
                          Generate
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
