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
            Built something cool?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            List your project in minutes. Get discovered by thousands of buyers and start earning from your work — instantly.
          </p>
          <Link to={user ? "/sell" : "/login"}>
            <Button size="lg" className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 text-base px-8">
              {user ? "List your project" : "Get started — it's free"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
