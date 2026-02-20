import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Cloud,
  Database,
  Rocket,
  Shield,
  Server,
  GitBranch,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  {
    icon: Database,
    title: "MongoDB Provisioning",
    desc: "Fully managed MongoDB clusters — replica sets, backups, and monitoring included.",
  },
  {
    icon: Rocket,
    title: "Netlify & Vercel Deploys",
    desc: "One-click deployments to Netlify or Vercel. We handle build pipelines and environment variables.",
  },
  {
    icon: GitBranch,
    title: "Automated Migrations",
    desc: "Schema migrations run safely on every deploy. Rollback support built in.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "SOC-2 aligned practices, encrypted at rest, VPC peering available on request.",
  },
  {
    icon: Server,
    title: "Zero-to-Live Pipeline",
    desc: "Upload a zip, we handle the rest — from dependency install to production deployment.",
  },
  {
    icon: Cloud,
    title: "Managed Infrastructure",
    desc: "Monitoring, alerting, log aggregation, and 99.9% uptime SLA.",
  },
];

const INCLUDED = [
  "MongoDB Atlas cluster (M10+)",
  "CI/CD pipeline via Netlify or Vercel",
  "Automated database migrations",
  "SSL certificates & custom domains",
  "Daily encrypted backups",
  "24/7 monitoring & alerts",
  "Dedicated Slack support channel",
  "Infrastructure-as-code templates",
];

export default function CloudPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("cloud_waitlist").insert({
      email: email.trim(),
      company_name: company.trim() || null,
      message: message.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("You're on the list!");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-[0.04]" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
                <Cloud className="h-3.5 w-3.5" /> Managed Cloud
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                From{" "}
                <span className="text-gradient">zip to production</span>
                <br />
                in minutes
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                We deploy your app to Netlify or Vercel, provision a secure MongoDB database,
                and handle migrations — so you can focus on building, not ops.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a href="#waitlist">
                  <Button
                    size="lg"
                    className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 px-8 text-base font-bold"
                  >
                    Join the waitlist <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <span className="text-2xl font-black">
                  $500<span className="text-base font-medium text-muted-foreground">/mo</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-20 border-t border-border/40">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-12">
              Everything you need to ship & scale
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center mb-4 shadow-glow">
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-20 border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-black text-center mb-2">
                What's included
              </h2>
              <p className="text-center text-muted-foreground mb-10">
                One flat rate. No surprise bills. No per-seat pricing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <span className="text-5xl font-black">$500</span>
                <span className="text-xl text-muted-foreground">/mo</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Billed monthly · Cancel anytime · Volume discounts available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist form */}
        <section id="waitlist" className="py-20 border-t border-border/40">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl md:text-3xl font-black text-center mb-2">
                Get early access
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                We're onboarding teams now. Join the waitlist and we'll reach out.
              </p>

              {submitted ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">You're on the list!</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll be in touch shortly with next steps.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Company name (optional)"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Tell us about your project (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                    ) : (
                      "Join the waitlist"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
