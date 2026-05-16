"use client";

import { Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function Home() {
  async function login() {
    const { url } = await api.authUrl();
    window.location.href = url;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-5xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={21} />
          </div>
          <div>
            <div className="text-xl font-semibold">GitSense</div>
            <div className="text-sm text-muted-foreground">AI workspace for GitHub repositories</div>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Understand any repository like a senior engineer joined the review.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Connect GitHub, inspect repositories, ask codebase-aware questions, summarize commits, and generate contributor-ready docs from one focused developer cockpit.
            </p>
            <Button onClick={login} className="mt-8 h-12 px-6">
              <Github size={19} />
              Continue with GitHub
            </Button>
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="rounded-md border bg-background p-4 font-mono text-sm">
                <div className="mb-4 text-muted-foreground">gitsense://analysis</div>
                <div className="space-y-3">
                  <div className="text-primary">summary.ready</div>
                  <div>architecture: app router + service layer</div>
                  <div>risk: missing auth tests in payment flow</div>
                  <div>docs: README generated with setup steps</div>
                  <div className="text-muted-foreground">chat: "where does OAuth callback persist users?"</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
