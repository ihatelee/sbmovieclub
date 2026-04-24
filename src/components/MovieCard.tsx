import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Movie } from "@/lib/mock-movies";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-[var(--shadow-poster)] ring-1 ring-border/60 transition-all duration-500 group-hover:ring-primary/50">
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          width={600}
          height={900}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        {movie.rating !== undefined && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur-md">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {movie.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-display text-base leading-tight transition-colors group-hover:text-primary">
          {movie.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {movie.director} · {movie.year}
        </p>
      </div>
    </Link>
  );
}
