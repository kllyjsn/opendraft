import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { DollarSign, Camera, FileText, CreditCard, TrendingUp, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "1. Build Something Useful",
    content: "Start with a real problem. The best-selling projects on OpenDraft solve specific needs: a SaaS dashboard, an AI chatbot, a landing page template. Use Lovable, Cursor, Bolt, or any AI coding tool to bring your idea to life. It doesn't need to be perfect — it needs to work.",
  },
  {
    icon: Camera,
    title: "2. Polish Your Listing",
    content: "Screenshots sell. Take clean, high-quality screenshots of your app in action. Write a clear description that explains what the project does, who it's for, and what tech it uses. Add a demo URL so buyers can try before they buy. Choose the right completeness badge: Prototype, MVP, or Production Ready.",
  },
  {
    icon: DollarSign,
    title: "3. Set Your Price",
    content: "You can offer one-time purchases or monthly subscriptions. Subscriptions ($15–$30/mo is the sweet spot) work best because buyers get ongoing support and you get recurring revenue. Think of it as offering a 'developer on retainer' — you maintain the app, fix bugs, and ship updates.",
  },
  {
    icon: CreditCard,
    title: "4. Connect Stripe & Go Live",
    content: "Connect your Stripe account from the Seller Dashboard (one-time setup). Once connected, submit your listing for review. After approval, it goes live on the marketplace. OpenDraft takes a 20% platform fee — you keep 80%, paid instantly at the moment of sale.",
  },
  {
    icon: TrendingUp,
    title: "5. Grow Your Subscriber Base",
    content: "Promote your listing on Twitter/X, Product Hunt, and in relevant communities. Respond quickly to buyer messages — great support = great reviews = more sales. Ship monthly updates to keep subscribers happy. The builders who treat it like a micro-SaaS earn the most.",
  },
];

const tips = [
  "Price subscriptions between $15–$30/month — it's the sweet spot for value and conversion.",
  "Add at least 3 screenshots. Listings with more visuals convert 2x better.",
  "Include a live demo URL. Buyers want to click around before committing.",
  "Respond to messages within 24 hours. Fast support builds trust and earns reviews.",
  "Ship at least one update per month. Subscribers are paying for ongoing value.",
  "Tag your listing with the right 'Built with' tool — buyers search by tool.",
];

export default function GuideSell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/guides/sell" />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Sell Your Vibe-Coded Project on OpenDraft",
        description: "A step-by-step guide to listing, pricing, and selling your AI-built app on OpenDraft.",
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.content,
        })),
      }} />

      {/* Hero */}
      <section className="border-b border-border bg-card/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Seller Guide</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            How to Sell Your Project on OpenDraft
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Turn your vibe-coded side project into recurring revenue. Here's how to list, price, and grow your subscriber base.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <div className="space-y-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex gap-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow mt-1">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black mb-2">{step.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{step.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-16 rounded-2xl border border-border bg-card p-8 shadow-card">
          <h2 className="text-xl font-black mb-5">💡 Pro Tips for Maximum Sales</h2>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <h3 className="text-2xl font-black mb-3">Ready to start selling?</h3>
          <p className="text-muted-foreground mb-6">List your first project in under 5 minutes.</p>
          <Link to="/sell">
            <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 px-8 text-base font-bold">
              List Your Project
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
