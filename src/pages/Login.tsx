import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { EmailAuthForm } from "@/components/EmailAuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";

import { useState } from "react";

const TRUST_POINTS = [
  { icon: "✨", text: "Your first app is completely free" },
  { icon: "⚡", text: "Get your app instantly — no waiting" },
  { icon: "🚀", text: "Expert-built apps, ready to launch" },
  { icon: "🔒", text: "Full source code — yours forever" },
];

export default function Login() {
  const { user, loading } = useAuth();
  const [showEmail, setShowEmail] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20 relative">
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 page-enter">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-5">
              <svg width="36" height="36" viewBox="0 0 28 28" fill="none" className="shrink-0">
                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="1" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="20" x2="14" y2="27" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-xl font-bold tracking-tight text-foreground">OpenDraft</span>
            </div>
            <h1 className="text-2xl font-black mb-2">Claim your free app</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sign up and claim one app completely free.<br />No coding experience needed.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-5">
            <GoogleSignInButton label="Continue with Google" />

            {/* Divider with email toggle */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full divider-gradient" />
              </div>
              <div className="relative flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="bg-card px-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-semibold"
                >
                  {showEmail ? "hide email" : "or use email"}
                </button>
              </div>
            </div>

            {/* Email auth form */}
            {showEmail && <EmailAuthForm defaultMode="signup" />}

            {/* Trust points */}
            {!showEmail && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full divider-gradient" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">why OpenDraft</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {TRUST_POINTS.map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="text-base">{icon}</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors duration-200">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors duration-200">Privacy Policy</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
