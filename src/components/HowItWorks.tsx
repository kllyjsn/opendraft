import { Link } from "react-router-dom";
import { MousePointerClick, MessageSquare, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    number: "01",
    title: "Find & Subscribe",
    description: "Browse AI-built projects and subscribe to one that fits your needs. Instant access, no waiting.",
  },
  {
    icon: MessageSquare,
    number: "02",
    title: "Message Your Builder",
    description: "Get a direct line to the developer. Request features, report bugs, ask questions — they're on retainer for you.",
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "Get Monthly Updates",
    description: "Your builder ships improvements, bug fixes, and new features every month. Peace of mind, not just code.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">How it works</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            A developer on retainer —<br className="hidden md:block" /> not just a file download
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border/60 bg-card p-7 shadow-card hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">{step.number}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/faq"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Learn more about how subscriptions work →
          </Link>
        </div>
      </div>
    </section>
  );
}
