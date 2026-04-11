import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sends recovery tokens in the URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid or expired reset link.");
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await api.post("/auth/update-user", { password }).catch((e: any) => ({ error: e.message }));
      if (error) throw error;
      setDone(true);
      toast.success("Password updated!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-5">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black mb-2">Set new password</h1>
            <p className="text-muted-foreground text-sm">Enter your new password below.</p>
          </div>

          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm font-semibold">Password updated. Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <Input
                type="password"
                placeholder="New password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-sm"
                minLength={6}
                required
              />
              <Button type="submit" disabled={loading} className="w-full h-10 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
