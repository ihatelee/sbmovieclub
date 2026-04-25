import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { SortDropdown, sortMovies, type SortKey } from "@/lib/movie-sort";
import { MoviesTable } from "@/components/MoviesTable";
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
  imdb_rating: number | null;
  rt_score: number | null;
  is_current: boolean;
  picked_by_user_id: string | null;
  picked_by_id: string | null;
  picked_by: string | null;
};

type WatchRow = {
  user_id: string;
  movie_id: string;
  rating: number | null;
};

type ProfileLite = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

function ProfilePage() {
  const { user, profile } = useAuth();
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueSort, setQueueSort] = useState<SortKey>("chronology");
  const [reelSort, setReelSort] = useState<SortKey>("chronology");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [mRes, wRes, pRes] = await Promise.all([
        supabase
          .from("movies")
          .select("id, title, year, poster_url, imdb_rating, rt_score, is_current, picked_by_user_id, picked_by_id, picked_by")
          .order("order_index", { ascending: false }),
        supabase.from("watches").select("user_id, movie_id, rating"),
        supabase
          .from("profiles")
          .select("id, first_name, avatar_url, is_approved")
          .eq("is_approved", true),
      ]);

      if (cancelled) return;
      if (mRes.error) console.error("[profile] movies:", mRes.error.message);
      if (wRes.error) console.error("[profile] watches:", wRes.error.message);
      if (pRes.error) console.error("[profile] profiles:", pRes.error.message);

      setMovies((mRes.data as MovieRow[] | null) ?? []);
      setWatches((wRes.data as WatchRow[] | null) ?? []);
      setProfiles((pRes.data as ProfileLite[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const avatarByName = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of profiles) {
      if (p.first_name) m.set(p.first_name.trim().toLowerCase(), p.avatar_url);
    }
    return m;
  }, [profiles]);

  const watchersByMovie = useMemo(() => {
    const m = new Map<string, WatchRow[]>();
    for (const w of watches) {
      const arr = m.get(w.movie_id) ?? [];
      arr.push(w);
      m.set(w.movie_id, arr);
    }
    return m;
  }, [watches]);

  const myWatchByMovie = useMemo(() => {
    const m = new Map<string, WatchRow>();
    if (!user) return m;
    for (const w of watches) if (w.user_id === user.id) m.set(w.movie_id, w);
    return m;
  }, [watches, user]);

  const watchedMovies = useMemo(
    () => movies.filter((m) => myWatchByMovie.has(m.id)),
    [movies, myWatchByMovie]
  );
  const unwatchedMovies = useMemo(
    () => movies.filter((m) => !myWatchByMovie.has(m.id)),
    [movies, myWatchByMovie]
  );

  const totalWatched = watchedMovies.length;
  const myRatings = watchedMovies
    .map((m) => myWatchByMovie.get(m.id)?.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const avgRating =
    myRatings.length > 0
      ? (myRatings.reduce((a, b) => a + b, 0) / myRatings.length).toFixed(1)
      : "—";

  const firstName = profile?.first_name ?? "there";

  const handleQuickChange = (
    movieId: string,
    next: { rating: number | null; watched: boolean }
  ) => {
    if (!user) return;
    setWatches((prev) => {
      const without = prev.filter(
        (w) => !(w.user_id === user.id && w.movie_id === movieId)
      );
      if (!next.watched) return without;
      return [
        ...without,
        { user_id: user.id, movie_id: movieId, rating: next.rating },
      ];
    });
  };

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
              suffix={myRatings.length > 0 ? "/ 5" : undefined}
            />
            <StatCard label="Still to watch" value={String(unwatchedMovies.length)} />
          </div>
        </div>
      </section>

      {/* Still to watch */}
      {!loading && unwatchedMovies.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                The Queue
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Still to watch
              </h2>
            </div>
            <SortDropdown value={queueSort} onChange={setQueueSort} />
          </div>
          <MoviesTable
            movies={sortMovies(unwatchedMovies, watchersByMovie, queueSort)}
            watchersByMovie={watchersByMovie}
            myWatchByMovie={myWatchByMovie}
            profileById={profileById}
            avatarByName={avatarByName}
            userId={user?.id}
            onChange={handleQuickChange}
          />
        </section>
      )}

      {/* Your ratings */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              The Reel
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Your ratings
            </h2>
          </div>
          {watchedMovies.length > 0 && (
            <SortDropdown value={reelSort} onChange={setReelSort} />
          )}
        </div>

        {loading ? (
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        ) : watchedMovies.length === 0 ? (
          <p className="text-sm font-medium text-muted-foreground">
            You haven't logged any watches yet.
          </p>
        ) : (
          <MoviesTable
            movies={sortMovies(watchedMovies, watchersByMovie, reelSort)}
            watchersByMovie={watchersByMovie}
            myWatchByMovie={myWatchByMovie}
            profileById={profileById}
            userId={user?.id}
            onChange={handleQuickChange}
          />
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
