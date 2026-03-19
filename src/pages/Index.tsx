import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GremlinWorkshop } from "@/components/GremlinWorkshop";
import { BusinessAnalyzer } from "@/components/BusinessAnalyzer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { useGenerationJob } from "@/hooks/useGenerationJob";
import { CheckCircle, AlertCircle, ExternalLink, Rocket, Globe, Pencil, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailCapture } from "@/components/EmailCapture";
import { AnalysisShowcase } from "@/components/AnalysisShowcase";
import { ValueProps } from "@/components/ValueProps";
import { HeroBeams } from "@/components/HeroBeams";
import { PeekRight, PeekLeft, FloatingAgent, AgentParade, PeekBottom } from "@/components/PeekingAgents";

const ROTATING_WORDS = ["CRM", "scheduler", "dashboard", "portal", "tracker", "helpdesk"];

function HeroTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6">
      {/* Ogilvy-crisp brand line */}
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-primary/80 mb-4">
        Improve your company. Get promoted.
      </p>

      <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[4.5rem] font-black tracking-[-0.04em] leading-[1.1]">
        <span className="block text-foreground">Stop renting</span>
        <span className="block text-foreground">
          your{" "}
          <span
            className="inline-block relative overflow-hidden align-bottom"
            style={{ minWidth: "7ch" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_WORDS[index]}
                initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -28, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block text-gradient animate-gradient-shift"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(265 90% 62%), hsl(320 95% 60%), hsl(175 95% 50%), hsl(265 90% 62%))",
                  backgroundSize: "200% 200%",
                }}
              >
                {ROTATING_WORDS[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          .
        </span>
      </h1>
    </div>
  );
}

function GenerationProgress({
  isInProgress,
  genJob,
  deployPhase,
  currentStage,
}: {
  isInProgress: boolean;
  genJob: any;
  deployPhase: string;
  currentStage: { label: string; pct: number };
}) {
  if (!isInProgress) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-md mx-auto space-y-5 mb-8"
    >
      <div className="relative h-14 w-14 mx-auto">
        <div
          className="absolute inset-0 rounded-full gradient-hero animate-spin"
          style={{ animationDuration: "2s" }}
        />
        <div className="absolute inset-[2px] rounded-full bg-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          {deployPhase === "deploying" || deployPhase === "polling" ? (
            <Rocket className="h-5 w-5 text-primary" />
          ) : (
            <Wand2 className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>
      <div>
        <p className="text-base font-bold">{currentStage.label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {genJob?.listing_title
            ? `"${genJob.listing_title}"`
            : "This usually takes 60–90 seconds"}
        </p>
      </div>
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full gradient-hero transition-all duration-1000 ease-out"
            style={{ width: `${currentStage.pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">
            {deployPhase === "deploying" || deployPhase === "polling"
              ? "Deploying"
              : "Building"}
          </span>
          <span className="text-[10px] font-semibold text-primary">
            {currentStage.pct}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-[10px]">
        <span
          className={`flex items-center gap-1 ${
            genJob?.status === "complete"
              ? "text-primary font-bold"
              : "text-muted-foreground"
          }`}
        >
          {genJob?.status === "complete" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          Build
        </span>
        <span className="text-border">→</span>
        <span
          className={`flex items-center gap-1 ${
            deployPhase === "polling" || deployPhase === "live"
              ? "text-primary font-bold"
              : "text-muted-foreground"
          }`}
        >
          {deployPhase === "live" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Rocket className="h-3 w-3" />
          )}
          Deploy
        </span>
        <span className="text-border">→</span>
        <span
          className={`flex items-center gap-1 ${
            deployPhase === "live"
              ? "text-primary font-bold"
              : "text-muted-foreground"
          }`}
        >
          <Globe className="h-3 w-3" />
          Live
        </span>
      </div>
    </motion.div>
  );
}

function DeploySuccess({
  deployUrl,
  genJob,
  navigate,
  reset,
}: {
  deployUrl: string;
  genJob: any;
  navigate: (path: string) => void;
  reset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto space-y-5 mb-8"
    >
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto">
        <CheckCircle className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-black text-foreground">Your app is live.</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {genJob?.listing_title && `"${genJob.listing_title}" — `}Built, deployed,
          ready.
        </p>
      </div>
      <a
        href={deployUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors mx-auto"
      >
        <Globe className="h-4 w-4" />
        {deployUrl.replace("https://", "")}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <div className="flex gap-2 justify-center flex-wrap">
        {genJob?.listing_id && (
          <Button
            size="sm"
            onClick={() => navigate(`/listing/${genJob.listing_id}/edit`)}
            className="gradient-hero text-primary-foreground border-0 shadow-glow hover:opacity-90 gap-2"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {genJob?.listing_id && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/listing/${genJob.listing_id}`)}
            className="gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View listing
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>
          Build another
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden shadow-card mt-4">
        <div className="bg-muted/50 px-3 py-1.5 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive/50" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/50" />
            <span className="h-2 w-2 rounded-full bg-green-500/50" />
          </div>
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            {deployUrl}
          </span>
        </div>
        <iframe
          src={deployUrl}
          className="w-full h-[300px] bg-background"
          title="Live preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </motion.div>
  );
}

function DeployError({
  deployPhase,
  genJob,
  deployError,
  handleAutoDeploy,
  handleGenerate,
  navigate,
}: {
  deployPhase: string;
  genJob: any;
  deployError: string | undefined;
  handleAutoDeploy: (id: string) => void;
  handleGenerate: (prompt: string) => void;
  navigate: (path: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3 mb-8"
    >
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 mx-auto">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm font-semibold">
        {deployPhase === "error" ? "Deploy failed" : "Build failed"}
      </p>
      <p className="text-xs text-muted-foreground">
        {deployError || genJob?.error}
      </p>
      <div className="flex gap-2 justify-center flex-wrap">
        {deployPhase === "error" && genJob?.listing_id ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAutoDeploy(genJob.listing_id!)}
              className="gap-2"
            >
              <Rocket className="h-3.5 w-3.5" /> Retry
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/listing/${genJob.listing_id}`)}
            >
              View listing
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate("")}
            className="gap-2"
          >
            <Wand2 className="h-3.5 w-3.5" /> Try again
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    generating,
    genJob,
    deployPhase,
    deployUrl,
    deployError,
    currentStage,
    isInProgress,
    handleGenerate,
    handleAutoDeploy,
    reset,
  } = useGenerationJob();

  // Auto-trigger generation from ?generate= param or pending session storage
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const genParam = params.get("generate");
    if (genParam) {
      params.delete("generate");
      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      window.history.replaceState({}, "", newUrl);
      handleGenerate(genParam);
      return;
    }
    const pending = sessionStorage.getItem("opendraft_pending_generate");
    if (pending) {
      sessionStorage.removeItem("opendraft_pending_generate");
      handleGenerate(pending);
    }
  }, [user]);

  const jsonLdData = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "OpenDraft",
        url: "https://opendraft.co",
        description: "Improve your company. Get promoted. Paste your site, own the app.",
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "OpenDraft",
        url: "https://opendraft.co",
        logo: "https://opendraft.co/mascot-icon.png",
        sameAs: ["https://x.com/OpenDraft"],
      },
    ],
    []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Improve Your Company, Get Promoted | OpenDraft"
        description="Paste your website. Get custom apps that make your team faster and your boss impressed — no per-seat fees, no lock-in."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative flex-1 flex items-center justify-center min-h-[65vh] md:min-h-[85vh]">
        <HeroBeams />

        {/* Peeking agents */}
        <PeekRight className="top-[20%] hidden md:block" delay={1.2} />
        <PeekLeft className="bottom-[15%] hidden md:block" delay={1.5} />
        <FloatingAgent
          className="absolute top-[12%] right-[8%] hidden lg:block"
          delay={1.8}
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroTagline />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-10 md:mb-14 leading-relaxed"
          >
            Paste your site. We build the tools your team needs.
            <br className="hidden sm:block" />
            <span className="text-foreground/70 font-medium">You look like a genius. We'll keep the secret.</span>
          </motion.p>

          {/* URL Input — sole CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 md:mb-14"
          >
            <BusinessAnalyzer onGenerate={handleGenerate} />
          </motion.div>

          {/* Generation progress */}
          <AnimatePresence>
            <GenerationProgress
              isInProgress={isInProgress}
              genJob={genJob}
              deployPhase={deployPhase}
              currentStage={currentStage}
            />
          </AnimatePresence>

          {/* Deploy success */}
          <AnimatePresence>
            {deployPhase === "live" && deployUrl && !isInProgress && (
              <DeploySuccess
                deployUrl={deployUrl}
                genJob={genJob}
                navigate={navigate}
                reset={reset}
              />
            )}
          </AnimatePresence>

          {/* Deploy error */}
          <AnimatePresence>
            {(deployPhase === "error" || genJob?.status === "failed") &&
              !isInProgress && (
                <DeployError
                  deployPhase={deployPhase}
                  genJob={genJob}
                  deployError={deployError}
                  handleAutoDeploy={handleAutoDeploy}
                  handleGenerate={handleGenerate}
                  navigate={navigate}
                />
              )}
          </AnimatePresence>

          {/* Minimal social proof — signed out only */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground/50 font-medium tracking-wide">
                <span>Better tools</span>
                <span className="h-3 w-px bg-border/30" />
                <span>Better results</span>
                <span className="h-3 w-px bg-border/30" />
                <span>Better career</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Value props grid */}
      <ValueProps />

      {/* Agent parade divider */}
      <div className="py-6 md:py-10">
        <AgentParade />
      </div>

      <AnalysisShowcase />

      {!user && <EmailCapture />}

      {/* Gremlin workshop */}
      <div className="relative">
        <PeekRight className="top-4 hidden md:block" delay={0.3} />
        <PeekLeft className="top-[40%] hidden md:block" delay={0.6} />
        <GremlinWorkshop />
      </div>

      <div className="relative">
        <PeekBottom className="mx-auto" delay={0.4} />
      </div>
      <Footer />
    </div>
  );
}
