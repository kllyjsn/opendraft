import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import {
  Building2, Shield, Lock, Users, BarChart3, Globe,
  ArrowRight, Check, ChevronDown, Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

const COMPLIANCE_FRAMEWORKS = [
  { name: "SOC 2 Type II", desc: "Full audit trail, access controls, encryption at rest" },
  { name: "HIPAA", desc: "PHI safeguards, BAA-ready, data residency controls" },
  { name: "GDPR", desc: "Data minimization, right to erasure, consent management" },
  { name: "PCI DSS", desc: "Cardholder data isolation, secure transmission" },
  { name: "FedRAMP", desc: "Federal security standards, NIST 800-53 controls" },
];

const FEATURES = [
  {
    icon: Building2,
    title: "Private App Catalog",
    desc: "A branded internal marketplace where any employee can browse, claim, and deploy pre-approved apps built for your company.",
  },
  {
    icon: Shield,
    title: "Compliance Built In",
    desc: "Every app is security-audited against SOC2, HIPAA, GDPR, and PCI frameworks before entering your catalog.",
  },
  {
    icon: Lock,
    title: "Own Your Stack",
    desc: "Full source code ownership. No vendor lock-in, no per-seat taxes, no recurring SaaS rent. Yours forever.",
  },
  {
    icon: Users,
    title: "SSO & Role Management",
    desc: "SAML/SSO integration with Okta, Azure AD, and Google Workspace. Role-based access for admins, builders, and employees.",
  },
  {
    icon: BarChart3,
    title: "ROI Dashboard",
    desc: "Track SaaS spend eliminated, apps deployed, and time saved across every department.",
  },
  {
    icon: Globe,
    title: "Deploy Anywhere",
    desc: "One-click deploy to AWS, Azure, GCP, or on-premise. Your data stays where you need it.",
  },
];

const TIERS = [
  {
    name: "Team",
    price: "$999",
    seats: "50 seats",
    apps: "25 apps",
    features: ["SSO integration", "Compliance dashboard", "Email support", "Department categories"],
  },
  {
    name: "Business",
    price: "$2,499",
    seats: "250 seats",
    apps: "Unlimited apps",
    popular: true,
    features: ["Everything in Team", "SAML/SSO", "Priority support", "Custom branding", "Approval workflows"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    seats: "Unlimited",
    apps: "Unlimited apps",
    features: ["Everything in Business", "On-prem deployment", "Dedicated CSM", "Custom SLA", "API access", "Volume pricing"],
  },
];

function SaaSCalculator() {
  const [tools, setTools] = useState(10);
  const [seats, setSeats] = useState(50);
  const [avgCost, setAvgCost] = useState(25);

  const monthlySaaS = tools * seats * avgCost;
  const yearlySaaS = monthlySaaS * 12;
  const openDraftYearly = 2499 * 12; // Business plan
  const savings = yearlySaaS - openDraftYearly;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-8 md:p-10">
      <h3 className="text-xl font-bold mb-6">SaaS Replacement Calculator</h3>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">SaaS tools used</label>
          <Input
            type="number"
            value={tools}
            onChange={(e) => setTools(Number(e.target.value) || 0)}
            min={1}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Team size (seats)</label>
          <Input
            type="number"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value) || 0)}
            min={1}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Avg cost/seat/month</label>
          <Input
            type="number"
            value={avgCost}
            onChange={(e) => setAvgCost(Number(e.target.value) || 0)}
            min={1}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
          <p className="text-sm text-muted-foreground mb-1">Current SaaS spend/year</p>
          <p className="text-2xl font-black text-destructive">${yearlySaaS.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted border border-border/40">
          <p className="text-sm text-muted-foreground mb-1">OpenDraft Business/year</p>
          <p className="text-2xl font-black">${openDraftYearly.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-sm text-muted-foreground mb-1">Your annual savings</p>
          <p className="text-2xl font-black text-accent-foreground">
            {savings > 0 ? `$${savings.toLocaleString()}` : "$0"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await api.from("enterprise_inquiries").insert({
      name: form.get("name") as string,
      email: form.get("email") as string,
      company: form.get("company") as string,
      team_size: form.get("team_size") as string,
      budget: form.get("budget") as string,
      message: form.get("message") as string,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Request received!", description: "We'll be in touch within 24 hours." });
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
          <Check className="h-8 w-8 text-accent-foreground" />
        </div>
        <h3 className="text-2xl font-bold mb-2">We'll be in touch</h3>
        <p className="text-muted-foreground">Expect a response within 24 hours with a personalized demo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
      <Input name="name" placeholder="Full name" required />
      <Input name="email" type="email" placeholder="Work email" required />
      <Input name="company" placeholder="Company name" />
      <select
        name="team_size"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue=""
      >
        <option value="" disabled>Team size</option>
        <option value="10-50">10–50</option>
        <option value="50-200">50–200</option>
        <option value="200-1000">200–1,000</option>
        <option value="1000+">1,000+</option>
      </select>
      <select
        name="budget"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue=""
      >
        <option value="" disabled>Annual budget</option>
        <option value="<$25k">Under $25k</option>
        <option value="$25k-100k">$25k–$100k</option>
        <option value="$100k-500k">$100k–$500k</option>
        <option value="$500k+">$500k+</option>
      </select>
      <Textarea
        name="message"
        placeholder="Tell us about your SaaS stack and what you'd like to replace..."
        className="md:col-span-2"
        rows={3}
      />
      <div className="md:col-span-2">
        <Button type="submit" size="lg" className="w-full h-12 font-semibold" disabled={loading}>
          {loading ? "Submitting…" : "Request a demo"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}

export default function Enterprise() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Enterprise Private App Marketplace | OpenDraft"
        description="Build a private marketplace of compliant, custom-built apps your teams own forever. The Okta of owned software — no per-seat taxes, no vendor lock-in."
        path="/enterprise"
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "OpenDraft Enterprise",
          description: "Private app marketplace for enterprises. Own your software stack.",
          brand: { "@type": "Brand", name: "OpenDraft" },
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Enterprise Private App Marketplace
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Your company's own
              <br />
              <span className="text-secondary">app store</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Every tool custom-built, security-audited, and owned forever.
              Stop paying per-seat SaaS taxes across dozens of vendors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Button size="lg" className="h-12 px-8 font-semibold" asChild>
                  <Link to="/org/new">
                    Create your workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-8 font-semibold" asChild>
                  <a href="#contact">
                    Request a demo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
              <Button size="lg" variant="outline" className="h-12 px-8 font-semibold" asChild>
                <a href="#calculator">See your savings</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-border/40 py-8 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          {[
            { value: "$0", label: "Per-seat cost after build" },
            { value: "100%", label: "Source code ownership" },
            { value: "A+", label: "Security audit grade" },
            { value: "24h", label: "Enterprise SLA" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Everything your IT team needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete platform for building, managing, and deploying compliant internal tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border/40 bg-card p-6 hover:shadow-[var(--shadow-card-hover)] transition-shadow"
              >
                <feat.icon className="h-8 w-8 text-secondary mb-4" />
                <h3 className="font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4 bg-muted/30 border-y border-border/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Compliance-first architecture
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every app in your private catalog is audited against industry standards before it reaches your team.
            </p>
          </div>
          <div className="space-y-3">
            {COMPLIANCE_FRAMEWORKS.map((fw) => (
              <div
                key={fw.name}
                className="flex items-start gap-4 rounded-xl border border-border/40 bg-card p-5"
              >
                <div className="shrink-0 mt-0.5">
                  <Shield className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">{fw.name}</h4>
                  <p className="text-sm text-muted-foreground">{fw.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="calculator" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Calculate your SaaS savings
            </h2>
            <p className="text-muted-foreground">
              See how much your company could save by owning instead of renting.
            </p>
          </div>
          <SaaSCalculator />
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Simple, predictable pricing
            </h2>
            <p className="text-muted-foreground">No per-seat fees. No surprise charges.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border bg-card p-8 flex flex-col ${
                  tier.popular
                    ? "border-secondary ring-2 ring-secondary/20 relative"
                    : "border-border/40"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-black mb-1">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground mb-6">{tier.seats} · {tier.apps}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.popular ? "default" : "outline"}
                  className="w-full font-semibold"
                  asChild
                >
                  <a href="#contact">
                    {tier.name === "Enterprise" ? "Contact sales" : "Get started"}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Ready to own your software?
            </h2>
            <p className="text-muted-foreground">
              Tell us about your team and we'll set up a personalized demo within 24 hours.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
