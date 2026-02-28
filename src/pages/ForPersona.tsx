import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BrandMascot } from "@/components/BrandMascot";
import { FeaturedListings } from "@/components/FeaturedListings";
import { HowItWorks } from "@/components/HowItWorks";
import { CtaBanner } from "@/components/CtaBanner";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { Code, Building2, Zap, Rocket, Shield, Users, ArrowRight } from "lucide-react";

interface PersonaConfig {
  title: string;
  headline: string;
  subheadline: string;
  metaDescription: string;
  icon: typeof Code;
  benefits: { icon: typeof Code; title: string; desc: string }[];
  cta: string;
  filterCategory?: string;
}

const personas: Record<string, PersonaConfig> = {
  developers: {
    title: "OpenDraft for Developers",
    headline: "Ship faster.\nBuy the boilerplate.",
    subheadline: "Stop rebuilding auth, dashboards, and CRUD from scratch. Get production-ready source code, own it forever, and launch in hours instead of weeks.",
    metaDescription: "Buy production-ready app templates and source code. Full ownership, one-time fee. SaaS starters, AI apps, dashboards & more for developers.",
    icon: Code,
    benefits: [
      { icon: Code, title: "Full source code", desc: "No lock-in. Fork it, modify it, ship it. You own every line." },
      { icon: Zap, title: "One-click deploy", desc: "Deploy to Vercel or Netlify directly from your purchase dashboard." },
      { icon: Shield, title: "Vetted quality", desc: "Every listing has a completeness badge — Prototype, MVP, or Production Ready." },
      { icon: Rocket, title: "Save weeks of work", desc: "Auth, payments, dashboards — already built. Focus on what makes your app unique." },
    ],
    cta: "Browse developer tools",
  },
  agencies: {
    title: "OpenDraft for Agencies",
    headline: "White-label apps.\nDeliver faster.",
    subheadline: "Your clients want apps yesterday. Buy production-ready templates, brand them, and deliver projects in days — not months. Keep your margins healthy.",
    metaDescription: "White-label app templates for agencies. Buy once, rebrand, and deliver to clients faster. SaaS tools, landing pages, AI apps & more.",
    icon: Building2,
    benefits: [
      { icon: Building2, title: "White-label ready", desc: "Full source code you can rebrand and resell to clients without restrictions." },
      { icon: Users, title: "Scale your team", desc: "Stop hiring for every project. Buy the foundation and customize from there." },
      { icon: Zap, title: "Faster delivery", desc: "Cut project timelines from months to weeks. Deliver more, earn more." },
      { icon: Shield, title: "Flat-fee pricing", desc: "One-time purchase per project. No recurring fees eating into your margins." },
    ],
    cta: "Browse templates",
  },
};

export default function ForPersona() {
  const { persona } = useParams<{ persona: string }>();
  const config = persona ? personas[persona] : undefined;

  if (!config) return <Navigate to="/" replace />;

  const Icon = config.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <CanonicalTag path={`/for/${persona}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: config.title,
          description: config.metaDescription,
          url: `https://opendraft.lovable.app/for/${persona}`,
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Icon className="h-4 w-4" />
              {config.title}
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95] whitespace-pre-line">
              {config.headline}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              {config.subheadline}
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link to="/#browse">
                <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 gap-2 text-base px-8">
                  {config.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-6">
              <BrandMascot size={80} variant="happy" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-12">
          Why {persona === "developers" ? "developers" : "agencies"} choose OpenDraft
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {config.benefits.map((b, i) => {
            const BIcon = b.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/40 bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <BIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <FeaturedListings />

      {/* How it works */}
      <HowItWorks />

      {/* CTA */}
      <CtaBanner />

      <Footer />
    </div>
  );
}
