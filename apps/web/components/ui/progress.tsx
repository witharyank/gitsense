"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "gradient";
}

export function Progress({ value, max = 100, className, showLabel = false, variant = "default" }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            variant === "gradient"
              ? "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient"
              : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export function IndeterminateProgress({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-primary to-accent animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  );
}
