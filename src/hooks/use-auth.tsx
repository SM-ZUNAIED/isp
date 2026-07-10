import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let validated = false;
    // Subscribe first, then validate. Ignore INITIAL_SESSION until we confirm
    // the token with the Auth server — otherwise a stale/expired refresh
    // token in localStorage flips session→truthy and downstream server fns
    // 401 before we can sign out.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "INITIAL_SESSION" && !validated) return;
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getUser().then(async ({ data, error }) => {
      validated = true;
      if (error || !data?.user) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
      } else {
        const { data: s } = await supabase.auth.getSession();
        setSession(s.session);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
