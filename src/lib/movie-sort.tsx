import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortKey =
  | "chronology"
  | "rating"
  | "lowest_rated"
  | "most_watched"
  | "least_watched"
  | "controversial";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "chronology", label: "Most recent" },
  { key: "rating", label: "Highest rated" },
  { key: "lowest_rated", label: "Lowest rated" },
  { key: "most_watched", label: "Most watched" },
  { key: "least_watched", label: "Least watched" },
  { key: "controversial", label: "Most controversial" },
];

type WatchLite = { rating: number | null };

function avg(rs: number[]): number {
  if (rs.length === 0) return 0;
  return rs.reduce((a, b) => a + b, 0) / rs.length;
}

/**
 * Polarization score: rewards movies where viewers split sharply between
 * high (4-5) and low (1-2) ratings. Uses the geometric mean of high and low
 * counts so movies need BOTH camps strongly represented to score highly.
 * Middling 3-star ratings are ignored.
 */
function polarization(rs: number[]): number {
  if (rs.length < 2) return 0;
  let high = 0;
  let low = 0;
  for (const r of rs) {
    if (r >= 4) high += 1;
    else if (r <= 2) low += 1;
  }
  if (high === 0 || low === 0) return 0;
  return Math.sqrt(high * low);
}

/**
 * Sort movies by the given key. Input is assumed to already be in chronological
 * order (most recent first); the "chronology" key returns the array unchanged.
 */
export function sortMovies<T extends { id: string }>(
  movies: T[],
  watchersByMovie: Map<string, WatchLite[]>,
  key: SortKey
): T[] {
  if (key === "chronology") return movies;
  const arr = [...movies];
  arr.sort((a, b) => {
    const wa = watchersByMovie.get(a.id) ?? [];
    const wb = watchersByMovie.get(b.id) ?? [];
    const ra = wa.map((w) => w.rating).filter((r): r is number => typeof r === "number" && r > 0);
    const rb = wb.map((w) => w.rating).filter((r): r is number => typeof r === "number" && r > 0);
    if (key === "rating") return avg(rb) - avg(ra);
    if (key === "lowest_rated") {
      // Movies with no ratings sink to the bottom.
      const aAvg = ra.length === 0 ? Infinity : avg(ra);
      const bAvg = rb.length === 0 ? Infinity : avg(rb);
      return aAvg - bAvg;
    }
    if (key === "most_watched") return wb.length - wa.length;
    if (key === "least_watched") return wa.length - wb.length;
    if (key === "controversial") return polarization(rb) - polarization(ra);
    return 0;
  });
  return arr;
}

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="text-primary">Sort:</span>
          <span className="text-foreground">{current.label}</span>
          <span aria-hidden className="opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onSelect={() => onChange(opt.key)}
            className={value === opt.key ? "font-black text-primary" : "font-bold"}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
