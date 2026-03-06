import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { ShieldCheck, ShieldAlert, Lock, Eye, Code2, FileCheck, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const CHECKS = [
  {
    icon: Lock,
    title: "Zero Hardcoded Secrets",
    description: "Every template is scanned for API keys, tokens, and credentials. Stripe keys, GitHub PATs, Google API keys — our regex-powered scanner catches them all. Environment variables are enforced.",
    severity: "critical",
  },
  {
    icon: ShieldAlert,
    title: "XSS Prevention",
    description: "No dangerouslySetInnerHTML, no innerHTML assignments, no inline event handlers. All content flows through React's built-in escaping. Zero tolerance.",
    severity: "critical",
  },
  {
    icon: Code2,
    title: "No Code Injection",
    description: "eval() and new Function() are banned. Dynamic code execution is the #1 injection vector — we eliminate it at the source.",
    severity: "critical",
  },
  {
    icon: FileCheck,
    title: "Input Validation with Zod",
    description: "Every form validates inputs with Zod schemas at runtime. Type-safe validation catches malformed data before it reaches your backend.",
    severity: "high",
  },
  {
    icon: Zap,
    title: "HTTPS Enforcement",
    description: "All external URLs must use HTTPS. No mixed content, no insecure transport. CSP meta tags are baked into every index.html.",
    severity: "high",
  },
  {
    icon: Eye,
    title: "Secure Storage Patterns",
    description: "Sensitive data never touches localStorage. Tokens, passwords, and API keys are handled through secure session management — not browser storage.",
    severity: "high",
  },
  {
    icon: CheckCircle2,
    title: "TypeScript Strict Mode",
    description: "Every template compiles with strict: true. Stronger type safety means fewer runtime vulnerabilities and null reference exploits.",
    severity: "medium",
  },
  {
    icon: FileCheck,
    title: "Security Documentation",
    description: "Every template ships with SECURITY.md and a machine-readable security-manifest.json documenting exactly what controls are in place.",
    severity: "medium",
  },
];

const GRADES = [
  { grade: "A", range: "90–100", label: "Security Hardened", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { grade: "B", range: "75–89", label: "Security Verified", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { grade: "C", range: "60–74", label: "Basic Security", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { grade: "D", range: "40–59", label: "Needs Improvement", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { grade: "F", range: "0–39", label: "Needs Review", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/security" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Security Standards — OpenDraft",
          description: "OpenDraft's security hardening standard for AI-generated templates. 10+ automated checks, zero tolerance for vulnerabilities.",
          url: "https://opendraft.co/security",
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-400 mb-6">
              <ShieldCheck className="h-4 w-4" />
              Security Hardened Standard
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              The most secure templates{" "}
              <span className="text-gradient">on the internet.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Every OpenDraft template is automatically scanned against 10+ security checks before it reaches the marketplace.
              Zero hardcoded secrets. Zero XSS vectors. Zero injection risks. Verified.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-black mb-3">How Our Security Scanner Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            When a template is approved, our automated scanner downloads the ZIP, parses every source file,
            and runs a comprehensive security audit. The result is a score from 0–100.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {[
            { step: "1", title: "Template Uploaded", desc: "Builder uploads source code as a ZIP or GitHub repo" },
            { step: "2", title: "Automated Scan", desc: "10+ security checks run against every file in the project" },
            { step: "3", title: "Score Assigned", desc: "Templates receive a grade (A–F) displayed on the marketplace" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-xl border border-border/50 bg-card text-center"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Checks */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-black mb-3">What We Scan For</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every check is non-negotiable. Templates that fail critical checks are flagged and cannot earn the "Security Hardened" badge.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {CHECKS.map((check, i) => (
            <motion.div
              key={check.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border border-border/50 bg-card hover:border-emerald-500/20 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  check.severity === "critical" ? "bg-red-500/10 text-red-400" :
                  check.severity === "high" ? "bg-amber-500/10 text-amber-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  <check.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{check.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      check.severity === "critical" ? "bg-red-500/10 text-red-400" :
                      check.severity === "high" ? "bg-amber-500/10 text-amber-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {check.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{check.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Grading Scale */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-black mb-3">Security Grading Scale</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every scanned template receives a score from 0–100 and a corresponding letter grade displayed on the marketplace.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-3xl mx-auto">
          {GRADES.map((g, i) => (
            <motion.div
              key={g.grade}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex-1 p-4 rounded-xl border text-center ${g.bg}`}
            >
              <div className={`text-3xl font-black ${g.color}`}>{g.grade}</div>
              <div className="text-xs font-bold mt-1">{g.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{g.range}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI-Generated Standard */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto p-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
        >
          <div className="flex items-start gap-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-black mb-2">Built Into Our AI Pipeline</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                OpenDraft's AI template generator doesn't just build apps — it builds <strong className="text-foreground">secure</strong> apps.
                Every AI-generated template includes Zod validation, CSP headers, SECURITY.md documentation,
                and a machine-readable security-manifest.json. Security isn't an afterthought — it's baked in from the first line of code.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Zod Validation", "CSP Headers", "SECURITY.md", "Strict TypeScript", ".env.example", "HTTPS Only"].map(tag => (
                  <span key={tag} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Reporting */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-black mb-2">Found a Vulnerability?</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          If you discover a security issue in any OpenDraft template, please report it responsibly.
        </p>
        <a
          href="mailto:security@opendraft.co"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          security@opendraft.co
        </a>
      </section>

      <Footer />
    </div>
  );
}
