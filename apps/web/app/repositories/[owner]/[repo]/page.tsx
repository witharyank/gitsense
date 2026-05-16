"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bot, Code2, Copy, File, Folder, GitCommit, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SkeletonBlock } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type User, type Workspace } from "@/lib/api";

type Summary = Awaited<ReturnType<typeof api.summary>>;
type Intel = Awaited<ReturnType<typeof api.commitIntel>>;

export default function RepositoryWorkspacePage() {
  const params = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const owner = decodeURIComponent(params.owner);
  const repo = decodeURIComponent(params.repo);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [readme, setReadme] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.me(), api.workspace(owner, repo)])
      .then(([me, data]) => {
        setUser(me);
        setWorkspace(data);
      })
      .catch(() => router.push("/"));
  }, [owner, repo, router]);

  const selectedFiles = useMemo(() => workspace?.files.filter((file) => file.type === "file").slice(0, 3).map((file) => file.path) ?? [], [workspace]);

  async function runSummary() {
    setBusy("summary");
    try {
      setSummary(await api.summary(owner, repo));
    } finally {
      setBusy(null);
    }
  }

  async function ask() {
    if (!question.trim()) return;
    setBusy("chat");
    try {
      const response = await api.chat(owner, repo, question, selectedFiles);
      setAnswer(response.answer);
    } finally {
      setBusy(null);
    }
  }

  async function analyzeCommits() {
    setBusy("commits");
    try {
      setIntel(await api.commitIntel(owner, repo));
    } finally {
      setBusy(null);
    }
  }

  async function generateReadme() {
    setBusy("readme");
    try {
      const response = await api.readme(owner, repo);
      setReadme(response.markdown);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell user={user}>
      {!workspace ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-28" />
          <div className="grid gap-4 lg:grid-cols-3">
            <SkeletonBlock className="h-96 lg:col-span-2" />
            <SkeletonBlock className="h-96" />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-primary">Repository workspace</p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{workspace.repository.full_name}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{workspace.repository.description ?? "No repository description provided."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={runSummary} disabled={busy === "summary"}><Sparkles size={17} />Summarize</Button>
              <Button variant="secondary" onClick={analyzeCommits} disabled={busy === "commits"}><GitCommit size={17} />Commits</Button>
              <Button variant="secondary" onClick={generateReadme} disabled={busy === "readme"}><Copy size={17} />README</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Stars" value={workspace.repository.stars.toString()} />
            <Stat label="Language" value={workspace.repository.language ?? "Unknown"} />
            <Stat label="Contributors" value={workspace.contributors.length.toString()} />
            <Stat label="Technologies" value={workspace.technologies.length.toString()} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Code2 size={18} /> Structure and stack</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {workspace.technologies.map((tech) => <span key={tech} className="rounded-md bg-muted px-2 py-1 text-sm">{tech}</span>)}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {workspace.files.map((node) => (
                    <div key={node.path} className="flex min-w-0 items-center gap-2 rounded-md border bg-background/60 px-3 py-2 text-sm">
                      {node.type === "dir" ? <Folder size={16} className="text-primary" /> : <File size={16} className="text-muted-foreground" />}
                      <span className="truncate">{node.path}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users size={18} /> Contributors</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {workspace.contributors.map((contributor) => (
                  <div key={contributor.login} className="flex items-center justify-between gap-3 rounded-md border bg-background/60 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {contributor.avatar_url ? <img src={contributor.avatar_url} alt="" className="h-8 w-8 rounded-full" /> : null}
                      <span className="truncate text-sm">{contributor.login}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{contributor.contributions}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot size={18} /> AI repository summary</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {summary ? (
                  <>
                    <Block title="Overview" text={summary.overview} />
                    <Block title="Architecture" text={summary.architecture} />
                    <Block title="Purpose" text={summary.probable_purpose} />
                    <Block title="Beginner explanation" text={summary.beginner_explanation} />
                  </>
                ) : (
                  <p>Generate a summary to explain architecture, stack, purpose, and onboarding context.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Codebase chat</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask where API logic exists..." />
                <Button onClick={ask} disabled={busy === "chat"}>Ask GitSense</Button>
                {answer ? <div className="whitespace-pre-wrap rounded-md border bg-background/60 p-4 text-sm leading-6 text-muted-foreground">{answer}</div> : null}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Commit intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {intel ? (
                  <>
                    <Block title="Weekly progress" text={intel.weekly_progress_summary} />
                    {intel.commit_summaries.map((item, index) => <Block key={index} title={`Commit ${index + 1}`} text={item} />)}
                  </>
                ) : (
                  workspace.commits.slice(0, 6).map((commit) => (
                    <div key={commit.sha} className="rounded-md border bg-background/60 p-3">
                      <div className="font-mono text-xs text-primary">{commit.sha.slice(0, 7)}</div>
                      <div className="mt-1 line-clamp-2">{commit.message}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>README generator</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={readme} onChange={(event) => setReadme(event.target.value)} placeholder="Generate a README to preview markdown here." className="min-h-80 font-mono" />
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(readme)} disabled={!readme}><Copy size={17} />Copy markdown</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="mb-1 font-medium text-foreground">{title}</div>
      <p className="leading-6">{text}</p>
    </div>
  );
}
