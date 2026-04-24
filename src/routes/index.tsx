import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieCard } from "@/components/MovieCard";
import { RatingBar } from "@/components/RatingBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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

type MovieRow = {
  id: string;
  tmdb_id: number | null;
  title: string;
  year: number | null;
  poster_url: string | null;
  overview: string | null;
  runtime: number | null;
  imdb_rating: number | null;
  rt_score: number | null;
  tmdb_rating: number | null;
  is_current: boolean;
  added_at: string;
};

const MOVIE_COLUMNS =
  "id, tmdb_id, title, year, poster_url, overview, runtime, imdb_rating, rt_score, tmdb_rating, is_current, added_at";

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

function formatRating(value: number | null, kind: "imdb" | "rt" | "tmdb") {
  if (value === null || value === undefined) return null;
  if (kind === "rt") return `${Math.round(value)}%`;
  if (kind === "tmdb") return `${Math.round(value * 10)}%`;
  return value.toFixed(1);
}

function HomePage() {
  const { session } = useAuth();
  const isLoggedIn = !!session;

  const [current, setCurrent] = useState<MovieRow | null>(null);
  const [recent, setRecent] = useState<MovieRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [currentRes, recentRes] = await Promise.all([
        supabase
          .from("movies")
          .select(MOVIE_COLUMNS)
          .eq("is_current", true)
          .maybeSingle(),
        supabase
          .from("movies")
          .select(MOVIE_COLUMNS)
          .eq("is_current", false)
          .order("order_index", { ascending: false })
          .limit(9),
      ]);

      if (cancelled) return;

      if (currentRes.error) {
        console.error("[home] current movie:", currentRes.error.message);
      }
      if (recentRes.error) {
        console.error("[home] recent movies:", recentRes.error.message);
      }

      setCurrent((currentRes.data as MovieRow | null) ?? null);
      setRecent((recentRes.data as MovieRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[320px_1fr] md:py-24">
          {current ? (
            <>
              {/* Poster with glow */}
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-6 rounded-3xl blur-3xl opacity-70"
                  style={{ background: "var(--gradient-brand)" }}
                />
                <div className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-poster)]">
                  {current.poster_url && !heroImgFailed ? (
                    <img
                      src={current.poster_url}
                      alt={`${current.title} poster`}
                      width={600}
                      height={900}
                      onError={() => setHeroImgFailed(true)}
                      className="aspect-[2/3] h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex aspect-[2/3] h-full w-full items-center justify-center p-6 text-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 60%, #16162a 100%)",
                      }}
                    >
                      <span className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
                        {current.title}
                      </span>
                    </div>
                  )}
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
                  {current.year && <span>{current.year}</span>}
                  {current.runtime && (
                    <>
                      <span aria-hidden>•</span>
                      <span>{current.runtime} min</span>
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {formatRating(current.imdb_rating, "imdb") && (
                    <RatingPill
                      label="IMDB"
                      value={formatRating(current.imdb_rating, "imdb")!}
                      color="#F5C518"
                    />
                  )}
                  {formatRating(current.rt_score, "rt") && (
                    <RatingPill
                      label="RT"
                      value={formatRating(current.rt_score, "rt")!}
                      color="#FA320A"
                    />
                  )}
                  {formatRating(current.tmdb_rating, "tmdb") && (
                    <RatingPill
                      label="TMDB"
                      value={formatRating(current.tmdb_rating, "tmdb")!}
                      color="#01D277"
                    />
                  )}
                </div>

                {current.overview && (
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/85">
                    {current.overview}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/movies/$movieId"
                    params={{ movieId: current.id }}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
                  >
                    ▶ View details
                  </Link>
                </div>

                {isLoggedIn && <RatingBar />}
              </div>
            </>
          ) : (
            <div className="md:col-span-2 flex min-h-[280px] flex-col items-center justify-center text-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
                Now Watching
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                {loading ? "Loading…" : "No current movie set"}
              </h1>
              {!loading && (
                <p className="mt-3 max-w-md text-sm font-medium text-muted-foreground">
                  An admin hasn't picked this round's movie yet. Check back soon
                  🍿
                </p>
              )}
            </div>
          )}
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

        {recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {recent.map((m) => (
              <MovieCard
                key={m.id}
                movie={{
                  id: m.id,
                  title: m.title,
                  year: m.year ?? 0,
                  director: "",
                  posterUrl: m.poster_url ?? "",
                  synopsis: m.overview ?? "",
                  runtime: m.runtime ?? 0,
                  watchedAt: m.added_at,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            {loading ? "Loading…" : "No movies in the archive yet."}
          </p>
        )}
      </section>

      <footer className="border-t border-border py-10 text-center text-xs font-medium text-muted-foreground">
        SB Movie Club · Private members only · Est. 2025
      </footer>
    </div>
  );
}
