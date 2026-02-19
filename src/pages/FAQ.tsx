import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, ShoppingCart, CreditCard, Shield, Package, DollarSign } from "lucide-react";

const sections = [
  {
    icon: ShoppingCart,
    title: "Buying Projects",
    faqs: [
      {
        q: "How do I buy a project?",
        a: "Browse the marketplace, click on any listing to view details, then click 'Buy Now'. You'll be redirected to a secure Stripe checkout page. After payment, you'll receive instant access to the project — no waiting, no approval process.",
      },
      {
        q: "What do I receive after purchasing?",
        a: "You get lifetime access to the project files, including all source code, assets, and documentation included by the seller. Delivery is instant — as soon as your payment is confirmed, the project is yours.",
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are processed by Stripe, one of the world's most trusted payment processors. OpenDraft never stores your card details.",
      },
      {
        q: "Can I get a refund?",
        a: "Because projects are digital goods delivered instantly, all sales are final. We encourage you to read the full listing description, check the demo link, and review the tech stack before purchasing. If you believe there was a fraudulent listing, contact us.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Any major credit or debit card (Visa, Mastercard, American Express) is accepted via Stripe. Additional methods like Apple Pay and Google Pay may be available depending on your browser and location.",
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
        q: "How do I set my price?",
        a: "You set the price when creating your listing. Most projects on OpenDraft range from $9 to $299 depending on complexity and completeness. You can choose a 'Prototype', 'MVP', or 'Production Ready' badge to set buyer expectations.",
      },
      {
        q: "Do I need to connect a payment account?",
        a: "Yes. To receive payouts, you must connect a Stripe account from your Dashboard. This is a one-time setup and allows Stripe to send earnings directly to your bank account.",
      },
    ],
  },
  {
    icon: DollarSign,
    title: "Fees & Payouts",
    faqs: [
      {
        q: "How much does it cost to sell on OpenDraft?",
        a: "Listing your project is completely free. OpenDraft charges a 20% platform fee on each sale, which is automatically deducted at checkout. The remaining 80% goes directly to you.",
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
      {
        q: "What currency does OpenDraft use?",
        a: "All prices are listed and charged in USD. Stripe handles currency conversion for international buyers automatically.",
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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
