import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn("animate-spin text-primary", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function FullPageSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border shadow-glow-primary">
          <Sparkles size={24} className="text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function InlineSpinner({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Spinner size={16} />
      {message && <span>{message}</span>}
    </div>
  );
}
