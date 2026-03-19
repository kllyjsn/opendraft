import { ArrowRight, Building2, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ENTERPRISE_FEATURES = [
  { icon: Building2, label: "White-label & resell rights" },
  { icon: Shield, label: "SLA-backed response times" },
  { icon: Headphones, label: "Dedicated account manager" },
];

export function PricingEnterpriseCTA() {
  return (
    <div className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Subtle glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            For agencies & enterprises
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
            Fleet licensing for teams at scale
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg">
            Unlimited apps, white-label rights, bulk deploy, and dedicated support.
            Volume pricing starts at $99/month.
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            {ENTERPRISE_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-foreground/70">
                <Icon className="h-4 w-4 text-secondary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <Link to="/credits#enterprise">
            <Button size="lg" variant="outline" className="h-12 px-8 font-semibold group">
              View enterprise plans
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
