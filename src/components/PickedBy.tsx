import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type Picker = {
  first_name: string | null;
  avatar_url: string | null;
};

type Props = {
  picker?: Picker | null;
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
 * Renders nothing when the picker is unknown.
 */
export function PickedBy({ picker, size = "md", className, bare = false }: Props) {
  if (!picker || !picker.first_name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-secondary/80 py-1 pl-1 pr-3 font-bold",
        TEXT_CLASS[size],
        className
      )}
    >
      <UserAvatar
        name={picker.first_name}
        url={picker.avatar_url}
        size={AVATAR_SIZE[size]}
      />
      {!bare && (
        <span className="text-muted-foreground">Picked by</span>
      )}
      <span>{picker.first_name}</span>
    </span>
  );
}
