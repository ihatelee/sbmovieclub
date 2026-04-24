import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Film, Loader2, Plus, Search, Star, Trash2, Users, X } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { PickerSelect } from "@/components/PickerSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ---------------- Types ----------------

type MovieRow = {
  id: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  title: string;
  year: number | null;
  poster_url: string | null;
  runtime: number | null;
  genres: string[] | null;
  imdb_rating: number | null;
  rt_score: number | null;
  tmdb_rating: number | null;
  is_current: boolean;
  added_at: string;
  picked_by_user_id: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  email: string | null;
  is_approved: boolean;
  is_admin: boolean;
  avatar_url: string | null;
};

type TmdbSearchResult = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
};

const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;
const OMDB_KEY = import.meta.env.VITE_OMDB_KEY as string | undefined;
const TMDB_IMG = (path: string | null, size = "w185") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

// ---------------- Route ----------------

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SB Movie Club" },
      { name: "description", content: "Manage screenings and members." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [ratingsByMovie, setRatingsByMovie] = useState<
    Record<string, { avg: number; count: number }>
  >({});
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const refreshMovies = async () => {
    setLoadingMovies(true);
    const [moviesRes, watchesRes] = await Promise.all([
      supabase
        .from("movies")
        .select(
          "id, tmdb_id, imdb_id, title, year, poster_url, runtime, genres, imdb_rating, rt_score, tmdb_rating, is_current, added_at, picked_by_user_id"
        )
        .order("order_index", { ascending: false }),
      supabase.from("watches").select("movie_id, rating"),
    ]);
    if (moviesRes.error) {
      toast.error("Failed to load movies", { description: moviesRes.error.message });
    } else {
      setMovies((moviesRes.data as MovieRow[]) ?? []);
    }
    if (watchesRes.error) {
      console.error("[admin] watches:", watchesRes.error.message);
      setRatingsByMovie({});
    } else {
      const sums: Record<string, { total: number; count: number }> = {};
      for (const w of (watchesRes.data ?? []) as { movie_id: string; rating: number | null }[]) {
        if (w.rating == null || w.rating <= 0) continue;
        const cur = sums[w.movie_id] ?? { total: 0, count: 0 };
        cur.total += w.rating;
        cur.count += 1;
        sums[w.movie_id] = cur;
      }
      const avgs: Record<string, { avg: number; count: number }> = {};
      for (const [id, { total, count }] of Object.entries(sums)) {
        avgs[id] = { avg: total / count, count };
      }
      setRatingsByMovie(avgs);
    }
    setLoadingMovies(false);
  };

  const refreshProfiles = async () => {
    setLoadingProfiles(true);
    setProfilesError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, email, is_approved, is_admin, avatar_url")
      .order("first_name", { ascending: true });
    if (error) {
      setProfilesError(error.message);
      setProfiles([]);
    } else {
      setProfiles((data as ProfileRow[]) ?? []);
    }
    setLoadingProfiles(false);
  };

  useEffect(() => {
    void refreshMovies();
    void refreshProfiles();
  }, []);

  const moviesCount = movies.length;
  const approvedCount = useMemo(
    () => profiles.filter((p) => p.is_approved).length,
    [profiles]
  );

  // -------- Mutations --------

  const handleSetCurrent = async (id: string) => {
    // Clear all, then set the chosen one. Two writes — Supabase JS has no
    // transaction primitive; the second write is the source of truth.
    const clear = await supabase.from("movies").update({ is_current: false }).neq("id", id);
    if (clear.error) {
      toast.error("Couldn't clear current movie", { description: clear.error.message });
      return;
    }
    const set = await supabase.from("movies").update({ is_current: true }).eq("id", id);
    if (set.error) {
      toast.error("Couldn't set current", { description: set.error.message });
      return;
    }
    toast.success("Set as current screening");
    void refreshMovies();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    toast.success("Movie deleted");
    setMovies((prev) => prev.filter((m) => m.id !== id));
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("id", id);
    if (error) {
      toast.error("Approval failed", { description: error.message });
      return;
    }
    toast.success("Member approved");
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_approved: true } : p))
    );
  };

  const handleSetPicker = async (movieId: string, pickerId: string | null) => {
    // Optimistic
    setMovies((prev) =>
      prev.map((m) => (m.id === movieId ? { ...m, picked_by_user_id: pickerId } : m))
    );
    const { error } = await supabase
      .from("movies")
      .update({ picked_by_user_id: pickerId })
      .eq("id", movieId);
    if (error) {
      toast.error("Couldn't update picker", { description: error.message });
      void refreshMovies();
      return;
    }
    toast.success(pickerId ? "Picker updated" : "Picker cleared");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              Control room
            </span>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Admin</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Manage screenings and members.
            </p>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
          >
            <Plus className="h-4 w-4" /> Add movie
          </button>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Stat icon={Film} label="Movies watched" value={moviesCount.toString()} />
          <Stat
            icon={Users}
            label="Active members"
            value={profilesError ? "—" : approvedCount.toString()}
            hint={profilesError ? "Profiles query failed" : undefined}
          />
        </div>

        <Tabs defaultValue="screenings" className="mt-12">
          <TabsList>
            <TabsTrigger value="screenings">Screenings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="screenings" className="mt-6">
            <ScreeningsTable
              movies={movies}
              ratingsByMovie={ratingsByMovie}
              profiles={profiles}
              loading={loadingMovies}
              onSetCurrent={handleSetCurrent}
              onDelete={handleDelete}
              onSetPicker={handleSetPicker}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembersTable
              profiles={profiles}
              loading={loadingProfiles}
              error={profilesError}
              onApprove={handleApprove}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddMovieDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        existingTmdbIds={new Set(movies.map((m) => m.tmdb_id).filter(Boolean) as number[])}
        profiles={profiles}
        onAdded={() => {
          void refreshMovies();
        }}
      />
    </div>
  );
}

// ---------------- Stat card ----------------

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs font-medium text-muted-foreground">{hint}</div>}
    </div>
  );
}

// ---------------- Screenings table ----------------

function ScreeningsTable({
  movies,
  ratingsByMovie,
  profiles,
  loading,
  onSetCurrent,
  onDelete,
  onSetPicker,
}: {
  movies: MovieRow[];
  ratingsByMovie: Record<string, { avg: number; count: number }>;
  profiles: ProfileRow[];
  loading: boolean;
  onSetCurrent: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onSetPicker: (movieId: string, pickerId: string | null) => void;
}) {
  const pickerProfiles = useMemo(
    () =>
      profiles
        .filter((p) => p.is_approved)
        .map((p) => ({ id: p.id, first_name: p.first_name, avatar_url: p.avatar_url })),
    [profiles]
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-black tracking-tight">Screenings</h2>
        <span className="text-xs font-bold text-muted-foreground">
          {loading ? "Loading…" : `${movies.length} total`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Year</th>
              <th className="px-6 py-3">Picked by</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Avg rating</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : movies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No movies yet — hit “Add movie” to log your first screening.
                </td>
              </tr>
            ) : (
              movies.map((m) => {
                const r = ratingsByMovie[m.id];
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/60"
                  >
                    <td className="px-6 py-3 font-bold">
                      <div className="flex items-center gap-3">
                        {m.poster_url ? (
                          <img
                            src={m.poster_url}
                            alt=""
                            className="h-10 w-7 flex-none rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-7 flex-none rounded bg-muted" />
                        )}
                        <span className="line-clamp-1">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{m.year ?? "—"}</td>
                    <td className="px-6 py-3">
                      <PickerSelect
                        profiles={pickerProfiles}
                        value={m.picked_by_user_id}
                        onChange={(id) => onSetPicker(m.id, id)}
                        size="sm"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-6 py-3">
                      {m.is_current ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
                          <Star className="h-3 w-3 fill-current" /> Current
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold">
                      {r ? (
                        <span>
                          🍿 {r.avg.toFixed(1)}/5{" "}
                          <span className="font-medium text-muted-foreground">({r.count})</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          No ratings yet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {!m.is_current && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSetCurrent(m.id)}
                        >
                          Set as current
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(m.id, m.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Members table ----------------

function MembersTable({
  profiles,
  loading,
  error,
  onApprove,
}: {
  profiles: ProfileRow[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-black tracking-tight">Members</h2>
        <span className="text-xs font-bold text-muted-foreground">
          {loading ? "Loading…" : `${profiles.length} total`}
        </span>
      </div>

      {error ? (
        <div className="px-6 py-8 text-sm">
          <p className="font-bold text-destructive">Couldn't load profiles</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
          {error.toLowerCase().includes("recursion") && (
            <p className="mt-3 text-xs text-muted-foreground">
              Run the SQL in <code className="rounded bg-muted px-1 py-0.5">docs/fix-profiles-rls.md</code>{" "}
              to fix the recursive RLS policy.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No members yet.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/60"
                  >
                    <td className="px-6 py-3 font-bold">{p.first_name ?? "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                    <td className="px-6 py-3">
                      {p.is_approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-500">
                          <Check className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-500">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {!p.is_approved && (
                        <Button size="sm" onClick={() => onApprove(p.id)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------- TMDB search dialog ----------------

function AddMovieDialog({
  open,
  onOpenChange,
  existingTmdbIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingTmdbIds: Set<number>;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (!TMDB_TOKEN) {
      toast.error("Missing VITE_TMDB_TOKEN");
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,
          {
            headers: {
              Authorization: `Bearer ${TMDB_TOKEN}`,
              accept: "application/json",
            },
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error(`TMDB ${res.status}`);
        const json = (await res.json()) as { results?: TmdbSearchResult[] };
        setResults(json.results?.slice(0, 12) ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          toast.error("TMDB search failed");
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query, open]);

  const reset = () => {
    setQuery("");
    setResults([]);
    setSavingId(null);
  };

  const handlePick = async (r: TmdbSearchResult) => {
    if (existingTmdbIds.has(r.id)) {
      toast.info("That movie's already in the list");
      return;
    }
    setSavingId(r.id);
    try {
      // Full TMDB details
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${r.id}?language=en-US`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" } }
      );
      if (!detailsRes.ok) throw new Error(`TMDB details ${detailsRes.status}`);
      const details = (await detailsRes.json()) as {
        runtime: number | null;
        genres: { name: string }[];
        imdb_id: string | null;
        vote_average: number | null;
        overview: string | null;
        poster_path: string | null;
        title: string;
        release_date: string | null;
      };

      // OMDB for RT score (best-effort)
      let rtScore: number | null = null;
      let imdbRating: number | null = null;
      if (details.imdb_id && OMDB_KEY) {
        try {
          const omdb = await fetch(
            `https://www.omdbapi.com/?i=${details.imdb_id}&apikey=${OMDB_KEY}`
          );
          if (omdb.ok) {
            const oj = (await omdb.json()) as {
              imdbRating?: string;
              Ratings?: { Source: string; Value: string }[];
            };
            const rt = oj.Ratings?.find((x) => x.Source === "Rotten Tomatoes")?.Value;
            if (rt) rtScore = parseInt(rt.replace("%", ""), 10);
            if (oj.imdbRating && oj.imdbRating !== "N/A") imdbRating = parseFloat(oj.imdbRating);
          }
        } catch {
          // OMDB is best-effort — don't fail the insert
        }
      }

      const year = details.release_date ? parseInt(details.release_date.slice(0, 4), 10) : null;
      const posterUrl = TMDB_IMG(details.poster_path ?? r.poster_path, "w500");

      const { error } = await supabase.from("movies").insert({
        tmdb_id: r.id,
        imdb_id: details.imdb_id,
        title: details.title ?? r.title,
        year,
        poster_url: posterUrl,
        overview: details.overview ?? null,
        runtime: details.runtime,
        genres: details.genres?.map((g) => g.name) ?? [],
        imdb_rating: imdbRating,
        rt_score: rtScore,
        tmdb_rating: details.vote_average ?? null,
        is_current: false,
      });
      if (error) throw error;

      toast.success(`Added ${details.title}`);
      onAdded();
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't add movie", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a movie</DialogTitle>
          <DialogDescription>Search TMDB and pick a result.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a title…"
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {searching && results.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : query.trim().length < 2 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((r) => {
                const already = existingTmdbIds.has(r.id);
                const year = r.release_date ? r.release_date.slice(0, 4) : "—";
                return (
                  <li key={r.id}>
                    <button
                      disabled={already || savingId !== null}
                      onClick={() => handlePick(r)}
                      className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {r.poster_path ? (
                        <img
                          src={TMDB_IMG(r.poster_path, "w92") ?? ""}
                          alt=""
                          className="h-16 w-11 flex-none rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-11 flex-none rounded bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold">{r.title}</span>
                          <span className="text-xs font-medium text-muted-foreground">{year}</span>
                          {already && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              Added
                            </span>
                          )}
                        </div>
                        {r.overview && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {r.overview}
                          </p>
                        )}
                      </div>
                      {savingId === r.id ? (
                        <Loader2 className="h-4 w-4 flex-none animate-spin text-primary" />
                      ) : (
                        !already && <Plus className="h-4 w-4 flex-none text-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
