import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { PickedBy } from "@/components/PickedBy";
import { QuickRate } from "@/components/QuickRate";
import { SortDropdown, sortMovies, sortMoviesByManualChronology, type SortKey } from "@/lib/movie-sort";
import { MobileMovieRow } from "@/components/MobileMovieRow";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { title: "All movies — SB Movie Club" },
      { name: "description", content: "Every film the club has watched, with ratings." },
    ],
  }),
  component: AllMoviesPage,
});

type MovieRow = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  runtime: number | null;
  imdb_rating: number | null;
  rt_score: number | null;
  is_current: boolean;
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

function AllMoviesPage() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("chronology");

  const refresh = async () => {
    setLoading(true);
    const [mRes, wRes, pRes] = await Promise.all([
      supabase
        .from("movies")
        .select("id, title, year, poster_url, runtime, imdb_rating, rt_score, is_current, picked_by_id, picked_by")
        .order("order_index", { ascending: false, nullsFirst: false }),
      supabase.from("watches").select("user_id, movie_id, rating"),
      supabase
        .from("profiles")
        .select("id, first_name, avatar_url, is_approved")
        .eq("is_approved", true),
    ]);
    if (mRes.error) console.error("[all-movies] movies:", mRes.error.message);
    if (wRes.error) console.error("[all-movies] watches:", wRes.error.message);
    if (pRes.error) console.error("[all-movies] profiles:", pRes.error.message);
    setMovies(sortMoviesByManualChronology((mRes.data as MovieRow[] | null) ?? []));
    setWatches((wRes.data as WatchRow[] | null) ?? []);
    setProfiles((pRes.data as ProfileLite[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const avatarByName = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of profiles) {
      if (p.first_name) m.set(p.first_name.toLowerCase(), p.avatar_url);
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

  const sortedMovies = useMemo(
    () => sortMovies(movies, watchersByMovie, sort),
    [movies, watchersByMovie, sort]
  );

  const stats = useMemo(() => {
    const totalMovies = movies.length;
    const watchedCount = new Map<string, number>();
    const ratedCount = new Map<string, number>();
    for (const w of watches) {
      watchedCount.set(w.user_id, (watchedCount.get(w.user_id) ?? 0) + 1);
      if (typeof w.rating === "number" && w.rating > 0) {
        ratedCount.set(w.user_id, (ratedCount.get(w.user_id) ?? 0) + 1);
      }
    }
    type Leader = { profile: ProfileLite; count: number } | null;
    let topWatched: Leader = null;
    let topRated: Leader = null;
    let topSkipped: Leader = null;
    for (const p of profiles) {
      const wc = watchedCount.get(p.id) ?? 0;
      const rc = ratedCount.get(p.id) ?? 0;
      const sc = totalMovies - wc;
      if (!topWatched || wc > topWatched.count) topWatched = { profile: p, count: wc };
      if (!topRated || rc > topRated.count) topRated = { profile: p, count: rc };
      if (!topSkipped || sc > topSkipped.count) topSkipped = { profile: p, count: sc };
    }
    const totalMinutes = movies.reduce((a, m) => a + (m.runtime ?? 0), 0);
    return { topWatched, topRated, topSkipped, totalMinutes };
  }, [movies, watches, profiles]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-14">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            The Archive
          </span>
          <h1 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">
            All movies
          </h1>
          <p className="mt-3 text-base font-semibold text-muted-foreground">
            {loading ? "Loading…" : `${movies.length} films`}
          </p>

          {!loading && movies.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatLeader
                label="Most watched"
                profile={stats.topWatched?.profile ?? null}
                value={stats.topWatched?.count ?? 0}
                unit="films"
              />
              <StatLeader
                label="Most ratings"
                profile={stats.topRated?.profile ?? null}
                value={stats.topRated?.count ?? 0}
                unit="rated"
              />
              <StatLeader
                label="Most skipped"
                profile={stats.topSkipped?.profile ?? null}
                value={stats.topSkipped?.count ?? 0}
                unit="skipped"
              />
              <StatTotal
                label="Total runtime"
                minutes={stats.totalMinutes}
              />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-center justify-end">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
        {/* Mobile list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card md:hidden">
          {loading ? (
            <div className="px-4 py-12 text-center text-muted-foreground">Loading…</div>
          ) : sortedMovies.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">No movies yet.</div>
          ) : (
            sortedMovies.map((m) => {
              const ws = watchersByMovie.get(m.id) ?? [];
              const mine = myWatchByMovie.get(m.id);
              return (
                <MobileMovieRow
                  key={m.id}
                  movie={m}
                  watchers={ws}
                  myRating={mine?.rating ?? null}
                  iWatched={!!mine}
                  profileById={profileById}
                  avatarByName={avatarByName}
                  userId={user?.id}
                  onChange={(next) => handleQuickChange(m.id, next)}
                />
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-auto" />
                <col className="w-20" />
                <col className="w-32" />
                <col className="w-44" />
                <col className="w-24" />
                <col className="w-44" />
                <col className="w-36" />
              </colgroup>
              <thead className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3 whitespace-nowrap">Picked by</th>
                  <th className="px-6 py-3">Ratings</th>
                  <th className="px-6 py-3">Avg</th>
                  <th className="px-6 py-3 whitespace-nowrap">Watched by</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Your rating</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : sortedMovies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No movies yet.
                    </td>
                  </tr>
                ) : (
                  sortedMovies.map((m) => {
                    const ws = watchersByMovie.get(m.id) ?? [];
                    const rated = ws
                      .map((w) => w.rating)
                      .filter((r): r is number => typeof r === "number" && r > 0);
                    const avg =
                      rated.length > 0
                        ? rated.reduce((a, b) => a + b, 0) / rated.length
                        : null;
                    const mine = myWatchByMovie.get(m.id);
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-secondary/40"
                      >
                        <td className="px-6 py-3">
                          <Link
                            to="/movies/$movieId"
                            params={{ movieId: m.id }}
                            className="flex items-center gap-3 font-bold hover:text-primary"
                          >
                            {m.poster_url ? (
                              <img
                                src={m.poster_url}
                                alt=""
                                className="h-12 w-8 flex-none rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-8 flex-none rounded bg-muted" />
                            )}
                            <span className="line-clamp-1">{m.title}</span>
                            {m.is_current && (
                              <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                                Current
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{m.year ?? "—"}</td>
                        <td className="px-6 py-3">
                          {(() => {
                            const picker = m.picked_by_id
                              ? profileById.get(m.picked_by_id) ?? null
                              : null;
                            if (picker) {
                              return (
                                <PickedBy
                                  picker={picker}
                                  linkUserId={m.picked_by_id}
                                  size="sm"
                                  bare
                                />
                              );
                            }
                            if (m.picked_by) {
                              return (
                                <PickedBy
                                  picker={{
                                    first_name: m.picked_by,
                                    avatar_url: avatarByName.get(m.picked_by.toLowerCase()) ?? null,
                                  }}
                                  size="sm"
                                  bare
                                />
                              );
                            }
                            return (
                              <span className="text-xs font-medium text-muted-foreground">—</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                            {m.imdb_rating != null && (
                              <span
                                className="rounded px-2 py-0.5"
                                style={{ background: "rgba(245,197,24,0.18)", color: "#F5C518" }}
                              >
                                IMDb {m.imdb_rating.toFixed(1)}
                              </span>
                            )}
                            {m.rt_score != null && (
                              <span
                                className="rounded px-2 py-0.5"
                                style={{ background: "rgba(250,50,10,0.18)", color: "#FA320A" }}
                              >
                                RT {Math.round(m.rt_score)}%
                              </span>
                            )}
                            {m.imdb_rating == null && m.rt_score == null && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-bold">
                          {avg != null ? (
                            <span>
                              🍿 {avg.toFixed(1)}
                              <span className="ml-1 text-xs font-medium text-muted-foreground">
                                ({rated.length})
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {ws.length === 0 ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              No one yet
                            </span>
                          ) : (
                            <div className="flex -space-x-2">
                              {ws.slice(0, 6).map((w) => {
                                const p = profileById.get(w.user_id);
                                return (
                                  <UserAvatar
                                    key={w.user_id}
                                    name={p?.first_name}
                                    url={p?.avatar_url ?? null}
                                    size={28}
                                    className="ring-2 ring-card"
                                  />
                                );
                              })}
                              {ws.length > 6 && (
                                <span className="ml-2 inline-flex h-7 items-center rounded-full bg-secondary px-2 text-[11px] font-bold text-muted-foreground">
                                  +{ws.length - 6}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {user ? (
                            <QuickRate
                              userId={user.id}
                              movieId={m.id}
                              rating={mine?.rating ?? null}
                              watched={!!mine}
                              size="sm"
                              onChange={(next) => handleQuickChange(m.id, next)}
                            />
                          ) : (
                            <Link to="/auth" className="text-xs font-bold text-primary hover:underline">
                              Sign in to rate
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatLeader({
  label,
  profile,
  value,
  unit,
}: {
  label: string;
  profile: ProfileLite | null;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <UserAvatar
          name={profile?.first_name}
          url={profile?.avatar_url ?? null}
          size={40}
          className="ring-2 ring-border"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-black tracking-tight">
            {profile?.first_name ?? "—"}
          </div>
          <div className="text-xs font-semibold text-primary">
            {value} {unit}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTotal({ label, minutes }: { label: string; minutes: number }) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/15 text-lg">
          🎬
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black tracking-tight">
            {minutes.toLocaleString()} min
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {hours.toLocaleString()}h {mins}m
          </div>
        </div>
      </div>
    </div>
  );
}
