import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BrandMascot } from "@/components/BrandMascot";

export function CtaBanner() {
  const { user } = useAuth();

  return (
    <section className="container mx-auto px-4 pb-16 md:pb-24">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/40 glass-strong p-6 sm:p-10 md:p-16 text-center">
        {/* Ambient orbs */}
        <div className="absolute -top-24 -right-24 md:-top-32 md:-right-32 h-[250px] md:h-[400px] w-[250px] md:w-[400px] rounded-full bg-primary/15 blur-[80px] md:blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 md:-bottom-32 md:-left-32 h-[200px] md:h-[350px] w-[200px] md:w-[350px] rounded-full bg-accent/15 blur-[70px] md:blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex justify-center mb-3 md:mb-4">
            <BrandMascot size={64} variant="happy" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3 md:mb-4">
            Every app. One subscription.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8 leading-relaxed">
            For $20/mo, claim and download any project on OpenDraft. Full source code, deploy anywhere. Need custom work? Hire the builder directly.
          </p>
          <Link to="/credits">
            <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 text-sm sm:text-base px-6 sm:px-8">
              Subscribe — $20/mo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
