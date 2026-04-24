import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  movieId: string;
  rating: number | null;
  watched: boolean;
  onChange?: (next: { rating: number | null; watched: boolean }) => void;
  size?: "sm" | "md";
  className?: string;
};

export function QuickRate({
  userId,
  movieId,
  rating,
  watched,
  onChange,
  size = "sm",
  className,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const persist = async (next: number | null, markWatched: boolean) => {
    setSaving(true);
    const { error } = await supabase.from("watches").upsert(
      { user_id: userId, movie_id: movieId, rating: next },
      { onConflict: "user_id,movie_id" }
    );
    setSaving(false);
    if (error) {
      console.error("[quick-rate] upsert:", error.message);
      toast.error("Couldn't save rating", { description: error.message });
      return;
    }
    onChange?.({ rating: next, watched: markWatched });
    if (next != null) toast.success(`Rated 🍿 ${next}/5`);
    else if (markWatched && !watched) toast.success("Marked as watched");
  };

  const remove = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("watches")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);
    setSaving(false);
    if (error) {
      console.error("[quick-rate] delete:", error.message);
      toast.error("Couldn't remove watch", { description: error.message });
      return;
    }
    onChange?.({ rating: null, watched: false });
    toast.success("Removed from watched");
  };

  const label = !watched
    ? "Mark watched"
    : rating != null
      ? `🍿 ${rating}/5`
      : "Watched · rate";

  const padding = size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={saving}
          aria-label="Rate this movie"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 rounded-full font-bold transition-colors disabled:opacity-60",
            padding,
            watched
              ? "bg-primary/15 text-primary hover:bg-primary/25"
              : "bg-secondary text-foreground hover:bg-secondary/70",
            className
          )}
        >
          {saving ? "…" : label}
          <span aria-hidden className="opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-44"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <DropdownMenuItem
            key={n}
            onSelect={() => void persist(n, true)}
            className="font-bold"
          >
            <span className="mr-2">{"🍿".repeat(n)}</span>
            <span className="text-muted-foreground">{n}/5</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void persist(null, true)}>
          Watched · no rating
        </DropdownMenuItem>
        {watched && (
          <DropdownMenuItem
            onSelect={() => void remove()}
            className="text-destructive focus:text-destructive"
          >
            Remove from watched
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
