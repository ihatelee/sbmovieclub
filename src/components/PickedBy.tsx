import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type Picker = {
  first_name: string | null;
  avatar_url: string | null;
};

type Props = {
  picker?: Picker | null;
  /** Plain text fallback when no linked picker profile exists. */
  fallbackName?: string | null;
  /** When provided, the pill becomes a link to /profile/$userId. */
  linkUserId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * When true, render only the avatar + name (no "Picked by" label prefix).
   * Useful for table cells with their own column header.
   */
  bare?: boolean;
};

const AVATAR_SIZE = { sm: 20, md: 24, lg: 32 } as const;
const TEXT_CLASS = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
} as const;

/**
 * Compact "Picked by <Avatar> <Name>" pill.
 * Falls back to a plain-text picker name when no linked profile exists.
 * Renders nothing when neither a picker profile nor a fallback name is given.
 */
export function PickedBy({
  picker,
  fallbackName,
  linkUserId,
  size = "md",
  className,
  bare = false,
}: Props) {
  const name = picker?.first_name ?? fallbackName ?? null;
  if (!name) return null;

  const pillClass = cn(
    "inline-flex items-center gap-2 rounded-full bg-secondary/80 py-1 pl-1 pr-3 font-bold",
    TEXT_CLASS[size],
    linkUserId && "transition-colors hover:bg-secondary",
    className
  );

  const inner = (
    <>
      <UserAvatar
        name={name}
        url={picker?.avatar_url ?? null}
        size={AVATAR_SIZE[size]}
      />
      {!bare && <span className="text-muted-foreground">Picked by</span>}
      <span>{name}</span>
    </>
  );

  if (linkUserId) {
    return (
      <Link
        to="/profile/$userId"
        params={{ userId: linkUserId }}
        className={pillClass}
      >
        {inner}
      </Link>
    );
  }

  return <span className={pillClass}>{inner}</span>;
}
