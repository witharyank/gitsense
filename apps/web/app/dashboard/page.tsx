"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GitBranch, RefreshCw, Search, Star, TrendingUp, WandSparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SkeletonCard } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, GlassCard, HoverCard } from "@/components/ui/card";
import { Badge, LanguageBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { api, type Repository, type User } from "@/lib/api";

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([api.me(), api.repositories()])
      .then(([me, repositories]) => {
        setUser(me);
        setRepos(repositories);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  const topLanguages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language).filter(Boolean))) as string[],
    [repos]
  );

  const filteredRepos = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q)
    );
  }, [repos, search]);

  async function sync() {
    setSyncing(true);
    try {
      const updated = await api.syncRepositories();
      setRepos(updated);
      toast("Repositories synced from GitHub", "success");
    } catch {
      toast("Failed to sync repositories", "error");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <AppShell user={null}>
        <FullPageSpinner message="Loading your workspace..." />
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary">
              <Zap size={10} />
              Developer dashboard
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connected repositories, activity, and AI-ready code intelligence in one place.
          </p>
        </div>
        <Button onClick={sync} loading={syncing}>
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          Sync GitHub
        </Button>
      </div>

      {/* Metric cards */}
      <div id="insights" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up delay-100">
        <MetricCard
          icon={<TrendingUp size={20} />}
          title="Repositories"
          value={repos.length.toString()}
          note="Synced from GitHub"
          gradient="from-primary/20 to-primary/5"
        />
        <MetricCard
          icon={<Star size={20} />}
          title="Primary Stack"
          value={topLanguages[0] ?? "Detecting"}
          note={topLanguages.slice(0, 5).join(", ") || "Sync repositories to detect"}
          gradient="from-accent/20 to-accent/5"
        />
        <MetricCard
          icon={<WandSparkles size={20} />}
          title="AI Workflows"
          value="4"
          note="Summary, chat, commits, README"
          gradient="from-warning/20 to-warning/5"
        />
      </div>

      {/* Repository list */}
      <section id="repositories" className="mt-10 animate-slide-up delay-200">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Connected repositories</h2>
            <Badge variant="outline">{repos.length} total</Badge>
          </div>
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {repos.length === 0 && !loading ? (
          <GlassCard className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <RefreshCw size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No repositories yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Click &quot;Sync GitHub&quot; to import your repositories and start analyzing them with AI.
            </p>
            <Button onClick={sync} loading={syncing} className="mt-6">
              <RefreshCw size={16} />
              Sync now
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRepos.map((repo, i) => (
              <Link key={repo.id} href={`/repositories/${repo.owner}/${repo.name}`}>
                <HoverCard
                  className="h-full p-5 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold truncate text-sm">{repo.full_name}</h3>
                    <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                      <Star size={13} />
                      <span className="text-xs tabular-nums">{repo.stars}</span>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground min-h-[2.5rem] leading-relaxed">
                    {repo.description ?? "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {repo.language && <LanguageBadge language={repo.language} />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GitBranch size={13} />
                      {repo.default_branch ?? "main"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open workspace <ArrowRight size={12} />
                  </div>
                </HoverCard>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Activity & Insights */}
      <section id="activity" className="mt-10 grid gap-4 lg:grid-cols-2 animate-slide-up delay-300">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sync repositories to see activity.</p>
            ) : (
              <div className="space-y-1">
                {repos.slice(0, 6).map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate font-medium">{repo.full_name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {repo.last_updated_at?.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="chat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WandSparkles size={16} className="text-accent" />
              AI insight cards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "Ask where logic lives and get answers grounded in repository structure.", icon: "💡" },
              { text: "Generate beginner-friendly summaries for onboarding and review.", icon: "📖" },
              { text: "Export README drafts with installation, usage, and contribution sections.", icon: "📝" }
            ].map((item) => (
              <div
                key={item.text}
                id={item.icon === "📝" ? "docs" : undefined}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <span className="text-base leading-none shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function MetricCard({
  icon,
  title,
  value,
  note,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  note: string;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
      <CardContent className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/80 text-primary border border-border/50">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
