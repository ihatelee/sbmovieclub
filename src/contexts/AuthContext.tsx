import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Avoid stale fetches if the session changes mid-flight.
  const fetchTokenRef = useRef(0);

  const fetchProfile = useCallback(async (userId: string | undefined) => {
    const token = ++fetchTokenRef.current;

    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, email, is_approved, is_admin, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    // Drop the result if a newer fetch started.
    if (token !== fetchTokenRef.current) return;

    if (error) {
      console.error("[auth] Failed to load profile:", error.message);
      setProfile(null);
      return;
    }

    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Subscribe FIRST to avoid missing the initial event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      // Defer profile fetch to avoid potential deadlock with the auth client.
      setTimeout(() => {
        void fetchProfile(nextSession?.user?.id);
      }, 0);
    });

    // 2. Then prime with the existing session.
    void supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      setSession(existing);
      void fetchProfile(existing?.user?.id).finally(() => {
        if (mounted) setLoading(false);
      });
      if (!existing) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (email, password, firstName) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName },
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return { error: error ?? null };
    },
    []
  );

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [session, profile, loading, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
