import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { motion } from "framer-motion";
import { Zap, DollarSign, Megaphone, Users, Rocket, Gift, CheckCircle, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "0% platform fees for 6 months",
    description: "Keep 100% of every sale. No commission, no hidden charges. After 6 months, the standard 20% fee applies.",
  },
  {
    icon: Megaphone,
    title: "Marketing spotlight",
    description: "Your listing gets featured on our homepage carousel and promoted across our social channels to thousands of builders.",
  },
  {
    icon: Users,
    title: "Concierge onboarding",
    description: "A dedicated team member helps you optimize your listing, set the right price, and craft screenshots that convert.",
  },
  {
    icon: Rocket,
    title: "Priority review",
    description: "Skip the queue. Founder Program listings are reviewed and approved within 24 hours — not days.",
  },
  {
    icon: Gift,
    title: "Creator Handbook access",
    description: "Get our battle-tested playbook for pricing, positioning, and promoting your AI-built projects.",
  },
  {
    icon: Zap,
    title: "Direct integration support",
    description: "Need help with Stripe Connect, deployment, or listing optimization? We'll pair with you directly.",
  },
];

const TIERS = [
  {
    name: "Starter",
    requirement: "1 listing",
    perks: ["0% fees for 3 months", "Creator Handbook", "Priority review"],
  },
  {
    name: "Builder",
    requirement: "3+ listings",
    perks: ["0% fees for 6 months", "Homepage spotlight", "Concierge onboarding", "Creator Handbook"],
    highlighted: true,
  },
  {
    name: "Studio",
    requirement: "5+ listings",
    perks: ["0% fees for 6 months", "Permanent featured badge", "Co-marketing campaigns", "Direct integration support", "Creator Handbook"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Founders() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/founders" />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Founder First Program — OpenDraft",
        description: "Join the OpenDraft Founder Program: 0% platform fees, marketing spotlights, and concierge onboarding for early-adopter creators.",
      }} />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 grain-overlay">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Limited spots available
            </motion.span>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.95]">
              Founder First
              <br />
              <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, hsl(265 85% 58%), hsl(330 90% 60%), hsl(185 90% 45%))' }}>
                Program
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              We're backing the first 100 creators with <strong className="text-foreground">0% platform fees</strong>, marketing spotlights, and hands-on support. Ship your project, keep every dollar.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/sell">
                <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 px-8 text-base font-bold">
                  Apply & List Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/guides/creators">
                <Button variant="outline" className="h-12 px-6 text-base border-border/40">
                  Read the Creator Handbook
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <h2 className="text-3xl font-black text-center mb-12 tracking-tight">What you get</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-base mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <h2 className="text-3xl font-black text-center mb-4 tracking-tight">Incentive tiers</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">The more you list, the more you earn. Every tier unlocks additional benefits.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 transition-shadow ${
                tier.highlighted
                  ? "border-primary/40 bg-primary/5 shadow-glow"
                  : "border-border bg-card shadow-card"
              }`}
            >
              {tier.highlighted && (
                <span className="inline-block rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-3">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-black mb-1">{tier.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{tier.requirement}</p>
              <ul className="space-y-2">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <h2 className="text-3xl font-black mb-4 tracking-tight">Ready to be a founding creator?</h2>
        <p className="text-muted-foreground mb-8">List your first project today — no fees, no risk, instant payouts.</p>
        <Link to="/sell">
          <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-14 px-10 text-lg font-bold">
            List Your Project Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
