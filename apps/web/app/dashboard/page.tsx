"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, RefreshCw, Star, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SkeletonBlock } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Repository, type User } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([api.me(), api.repositories()])
      .then(([me, repositories]) => {
        setUser(me);
        setRepos(repositories);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  const topLanguages = useMemo(() => Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).slice(0, 6), [repos]);

  async function sync() {
    setSyncing(true);
    try {
      setRepos(await api.syncRepositories());
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppShell user={user}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-primary">Developer dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
          <p className="mt-2 text-muted-foreground">Connected repositories, activity, and AI-ready code intelligence in one place.</p>
        </div>
        <Button onClick={sync} disabled={syncing}>
          <RefreshCw size={17} className={syncing ? "animate-spin" : ""} />
          Sync GitHub
        </Button>
      </div>

      <div id="insights" className="grid gap-4 md:grid-cols-3">
        <Metric title="Repositories" value={repos.length.toString()} note="Synced from GitHub" />
        <Metric title="Primary Stack" value={topLanguages[0] ?? "Detecting"} note={topLanguages.join(", ") || "Sync repositories to detect"} />
        <Metric title="AI Workflows" value="4" note="Summary, chat, commits, README" />
      </div>

      <section id="repositories" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Connected repositories</h2>
          <span className="text-sm text-muted-foreground">{repos.length} total</span>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className="h-40" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repos.map((repo) => (
              <Link key={repo.id} href={`/repositories/${repo.owner}/${repo.name}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/60">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span className="truncate">{repo.full_name}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star size={15} />{repo.stars}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{repo.description ?? "No description provided."}</p>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="rounded-md bg-muted px-2 py-1">{repo.language ?? "Unknown"}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><GitBranch size={15} />{repo.default_branch ?? "main"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="activity" className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {repos.slice(0, 5).map((repo) => <div key={repo.id} className="flex justify-between gap-4 border-b pb-3 last:border-0"><span>{repo.full_name}</span><span>{repo.last_updated_at?.slice(0, 10)}</span></div>)}
          </CardContent>
        </Card>
        <Card id="chat">
          <CardHeader><CardTitle className="flex items-center gap-2"><WandSparkles size={18} /> AI insight cards</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>Ask where logic lives and get answers grounded in repository structure.</div>
            <div>Generate beginner-friendly summaries for onboarding and review.</div>
            <div id="docs">Export README drafts with installation, usage, and contribution sections.</div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
