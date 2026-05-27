"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-success shrink-0" />,
  error: <XCircle size={16} className="text-destructive shrink-0" />,
  info: <Info size={16} className="text-accent shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning shrink-0" />
};

const styles: Record<ToastType, string> = {
  success: "border-success/20 bg-success/5",
  error: "border-destructive/20 bg-destructive/5",
  info: "border-accent/20 bg-accent/5",
  warning: "border-warning/20 bg-warning/5"
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass-strong flex items-center gap-3 rounded-lg border px-4 py-3 shadow-glow-sm animate-slide-up",
              styles[t.type]
            )}
          >
            {icons[t.type]}
            <span className="text-sm text-foreground">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
