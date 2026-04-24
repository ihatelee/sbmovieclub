import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
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
};

type WatchedCardData = {
  movie: MovieRow;
  rating: number | null;
  watched_at: string;
};

function MiniCard({
  movie,
  rating,
  watched,
}: {
  movie: MovieRow;
  rating: number | null;
  watched: boolean;
}) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group block"
    >
      <div
        className="relative w-full overflow-hidden rounded-lg bg-secondary shadow-[var(--shadow-poster)] transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{ aspectRatio: "2 / 3", maxHeight: 180 }}
      >
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] font-bold leading-tight text-white">
            {movie.title}
          </div>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <h3
          className="truncate font-black leading-tight tracking-tight text-white"
          style={{ fontSize: 12 }}
          title={movie.title}
        >
          {movie.title}
        </h3>
        <p
          className="mt-0.5 font-medium text-muted-foreground"
          style={{ fontSize: 11 }}
        >
          {movie.year ?? "—"}
        </p>
        {watched && (
          <p
            className="mt-0.5 font-bold text-primary"
            style={{ fontSize: 11 }}
          >
            {rating != null ? `🍿 ${rating}/5` : "Watched"}
          </p>
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
          .select("id, movie_id, rating, watched_at")
          .eq("user_id", user.id)
          .order("watched_at", { ascending: false }),
        supabase
          .from("movies")
          .select("id, title, year, poster_url"),
      ]);

      if (cancelled) return;
      if (watchesRes.error) console.error("[profile] watches:", watchesRes.error.message);
      if (moviesRes.error) console.error("[profile] movies:", moviesRes.error.message);

      setWatches((watchesRes.data as WatchRow[] | null) ?? []);
      setAllMovies((moviesRes.data as MovieRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const movieById = useMemo(() => {
    const m = new Map<string, MovieRow>();
    for (const movie of allMovies) m.set(movie.id, movie);
    return m;
  }, [allMovies]);

  const watchedCards = useMemo<WatchedCardData[]>(() => {
    return watches
      .map((w) => {
        const movie = movieById.get(w.movie_id);
        return movie ? { movie, rating: w.rating, watched_at: w.watched_at } : null;
      })
      .filter((x): x is WatchedCardData => x !== null);
  }, [watches, movieById]);

  const watchedIds = useMemo(
    () => new Set(watches.map((w) => w.movie_id)),
    [watches]
  );
  const unwatched = useMemo(
    () => allMovies.filter((m) => !watchedIds.has(m.id)),
    [allMovies, watchedIds]
  );

  const totalWatched = watches.length;
  const ratings = watches
    .map((w) => w.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "—";

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
          <div className="mt-3 flex items-center gap-5">
            <UserAvatar
              name={firstName}
              url={profile?.avatar_url ?? null}
              size={88}
              className="ring-4 ring-primary/30"
            />
            <div>
              <h1 className="text-5xl font-black tracking-tight md:text-6xl">
                Hey, {firstName}! <span aria-hidden>🍿</span>
              </h1>
              <p className="mt-2 text-base font-semibold text-muted-foreground">
                {loading
                  ? "Loading…"
                  : `${totalWatched} ${totalWatched === 1 ? "film" : "films"} watched`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total watched" value={String(totalWatched)} />
            <StatCard
              label="Avg popcorn rating"
              value={avgRating}
              suffix={ratings.length > 0 ? "/ 5" : undefined}
            />
            <StatCard label="Still to watch" value={String(unwatched.length)} />
          </div>
        </div>
      </section>

      {/* Your ratings */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            The Reel
          </span>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Your ratings
          </h2>
        </div>

        {loading ? (
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        ) : watchedCards.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">
            You haven't logged any watches yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {watchedCards.map((c) => (
              <MiniCard
                key={c.movie.id}
                movie={c.movie}
                rating={c.rating}
                watched
              />
            ))}
          </div>
        )}
      </section>

      {/* Still to watch */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6">
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
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {unwatched.map((m) => (
              <MiniCard key={m.id} movie={m} rating={null} watched={false} />
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
          <span className="text-sm font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
