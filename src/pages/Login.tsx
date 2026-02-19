import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Zap, ShieldCheck, Zap as ZapIcon } from "lucide-react";

const TRUST_POINTS = [
  { icon: "⚡", text: "Instant project delivery" },
  { icon: "🔒", text: "Secure Stripe payments" },
  { icon: "🚀", text: "Ship in minutes, not months" },
];

export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          {/* Logo + headline */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-glow mb-5">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black mb-2">Welcome to OpenDraft</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sign in to buy, sell, and discover<br />ready-to-ship projects.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-5">
            <GoogleSignInButton label="Continue with Google" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">why OpenDraft</span>
              </div>
            </div>

            {/* Trust points */}
            <ul className="space-y-2.5">
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
            <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</a>.
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
