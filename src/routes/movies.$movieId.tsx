import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { PickedBy } from "@/components/PickedBy";
import { supabase } from "@/lib/supabase";

type MovieRow = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  overview: string | null;
  runtime: number | null;
  genres: string[] | null;
  imdb_rating: number | null;
  rt_score: number | null;
  tmdb_rating: number | null;
  is_current: boolean;
  added_at: string;
  picked_by_user_id: string | null;
  picked_by_id: string | null;
  picked_by: string | null;
};

type WatcherRow = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
  watched: boolean;
  rating: number | null;
};


export const Route = createFileRoute("/movies/$movieId")({
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

function Pill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ background: tone }}
    >
      <span className="opacity-80">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MovieDetail() {
  const { movieId } = Route.useParams();
  const [movie, setMovie] = useState<MovieRow | null>(null);
  const [watchers, setWatchers] = useState<WatcherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [movieRes, profilesRes, watchesRes] = await Promise.all([
        supabase
          .from("movies")
          .select(
            "id, title, year, poster_url, overview, runtime, genres, imdb_rating, rt_score, tmdb_rating, is_current, added_at, picked_by_user_id, picked_by_id, picked_by"
          )
          .eq("id", movieId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, first_name, avatar_url, is_approved")
          .eq("is_approved", true),
        supabase
          .from("watches")
          .select("user_id, rating")
          .eq("movie_id", movieId),
      ]);

      if (cancelled) return;

      if (movieRes.error) console.error("[movie-detail] movie:", movieRes.error.message);
      if (profilesRes.error) console.error("[movie-detail] profiles:", profilesRes.error.message);
      if (watchesRes.error) console.error("[movie-detail] watches:", watchesRes.error.message);

      if (!movieRes.data) setNotFoundFlag(true);
      setMovie((movieRes.data as MovieRow | null) ?? null);

      const watchMap = new Map<string, number | null>();
      for (const w of (watchesRes.data ?? []) as { user_id: string; rating: number | null }[]) {
        watchMap.set(w.user_id, w.rating);
      }
      const merged: WatcherRow[] = (
        (profilesRes.data ?? []) as { id: string; first_name: string | null; avatar_url: string | null }[]
      )
        .map((p) => ({
          id: p.id,
          first_name: p.first_name,
          avatar_url: p.avatar_url,
          watched: watchMap.has(p.id),
          rating: watchMap.get(p.id) ?? null,
        }))
        .sort((a, b) => {
          if (a.watched !== b.watched) return a.watched ? -1 : 1;
          return (a.first_name ?? "").localeCompare(b.first_name ?? "");
        });
      setWatchers(merged);

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  if (notFoundFlag) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-3xl font-black">Movie not found</h1>
          <Link
            to="/"
            className="mt-4 inline-block font-bold text-primary hover:underline"
          >
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

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

          {loading || !movie ? (
            <div className="mt-12 grid gap-10 md:grid-cols-[280px_1fr]">
              <div className="aspect-[2/3] rounded-2xl bg-muted/40" />
              <div className="space-y-4">
                <div className="h-12 w-2/3 rounded bg-muted/40" />
                <div className="h-4 w-1/3 rounded bg-muted/40" />
                <div className="h-24 w-full rounded bg-muted/40" />
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-10 md:grid-cols-[280px_1fr]">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-5 rounded-3xl blur-3xl opacity-60"
                  style={{ background: "var(--gradient-brand)" }}
                />
                <div
                  className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-[var(--shadow-poster)]"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)",
                  }}
                >
                  {movie.poster_url && !imgFailed ? (
                    <img
                      src={movie.poster_url}
                      alt={`${movie.title} poster`}
                      width={600}
                      height={900}
                      className="h-full w-full object-cover"
                      onError={() => setImgFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center">
                      <span className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
                        {movie.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                  {movie.title}
                </h1>
                <p className="mt-3 text-base font-semibold text-muted-foreground">
                  {[
                    movie.year,
                    movie.runtime ? `${movie.runtime} min` : null,
                    movie.genres?.length ? movie.genres.slice(0, 3).join(" · ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {movie.is_current && (
                    <span
                      className="rounded-full px-3 py-1.5 text-xs font-bold text-primary-foreground"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      🎬 Currently watching
                    </span>
                  )}
                  {(() => {
                    const picker = movie.picked_by_user_id
                      ? watchers.find((w) => w.id === movie.picked_by_user_id)
                      : null;
                    if (picker) {
                      return (
                        <PickedBy
                          picker={{
                            first_name: picker.first_name,
                            avatar_url: picker.avatar_url,
                          }}
                          size="md"
                        />
                      );
                    }
                    if (movie.picked_by) {
                      return (
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1.5 text-xs font-bold">
                          <span className="text-muted-foreground">Picked by</span>
                          <span>{movie.picked_by}</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {movie.imdb_rating != null && (
                    <Pill
                      label="IMDb"
                      value={movie.imdb_rating.toFixed(1)}
                      tone="rgba(245,197,24,0.18)"
                    />
                  )}
                  {movie.rt_score != null && (
                    <Pill
                      label="RT"
                      value={`${Math.round(movie.rt_score)}%`}
                      tone="rgba(250,50,10,0.18)"
                    />
                  )}
                  {movie.tmdb_rating != null && (
                    <Pill
                      label="TMDB"
                      value={`${Math.round(movie.tmdb_rating * 10)}%`}
                      tone="rgba(1,210,119,0.18)"
                    />
                  )}
                </div>

                {movie.overview && (
                  <p className="mt-7 text-base leading-relaxed text-foreground/90">
                    {movie.overview}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && movie && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-black tracking-tight">Who's watched it</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {watchers.filter((w) => w.watched).length} of {watchers.length} members
          </p>

          {watchers.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {watchers.map((w) => (
                <div
                  key={w.id}
                  className={`flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-opacity ${
                    w.watched ? "" : "opacity-60"
                  }`}
                >
                  <div className="relative">
                    <UserAvatar
                      name={w.first_name}
                      url={w.avatar_url}
                      size={56}
                      className={w.watched ? "" : "grayscale"}
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[11px] font-black ${
                        w.watched
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden
                    >
                      {w.watched ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="text-sm font-bold">
                    {w.first_name ?? "Member"}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {!w.watched
                      ? "Not watched"
                      : w.rating != null
                        ? `🍿 ${w.rating}/5`
                        : "No rating"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
