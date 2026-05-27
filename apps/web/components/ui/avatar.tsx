import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-xs", pixels: 32 },
  md: { container: "h-10 w-10", text: "text-sm", pixels: 40 },
  lg: { container: "h-14 w-14", text: "text-base", pixels: 56 }
};

export function Avatar({ src, alt = "", fallback, size = "md", className }: AvatarProps) {
  const { container, text, pixels } = sizeMap[size];
  const initials = fallback
    ? fallback
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (src) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-full ring-2 ring-border", container, className)}>
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-border font-medium text-muted-foreground",
        container,
        text,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({
  children,
  max = 5,
  className
}: {
  children: React.ReactNode[];
  max?: number;
  className?: string;
}) {
  const visible = children.slice(0, max);
  const remaining = children.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible}
      {remaining > 0 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background">
          +{remaining}
        </div>
      )}
    </div>
  );
}
