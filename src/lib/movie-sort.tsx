import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortKey =
  | "chronology"
  | "rating"
  | "least_watched"
  | "most_watched"
  | "controversial";

export const SORT_LABELS: Record<SortKey, string> = {
  chronology: "Most recent first",
  rating: "Highest rated",
  least_watched: "Least watched",
  most_watched: "Most watched",
  controversial: "Most controversial",
};

const ORDER: SortKey[] = [
  "chronology",
  "rating",
  "most_watched",
  "least_watched",
  "controversial",
];

type Movie = { id: string };
type Watch = { movie_id: string; rating: number | null };

type SortStats = {
  avg: number | null;
  count: number;
  stddev: number; // population stddev of ratings; 0 when <2 rated
};

function computeStats(watches: Watch[]): SortStats {
  const rated = watches
    .map((w) => w.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);
  if (rated.length === 0) return { avg: null, count: watches.length, stddev: 0 };
  const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
  const variance =
    rated.length > 1
      ? rated.reduce((acc, r) => acc + (r - avg) ** 2, 0) / rated.length
      : 0;
  return { avg, count: watches.length, stddev: Math.sqrt(variance) };
}

/**
 * Returns a new array of movies sorted by the given key.
 * The original `movies` array order represents chronology (most-recent first),
 * which is the default ordering returned from Supabase.
 */
export function sortMovies<M extends Movie>(
  movies: M[],
  watchersByMovie: Map<string, Watch[]>,
  sort: SortKey
): M[] {
  if (sort === "chronology") return movies;

  const withStats = movies.map((m, i) => ({
    m,
    i,
    stats: computeStats(watchersByMovie.get(m.id) ?? []),
  }));

  // Stable secondary sort: original index (chronology).
  withStats.sort((a, b) => {
    const sa = a.stats;
    const sb = b.stats;
    let primary = 0;
    switch (sort) {
      case "rating":
        // null avg sinks to bottom
        if (sa.avg == null && sb.avg == null) primary = 0;
        else if (sa.avg == null) primary = 1;
        else if (sb.avg == null) primary = -1;
        else primary = sb.avg - sa.avg;
        break;
      case "most_watched":
        primary = sb.count - sa.count;
        break;
      case "least_watched":
        primary = sa.count - sb.count;
        break;
      case "controversial":
        // Need at least 2 ratings for stddev to mean anything.
        primary = sb.stddev - sa.stddev;
        break;
    }
    if (primary !== 0) return primary;
    return a.i - b.i;
  });

  return withStats.map((x) => x.m);
}

export function SortDropdown({
  value,
  onChange,
  className,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-foreground transition-colors hover:bg-secondary",
            className
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="text-muted-foreground">Sort:</span>
          <span>{SORT_LABELS[value]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ORDER.map((k) => (
          <DropdownMenuItem
            key={k}
            onSelect={() => onChange(k)}
            className={cn(
              "text-sm font-bold",
              value === k && "bg-secondary text-primary"
            )}
          >
            {SORT_LABELS[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
