import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  url?: string | null;
  size?: number; // px
  className?: string;
};

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export function UserAvatar({ name, url, size = 32, className }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!url && !failed;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-foreground",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.42)),
      }}
      aria-label={name ?? "Member"}
    >
      {showImage ? (
        <img
          src={url!}
          alt={name ? `${name}'s avatar` : "Member avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-black tracking-tight">{initials(name)}</span>
      )}
    </div>
  );
}
