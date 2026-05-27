"use client";

import { useEffect, useState } from "react";
import { Github, Sparkles, Code2, MessageSquareText, FileText, GitCommit, ArrowRight, Zap, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const FEATURES = [
  {
    icon: Eye,
    title: "Repository Intelligence",
    description: "Deep analysis of architecture, tech stack, file structure, and contributor patterns."
  },
  {
    icon: MessageSquareText,
    title: "Codebase Chat",
    description: "Ask questions grounded in actual code. Get answers a senior engineer would give."
  },
  {
    icon: GitCommit,
    title: "Commit Intelligence",
    description: "AI summaries of commit history, contributor insights, and weekly progress reports."
  },
  {
    icon: FileText,
    title: "README Generator",
    description: "Auto-generate professional documentation with setup steps, usage, and contribution guides."
  }
];

const TERMINAL_LINES = [
  { text: "gitsense://analysis", style: "muted" as const, delay: 0 },
  { text: "→ scanning repository structure...", style: "muted" as const, delay: 400 },
  { text: "✓ summary.ready", style: "primary" as const, delay: 800 },
  { text: "  architecture: app router + service layer", style: "default" as const, delay: 1200 },
  { text: "  risk: missing auth tests in payment flow", style: "warning" as const, delay: 1600 },
  { text: "  docs: README generated with setup steps", style: "default" as const, delay: 2000 },
  { text: '  chat: "where does OAuth callback persist users?"', style: "muted" as const, delay: 2400 }
];

export default function Home() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + 600)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  async function login() {
    const { url } = await api.authUrl();
    window.location.href = url;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/8 blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-48 h-[500px] w-[500px] rounded-full bg-accent/6 blur-[140px] animate-float delay-700" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/5 blur-[100px] animate-float delay-300" />
      </div>

      {/* ─── Top bar ──────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-primary">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">GitSense</span>
        </div>
        <Button variant="outline" size="sm" onClick={login}>
          <Github size={16} />
          Sign in
        </Button>
      </header>

      {/* ─── Hero ─────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 md:px-12 md:pt-28 md:pb-32">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          {/* Left: Copy */}
          <div className="animate-slide-up">
            <Badge variant="primary" className="mb-6">
              <Zap size={12} />
              AI-Powered Developer Workspace
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Understand any repo{" "}
              <span className="text-gradient">like a senior engineer</span>{" "}
              joined the review.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Connect GitHub, inspect repositories, ask codebase-aware questions,
              summarize commits, and generate docs — from one focused developer cockpit.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button variant="glow" size="lg" onClick={login}>
                <Github size={18} />
                Continue with GitHub
                <ArrowRight size={16} />
              </Button>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={14} />
                Free &middot; No credit card required
              </span>
            </div>
          </div>

          {/* Right: Animated terminal */}
          <div className="animate-slide-up delay-200">
            <GlassCard className="relative overflow-hidden animate-glow-pulse">
              {/* Fake terminal header */}
              <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">gitsense — analysis</span>
              </div>
              <div className="p-5 font-mono text-sm leading-7">
                {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
                  <div
                    key={i}
                    className={`animate-fade-in ${
                      line.style === "primary"
                        ? "text-primary font-semibold"
                        : line.style === "warning"
                        ? "text-warning"
                        : line.style === "muted"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
                {visibleLines < TERMINAL_LINES.length && (
                  <span className="inline-block h-4 w-2 animate-pulse bg-primary/70 rounded-sm" />
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ─── Feature cards ────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-12">
        <div className="mb-12 text-center animate-slide-up">
          <Badge variant="accent" className="mb-4">
            <Code2 size={12} />
            Capabilities
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to <span className="text-gradient">understand code</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Four AI-powered workflows that turn any GitHub repository into actionable intelligence.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <GlassCard
                key={feature.title}
                className="group cursor-default p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow animate-slide-up"
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────── */}
      <footer className="relative z-10 border-t border-border/50 glass-strong px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles size={14} className="text-primary" />
            GitSense &copy; {new Date().getFullYear()}
          </div>
          <div className="text-sm text-muted-foreground">
            Built for developers, by developers.
          </div>
        </div>
      </footer>
    </main>
  );
}
