import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile/$userId")({
  head: () => ({
    meta: [
      { title: "Member profile — SB Movie Club" },
      { name: "description", content: "A member's watched films and ratings." },
    ],
  }),
  component: MemberProfilePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-black">Member not found</h1>
        <Link to="/" className="mt-4 inline-block font-bold text-primary hover:underline">
          ← Back home
        </Link>
      </div>
    </div>
  ),
});

type ProfileRow = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

type MovieRow = {
  id: string;
  title: string;
  year: number | null;
  poster_url: string | null;
  is_current: boolean;
  picked_by_id: string | null;
  picked_by: string | null;
};

type WatchRow = {
  movie_id: string;
  rating: number | null;
};

function MemberProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pRes, mRes, wRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("movies")
          .select("id, title, year, poster_url, is_current, picked_by_id, picked_by")
          .order("order_index", { ascending: false }),
        supabase
          .from("watches")
          .select("movie_id, rating")
          .eq("user_id", userId),
      ]);

      if (cancelled) return;
      if (pRes.error) console.error("[member-profile] profile:", pRes.error.message);
      if (mRes.error) console.error("[member-profile] movies:", mRes.error.message);
      if (wRes.error) console.error("[member-profile] watches:", wRes.error.message);

      if (!pRes.data) setNotFoundFlag(true);
      setProfile((pRes.data as ProfileRow | null) ?? null);
      setMovies((mRes.data as MovieRow[] | null) ?? []);
      setWatches((wRes.data as WatchRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const watchByMovie = useMemo(() => {
    const m = new Map<string, WatchRow>();
    for (const w of watches) m.set(w.movie_id, w);
    return m;
  }, [watches]);

  const watched = useMemo(
    () => movies.filter((m) => watchByMovie.has(m.id)),
    [movies, watchByMovie]
  );

  const picked = useMemo(
    () => movies.filter((m) => m.picked_by_id === userId),
    [movies, userId]
  );

  const ratedCount = watched.filter((m) => (watchByMovie.get(m.id)?.rating ?? 0) > 0).length;
  const avgRating = (() => {
    const rs = watched
      .map((m) => watchByMovie.get(m.id)?.rating ?? 0)
      .filter((r) => r > 0);
    if (rs.length === 0) return null;
    return rs.reduce((a, b) => a + b, 0) / rs.length;
  })();

  if (notFoundFlag) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-3xl font-black">Member not found</h1>
          <Link to="/" className="mt-4 inline-block font-bold text-primary hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mt-6 flex items-center gap-5">
            <UserAvatar
              name={profile?.first_name}
              url={profile?.avatar_url ?? null}
              size={88}
            />
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                Member
              </span>
              <h1 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">
                {profile?.first_name ?? (loading ? "Loading…" : "Member")}
              </h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {watched.length} watched · {picked.length} picked
                {avgRating != null && (
                  <> · 🍿 {avgRating.toFixed(1)} avg ({ratedCount})</>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-black tracking-tight">Movies they picked</h2>
        {picked.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No picks yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {picked.map((m) => (
              <PosterTile key={m.id} movie={m} />
            ))}
          </div>
        )}

        <h2 className="mt-14 text-2xl font-black tracking-tight">Movies they watched</h2>
        {watched.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Hasn't watched anything yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {watched.map((m) => {
              const r = watchByMovie.get(m.id)?.rating ?? null;
              return <PosterTile key={m.id} movie={m} rating={r} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PosterTile({
  movie,
  rating,
}: {
  movie: MovieRow;
  rating?: number | null;
}) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-[var(--shadow-poster)] transition-transform duration-300 group-hover:-translate-y-1">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center">
            <span className="text-sm font-black leading-tight tracking-tight text-white drop-shadow">
              {movie.title}
            </span>
          </div>
        )}
        {rating != null && rating > 0 && (
          <div className="absolute right-1.5 top-1.5 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
            🍿 {rating}/5
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <div className="line-clamp-1 text-xs font-bold">{movie.title}</div>
        <div className="text-[11px] font-medium text-muted-foreground">
          {movie.year ?? "—"}
        </div>
      </div>
    </Link>
  );
}
