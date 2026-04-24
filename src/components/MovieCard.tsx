import { Link } from "@tanstack/react-router";
import type { Movie } from "@/lib/mock-movies";
import { PickedBy } from "@/components/PickedBy";

type Picker = { first_name: string | null; avatar_url: string | null };

// Deterministic gradient pair based on movie id
const gradients = [
  ["#FF6B35", "#FF3CAC"],
  ["#FF3CAC", "#7B61FF"],
  ["#01D277", "#FF6B35"],
  ["#F5C518", "#FA320A"],
  ["#7B61FF", "#01D277"],
  ["#FA320A", "#FF3CAC"],
];
function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export function MovieCard({
  movie,
  userRating,
  picker,
}: {
  movie: Movie;
  userRating?: number;
  picker?: Picker | null;
}) {
  const [a, b] = gradientFor(movie.id);
  const showRating =
    typeof userRating === "number" && userRating > 0;
  const hasPoster = !!movie.posterUrl;

  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group block"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-[var(--shadow-poster)] transition-transform duration-300 group-hover:-translate-y-1"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      >
        {hasPoster ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            loading="lazy"
            width={600}
            height={900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center">
            <span className="text-lg font-black leading-tight tracking-tight text-white drop-shadow-lg">
              {movie.title}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {showRating && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-xs font-bold backdrop-blur">
            <span aria-hidden>🍿</span>
            <span>{userRating}/5</span>
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-base font-black leading-tight tracking-tight text-white">
          {movie.title}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {movie.year}
        </p>
        {picker && (
          <div className="mt-2">
            <PickedBy picker={picker} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
