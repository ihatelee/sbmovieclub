import { useState } from "react";
import { Check, ChevronDown, UserCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type PickerProfile = {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
};

type Props = {
  profiles: PickerProfile[];
  value: string | null;
  onChange: (id: string | null) => void;
  size?: "sm" | "md";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Compact dropdown to choose who picked a movie. Shows avatar + first name.
 */
export function PickerSelect({
  profiles,
  value,
  onChange,
  size = "md",
  placeholder = "Pick someone…",
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = profiles.find((p) => p.id === value) ?? null;
  const avatarSize = size === "sm" ? 18 : 22;
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-secondary/80 py-1 pl-1 pr-2.5 font-bold transition-colors hover:bg-secondary disabled:opacity-50",
            textClass,
            className
          )}
        >
          {selected ? (
            <>
              <UserAvatar
                name={selected.first_name}
                url={selected.avatar_url}
                size={avatarSize}
              />
              <span>{selected.first_name ?? "Member"}</span>
            </>
          ) : (
            <>
              <UserCircle2
                className="text-muted-foreground"
                style={{ width: avatarSize, height: avatarSize }}
              />
              <span className="text-muted-foreground">{placeholder}</span>
            </>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuItem
          onSelect={() => onChange(null)}
          className="gap-2 text-muted-foreground"
        >
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center">
            {value === null && <Check className="h-3.5 w-3.5" />}
          </span>
          <span>No one yet</span>
        </DropdownMenuItem>
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => onChange(p.id)}
            className="gap-2 font-bold"
          >
            <UserAvatar name={p.first_name} url={p.avatar_url} size={22} />
            <span className="flex-1">{p.first_name ?? "Member"}</span>
            {value === p.id && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
