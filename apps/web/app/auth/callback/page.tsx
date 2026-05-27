"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    // The backend OAuth callback redirects to /dashboard with the session cookie set.
    // This page exists as a fallback if someone navigates here directly.
    // Try to check auth status and redirect accordingly.
    api
      .me()
      .then(() => router.replace("/dashboard"))
      .catch(() => setError(true));
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Authentication failed</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            We couldn&apos;t complete the sign-in process. This may be due to an expired or invalid session.
          </p>
          <Button onClick={() => router.push("/")} className="mt-6">
            Back to home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="relative mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-primary">
            <Sparkles size={24} className="animate-pulse" />
          </div>
        </div>
        <h1 className="text-xl font-semibold">Completing GitHub sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Setting up your workspace...
        </p>
        <div className="mt-6 mx-auto h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-accent animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  );
}
