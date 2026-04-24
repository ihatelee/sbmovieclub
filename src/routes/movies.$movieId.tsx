import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RatingBar } from "@/components/RatingBar";
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
          { title: `${loaderData.movie.title} — SB Movie Club` },
          {
            name: "description",
            content: `${loaderData.movie.title} (${loaderData.movie.year}) — directed by ${loaderData.movie.director}.`,
          },
          {
            property: "og:title",
            content: `${loaderData.movie.title} — SB Movie Club`,
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
        <h1 className="text-3xl font-black">Movie not found</h1>
        <Link to="/" className="mt-4 inline-block font-bold text-primary hover:underline">
          ← Back home
        </Link>
      </div>
    </div>
  ),
});

const IS_LOGGED_IN = true;

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

      <div className="relative" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative mx-auto max-w-5xl px-6 pt-10 pb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-[280px_1fr]">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-5 rounded-3xl blur-3xl opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              />
              <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-poster)]">
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  width={600}
                  height={900}
                  className="aspect-[2/3] h-full w-full object-cover"
                />
              </div>
            </div>

            <div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                {movie.title}
              </h1>
              <p className="mt-3 text-base font-semibold text-muted-foreground">
                {movie.director} · {movie.year} · {movie.runtime} min
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-secondary px-3 py-1.5">
                  📅 {watchDate}
                </span>
                {movie.pickedBy && (
                  <span className="rounded-full bg-secondary px-3 py-1.5">
                    🎟 Picked by {movie.pickedBy}
                  </span>
                )}
                {movie.rating !== undefined && (
                  <span
                    className="rounded-full px-3 py-1.5 text-primary-foreground"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    Club avg {movie.rating.toFixed(1)}/10
                  </span>
                )}
              </div>

              <p className="mt-7 text-base leading-relaxed text-foreground/90">
                {movie.synopsis}
              </p>

              {IS_LOGGED_IN && <RatingBar />}

              <div className="mt-10 rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-black tracking-tight">Club discussion</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Member ratings and notes will appear here once Lovable Cloud is connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
