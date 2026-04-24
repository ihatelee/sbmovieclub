import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, Star, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieCard } from "@/components/MovieCard";
import { getCurrentMovie, getRecentMovies } from "@/lib/mock-movies";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reel Society — Now Screening" },
      {
        name: "description",
        content: "The current pick and our recent screenings.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const current = getCurrentMovie();
  const recent = getRecentMovies();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — current movie */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {current.backdropUrl && (
            <img
              src={current.backdropUrl}
              alt=""
              width={1600}
              height={900}
              className="h-full w-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[280px_1fr] md:py-28">
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl shadow-[var(--shadow-poster)] ring-1 ring-border/60">
              <img
                src={current.posterUrl}
                alt={`${current.title} poster`}
                width={600}
                height={900}
                className="aspect-[2/3] h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
              Now Screening · Pick of the week
            </span>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-7xl">
              {current.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {current.director} · {current.year}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {current.runtime} min
              </span>
              {current.rating !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {current.rating.toFixed(1)} club avg
                </span>
              )}
              {current.pickedBy && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Picked by {current.pickedBy}
                </span>
              )}
            </div>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/90">
              {current.synopsis}
            </p>

            <div className="mt-8 flex gap-3">
              <Link
                to="/movies/$movieId"
                params={{ movieId: current.id }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-[var(--shadow-glow)]"
              >
                View details
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background/40 px-6 py-2.5 text-sm font-medium backdrop-blur transition-colors hover:bg-secondary"
              >
                Join the club
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent screenings */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
              <Calendar className="mr-1.5 inline h-3 w-3" />
              The archive
            </span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Recent screenings</h2>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            Last 9 films we watched together
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {recent.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        Reel Society · A private club · Est. 2025
      </footer>
    </div>
  );
}
