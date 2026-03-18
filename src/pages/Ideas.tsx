import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { useSavedIdeas, SavedIdea } from "@/hooks/useSavedIdeas";
import { useAuth } from "@/hooks/useAuth";
import { useGenerationJob } from "@/hooks/useGenerationJob";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Lightbulb, Wand2, Trash2, StickyNote, Rocket, CheckCircle,
  Clock, Zap, Brain, Layout, FileText, Gamepad2, Sparkles, ArrowRight, X,
} from "lucide-react";

const CATEGORY_ICON: Record<string, typeof Zap> = {
  saas_tool: Zap, ai_app: Brain, landing_page: Layout,
  utility: FileText, game: Gamepad2, other: Sparkles,
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  saved: { label: "Saved", icon: Clock, color: "text-muted-foreground" },
  building: { label: "Building", icon: Rocket, color: "text-primary" },
  built: { label: "Built", icon: CheckCircle, color: "text-green-500" },
};

function IdeaCard({
  idea, onGenerate, onDelete, onUpdateNotes, onUpdateStatus,
}: {
  idea: SavedIdea;
  onGenerate: (query: string) => void;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(idea.notes || "");
  const Icon = CATEGORY_ICON[idea.category] || Sparkles;
  const status = STATUS_CONFIG[idea.status] || STATUS_CONFIG.saved;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-bold">{idea.name}</h3>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${status.color}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{idea.description}</p>
          {idea.source_url && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 truncate">
              From: {idea.source_url}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdateNotes(idea.id, notes)}
              placeholder="Add notes about this idea…"
              className="text-xs min-h-[60px] bg-muted/30 border-border/40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          size="sm"
          onClick={() => {
            onUpdateStatus(idea.id, "building");
            onGenerate(idea.search_query);
          }}
          className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-7 text-[10px] font-bold rounded-lg gap-1"
        >
          <Wand2 className="h-3 w-3" />
          Generate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNotes(!showNotes)}
          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
        >
          <StickyNote className="h-3 w-3" />
          {showNotes ? "Hide" : "Notes"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(idea.id)}
          className="h-7 px-2 text-[10px] text-destructive/60 hover:text-destructive hover:bg-destructive/10 gap-1 ml-auto"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Ideas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ideas, loading, deleteIdea, updateIdea } = useSavedIdeas();
  const { handleGenerate } = useGenerationJob();
  const [filter, setFilter] = useState<"all" | "saved" | "building" | "built">("all");

  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <MetaTags title="Saved Ideas | OpenDraft" description="Save app ideas for later and build when you're ready." path="/ideas" />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Lightbulb className="h-12 w-12 text-primary/40 mx-auto" />
            <h1 className="text-2xl font-black">Your Idea Vault</h1>
            <p className="text-sm text-muted-foreground">Sign in to save and manage app ideas.</p>
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
      <MetaTags title="Saved Ideas | OpenDraft" description="Save app ideas for later and build when you're ready." path="/ideas" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Idea Vault
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ideas.length} idea{ideas.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-1.5 text-xs"
            >
              <ArrowRight className="h-3 w-3" />
              Analyze a site
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {(["all", "saved", "building", "built"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f === "all" ? `All (${ideas.length})` : `${f} (${ideas.filter((i) => i.status === f).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">Loading ideas…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "No ideas saved yet. Analyze a website to discover app opportunities."
                  : `No ${filter} ideas.`}
              </p>
              {filter === "all" && (
                <Button size="sm" onClick={() => navigate("/")} className="gradient-hero text-primary-foreground border-0 shadow-glow gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  Get started
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onGenerate={handleGenerate}
                    onDelete={deleteIdea}
                    onUpdateNotes={(id, notes) => updateIdea(id, { notes })}
                    onUpdateStatus={(id, status) => updateIdea(id, { status })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
