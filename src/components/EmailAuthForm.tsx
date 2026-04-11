import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";

interface EmailAuthFormProps {
  defaultMode?: "signin" | "signup";
}

export function EmailAuthForm({ defaultMode = "signup" }: EmailAuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await api.post<{ error?: string }>("/auth/reset-password", {
          email: email.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        }).catch((e: any) => ({ error: e.message }));
        if (error) throw error;
        toast.success("Check your email for a password reset link.");
        setMode("signin");
      } else if (mode === "signup") {
        const { error } = await api.post<{ error?: string }>("/auth/register", {
          email: email.trim(),
          password,
        }).catch((e: any) => ({ error: e.message }));
        if (error) throw error;
        toast.success("Account created! You're all set.");
      } else {
        const { token, error } = await api.post<{ token: string; error?: string }>("/auth/login", {
          email: email.trim(),
          password,
        }).catch((e: any) => ({ token: "", error: e.message }));
      if (token) setToken(token);
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-10 text-sm bg-background border-border/50"
        required
      />
      {mode !== "forgot" && (
        <Input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 text-sm bg-background border-border/50"
          minLength={8}
          required
        />
      )}
      <Button type="submit" disabled={loading} className="w-full h-10 font-semibold gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {mode === "forgot"
          ? "Send reset link"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </Button>

      <div className="flex justify-between text-[11px]">
        {mode === "forgot" ? (
          <button type="button" onClick={() => setMode("signin")} className="text-primary hover:underline">
            Back to sign in
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
            {mode === "signin" && (
              <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">
                Forgot password?
              </button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
