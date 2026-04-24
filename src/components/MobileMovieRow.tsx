import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { PickedBy } from "@/components/PickedBy";
import { UserAvatar } from "@/components/UserAvatar";
import { QuickRate } from "@/components/QuickRate";

type ProfileLite = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

type WatchLite = {
  user_id: string;
  rating: number | null;
};

export type MobileMovieRowMovie = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  imdb_rating: number | null;
  rt_score: number | null;
  is_current?: boolean;
  picked_by_id: string | null;
  picked_by_user_id?: string | null;
  picked_by: string | null;
};

export function MobileMovieRow({
  movie,
  watchers,
  myRating,
  iWatched,
  profileById,
  avatarByName,
  userId,
  onChange,
}: {
  movie: MobileMovieRowMovie;
  watchers: WatchLite[];
  myRating: number | null;
  iWatched: boolean;
  profileById: Map<string, ProfileLite>;
  avatarByName?: Map<string, string | null>;
  userId?: string;
  onChange: (next: { rating: number | null; watched: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);

  const rated = watchers
    .map((w) => w.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const avg =
    rated.length > 0 ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  const pid = movie.picked_by_id ?? movie.picked_by_user_id ?? null;
  const picker = pid ? profileById.get(pid) ?? null : null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="line-clamp-1 text-sm font-bold">{movie.title}</span>
            {movie.is_current && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                Now
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {picker ? (
              <PickedBy picker={picker} size="sm" bare />
            ) : movie.picked_by ? (
              <PickedBy
                picker={{
                  first_name: movie.picked_by,
                  avatar_url:
                    avatarByName?.get(movie.picked_by.toLowerCase()) ?? null,
                }}
                size="sm"
                bare
              />
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {avg != null && (
            <span className="rounded-full bg-secondary px-2 py-1 text-xs font-bold">
              {avg.toFixed(1)} 🍿
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div className="flex items-start gap-3">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt=""
                className="h-24 w-16 flex-none rounded object-cover"
              />
            ) : (
              <div className="h-24 w-16 flex-none rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1 space-y-2 text-xs">
              <div className="text-muted-foreground">
                {movie.year ?? "—"}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {movie.imdb_rating != null && (
                  <span
                    className="rounded px-2 py-0.5"
                    style={{
                      background: "rgba(245,197,24,0.18)",
                      color: "#F5C518",
                    }}
                  >
                    IMDb {movie.imdb_rating.toFixed(1)}
                  </span>
                )}
                {movie.rt_score != null && (
                  <span
                    className="rounded px-2 py-0.5"
                    style={{
                      background: "rgba(250,50,10,0.18)",
                      color: "#FA320A",
                    }}
                  >
                    RT {Math.round(movie.rt_score)}%
                  </span>
                )}
                {avg != null && (
                  <span className="rounded bg-secondary px-2 py-0.5">
                    🍿 {avg.toFixed(1)} ({rated.length})
                  </span>
                )}
              </div>
              <Link
                to="/movies/$movieId"
                params={{ movieId: movie.id }}
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                View details →
              </Link>
            </div>
          </div>

          {watchers.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Watched by
              </div>
              <div className="flex flex-wrap -space-x-2">
                {watchers.slice(0, 8).map((w) => {
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
                {watchers.length > 8 && (
                  <span className="ml-2 inline-flex h-7 items-center rounded-full bg-secondary px-2 text-[11px] font-bold text-muted-foreground">
                    +{watchers.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Your rating
            </div>
            {userId ? (
              <QuickRate
                userId={userId}
                movieId={movie.id}
                rating={myRating}
                watched={iWatched}
                size="sm"
                onChange={onChange}
              />
            ) : (
              <Link
                to="/auth"
                className="text-xs font-bold text-primary hover:underline"
              >
                Sign in to rate
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
