import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { CheckCircle, DollarSign, Camera, MessageSquare, TrendingUp, Target, Lightbulb, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    icon: Target,
    title: "Pick the Right Niche",
    content: [
      "Focus on problems you've personally faced — authenticity sells.",
      "AI apps, SaaS dashboards, and developer tools are the highest-demand categories.",
      "Check the homepage for trending categories and unmet bounties before building.",
      "A narrow niche with 100 eager buyers beats a broad idea with 10,000 lurkers.",
    ],
  },
  {
    icon: Camera,
    title: "Screenshots That Convert",
    content: [
      "Lead with a hero screenshot showing the core feature in action.",
      "Use 3–5 screenshots minimum — listings with more visuals convert 2x better.",
      "Show real data, not empty states. Mock data > placeholder content.",
      "Include a dark mode screenshot if your app supports it.",
      "Capture at desktop resolution (1280×800+) for crisp previews.",
    ],
  },
  {
    icon: DollarSign,
    title: "Pricing That Works",
    content: [
      "The sweet spot for templates and starter kits is $19–$49 one-time.",
      "Production-ready SaaS apps can command $99–$299+.",
      "Offer a $0 'lite' version to build trust, then upsell the full version.",
      "Price based on the value delivered, not time spent building.",
      "Consider the buyer's alternative: if they'd spend 20 hours building it, $49 is a steal.",
    ],
  },
  {
    icon: MessageSquare,
    title: "Support = Sales",
    content: [
      "Respond to buyer messages within 24 hours — speed builds trust.",
      "Great support earns reviews, and reviews drive 3x more conversions.",
      "Include a README in your ZIP with setup instructions and common troubleshooting.",
      "Offer optional monthly support tiers for buyers who want hands-on help.",
    ],
  },
  {
    icon: TrendingUp,
    title: "Promote & Grow",
    content: [
      "Share your listing on X/Twitter with a demo video or GIF — visual content gets 5x engagement.",
      "Post in builder communities: Indie Hackers, Reddit r/SideProject, Dev.to.",
      "Submit to Product Hunt as a 'maker tool' to tap into the early adopter audience.",
      "Cross-promote with other creators — bundle complementary projects.",
      "Use the OpenDraft referral link on your GitHub README.",
    ],
  },
  {
    icon: Lightbulb,
    title: "Listing Optimization Checklist",
    content: [
      "Title: Clear, specific, keyword-rich (e.g., 'AI Email Writer SaaS — React + OpenAI').",
      "Description: Lead with the problem, then the solution, then what's included.",
      "Tech stack tags: Add every relevant technology for search discoverability.",
      "Demo URL: Always include one. Buyers want to click before they buy.",
      "Completeness badge: Be honest — MVP listings with clear roadmaps outsell overpromising 'production ready' ones.",
      "'Built with' tag: Buyers filter by tool. Tag Lovable, Cursor, Bolt, etc.",
    ],
  },
];

export default function CreatorHandbook() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CanonicalTag path="/guides/creators" />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "OpenDraft Creator Handbook — Sell Your AI-Built Projects",
        description: "The complete guide to listing, pricing, and growing your sales on OpenDraft.",
        step: SECTIONS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.content.join(" "),
        })),
      }} />

      {/* Hero */}
      <section className="border-b border-border bg-card/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">
            📖 Creator Handbook
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            The Playbook for Selling on OpenDraft
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Everything we've learned from our top sellers — condensed into actionable advice you can apply in 10 minutes.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <div className="space-y-14">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow flex-shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black">{section.title}</h2>
                </div>
                <ul className="space-y-3 pl-[52px]">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Founder Program callout */}
        <div className="mt-16 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h3 className="text-xl font-black mb-2">🚀 Join the Founder First Program</h3>
          <p className="text-muted-foreground mb-5 max-w-md mx-auto">
            Get 0% platform fees for up to 6 months, marketing spotlights, and concierge onboarding.
          </p>
          <Link to="/founders">
            <Button className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 font-bold">
              Learn More <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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
