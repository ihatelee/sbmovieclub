import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Star, Users, Calendar } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getMovieById } from "@/lib/mock-movies";

export const Route = createFileRoute("/movies/$movieId")({
  loader: ({ params }) => {
    const movie = getMovieById(params.movieId);
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.movie.title} — Reel Society` },
          {
            name: "description",
            content: `${loaderData.movie.title} (${loaderData.movie.year}) — directed by ${loaderData.movie.director}.`,
          },
          {
            property: "og:title",
            content: `${loaderData.movie.title} — Reel Society`,
          },
          {
            property: "og:image",
            content: loaderData.movie.backdropUrl ?? loaderData.movie.posterUrl,
          },
        ]
      : [],
  }),
  component: MovieDetail,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-3xl">Movie not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to screenings
        </Link>
      </div>
    </div>
  ),
});

function MovieDetail() {
  const { movie } = Route.useLoaderData();
  const watchDate = new Date(movie.watchedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative">
        {movie.backdropUrl && (
          <div className="absolute inset-x-0 top-0 h-[480px] overflow-hidden">
            <img
              src={movie.backdropUrl}
              alt=""
              width={1600}
              height={900}
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-6 pt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All screenings
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-[260px_1fr]">
            <div className="overflow-hidden rounded-xl shadow-[var(--shadow-poster)] ring-1 ring-border/60">
              <img
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                width={600}
                height={900}
                className="aspect-[2/3] h-full w-full object-cover"
              />
            </div>

            <div>
              <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">
                {movie.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Directed by {movie.director} · {movie.year}
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {movie.runtime} min
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Screened {watchDate}
                </span>
                {movie.pickedBy && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Picked by {movie.pickedBy}
                  </span>
                )}
                {movie.rating !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {movie.rating.toFixed(1)} / 10
                  </span>
                )}
              </div>

              <p className="mt-8 text-base leading-relaxed text-foreground/90">
                {movie.synopsis}
              </p>

              {/* Discussion placeholder */}
              <div className="mt-12 rounded-xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl">Club discussion</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Member ratings and notes will appear here once Lovable Cloud is
                  connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
