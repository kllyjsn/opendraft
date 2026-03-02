import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BrandMascot } from "@/components/BrandMascot";

export function CtaBanner() {
  const { user } = useAuth();

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 glass-strong p-10 md:p-16 text-center">
        {/* Ambient orbs */}
        <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full bg-accent/15 blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex justify-center mb-4">
            <BrandMascot size={80} variant="happy" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Every app. One subscription.
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            For $20/mo, claim and download any project on OpenDraft. Full source code, deploy anywhere. Need custom work? Hire the builder directly.
          </p>
          <Link to="/credits">
            <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 text-base px-8">
              Subscribe — $20/mo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
