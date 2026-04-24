import { useState } from "react";

export function RatingBar({
  initial = 0,
  onRate,
  onMarkWatched,
}: {
  initial?: number;
  onRate?: (n: number) => void;
  onMarkWatched?: () => void;
}) {
  const [rating, setRating] = useState(initial);
  const [hover, setHover] = useState(0);

  return (
    <div
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/30 p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,107,53,0.16), rgba(255,60,172,0.08))",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div>
          <div className="text-sm font-black uppercase tracking-wide">
            Watched it? Rate it!
          </div>
          <div className="text-xs text-muted-foreground">
            Tap a popcorn to score this pick.
          </div>
        </div>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => {
                  setRating(n);
                  onRate?.(n);
                }}
                className="text-2xl leading-none transition-transform hover:scale-125"
                style={{
                  filter: active ? "none" : "grayscale(1) opacity(0.35)",
                }}
              >
                🍿
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onMarkWatched}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
      >
        Mark watched
      </button>
    </div>
  );
}
