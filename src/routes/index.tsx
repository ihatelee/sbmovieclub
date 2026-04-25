import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { MovieCard } from "@/components/MovieCard";
import { RatingBar } from "@/components/RatingBar";
import { PickedBy } from "@/components/PickedBy";
import { WatchedAvatar } from "@/components/WatchedAvatar";
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
  picked_by_user_id: string | null;
  picked_by_id: string | null;
  picked_by: string | null;
};

type ProfileLite = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

type WatchRow = {
  user_id: string;
  movie_id: string;
  rating: number | null;
};

const MOVIE_COLUMNS =
  "id, tmdb_id, title, year, poster_url, overview, runtime, imdb_rating, rt_score, tmdb_rating, is_current, added_at, picked_by_user_id, picked_by_id, picked_by";

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
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [currentRes, recentRes, profilesRes] = await Promise.all([
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
          .limit(15),
        supabase
          .from("profiles")
          .select("id, first_name, avatar_url"),
      ]);

      if (cancelled) return;

      if (currentRes.error) {
        console.error("[home] current movie:", currentRes.error.message);
      }
      if (recentRes.error) {
        console.error("[home] recent movies:", recentRes.error.message);
      }
      if (profilesRes.error) {
        console.error("[home] profiles:", profilesRes.error.message);
      }

      const currentMovie = (currentRes.data as MovieRow | null) ?? null;
      setCurrent(currentMovie);
      setRecent((recentRes.data as MovieRow[] | null) ?? []);
      setProfiles((profilesRes.data as ProfileLite[] | null) ?? []);

      const watchesRes = await supabase
        .from("watches")
        .select("user_id, movie_id, rating");
      if (!cancelled) {
        if (watchesRes.error) {
          console.error("[home] watches:", watchesRes.error.message);
        }
        setWatches((watchesRes.data as WatchRow[] | null) ?? []);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profileById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const profileByName = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    for (const p of profiles) {
      if (p.first_name) m.set(p.first_name.trim().toLowerCase(), p);
    }
    return m;
  }, [profiles]);

  const PICK_ORDER = ["Sam", "Jessie", "Elin", "Nicole", "Lee", "Quinn"];

  const currentPickerId = current?.picked_by_id ?? current?.picked_by_user_id ?? null;
  const currentPicker = ((): ProfileLite | null => {
    if (currentPickerId) {
      const byId = profileById.get(currentPickerId);
      if (byId) return byId;
    }
    if (current?.picked_by) {
      const byName = profileByName.get(current.picked_by.trim().toLowerCase());
      if (byName) return byName;
    }
    return null;
  })();
  const currentPickerLinkId = currentPicker?.id ?? null;

  const nextPicker = useMemo((): ProfileLite | { first_name: string; avatar_url: null; id: null } | null => {
    const currentName = currentPicker?.first_name ?? current?.picked_by ?? null;
    let idx = -1;
    if (currentName) {
      idx = PICK_ORDER.findIndex(
        (n) => n.toLowerCase() === currentName.trim().toLowerCase()
      );
    }
    if (idx === -1) return null;
    const nextName = PICK_ORDER[(idx + 1) % PICK_ORDER.length];
    const profile = profileByName.get(nextName.toLowerCase());
    if (profile) return profile;
    return { first_name: nextName, avatar_url: null, id: null };
  }, [currentPicker, current, profileByName]);

  const watchedRows = useMemo(
    () =>
      watches
        .filter((w) => current && w.movie_id === current.id)
        .map((w) => ({ ...w, profile: profileById.get(w.user_id) ?? null }))
        .filter((w) => w.profile !== null),
    [watches, profileById, current]
  );

  const avgByMovie = useMemo(() => {
    const m = new Map<string, { avg: number; count: number }>();
    const groups = new Map<string, number[]>();
    for (const w of watches) {
      if (typeof w.rating === "number" && w.rating > 0) {
        const arr = groups.get(w.movie_id) ?? [];
        arr.push(w.rating);
        groups.set(w.movie_id, arr);
      }
    }
    for (const [id, rs] of groups) {
      m.set(id, { avg: rs.reduce((a, b) => a + b, 0) / rs.length, count: rs.length });
    }
    return m;
  }, [watches]);

  const handleWatchChange = (next: { rating: number | null; watched: boolean }) => {
    if (!session?.user || !current) return;
    const userId = session.user.id;
    const movieId = current.id;
    setWatches((prev) => {
      const without = prev.filter((w) => !(w.user_id === userId && w.movie_id === movieId));
      return next.watched
        ? [...without, { user_id: userId, movie_id: movieId, rating: next.rating }]
        : without;
    });
  };

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
                  {(currentPicker?.first_name || current.picked_by) && (
                    <>
                      <span aria-hidden>•</span>
                      <span>
                        Picked by {currentPicker?.first_name ?? current.picked_by}
                      </span>
                    </>
                  )}
                </div>

                {(currentPicker || current.picked_by) && (
                  <div className="mt-4">
                    <PickedBy
                      picker={currentPicker}
                      fallbackName={current.picked_by}
                      linkUserId={currentPickerLinkId}
                      size="md"
                    />
                  </div>
                )}

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

                {(() => {
                  const myWatch = session?.user
                    ? watches.find((w) => w.user_id === session.user.id && current && w.movie_id === current.id) ?? null
                    : null;
                  const iWatched = myWatch !== null;
                  const myRating = myWatch?.rating ?? null;
                  return (
                    <>
                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link
                          to="/movies/$movieId"
                          params={{ movieId: current.id }}
                          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
                        >
                          ▶ View details
                        </Link>
                        {iWatched && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-black text-primary">
                            <span aria-hidden>✓</span>
                            Watched
                            {myRating != null && (
                              <span className="ml-1 text-foreground/80">
                                · {"🍿".repeat(myRating)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {isLoggedIn && session?.user && !iWatched && (
                        <HeroRating
                          movieId={current.id}
                          userId={session.user.id}
                          onChange={handleWatchChange}
                        />
                      )}

                      {watchedRows.length > 0 && (
                        <div className="mt-6">
                          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                            Watched by
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {watchedRows.map((w) => (
                              <WatchedAvatar
                                key={w.user_id}
                                name={w.profile?.first_name ?? null}
                                url={w.profile?.avatar_url ?? null}
                                rating={w.rating}
                                size={36}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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

      {/* Next pick banner */}
      {nextPicker && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6 py-4">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Next pick
            </span>
            <PickedBy
              picker={{
                first_name: nextPicker.first_name,
                avatar_url: nextPicker.avatar_url,
              }}
              linkUserId={nextPicker.id ?? null}
              size="md"
              bare
            />
          </div>
        </section>
      )}

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
          <Link
            to="/movies"
            className="hidden text-sm font-bold text-primary transition-colors hover:text-primary/80 md:inline-flex"
          >
            All movies →
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                {...(() => {
                  const pid = m.picked_by_id ?? m.picked_by_user_id;
                  let p: ProfileLite | null = pid ? profileById.get(pid) ?? null : null;
                  if (!p && m.picked_by) {
                    p = profileByName.get(m.picked_by.trim().toLowerCase()) ?? null;
                  }
                  if (p) {
                    return {
                      picker: { first_name: p.first_name, avatar_url: p.avatar_url },
                      pickerUserId: p.id,
                    };
                  }
                  if (m.picked_by) {
                    return {
                      picker: { first_name: m.picked_by, avatar_url: null },
                      pickerUserId: null,
                    };
                  }
                  return { picker: null, pickerUserId: null };
                })()}
                avgRating={avgByMovie.get(m.id)?.avg ?? null}
                ratingCount={avgByMovie.get(m.id)?.count ?? 0}
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

function HeroRating({
  movieId,
  userId,
  onChange,
}: {
  movieId: string;
  userId: string;
  onChange?: (next: { rating: number | null; watched: boolean }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleMarkWatched = async () => {
    setSaving(true);
    const finalRating = rating > 0 ? rating : null;
    const { error } = await supabase.from("watches").upsert(
      {
        user_id: userId,
        movie_id: movieId,
        rating: finalRating,
      },
      { onConflict: "user_id,movie_id" }
    );
    setSaving(false);
    if (error) {
      console.error("[hero-rating] upsert:", error.message);
      toast.error("Couldn't mark as watched", { description: error.message });
      return;
    }
    onChange?.({ rating: finalRating, watched: true });
    toast.success("Marked as watched");
  };

  return (
    <RatingBar
      rating={rating}
      onChange={setRating}
      onMarkWatched={handleMarkWatched}
      watched={false}
      saving={saving}
    />
  );
}

