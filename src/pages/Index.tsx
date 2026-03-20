import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
import { SocialProofBar } from "@/components/SocialProofBar";
import { BeforeAfterDemo } from "@/components/BeforeAfterDemo";

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
    <div className="mb-8 md:mb-10">
      <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.05em] leading-[1.05]">
        <span className="block text-foreground">Build your own</span>
        <span className="block text-foreground">
          <span
            className="inline-block relative overflow-hidden align-bottom"
            style={{ minWidth: "7ch" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={ROTATING_WORDS[index]}
                initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -36, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block text-primary"
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
          className="absolute inset-0 rounded-full border-2 border-primary animate-spin"
          style={{ animationDuration: "2s", borderTopColor: "transparent" }}
        />
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
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${currentStage.pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">
            {deployPhase === "deploying" || deployPhase === "polling" ? "Deploying" : "Building"}
          </span>
          <span className="text-[10px] font-semibold text-primary">
            {currentStage.pct}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-[10px]">
        <span className={`flex items-center gap-1 ${genJob?.status === "complete" ? "text-primary font-bold" : "text-muted-foreground"}`}>
          {genJob?.status === "complete" ? <CheckCircle className="h-3 w-3" /> : <Wand2 className="h-3 w-3" />}
          Build
        </span>
        <span className="text-border">→</span>
        <span className={`flex items-center gap-1 ${deployPhase === "polling" || deployPhase === "live" ? "text-primary font-bold" : "text-muted-foreground"}`}>
          {deployPhase === "live" ? <CheckCircle className="h-3 w-3" /> : <Rocket className="h-3 w-3" />}
          Deploy
        </span>
        <span className="text-border">→</span>
        <span className={`flex items-center gap-1 ${deployPhase === "live" ? "text-primary font-bold" : "text-muted-foreground"}`}>
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
          {genJob?.listing_title && `"${genJob.listing_title}" — `}Built, deployed, ready.
        </p>
      </div>
      <a
        href={deployUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors mx-auto"
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
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
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
            <span className="h-2 w-2 rounded-full bg-foreground/10" />
            <span className="h-2 w-2 rounded-full bg-foreground/10" />
            <span className="h-2 w-2 rounded-full bg-foreground/10" />
          </div>
          <span className="text-[10px] text-muted-foreground truncate flex-1">{deployUrl}</span>
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
      <p className="text-xs text-muted-foreground">{deployError || genJob?.error}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {deployPhase === "error" && genJob?.listing_id ? (
          <>
            <Button size="sm" variant="outline" onClick={() => handleAutoDeploy(genJob.listing_id!)} className="gap-2">
              <Rocket className="h-3.5 w-3.5" /> Retry
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/listing/${genJob.listing_id}`)}>
              View listing
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => handleGenerate("")} className="gap-2">
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
        description: "Every business, better software. Paste your site, own the app.",
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
        title="Every Business, Better Software | OpenDraft"
        description="Paste your website. Get custom apps that make your team faster and your boss impressed — no per-seat fees, no lock-in."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      <Navbar />

      {/* ── HERO — Confident Gravity ── */}
      <section className="relative flex-1 flex items-center justify-center min-h-[70vh] md:min-h-[90vh]">
        <HeroBeams />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroTagline />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-12 md:mb-16 leading-relaxed"
          >
            Paste your site. We build the tools your team needs.
            <br className="hidden sm:block" />
            <span className="text-foreground/80 font-medium">
              You look like a genius. We'll keep the secret.
            </span>
          </motion.p>

          {/* URL Input — the singular CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 md:mb-16"
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
              <DeploySuccess deployUrl={deployUrl} genJob={genJob} navigate={navigate} reset={reset} />
            )}
          </AnimatePresence>

          {/* Deploy error */}
          <AnimatePresence>
            {(deployPhase === "error" || genJob?.status === "failed") && !isInProgress && (
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

          {/* Minimal proof line — signed out only */}
          {!user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="text-xs text-muted-foreground/40 tracking-wide mt-4"
            >
              No per-seat fees. You own the code. Forever.
            </motion.p>
          )}
        </div>
      </section>

      {/* ── VALUE PROPOSITIONS ── */}
      <ValueProps />

      {/* ── SHOWCASE ── */}
      <AnalysisShowcase />

      {/* ── EMAIL CAPTURE — signed out only ── */}
      {!user && <EmailCapture />}

      {/* ── CLOSING CTA ── */}
      <section className="py-24 md:py-40">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[1.1] mb-6">
              Every business,
              <br />
              <span className="text-primary">better software.</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
              Your competitors rent software. You'll own it.
            </p>
            <Button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[inputMode="url"]');
                if (input) {
                  input.focus();
                  input.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-sm font-bold rounded-xl transition-all duration-300"
            >
              Paste your URL
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
