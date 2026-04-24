import { Link } from "@tanstack/react-router";
import { Film } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-gold-foreground shadow-[var(--shadow-glow)]">
            <Film className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-tight">Reel Society</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Movie Club
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
          >
            Screenings
          </Link>
          <Link
            to="/admin"
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
          >
            Admin
          </Link>
          <Link
            to="/auth"
            className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-[var(--shadow-glow)]"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
