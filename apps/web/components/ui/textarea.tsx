import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("min-h-28 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
