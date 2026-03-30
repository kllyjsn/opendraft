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
      saas_replacements: [
        { tool_name: "Clio", monthly_cost: 89, replacement_app: "Case Management Dashboard", difficulty: "moderate" as const },
        { tool_name: "LawPay", monthly_cost: 49, replacement_app: "Client Billing Portal", difficulty: "moderate" as const },
        { tool_name: "Calendly", monthly_cost: 12, replacement_app: "Consultation Scheduler", difficulty: "easy" as const },
      ],
      quick_wins: [
        { name: "Consultation Booking Form", impact: "Convert website visitors into booked consultations 24/7", time_to_build: "15 min" },
        { name: "Case Status Auto-Updater", impact: "Eliminate 60% of 'what's my status?' calls", time_to_build: "30 min" },
        { name: "Client Intake Questionnaire", impact: "Cut new client onboarding from 45 min to 8 min", time_to_build: "20 min" },
      ],
      competitive_edge: "Forward-thinking firms are using custom client portals that let clients check case status, sign documents, and message attorneys — eliminating the #1 complaint in legal: poor communication. Owning your tech stack means you never pay per-seat fees that punish growth.",
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
      saas_replacements: [
        { tool_name: "Mindbody", monthly_cost: 139, replacement_app: "Member Booking App", difficulty: "moderate" as const },
        { tool_name: "Mailchimp", monthly_cost: 20, replacement_app: "Retention Alert System", difficulty: "easy" as const },
        { tool_name: "Stripe Billing", monthly_cost: 0, replacement_app: "Membership Dashboard", difficulty: "easy" as const },
      ],
      quick_wins: [
        { name: "Class Schedule Widget", impact: "Let members book from your website or Instagram bio link", time_to_build: "15 min" },
        { name: "Attendance Tracker", impact: "Spot at-risk members before they cancel", time_to_build: "25 min" },
        { name: "Post-Class Survey", impact: "Get real-time feedback to improve class quality", time_to_build: "10 min" },
      ],
      competitive_edge: "Studios using custom member apps see 25% lower churn because they catch disengagement early. While competitors pay $139/mo for Mindbody's generic experience, you can own a branded app that feels premium and costs a fraction to maintain.",
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

export function BusinessAnalyzer({ onGenerate, onResultsChange }: {
  onGenerate?: (prompt: string, brandContext?: Record<string, string>) => void;
  onResultsChange?: (hasResults: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveIdea } = useSavedIdeas();
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Notify parent when results change
  useEffect(() => {
    onResultsChange?.(!!result);
  }, [result, onResultsChange]);

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

  const [showUrlInput, setShowUrlInput] = useState(false);

  // ── Input Form ──
  if (!result) {
    return (
      <div className="max-w-lg mx-auto w-full">
        {/* PRIMARY: One-tap demo examples — highest conversion action */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3 md:gap-4"
          >
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              Pick an industry to see the audit:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
              {EXAMPLE_ANALYSES.map((ex, i) => (
                <button
                  key={ex.label}
                  type="button"
                  data-demo-btn={i === 0 ? "" : undefined}
                  onClick={() => {
                    logActivity({ event_type: "example_clicked", event_data: { label: ex.label }, page: "/" });
                    setResult(ex.data);
                    saveAnalysis(ex.data);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 active:scale-[0.97] shadow-sm"
                >
                  <span className="text-base md:text-lg">{ex.emoji}</span>
                  {ex.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* SECONDARY: URL input — revealed on tap */}
            <div className="w-full mt-2 md:mt-4">
              {!showUrlInput ? (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium underline underline-offset-4 decoration-border hover:decoration-foreground"
                >
                  Or audit your own website →
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleAnalyze} className="mt-1">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-500" />
                      <div className="relative flex items-center">
                        <Globe className="absolute left-3 md:left-4 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          inputMode="url"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="e.g. acmeplumbing.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="pl-9 md:pl-11 pr-24 md:pr-28 h-11 md:h-12 bg-card border-border/50 focus-visible:border-primary/40 focus-visible:shadow-glow transition-all rounded-xl text-sm leading-normal [&]:py-0"
                          disabled={loading}
                          autoFocus
                          required
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={loading || !url.trim()}
                          className="absolute right-1.5 md:right-2 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 rounded-lg h-8 md:h-9 px-4 md:px-5 text-xs font-bold"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              <span className="hidden sm:inline">Analyzing</span>
                              <span className="sm:hidden">…</span>
                            </>
                          ) : (
                            "Audit free"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
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
  const totalSaasSavings = (result.saas_replacements || []).reduce((sum, r) => sum + r.monthly_cost, 0);
  const heroBuild = result.recommended_builds[0];
  const restBuilds = result.recommended_builds.slice(1);
  const HeroIcon = CATEGORY_ICON[heroBuild?.category] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto w-full text-left"
    >
      {/* ── Progress Stepper ── */}
      <div className="flex items-center justify-center gap-1 mb-6">
        {[
          { label: "Analyze", done: true },
          { label: "Pick", done: false, active: true },
          { label: "Deploy", done: false },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            {i > 0 && <div className={`w-6 sm:w-10 h-px ${step.done || step.active ? "bg-primary/40" : "bg-border/60"}`} />}
            <div className="flex items-center gap-1.5">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step.done ? "bg-primary text-primary-foreground" :
                step.active ? "border-2 border-primary text-primary" :
                "border border-border text-muted-foreground/50"
              }`}>
                {step.done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${
                step.done ? "text-primary" :
                step.active ? "text-foreground" :
                "text-muted-foreground/50"
              }`}>{step.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-1 flex-wrap"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              {result.industry}
            </span>
            {totalSaasSavings > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                <DollarSign className="h-3 w-3" />
                ${totalSaasSavings}/mo saveable
              </span>
            )}
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

      {/* ── Brand Identity Preview ── */}
      {result.brand_identity && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/40 bg-card/60 p-4 mb-6 backdrop-blur-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Palette className="h-3 w-3" />
            Your brand identity
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              {[result.brand_identity.primary_color, result.brand_identity.secondary_color, result.brand_identity.accent_color].map((color, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-lg border border-border/50 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 font-medium capitalize">
                {result.brand_identity.design_mood}
              </span>
              <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 font-medium capitalize">
                {result.brand_identity.typography_style.replace(/-/g, " ")}
              </span>
              <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 font-medium capitalize">
                {result.brand_identity.border_radius} corners
              </span>
              <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 font-medium capitalize">
                {result.brand_identity.background_style} theme
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
            {result.brand_identity.visual_references}
          </p>
        </motion.div>
      )}

      {/* Insights Strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6"
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

      {/* ── SaaS Savings Calculator ── */}
      {result.saas_replacements && result.saas_replacements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400 flex items-center gap-2">
              <Replace className="h-3 w-3" />
              SaaS you can replace
            </p>
            <span className="text-sm font-black text-green-600 dark:text-green-400">
              ${totalSaasSavings}/mo → $0
            </span>
          </div>
          <div className="space-y-2">
            {result.saas_replacements.map((replacement, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center justify-between rounded-xl bg-background/60 border border-border/30 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{replacement.tool_name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">→ {replacement.replacement_app}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                    replacement.difficulty === "easy" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                    replacement.difficulty === "moderate" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                    "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}>
                    {replacement.difficulty}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground line-through">${replacement.monthly_cost}/mo</span>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-3 text-center font-medium">
            Annual savings: <span className="font-black">${totalSaasSavings * 12}/year</span> by owning your tools
          </p>
        </motion.div>
      )}

      {/* ── Quick Wins ── */}
      {result.quick_wins && result.quick_wins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-3 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Quick wins — build in under an hour
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {result.quick_wins.map((win, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="rounded-xl border border-accent/20 bg-accent/5 p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3 text-accent" />
                  <p className="text-xs font-bold">{win.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug mb-2">{win.impact}</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-accent/80 bg-accent/10 rounded-full px-2 py-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {win.time_to_build}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Competitive Edge ── */}
      {result.competitive_edge && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 shrink-0">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                Competitive edge
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{result.competitive_edge}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── #1 Recommendation — Hero Card ── */}
      {heroBuild && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
            <Rocket className="h-3.5 w-3.5" />
            #1 recommendation
          </p>
          <div className="relative rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                <TrendingUp className="h-3 w-3" />
                Highest impact
              </span>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 shrink-0">
                <HeroIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 pr-20">
                <p className="text-base font-black tracking-tight">{heroBuild.name}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{heroBuild.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 ml-[52px]">
              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <Code className="h-2.5 w-2.5" /> Full source code
              </span>
              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <Rocket className="h-2.5 w-2.5" /> Live deploy
              </span>
              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <Megaphone className="h-2.5 w-2.5" /> Marketing kit
              </span>
            </div>
            <div className="flex items-center gap-2 ml-[52px]">
              <Button
                size="sm"
                onClick={() => handleGenerateClick(heroBuild.search_query)}
                className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-9 px-5 text-xs font-bold rounded-lg"
              >
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Build this now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!user) { navigate("/login"); return; }
                  const ok = await saveIdea({
                    name: heroBuild.name,
                    description: heroBuild.description,
                    category: heroBuild.category,
                    priority: heroBuild.priority,
                    search_query: heroBuild.search_query,
                    source_url: result?.url,
                  });
                  if (ok) setSavedSet(prev => new Set(prev).add(heroBuild.search_query));
                }}
                disabled={savedSet.has(heroBuild.search_query)}
                className="h-9 px-2 text-muted-foreground hover:text-primary"
                title="Save for later"
              >
                {savedSet.has(heroBuild.search_query) ? <Check className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Other Builds ── */}
      {restBuilds.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            Also recommended
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {restBuilds.map((build, i) => {
              const Icon = CATEGORY_ICON[build.category] || Sparkles;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
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

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateClick(build.search_query)}
                      className="flex-1 gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 h-8 text-[11px] font-bold rounded-lg min-w-0"
                    >
                      <Wand2 className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">Build this</span>
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
                      className="h-8 px-2 text-[11px] text-muted-foreground hover:text-primary shrink-0"
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
                      className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
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
      )}

    </motion.div>
  );
}
