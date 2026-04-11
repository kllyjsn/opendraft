import { useEffect, useState } from "react";
import { api, clearToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  email_verified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("opendraft_token");
      if (!token) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      api.get<{ user: AuthUser }>("/auth/me")
        .then(({ user: u }) => {
          setUser(u);
          setSession({ token });
          localStorage.setItem("opendraft_onboarding_done", "1");
        })
        .catch(() => {
          clearToken();
          setUser(null);
          setSession(null);
        })
        .finally(() => setLoading(false));
    };

    checkAuth();

    // Re-check auth when token changes (sign-in, sign-up, sign-out)
    const handleAuthChange = () => checkAuth();
    window.addEventListener("opendraft_auth_change", handleAuthChange);
    return () => window.removeEventListener("opendraft_auth_change", handleAuthChange);
  }, []);

  const signOut = async () => {
    clearToken();
    setUser(null);
    setSession(null);
  };

  return { user, session, loading, signOut, setUser, setSession };
}
