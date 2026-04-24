import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type Props = {
  name: string | null;
  url: string | null;
  size?: number;
  rating?: number | null;
  className?: string;
};

/**
 * Avatar with a small checkmark badge to indicate the member has watched.
 * Optionally shows the rating below the badge in a tooltip.
 */
export function WatchedAvatar({ name, url, size = 36, rating, className }: Props) {
  const title = rating != null ? `${name ?? "Member"} — 🍿 ${rating}/5` : `${name ?? "Member"} watched`;
  return (
    <span
      title={title}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <UserAvatar name={name} url={url} size={size} />
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
        style={{ width: Math.max(14, size * 0.45), height: Math.max(14, size * 0.45), fontSize: Math.max(9, size * 0.28) }}
      >
        ✓
      </span>
    </span>
  );
}
