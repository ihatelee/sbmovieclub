import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/UserAvatar";
import { PickedBy } from "@/components/PickedBy";
import { QuickRate } from "@/components/QuickRate";
import { MobileMovieRow } from "@/components/MobileMovieRow";

export type MoviesTableMovie = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  imdb_rating: number | null;
  rt_score: number | null;
  is_current?: boolean;
  picked_by_user_id?: string | null;
  picked_by_id: string | null;
  picked_by: string | null;
};

export type WatchLite = {
  user_id: string;
  movie_id?: string;
  rating: number | null;
};

export type ProfileLite = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

export function MoviesTable({
  movies,
  watchersByMovie,
  myWatchByMovie,
  profileById,
  avatarByName,
  userId,
  onChange,
}: {
  movies: MoviesTableMovie[];
  watchersByMovie: Map<string, WatchLite[]>;
  myWatchByMovie: Map<string, WatchLite>;
  profileById: Map<string, ProfileLite>;
  avatarByName?: Map<string, string | null>;
  userId?: string;
  onChange: (
    movieId: string,
    next: { rating: number | null; watched: boolean }
  ) => void;
}) {
  return (
    <>
      {/* Mobile list */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card md:hidden">
        {movies.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No movies.
          </div>
        ) : (
          movies.map((m) => {
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
                userId={userId}
                onChange={(next) => onChange(m.id, next)}
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
              <col className="w-36" />
              <col className="w-44" />
              <col className="w-24" />
              <col className="w-44" />
              <col className="w-36" />
            </colgroup>
            <thead className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3">Picked by</th>
                <th className="px-6 py-3">Ratings</th>
                <th className="px-6 py-3">Avg</th>
                <th className="px-6 py-3 whitespace-nowrap">Watched by</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">
                  Your rating
                </th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => {
                const ws = watchersByMovie.get(m.id) ?? [];
                const rated = ws
                  .map((w) => w.rating)
                  .filter((r): r is number => typeof r === "number" && r > 0);
                const avg =
                  rated.length > 0
                    ? rated.reduce((a, b) => a + b, 0) / rated.length
                    : null;
                const mine = myWatchByMovie.get(m.id);
                const pid = m.picked_by_id ?? m.picked_by_user_id ?? null;
                const picker = pid ? profileById.get(pid) ?? null : null;
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
                    <td className="px-6 py-3 text-muted-foreground">
                      {m.year ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      {picker ? (
                        <PickedBy
                          picker={picker}
                          linkUserId={pid}
                          size="sm"
                          bare
                        />
                      ) : m.picked_by ? (
                        <PickedBy
                          picker={{
                            first_name: m.picked_by,
                            avatar_url:
                              avatarByName?.get(m.picked_by.toLowerCase()) ??
                              null,
                          }}
                          size="sm"
                          bare
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {m.imdb_rating != null && (
                          <span
                            className="rounded px-2 py-0.5"
                            style={{
                              background: "rgba(245,197,24,0.18)",
                              color: "#F5C518",
                            }}
                          >
                            IMDb {m.imdb_rating.toFixed(1)}
                          </span>
                        )}
                        {m.rt_score != null && (
                          <span
                            className="rounded px-2 py-0.5"
                            style={{
                              background: "rgba(250,50,10,0.18)",
                              color: "#FA320A",
                            }}
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
                      {userId ? (
                        <QuickRate
                          userId={userId}
                          movieId={m.id}
                          rating={mine?.rating ?? null}
                          watched={!!mine}
                          size="sm"
                          onChange={(next) => onChange(m.id, next)}
                        />
                      ) : (
                        <Link
                          to="/auth"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Sign in to rate
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
