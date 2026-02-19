import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-glow mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1">Welcome to VibeMarket</h1>
            <p className="text-muted-foreground text-sm">Sign in to buy, sell, and discover vibe-coded projects</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <GoogleSignInButton label="Continue with Google" />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to VibeMarket? Your account is created automatically on first sign in.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
