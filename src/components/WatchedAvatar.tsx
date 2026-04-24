import { Check } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
  /** Tooltip / aria text. Defaults to "<name> watched". */
  title?: string;
};

/**
 * Avatar with a small checkmark badge, used to indicate a member has
 * watched a movie. Composes UserAvatar so initials/fallback still apply.
 */
export function WatchedAvatar({ name, url, size = 36, className, title }: Props) {
  // Badge ~38% of avatar, min 14px so it's tappable / legible
  const badge = Math.max(14, Math.round(size * 0.38));
  return (
    <span
      className={cn("relative inline-block", className)}
      title={title ?? (name ? `${name} watched` : "Watched")}
      aria-label={title ?? (name ? `${name} watched` : "Watched")}
    >
      <UserAvatar name={name} url={url} size={size} />
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
        style={{ width: badge, height: badge }}
      >
        <Check
          strokeWidth={3.5}
          style={{ width: Math.round(badge * 0.62), height: Math.round(badge * 0.62) }}
        />
      </span>
    </span>
  );
}
