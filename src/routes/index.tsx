import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieCard } from "@/components/MovieCard";
import { RatingBar } from "@/components/RatingBar";
import { getCurrentMovie, getRecentMovies } from "@/lib/mock-movies";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SB Movie Club — Now Watching" },
      {
        name: "description",
        content: "The current pick and our recent screenings.",
      },
    ],
  }),
  component: HomePage,
});

// Mock signed-in flag — replace with real auth state when Lovable Cloud is connected
const IS_LOGGED_IN = true;

function RatingPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <span style={{ color }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function HomePage() {
  const current = getCurrentMovie();
  const recent = getRecentMovies();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[320px_1fr] md:py-24">
          {/* Poster with glow */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-3xl blur-3xl opacity-70"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-poster)]">
              <img
                src={current.posterUrl}
                alt={`${current.title} poster`}
                width={600}
                height={900}
                className="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground">
              <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-white" />
              Now Watching
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              {current.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-muted-foreground">
              <span>{current.year}</span>
              <span aria-hidden>•</span>
              <span>{current.director}</span>
              <span aria-hidden>•</span>
              <span>{current.runtime} min</span>
              {current.pickedBy && (
                <>
                  <span aria-hidden>•</span>
                  <span>Picked by {current.pickedBy}</span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <RatingPill label="IMDB" value="8.4" color="#F5C518" />
              <RatingPill label="RT" value="92%" color="#FA320A" />
              <RatingPill label="TMDB" value="84%" color="#01D277" />
            </div>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/85">
              {current.synopsis}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/movies/$movieId"
                params={{ movieId: current.id }}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
              >
                ▶ View details
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-card"
              >
                + Watchlist
              </Link>
            </div>

            {IS_LOGGED_IN && <RatingBar />}
          </div>
        </div>
      </section>

      {/* Archive */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              The Archive
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Recently Watched
            </h2>
          </div>
          <p className="hidden text-sm font-medium text-muted-foreground md:block">
            Last 9 picks
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {recent.map((m, i) => (
            <MovieCard
              key={m.id}
              movie={m}
              userRating={IS_LOGGED_IN && i % 3 === 0 ? 4 : undefined}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-xs font-medium text-muted-foreground">
        SB Movie Club · Private members only · Est. 2025
      </footer>
    </div>
  );
}
