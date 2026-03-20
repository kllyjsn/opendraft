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
import { CheckCircle, AlertCircle, ExternalLink, Rocket, Globe, Pencil, Wand2, Code, FileText, Shield } from "lucide-react";
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
  currentStage,
}: {
  isInProgress: boolean;
  genJob: any;
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
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-base font-bold">{currentStage.label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {genJob?.listing_title
            ? `Building "${genJob.listing_title}"`
            : "This usually takes 60–90 seconds"}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2.5 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1"><Code className="h-2.5 w-2.5" /> Full source code</span>
          <span className="flex items-center gap-1"><Rocket className="h-2.5 w-2.5" /> Ready to deploy</span>
          <span className="flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Marketing kit</span>
          <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Security audit</span>
        </div>
      </div>
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${currentStage.pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">Building</span>
          <span className="text-[10px] font-semibold text-primary">
            {currentStage.pct}%
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        You can leave this page — track progress in your{" "}
        <a href="/dashboard" className="text-primary underline underline-offset-2">dashboard</a>.
      </p>
    </motion.div>
  );
}

function BuildError({
  genJob,
  handleGenerate,
}: {
  genJob: any;
  handleGenerate: (prompt: string) => void;
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
      <p className="text-sm font-semibold">Build failed</p>
      <p className="text-xs text-muted-foreground">{genJob?.error}</p>
      <Button size="sm" variant="outline" onClick={() => handleGenerate("")} className="gap-2">
        <Wand2 className="h-3.5 w-3.5" /> Try again
      </Button>
    </motion.div>
  );
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

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

      {/* ── HERO — Pain-Driven Conversion ── */}
      <section className="relative flex-1 flex items-center justify-center min-h-[60vh] md:min-h-[85vh] pt-8 md:pt-0">
        <HeroBeams />

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Pain-point headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[5rem] font-black tracking-[-0.05em] leading-[1.08]">
                <span className="block text-muted-foreground">Stop renting software.</span>
                <span className="block text-foreground mt-1">
                  Build your own{" "}
                  <span
                    className="inline-block relative overflow-hidden align-bottom"
                    style={{ minWidth: "5ch" }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={ROTATING_WORDS[rotatingIndex]}
                        initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -28, filter: "blur(6px)" }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block text-primary"
                      >
                        {ROTATING_WORDS[rotatingIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  .
                </span>
              </h1>
            </div>
          </motion.div>

          {/* Concrete sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto mb-8 md:mb-10 leading-relaxed"
          >
            Paste your website. Get a custom app in 90 seconds.
            <br />
            <span className="text-foreground/80 font-medium">Free to try — no coding experience needed.</span>
          </motion.p>

          {/* URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 md:mb-8"
          >
            <BusinessAnalyzer onGenerate={handleGenerate} />
          </motion.div>

          {/* Trust signals — immediately below CTA */}
          <SocialProofBar />

          {/* Generation progress */}
          <div className="mt-8">
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
          </div>
        </div>
      </section>

      {/* ── BEFORE/AFTER — Show what you get ── */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <BeforeAfterDemo />
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
