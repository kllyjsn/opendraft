import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, Lightbulb, Rocket, Search, AlertCircle, X,
  Wand2, ArrowRight, Sparkles, Zap, Layout, Brain, FileText, Gamepad2, Bookmark, Check, Code, Megaphone,
  Palette, DollarSign, Clock, TrendingUp, Replace, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";

interface Insight {
  title: string;
  description: string;
}

interface RecommendedBuild {
  name: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  search_query: string;
}

interface BrandIdentity {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_style: string;
  design_mood: string;
  typography_style: string;
  border_radius: string;
  visual_references: string;
}

interface SaasReplacement {
  tool_name: string;
  monthly_cost: number;
  replacement_app: string;
  difficulty: "easy" | "moderate" | "complex";
}

interface QuickWin {
  name: string;
  impact: string;
  time_to_build: string;
}

interface AnalysisResult {
  business_name: string;
  industry: string;
  summary: string;
  brand_identity?: BrandIdentity;
  insights: Insight[];
  recommended_builds: RecommendedBuild[];
  saas_replacements?: SaasReplacement[];
  quick_wins?: QuickWin[];
  competitive_edge?: string;
  pageTitle: string;
  url: string;
}

const CATEGORY_ICON: Record<string, typeof Zap> = {
  saas_tool: Zap,
  ai_app: Brain,
  landing_page: Layout,
  utility: FileText,
  game: Gamepad2,
  other: Sparkles,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-primary/30 bg-primary/5",
  medium: "border-accent/30 bg-accent/5",
  low: "border-border bg-muted/30",
};

// Pre-cached example analyses — these load instantly, no API call needed
const EXAMPLE_ANALYSES: { label: string; emoji: string; data: AnalysisResult }[] = [
  {
    label: "Plumbing Co",
    emoji: "🔧",
    data: {
      business_name: "Summit Plumbing",
      industry: "Home Services",
      summary: "A residential plumbing company that could automate scheduling, estimates, and customer follow-ups to reduce admin overhead by 60%.",
      insights: [
        { title: "Scheduling is a bottleneck", description: "Most plumbing companies lose 5+ hours/week on phone-based booking. Online self-scheduling converts 3× more leads." },
        { title: "Estimates drive close rate", description: "Instant digital estimates with photo uploads close 40% faster than PDF-over-email." },
        { title: "Repeat customers are gold", description: "Automated maintenance reminders drive 30% of annual revenue for top home service companies." },
      ],
      recommended_builds: [
        { name: "Online Booking Portal", description: "Let customers pick a time slot, describe their issue with photos, and get instant confirmation.", category: "saas_tool", priority: "high", search_query: "plumbing booking scheduling app" },
        { name: "Instant Estimate Builder", description: "Drag-and-drop estimate tool with labor rates, parts markup, and one-click customer approval.", category: "saas_tool", priority: "high", search_query: "plumbing estimate quote builder app" },
        { name: "Customer Follow-Up System", description: "Automated texts for appointment reminders, review requests, and annual maintenance nudges.", category: "ai_app", priority: "medium", search_query: "plumbing customer follow up automation" },
        { name: "Service Area Landing Page", description: "SEO-optimized page with real-time availability, reviews, and click-to-book for each zip code.", category: "landing_page", priority: "medium", search_query: "plumbing service area landing page" },
      ],
      saas_replacements: [
        { tool_name: "Housecall Pro", monthly_cost: 65, replacement_app: "Custom Booking Portal", difficulty: "easy" as const },
        { tool_name: "Jobber", monthly_cost: 49, replacement_app: "Estimate & Invoice Tool", difficulty: "moderate" as const },
        { tool_name: "Mailchimp", monthly_cost: 20, replacement_app: "Follow-Up Automation", difficulty: "easy" as const },
      ],
      quick_wins: [
        { name: "Online Booking Widget", impact: "Capture after-hours leads — 35% of searches happen at night", time_to_build: "20 min" },
        { name: "Review Request Automator", impact: "Double Google reviews in 30 days", time_to_build: "15 min" },
        { name: "Service Area Checker", impact: "Stop wasting time on out-of-area calls", time_to_build: "10 min" },
      ],
      competitive_edge: "The top 10% of home service companies use custom booking and follow-up tools that convert 3× more leads than competitors relying on phone calls and paper estimates. By owning your scheduling and estimate stack, you eliminate $134/mo in SaaS fees while delivering a faster customer experience.",
      pageTitle: "Summit Plumbing",
      url: "https://summitplumbing.com",
    },
  },
  {
    label: "Law Firm",
    emoji: "⚖️",
    data: {
      business_name: "Meridian Legal",
      industry: "Professional Services — Legal",
      summary: "A mid-size law firm spending too much on generic practice management software. Custom tools could cut software costs 70% and improve client experience.",
      insights: [
        { title: "Client intake is manual", description: "Firms using digital intake forms reduce onboarding time from 45 min to 8 min per new client." },
        { title: "Case status calls waste time", description: "60% of client calls are 'what's my case status?' — a self-serve portal eliminates them." },
        { title: "Document management is fragmented", description: "Centralizing documents with role-based access cuts document retrieval time by 80%." },
      ],
      recommended_builds: [
        { name: "Client Intake Portal", description: "Digital forms with e-signatures, conflict checks, and automatic matter creation.", category: "saas_tool", priority: "high", search_query: "law firm client intake portal app" },
        { name: "Case Status Dashboard", description: "Clients log in to see milestones, upcoming dates, documents, and message their attorney.", category: "saas_tool", priority: "high", search_query: "law firm case tracker client portal" },
        { name: "AI Document Drafter", description: "Template-based document generation with AI clause suggestions and version history.", category: "ai_app", priority: "medium", search_query: "law firm ai document drafting tool" },
        { name: "Lead Qualification Chatbot", description: "Website chatbot that qualifies leads, books consultations, and captures case details 24/7.", category: "ai_app", priority: "medium", search_query: "law firm lead chatbot" },
      ],
      pageTitle: "Meridian Legal",
      url: "https://meridianlegal.com",
    },
  },
  {
    label: "Fitness Studio",
    emoji: "💪",
    data: {
      business_name: "Peak Fitness",
      industry: "Health & Wellness",
      summary: "A boutique fitness studio paying $200+/mo for Mindbody when custom tools could handle booking, memberships, and retention for a fraction of the cost.",
      insights: [
        { title: "Member churn is preventable", description: "Studios that track attendance patterns and send re-engagement messages reduce churn by 25%." },
        { title: "Class booking drives revenue", description: "Frictionless mobile booking increases class fill rates by 35% vs. walk-in only." },
        { title: "Upsell opportunities are missed", description: "Post-class product and package recommendations boost per-member revenue 15%." },
      ],
      recommended_builds: [
        { name: "Member Booking App", description: "Mobile-first class schedule with waitlists, check-in QR codes, and package tracking.", category: "saas_tool", priority: "high", search_query: "fitness studio booking app" },
        { name: "Membership Dashboard", description: "Track visits, remaining sessions, billing, and freeze/cancel — all self-serve.", category: "saas_tool", priority: "high", search_query: "fitness membership management dashboard" },
        { name: "Retention Alert System", description: "AI flags at-risk members based on attendance drops and triggers personalized win-back messages.", category: "ai_app", priority: "medium", search_query: "fitness member retention automation" },
        { name: "Class Results Tracker", description: "Members log workouts, see progress charts, and share achievements — drives community and retention.", category: "utility", priority: "medium", search_query: "fitness workout tracker app" },
      ],
      pageTitle: "Peak Fitness",
      url: "https://peakfitness.com",
    },
  },
];

const PRIORITY_TAG: Record<string, string> = {
  high: "bg-primary/15 text-primary",
  medium: "bg-accent/15 text-accent",
  low: "bg-muted text-muted-foreground",
};

const STORAGE_KEY = "opendraft_biz_analysis";

function saveAnalysis(result: AnalysisResult) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch {}
}
function loadAnalysis(): AnalysisResult | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearAnalysis() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

async function saveAnalysisToDb(result: AnalysisResult, isFallback: boolean) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("analyzed_urls").insert({
      user_id: user?.id ?? null,
      url: result.url,
      business_name: result.business_name,
      industry: result.industry,
      summary: result.summary,
      insights: { items: result.insights, brand_identity: result.brand_identity || null },
      recommended_builds: result.recommended_builds,
      is_fallback: isFallback,
    });
  } catch {}
}

export function BusinessAnalyzer({ onGenerate }: { onGenerate?: (prompt: string, brandContext?: Record<string, string>) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveIdea } = useSavedIdeas();
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Restore analysis after sign-in redirect
  useEffect(() => {
    const saved = loadAnalysis();
    if (saved && !result) {
      setResult(saved);
      setUrl(saved.url || "");
    }
  }, []);

  function buildInstantFallback(rawUrl: string): AnalysisResult {
    const formatted = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;

    let domain = rawUrl;
    try {
      domain = new URL(formatted).hostname.replace("www.", "");
    } catch {
      domain = rawUrl;
    }

    const businessName = domain.split(".")[0]?.replace(/[-_]/g, " ") || domain;
    const prettyName = businessName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      business_name: prettyName || "Your Business",
      industry: "Digital Business Operations",
      summary: "We generated instant recommendations you can build right now in OpenDraft while live analysis catches up.",
      insights: [
        { title: "Automate repetitive workflows", description: "Use app workflows to remove manual handoffs in onboarding, approvals, and reporting." },
        { title: "Build customer self-serve", description: "Ship portals that let users get answers, submit requests, and track progress without support delays." },
        { title: "Use AI for speed", description: "Add AI assistants for lead triage, drafting, and knowledge retrieval to increase team throughput." },
      ],
      recommended_builds: [
        {
          name: "Client Onboarding Portal",
          description: "A milestone-based onboarding app with tasks, documents, and status tracking.",
          category: "saas_tool",
          priority: "high",
          search_query: `${domain} onboarding portal app`,
        },
        {
          name: "AI Lead Qualification Assistant",
          description: "Score inbound leads and auto-route high-intent prospects to sales instantly.",
          category: "ai_app",
          priority: "high",
          search_query: `${domain} ai lead qualification app`,
        },
        {
          name: "Customer Health Dashboard",
          description: "Track activation, usage, and renewal risk in one operational dashboard.",
          category: "utility",
          priority: "medium",
          search_query: `${domain} customer health dashboard`,
        },
        {
          name: "ROI Proof Landing Page",
          description: "A high-converting landing experience with calculator, proof points, and demo CTA.",
          category: "landing_page",
          priority: "medium",
          search_query: `${domain} roi landing page`,
        },
      ],
      pageTitle: prettyName || domain,
      url: formatted,
    };
  }

  function normalizeBusinessUrl(rawInput: string): string | null {
    const candidate = rawInput.trim();
    if (!candidate) return null;

    const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

    try {
      const parsed = new URL(withProtocol);
      if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();

    const normalizedUrl = normalizeBusinessUrl(url);
    if (!normalizedUrl) {
      setError("Enter a valid website (e.g. workday.com)");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    setResult(null);

    logActivity({ event_type: "url_entered", event_data: { url: normalizedUrl }, page: "/" });

    try {
      const invokePromise = supabase.functions.invoke("analyze-business-url", {
        body: { url: normalizedUrl },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Analysis is taking longer than expected.")), 22000);
      });

      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.recommended_builds?.length) throw new Error("No build recommendations returned.");
      setResult(data);
      saveAnalysis(data);
      saveAnalysisToDb(data, false);
    } catch (err) {
      const fallback = buildInstantFallback(normalizedUrl);
      setResult(fallback);
      saveAnalysis(fallback);
      saveAnalysisToDb(fallback, true);
      setNotice("Live analysis was slow, so we loaded instant build ideas you can generate now.");
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGenerateClick(prompt: string) {
    if (!user) {
      // Persist analysis so it survives the sign-in redirect
      if (result) saveAnalysis(result);
      // Store the prompt so Index can auto-trigger after login
      sessionStorage.setItem("opendraft_pending_generate", prompt);
      navigate("/login");
      return;
    }
    // Build brand context from current analysis result
    const brandCtx = result?.brand_identity ? {
      ...result.brand_identity,
      business_name: result.business_name,
    } : undefined;
    // Clear both sessionStorage and React state so the results panel
    // collapses and the generation progress UI in the parent becomes visible
    clearAnalysis();
    setResult(null);
    setError(null);
    setNotice(null);
    if (onGenerate) {
      onGenerate(prompt, brandCtx as any);
    } else {
      // Store brand context in sessionStorage for cross-page generation
      if (brandCtx) sessionStorage.setItem("opendraft_brand_context", JSON.stringify(brandCtx));
      navigate(`/?generate=${encodeURIComponent(prompt)}`);
    }
  }

  function handleSearchClick(query: string) {
    navigate(`/?q=${encodeURIComponent(query)}`);
  }

  function reset() {
    setResult(null);
    setError(null);
    setNotice(null);
    setUrl("");
    clearAnalysis();
  }

  // ── Input Form ──
  if (!result) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <form onSubmit={handleAnalyze}>
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-500" />
            <div className="relative flex items-center">
              <Globe className="absolute left-4 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter your company URL (e.g. workday.com)…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-11 pr-28 h-12 bg-card border-border/50 focus-visible:border-primary/40 focus-visible:shadow-glow transition-all rounded-xl text-sm leading-normal [&]:py-0"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !url.trim()}
                className="absolute right-2 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 rounded-lg h-9 px-5 text-xs font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* One-tap examples — the key conversion lever */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-col items-center gap-2"
          >
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
              or see what we'd build for
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_ANALYSES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    logActivity({ event_type: "example_clicked", event_data: { label: ex.label }, page: "/" });
                    setResult(ex.data);
                    saveAnalysis(ex.data);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                >
                  <span>{ex.emoji}</span>
                  {ex.label}
                  <ArrowRight className="h-3 w-3 opacity-40" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-3 text-sm text-destructive justify-center"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 mt-6"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Scanning your site & building recommendations…
            </div>
            <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Results ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto w-full text-left"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-1"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              {result.industry}
            </span>
          </motion.div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{result.business_name}</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">{result.summary}</p>
          {notice && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
              <AlertCircle className="h-3 w-3" />
              {notice}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground h-8 shrink-0">
          <X className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {/* Insights Strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8"
      >
        {result.insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className="rounded-xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">{insight.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recommended Builds */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5" />
          Apps we'd build for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {result.recommended_builds.map((build, i) => {
            const Icon = CATEGORY_ICON[build.category] || Sparkles;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${PRIORITY_STYLES[build.priority]}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-xl bg-background/80 border border-border/50 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold truncate">{build.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${PRIORITY_TAG[build.priority]}`}>
                        {build.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{build.description}</p>
                  </div>
                </div>

                {/* What you'll get */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2.5 ml-11">
                  <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Code className="h-2.5 w-2.5" /> Source code
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Rocket className="h-2.5 w-2.5" /> Live deploy
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Megaphone className="h-2.5 w-2.5" /> Marketing kit
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateClick(build.search_query)}
                    className="flex-1 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-8 text-[11px] font-bold rounded-lg"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Build "{build.name}"
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!user) { navigate("/login"); return; }
                      const ok = await saveIdea({
                        name: build.name,
                        description: build.description,
                        category: build.category,
                        priority: build.priority,
                        search_query: build.search_query,
                        source_url: result?.url,
                      });
                      if (ok) setSavedSet(prev => new Set(prev).add(build.search_query));
                    }}
                    disabled={savedSet.has(build.search_query)}
                    className="h-8 px-2 text-[11px] text-muted-foreground hover:text-primary"
                    title="Save for later"
                  >
                    {savedSet.has(build.search_query)
                      ? <Check className="h-3 w-3 text-primary" />
                      : <Bookmark className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSearchClick(build.search_query)}
                    className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Browse similar"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
