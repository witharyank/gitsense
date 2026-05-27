import { cn } from "@/lib/utils";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/60",
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3.5 animate-pulse rounded-md bg-muted/60",
            i === lines - 1 && "w-3/4"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/60" />
      <div className="mt-4 space-y-2.5">
        <div className="h-3 animate-pulse rounded-md bg-muted/60" style={{ animationDelay: "100ms" }} />
        <div className="h-3 w-5/6 animate-pulse rounded-md bg-muted/60" style={{ animationDelay: "200ms" }} />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-md bg-muted/60" style={{ animationDelay: "300ms" }} />
        <div className="h-6 w-20 animate-pulse rounded-md bg-muted/60" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return <div className={cn("animate-pulse rounded-full bg-muted/60", sizeClasses[size])} />;
}
