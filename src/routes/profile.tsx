import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SB Movie Club" },
      { name: "description", content: "Your watched films and ratings." },
    ],
  }),
  component: ProfilePage,
});

type MovieRow = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
};

type WatchRow = {
  id: string;
  movie_id: string;
  rating: number | null;
  watched_at: string;
  movie: MovieRow | null;
};

function PopcornRow({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) {
    return (
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        No rating
      </span>
    );
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="text-base leading-none"
          style={{ opacity: n <= rating ? 1 : 0.25 }}
          aria-hidden
        >
          🍿
        </span>
      ))}
    </div>
  );
}

function MoviePoster({ movie }: { movie: MovieRow }) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-secondary shadow-[var(--shadow-poster)] transition-transform duration-300 group-hover:-translate-y-1">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            loading="lazy"
            width={600}
            height={900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
            No poster
          </div>
        )}
      </div>
    </Link>
  );
}

function ProfilePage() {
  const { user, profile } = useAuth();
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [allMovies, setAllMovies] = useState<MovieRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [watchesRes, moviesRes] = await Promise.all([
        supabase
          .from("watches")
          .select(
            "id, movie_id, rating, watched_at, movie:movies(id, title, year, poster_url)"
          )
          .eq("user_id", user.id)
          .order("watched_at", { ascending: false }),
        supabase
          .from("movies")
          .select("id, title, year, poster_url"),
      ]);

      if (cancelled) return;
      if (watchesRes.error) console.error("[profile] watches:", watchesRes.error.message);
      if (moviesRes.error) console.error("[profile] movies:", moviesRes.error.message);

      setWatches((watchesRes.data as unknown as WatchRow[] | null) ?? []);
      setAllMovies((moviesRes.data as MovieRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totalWatched = watches.length;
  const ratings = watches.map((w) => w.rating).filter((r): r is number => typeof r === "number");
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "—";

  const watchedIds = useMemo(() => new Set(watches.map((w) => w.movie_id)), [watches]);
  const unwatched = useMemo(
    () => allMovies.filter((m) => !watchedIds.has(m.id)),
    [allMovies, watchedIds]
  );

  const firstName = profile?.first_name ?? "there";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            Your profile
          </span>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">
            Hey, {firstName}! <span aria-hidden>🍿</span>
          </h1>
          <p className="mt-3 text-base font-semibold text-muted-foreground">
            {loading ? "Loading…" : `${totalWatched} ${totalWatched === 1 ? "film" : "films"} watched`}
          </p>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total watched" value={String(totalWatched)} />
            <StatCard label="Avg popcorn rating" value={avgRating} suffix={ratings.length > 0 ? "/ 5" : undefined} />
            <StatCard label="Still to watch" value={String(unwatched.length)} />
          </div>
        </div>
      </section>

      {/* Your ratings */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            The Reel
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Your ratings
          </h2>
        </div>

        {loading ? (
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        ) : watches.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">
            You haven't logged any watches yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {watches.map((w) =>
              w.movie ? (
                <div key={w.id} className="flex flex-col">
                  <MoviePoster movie={w.movie} />
                  <div className="mt-3 px-1">
                    <h3 className="text-base font-black leading-tight tracking-tight">
                      {w.movie.title}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {w.movie.year ?? "—"}
                    </p>
                    <div className="mt-2">
                      <PopcornRow rating={w.rating} />
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>

      {/* Still to watch */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            The Queue
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Still to watch
          </h2>
        </div>

        {loading ? (
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        ) : unwatched.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">
            You've seen everything in the archive. Bravo 🎉
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {unwatched.map((m) => (
              <div key={m.id} className="flex flex-col">
                <MoviePoster movie={m} />
                <div className="mt-3 px-1">
                  <h3 className="text-base font-black leading-tight tracking-tight">
                    {m.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {m.year ?? "—"}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Unwatched
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tight">{value}</span>
        {suffix && (
          <span className="text-sm font-bold text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}
