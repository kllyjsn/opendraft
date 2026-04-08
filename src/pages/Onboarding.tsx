import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrg } from "@/hooks/useOrg";
import { useGremlinProgress } from "@/hooks/useGremlinProgress";
import {
  ArrowRight,
  ArrowLeft,
  Code,
  Rocket,
  Building2,
  TrendingDown,
  BarChart3,
  Zap,
  Lock,
  Globe,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Value-first onboarding screens (show before asking anything) ─── */

interface OnboardingScreen {
  id: string;
  headline: string;
  subline: string;
  icon: React.ElementType;
  bullets?: string[];
  stat?: { value: string; label: string };
}

const INDIVIDUAL_SCREENS: OnboardingScreen[] = [
  {
    id: "welcome",
    headline: "You're in. Let's kill your SaaS bill.",
    subline:
      "OpenDraft replaces the tools you rent with software you own — full source code, deploy anywhere, no per-seat fees.",
    icon: Zap,
    stat: { value: "$16,200", label: "avg. saved per team / year" },
  },
  {
    id: "how",
    headline: "Here's how it works",
    subline: "Three steps. No meetings. No sales calls.",
    icon: BarChart3,
    bullets: [
      "Paste your website — we audit your software stack",
      "See custom app replacements built for your business",
      "Claim with full source code and deploy in 90 seconds",
    ],
  },
  {
    id: "own",
    headline: "You own every line of code",
    subline:
      "No vendor lock-in. No subscription creep. Ship on your own infrastructure — Netlify, Vercel, or bare metal.",
    icon: Code,
    bullets: [
      "React + TypeScript — industry-standard stack",
      "Security-audited before every release",
      "Deploy configs included out of the box",
    ],
  },
  {
    id: "teams",
    headline: "Built for teams that move fast",
    subline:
      "Give your entire org access to approved, compliant apps through a private workspace. Like Okta, but for software you own.",
    icon: Building2,
    bullets: [
      "Invite unlimited team members",
      "Compliance tagging — SOC2, HIPAA, GDPR",
      "Admin approval workflows",
    ],
  },
  {
    id: "savings",
    headline: "Stop paying the per-seat tax",
    subline:
      "The average 10-person team spends $4,000+/mo on SaaS they don't own. Own it instead.",
    icon: TrendingDown,
    stat: { value: "10x", label: "cheaper than per-seat SaaS" },
    bullets: [
      "CRM — save $650/mo",
      "PM tools — save $300/mo",
      "Analytics — save $400/mo",
    ],
  },
];

const ENTERPRISE_SCREENS: OnboardingScreen[] = [
  {
    id: "ent-welcome",
    headline: "Welcome to your enterprise workspace",
    subline:
      "OpenDraft gives your organization a private app marketplace — own every tool, eliminate per-seat costs, and maintain full compliance.",
    icon: Building2,
    stat: { value: "$162K", label: "avg. saved per org / year" },
  },
  {
    id: "ent-workspace",
    headline: "Your private app catalog",
    subline:
      "Curate a library of approved, security-audited apps for your entire organization. Every team member gets instant access.",
    icon: Globe,
    bullets: [
      "Create a private app catalog for your org",
      "Approve and manage apps with admin workflows",
      "Invite teams with role-based access control",
    ],
  },
  {
    id: "ent-compliance",
    headline: "Enterprise-grade compliance",
    subline:
      "Tag apps with compliance frameworks, enforce approval workflows, and maintain a full audit trail for your IT governance team.",
    icon: FileCheck,
    bullets: [
      "SOC2, HIPAA, GDPR, PCI, FedRAMP tagging",
      "Admin approval before team deployment",
      "Audit-ready — track who deployed what, when",
    ],
  },
  {
    id: "ent-security",
    headline: "Security you can verify",
    subline:
      "Every app is security-audited with full source code access. No black-box SaaS — inspect, modify, and host on your own infrastructure.",
    icon: Lock,
    bullets: [
      "Full source code for every app",
      "Security audits included with every release",
      "Deploy on your infrastructure — no vendor lock-in",
    ],
  },
  {
    id: "ent-roi",
    headline: "Prove the ROI to leadership",
    subline:
      "Track exactly how much your org saves by replacing per-seat SaaS with owned software. Built-in analytics for every workspace.",
    icon: TrendingDown,
    stat: { value: "10x", label: "cheaper than per-seat SaaS" },
    bullets: [
      "Per-app savings tracking",
      "Team usage and adoption metrics",
      "Exportable reports for leadership",
    ],
  },
];

/* ─── Progress dots ─── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-primary"
              : i < current
              ? "w-1.5 bg-primary/40"
              : "w-1.5 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

/* ─── Single screen renderer ─── */
function ScreenView({ screen }: { screen: OnboardingScreen }) {
  const Icon = screen.icon;
  return (
    <motion.div
      key={screen.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="text-center max-w-md mx-auto"
    >
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Icon className="h-8 w-8 text-primary" />
      </div>

      <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-3">
        {screen.headline}
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {screen.subline}
      </p>

      {screen.stat && (
        <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 mb-6">
          <span className="text-2xl font-black text-primary">{screen.stat.value}</span>
          <span className="text-xs text-muted-foreground font-medium text-left leading-tight">
            {screen.stat.label}
          </span>
        </div>
      )}

      {screen.bullets && (
        <div className="space-y-3 text-left max-w-xs mx-auto">
          {screen.bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Onboarding Page ─── */
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { org: myOrg, loading: orgLoading } = useMyOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const progress = useGremlinProgress();
  const [step, setStep] = useState(0);

  // Determine if this is an enterprise onboarding flow
  // Use URL param immediately; org membership only after loading completes
  const isEnterprise = searchParams.get("plan") === "enterprise" || (!orgLoading && !!myOrg);

  const screens = isEnterprise ? ENTERPRISE_SCREENS : INDIVIDUAL_SCREENS;
  const totalScreens = screens.length;
  const isLast = step === totalScreens - 1;

  // Reset step if enterprise state changes (safety net)
  useEffect(() => {
    setStep(0);
  }, [isEnterprise]);

  // Derive the correct exit destination based on enterprise context
  function getExitPath() {
    if (isEnterprise && myOrg) return `/org/${myOrg.slug}`;
    if (isEnterprise) return "/org/new";
    return "/";
  }

  // Skip if already completed
  useEffect(() => {
    if (!progress.loading && progress.percentage === 100) {
      localStorage.setItem("opendraft_onboarding_done", "1");
      navigate(getExitPath(), { replace: true });
    }
  }, [progress.loading, progress.percentage, navigate, isEnterprise, myOrg]);

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  // Wait for org loading to settle before rendering screens
  if (orgLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  function finish() {
    localStorage.setItem("opendraft_onboarding_done", "1");
    navigate(getExitPath());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-16">
        {/* Enterprise badge */}
        {isEnterprise && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1">
              <Building2 className="h-3 w-3" /> Enterprise
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="mb-8">
          <ProgressDots current={step} total={totalScreens} />
        </div>

        {/* Screen */}
        <div className="w-full max-w-lg min-h-[360px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <ScreenView screen={screens[step]} />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-10 w-full max-w-xs">
          {step > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              className="gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <Button
              onClick={finish}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 h-11 font-bold gap-2"
            >
              {isEnterprise ? (
                <>Set up workspace <Building2 className="h-4 w-4" /></>
              ) : (
                <>Start building <Rocket className="h-4 w-4" /></>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 h-11 font-bold gap-2"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Skip link */}
        <button
          onClick={finish}
          className="mt-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Skip for now
        </button>
      </main>
    </div>
  );
}
