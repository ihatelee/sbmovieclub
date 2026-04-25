import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SiteHeader() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!session;
  const isAdmin = !!profile?.is_admin;
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/auth" });
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-3" onClick={closeMenu}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-base shadow-[var(--shadow-glow-orange)]"
            style={{ background: "var(--gradient-brand)" }}
            aria-hidden
          >
            🍿
          </div>
          <span className="text-lg font-black tracking-tight">
            SB <span className="text-primary">MOVIE</span> CLUB
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
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
                  className="inline-flex items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80"
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 text-sm font-semibold">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              All movies
            </Link>
            {isLoggedIn && (
              <Link
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {firstName && <UserAvatar name={firstName} url={avatarUrl} size={24} />}
                <span>Profile</span>
              </Link>
            )}
            {isLoggedIn && isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                Admin
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="mt-1 rounded-xl bg-secondary px-4 py-3 text-left font-bold text-foreground transition-colors hover:bg-secondary/80"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={closeMenu}
                className="mt-1 rounded-xl bg-primary px-4 py-3 text-center font-bold text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
