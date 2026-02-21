import { useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, ShoppingCart, CreditCard, Shield, Package, DollarSign, RefreshCw } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { CanonicalTag } from "@/components/CanonicalTag";

const sections = [
  {
    icon: ShoppingCart,
    title: "Buying Projects",
    faqs: [
      {
        q: "What am I actually buying?",
        a: "You're not just buying code — you're buying peace of mind. When you subscribe to a project, you get a developer on retainer: ongoing support, bug fixes, feature requests, and monthly updates. It's like having your own micro-SaaS team for a fraction of the cost.",
      },
      {
        q: "How is this different from buying code on other marketplaces?",
        a: "On most marketplaces, the transaction ends at download. Here, subscribing means the builder keeps your app alive and improving. You get direct access to message them, request features, and report issues. The code works — and keeps working.",
      },
      {
        q: "How do I buy a project?",
        a: "Browse the marketplace, click on any listing to view details, then click 'Buy Now'. You'll be redirected to a secure Stripe checkout page. After payment, you'll receive instant access to the project — no waiting, no approval process.",
      },
      {
        q: "What's the difference between a subscription and a one-time purchase?",
        a: "A subscription ($20/mo typical) gives you ongoing support, updates, and a direct line to the builder — essentially a developer on retainer. A one-time purchase gives you the code to fork and maintain yourself. Choose the subscription if you want peace of mind; choose one-time if you want full control.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel anytime. You'll keep access until the end of your billing period. No lock-in, no penalties.",
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are processed by Stripe, one of the world's most trusted payment processors. OpenDraft never stores your card details.",
      },
    ],
  },
  {
    icon: Package,
    title: "Selling Projects",
    faqs: [
      {
        q: "How do I list a project for sale?",
        a: "Sign in, go to 'Sell' in the navigation, fill in your project details (title, description, tech stack, screenshots, price), and submit for review. Once approved, your listing goes live on the marketplace.",
      },
      {
        q: "What kinds of projects can I sell?",
        a: "Any vibe-coded or AI-generated project: SaaS tools, landing pages, utilities, games, AI apps, templates, and more. The project must be your own work and must be functional as described.",
      },
      {
        q: "How should I think about pricing?",
        a: "Think of subscriptions as selling a service, not a file. At $20/month, you're offering ongoing support, maintenance, and feature development. Most buyers aren't paying for code — they're paying for peace of mind and a developer they can rely on.",
      },
      {
        q: "Do I need to connect a payment account?",
        a: "Yes. To receive payouts, you must connect a Stripe account from your Dashboard. This is a one-time setup and allows Stripe to send earnings directly to your bank account.",
      },
    ],
  },
  {
    icon: RefreshCw,
    title: "Subscriptions & Support",
    faqs: [
      {
        q: "What does 'developer on retainer' actually mean?",
        a: "When a buyer subscribes to your project, they expect ongoing value: bug fixes, feature requests, and regular updates. You're not just selling code — you're offering a relationship. Think of it as a micro-SaaS where you're the team.",
      },
      {
        q: "What's expected of me as a seller with subscribers?",
        a: "Respond to messages, fix bugs, ship improvements, and keep the app running. Subscribers are paying for peace of mind — that their app works and someone is there if it doesn't.",
      },
      {
        q: "How do buyers request features or report issues?",
        a: "Every listing has built-in messaging. Subscribers can message the builder directly to request features, report bugs, or ask questions. It's a direct line — no ticketing system, no bureaucracy.",
      },
    ],
  },
  {
    icon: DollarSign,
    title: "Fees & Payouts",
    faqs: [
      {
        q: "How much does it cost to sell on OpenDraft?",
        a: "Listing your project is completely free. OpenDraft charges a 20% platform fee on each sale or subscription payment, which is automatically deducted. The remaining 80% goes directly to you.",
      },
      {
        q: "How does the fee split work?",
        a: "When a buyer pays, Stripe automatically splits the payment: 80% goes to the seller's connected account and 20% goes to OpenDraft. This happens in real time — no invoices, no manual transfers.",
      },
      {
        q: "When do I get paid?",
        a: "Payouts happen instantly at the moment of sale. Once Stripe processes the payment, your 80% share is sent directly to your connected account. Stripe's standard payout schedule then transfers funds to your bank (typically 2–7 business days depending on your country).",
      },
      {
        q: "Are there any hidden fees?",
        a: "No. The only fee is the 20% platform fee deducted from each sale. There are no listing fees, monthly fees, or withdrawal fees from OpenDraft. Standard Stripe processing fees may apply.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    faqs: [
      {
        q: "How does OpenDraft verify listings?",
        a: "All new listings go through a manual review process before going live. Our team checks that descriptions are accurate, screenshots match the project, and the listing meets our quality standards.",
      },
      {
        q: "What if a listing is misrepresented?",
        a: "If you believe a listing is inaccurate or fraudulent, contact us immediately. We take misrepresentation seriously and will investigate and remove listings that violate our policies.",
      },
      {
        q: "What are the completeness badges?",
        a: "Badges help buyers understand the state of a project: 'Prototype' means early-stage/proof of concept, 'MVP' means functional core features, and 'Production Ready' means deployable with full features. Sellers are required to badge their listings honestly.",
      },
    ],
  },
];

export default function FAQ() {
  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      }))
    ),
  }), []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/faq" />
      <JsonLd data={faqSchema} />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-card/50 py-16">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-glow mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-3">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about buying and selling on OpenDraft.
            </p>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="container mx-auto px-4 py-14 max-w-3xl">
          <div className="space-y-12">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-black">{section.title}</h2>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {section.faqs.map((faq, i) => (
                      <AccordionItem
                        key={i}
                        value={`${section.title}-${i}`}
                        className="rounded-xl border border-border bg-card px-5 shadow-card"
                      >
                        <AccordionTrigger className="text-left font-semibold text-sm hover:no-underline py-4">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <CreditCard className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="text-lg font-black mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground">
              We're here to help. Reach out to us and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:hello@opendraft.com"
              className="inline-block mt-4 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              hello@opendraft.com
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
