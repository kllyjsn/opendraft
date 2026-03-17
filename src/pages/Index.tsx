import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BusinessAnalyzer } from "@/components/BusinessAnalyzer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { BrandMascot } from "@/components/BrandMascot";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { useGenerationJob } from "@/hooks/useGenerationJob";
import { CheckCircle, AlertCircle, ExternalLink, Rocket, Globe, Pencil, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTA_COPY } from "@/lib/pricing-tiers";

const ROTATING_WORDS = ["restaurant", "agency", "clinic", "startup", "gym", "studio"];

function HeroTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-4xl md:text-6xl lg:text-[5rem] font-black tracking-[-0.04em] mb-4 leading-[1.05] md:leading-[0.92]">
      <span className="block">Your{" "}
        <span className="inline-block relative overflow-hidden align-bottom" style={{ minWidth: "7ch" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={ROTATING_WORDS[index]}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block text-gradient animate-gradient-shift"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(265 90% 62%), hsl(320 95% 60%), hsl(175 95% 50%), hsl(265 90% 62%))",
                backgroundSize: "200% 200%",
              }}
            >
              {ROTATING_WORDS[index]}
            </motion.span>
          </AnimatePresence>
        </span>,
      </span>
      <span className="block">deployed.</span>
    </h1>
  );
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);

  const { generating, genJob, deployPhase, deployUrl, deployError, currentStage, isInProgress, handleGenerate, handleAutoDeploy, reset } = useGenerationJob();

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

  const jsonLdData = useMemo(() => [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "OpenDraft",
      "url": "https://opendraft.co",
      "description": "Paste your business URL. Get a production-ready app — built, secured, and deployed in 90 seconds.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "OpenDraft",
      "url": "https://opendraft.co",
      "logo": "https://opendraft.co/mascot-icon.png",
      "sameAs": ["https://x.com/OpenDraft"],
    },
  ], []);

  useEffect(() => {
    if (user || stickyDismissed) return;
    const onScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, stickyDismissed]);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Your Business, Deployed — Production-Ready Apps in 90 Seconds | OpenDraft"
        description="Paste your URL. Get a production-ready app — built, secured, and ready to ship. No templates. Real software."
        path="/"
      />
      <JsonLd data={jsonLdData} />
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden flex-1 flex items-center justify-center min-h-[85vh] md:min-h-[90vh]">
        {/* Cinematic background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-primary/8 blur-[200px]" />
          <div className="absolute -bottom-20 -right-40 w-[500px] h-[500px] rounded-full bg-accent/6 blur-[160px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 md:mb-6"
          >
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              From URL to live app in 90 seconds
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroTagline />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto mb-6 md:mb-10 leading-relaxed"
          >
            Paste your URL. Get a production-ready app — built, secured, and ready to ship.
          </motion.p>

          {/* URL Input — the single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 md:mb-12"
          >
            <BusinessAnalyzer onGenerate={handleGenerate} />
          </motion.div>

          {/* Generation progress — inline */}
          <AnimatePresence>
            {isInProgress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto space-y-5 mb-8"
              >
                <div className="relative h-14 w-14 mx-auto">
                  <div className="absolute inset-0 rounded-full gradient-hero animate-spin" style={{ animationDuration: "2s" }} />
                  <div className="absolute inset-[2px] rounded-full bg-card" />
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
                    {genJob?.listing_title ? `"${genJob.listing_title}"` : "This usually takes 60–90 seconds"}
                  </p>
                </div>
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-hero transition-all duration-1000 ease-out" style={{ width: `${currentStage.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {deployPhase === "deploying" || deployPhase === "polling" ? "Deploying to cloud" : "Building your app"}
                    </span>
                    <span className="text-[10px] font-semibold text-primary">{currentStage.pct}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
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
            )}
          </AnimatePresence>

          {/* Deploy success */}
          <AnimatePresence>
            {deployPhase === "live" && deployUrl && !isInProgress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto space-y-5 mb-8"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">🎉 Your app is live!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    "{genJob?.listing_title}" has been built and deployed.
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
                      className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit your app
                    </Button>
                  )}
                  {genJob?.listing_id && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${genJob.listing_id}`)} className="gap-2">
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
            )}
          </AnimatePresence>

          {/* Deploy error */}
          <AnimatePresence>
            {(deployPhase === "error" || genJob?.status === "failed") && !isInProgress && (
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
                        <Rocket className="h-3.5 w-3.5" /> Retry deploy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/listing/${genJob.listing_id}`)}>
                        View listing instead
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleGenerate("")} className="gap-2">
                      <Wand2 className="h-3.5 w-3.5" /> Try again
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social proof — signed out only */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="max-w-xs mx-auto">
                <GoogleSignInButton label="Get started — it's free" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
                {[
                  "Full source code ownership",
                  "Security audited",
                  "Deploy-ready in minutes",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-primary/50" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />

      {/* Sticky sign-up bar for visitors */}
      <AnimatePresence>
        {showStickyBar && !user && !stickyDismissed && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 inset-x-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-xl shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <BrandMascot size={32} variant="wave" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your business, <span className="font-bold">deployed</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {CTA_COPY.card}
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground sm:hidden">
                🚀 Paste URL · Get a live app
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-48">
                  <GoogleSignInButton label="Get started" />
                </div>
                <button
                  onClick={() => setStickyDismissed(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
