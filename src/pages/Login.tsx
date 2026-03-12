import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Zap } from "lucide-react";

const TRUST_POINTS = [
  { icon: "✨", text: "Your first app is completely free" },
  { icon: "⚡", text: "Get your app instantly — no waiting" },
  { icon: "🚀", text: "1,000+ apps ready to launch" },
  { icon: "🔒", text: "Full source code — yours forever" },
];

export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    const onboarded = localStorage.getItem("opendraft_onboarding_done");
    return <Navigate to={onboarded ? "/" : "/onboarding"} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20 relative">
        {/* Ambient orbs */}
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 page-enter">
          {/* Logo + headline */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-glow mb-5">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black mb-2">Get your app today</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Join 500+ entrepreneurs who launched<br />their business with a ready-made app.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-5">
            <GoogleSignInButton label="Continue with Google" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full divider-gradient" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">why OpenDraft</span>
              </div>
            </div>

            {/* Trust points */}
            <ul className="space-y-3">
              {TRUST_POINTS.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="text-base">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors duration-200">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors duration-200">Privacy Policy</Link>.
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            New here? Your account is created automatically on first sign in.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}