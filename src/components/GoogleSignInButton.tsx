import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GoogleSignInButtonProps {
  label?: string;
  redirectTo?: string;
  className?: string;
}

export function GoogleSignInButton({ label = "Continue with Google", redirectTo, className }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo ?? window.location.origin,
      });
      if (result.error) {
        toast({ title: "Sign in failed", description: String(result.error), variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Sign in failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className={`w-full flex items-center gap-3 bg-card text-foreground border border-border/50 hover:bg-muted shadow-sm font-medium ${className}`}
      variant="outline"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      )}
      {label}
    </Button>
  );
}
