import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps every route except /auth.
 * - No session → redirect to /auth
 * - Session but profile.is_approved === false → full-page "Pending approval"
 * - Otherwise → render children
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthRoute = location.pathname.startsWith("/auth");

  useEffect(() => {
    if (loading) return;
    if (!session && !isAuthRoute) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, isAuthRoute, navigate]);

  // /auth is always public — bypass the guard entirely.
  if (isAuthRoute) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm font-bold text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!session) {
    // Redirect is firing in the effect above; render nothing in the meantime.
    return null;
  }

  // Signed in but pending approval — block everything.
  if (profile && profile.is_approved === false) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}

function PendingApproval() {
  const { signOut } = useAuth();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
          style={{ background: "var(--gradient-brand)" }}
          aria-hidden
        >
          🎬
        </div>
        <span className="text-2xl font-black tracking-tight">
          SB <span className="text-primary">Movie</span> Club
        </span>
      </div>

      <div className="mt-10 text-6xl">🍿</div>
      <h1 className="mt-6 max-w-md text-3xl font-black tracking-tight">
        Your account is pending approval.
      </h1>
      <p className="mt-3 max-w-md text-sm font-medium text-muted-foreground">
        Check back soon!
      </p>

      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-8 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-bold transition-colors hover:bg-card"
      >
        Sign out
      </button>
    </div>
  );
}
