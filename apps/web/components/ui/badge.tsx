import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border border-border bg-muted text-foreground",
        primary: "border border-primary/20 bg-primary/10 text-primary",
        accent: "border border-accent/20 bg-accent/10 text-accent",
        success: "border border-success/20 bg-success/10 text-success",
        warning: "border border-warning/20 bg-warning/10 text-warning",
        destructive: "border border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border border-border text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* Map common programming languages to badge variants */
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "primary",
  javascript: "warning",
  python: "accent",
  rust: "destructive",
  go: "primary",
  java: "warning",
  ruby: "destructive",
  "c++": "accent",
  "c#": "accent",
  swift: "warning",
  kotlin: "accent",
  dart: "primary",
  php: "accent"
};

export function LanguageBadge({ language }: { language: string }) {
  const variant = (LANGUAGE_COLORS[language.toLowerCase()] || "default") as BadgeProps["variant"];
  return <Badge variant={variant}>{language}</Badge>;
}
