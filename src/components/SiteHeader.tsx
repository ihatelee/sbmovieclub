import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

export function SiteHeader() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!session;
  const isAdmin = !!profile?.is_admin;
  const firstName = profile?.first_name;
  const avatarUrl = profile?.avatar_url ?? null;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-base shadow-[var(--shadow-glow-orange)]"
            style={{ background: "var(--gradient-brand)" }}
            aria-hidden
          >
            🎬
          </div>
          <span className="text-lg font-black tracking-tight">
            SB <span className="text-primary">Movie</span> Club
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
          >
            Home
          </Link>

          {isLoggedIn && isAdmin && (
            <Link
              to="/admin"
              className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              Admin
            </Link>
          )}

          {isLoggedIn ? (
            <div className="ml-2 flex items-center gap-3">
              {firstName && (
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80 sm:inline-flex"
                >
                  <UserAvatar name={firstName} url={avatarUrl} size={28} />
                  <span>{firstName}</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-full bg-secondary px-4 py-2 font-bold text-foreground transition-colors hover:bg-secondary/80"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="ml-2 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
