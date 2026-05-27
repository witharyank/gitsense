"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Code2,
  Copy,
  Database,
  File,
  FileText,
  Folder,
  GitCommit,
  Layers3,
  Network,
  Play,
  Send,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge, LanguageBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FullPageSpinner, InlineSpinner } from "@/components/ui/spinner";
import { IndeterminateProgress } from "@/components/ui/progress";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { api, type User, type Workspace } from "@/lib/api";

type Summary = Awaited<ReturnType<typeof api.summary>>;
type Intel = Awaited<ReturnType<typeof api.commitIntel>>;
type ArchitectureValue = string | string[] | Record<string, unknown> | Array<Record<string, unknown>>;
type ArchitectureJson = Record<string, ArchitectureValue>;
type ArchitectureSection = { key: string; title: string; value: ArchitectureValue };

const ARCHITECTURE_SECTIONS = [
  { key: "components", title: "Components", icon: Layers3 },
  { key: "flow", title: "Flow", icon: ArrowRight },
  { key: "entry_point", title: "Entry Point", icon: Play },
  { key: "entryPoint", title: "Entry Point", icon: Play },
  { key: "data_flow", title: "Data Flow", icon: Database },
  { key: "dataFlow", title: "Data Flow", icon: Database },
  { key: "overview", title: "Overview", icon: Network },
  { key: "structure", title: "Structure", icon: Folder }
] as const;

function WorkspaceContent() {
  const params = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const owner = params.owner ? decodeURIComponent(params.owner) : "";
  const repo = params.repo ? decodeURIComponent(params.repo) : "";

  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [readme, setReadme] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !repo) return;
    Promise.all([api.me(), api.workspace(owner, repo)])
      .then(([me, data]) => {
        setUser(me);
        setWorkspace(data);
      })
      .catch(() => router.push("/dashboard"));
  }, [owner, repo, router]);

  const selectedFiles = useMemo(
    () => workspace?.files.filter((f) => f.type === "file").slice(0, 3).map((f) => f.path) ?? [],
    [workspace]
  );

  async function runSummary() {
    setBusy("summary");
    try {
      setSummary(await api.summary(owner, repo));
      toast("Repository summary generated", "success");
    } catch {
      toast("Failed to generate summary", "error");
    } finally {
      setBusy(null);
    }
  }

  async function ask() {
    if (!question.trim()) return;
    const q = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: q }]);
    setBusy("chat");
    try {
      const response = await api.chat(owner, repo, q, selectedFiles);
      setChatHistory((prev) => [...prev, { role: "assistant", content: response.answer }]);
    } catch {
      toast("Failed to get response", "error");
    } finally {
      setBusy(null);
    }
  }

  async function analyzeCommits() {
    setBusy("commits");
    try {
      setIntel(await api.commitIntel(owner, repo));
      toast("Commit intelligence ready", "success");
    } catch {
      toast("Failed to analyze commits", "error");
    } finally {
      setBusy(null);
    }
  }

  async function generateReadme() {
    setBusy("readme");
    try {
      const response = await api.readme(owner, repo);
      setReadme(response.markdown);
      toast("README generated", "success");
    } catch {
      toast("Failed to generate README", "error");
    } finally {
      setBusy(null);
    }
  }

  async function copyReadme() {
    await navigator.clipboard.writeText(readme);
    toast("Copied to clipboard", "success");
  }

  if (!workspace) {
    return (
      <AppShell user={null}>
        <FullPageSpinner message={`Loading ${owner}/${repo}...`} />
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      {/* Busy progress bar */}
      {busy && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <IndeterminateProgress />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft size={14} />
              Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="primary" className="mb-3">
              <Sparkles size={10} />
              Repository workspace
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {workspace.repository.full_name}
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {workspace.repository.description ?? "No repository description provided."}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Star size={16} />} label="Stars" value={workspace.repository.stars.toString()} />
          <StatCard
            icon={<Code2 size={16} />}
            label="Language"
            value={workspace.repository.language ?? "Unknown"}
          />
          <StatCard icon={<Users size={16} />} label="Contributors" value={workspace.contributors.length.toString()} />
          <StatCard
            icon={<Layers3 size={16} />}
            label="Technologies"
            value={workspace.technologies.length.toString()}
          />
        </div>
      </div>

      {/* Tabbed workspace */}
      <Tabs defaultValue="overview" className="animate-slide-up delay-100">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" icon={<Code2 size={15} />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="chat" icon={<Bot size={15} />}>
            Chat
          </TabsTrigger>
          <TabsTrigger value="commits" icon={<GitCommit size={15} />}>
            Commits
          </TabsTrigger>
          <TabsTrigger value="docs" icon={<FileText size={15} />}>
            Docs
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ───────────────────── */}
        <TabsContent value="overview">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            {/* Structure & stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 size={16} className="text-primary" />
                  Structure &amp; stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-5 flex flex-wrap gap-2">
                  {workspace.technologies.map((tech) => (
                    <LanguageBadge key={tech} language={tech} />
                  ))}
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {workspace.files.map((node) => (
                    <div
                      key={node.path}
                      className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      {node.type === "dir" ? (
                        <Folder size={15} className="shrink-0 text-primary" />
                      ) : (
                        <File size={15} className="shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate font-mono text-xs">{node.path}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={16} className="text-accent" />
                  Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workspace.contributors.map((c) => (
                  <div
                    key={c.login}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar src={c.avatar_url} alt={c.login} fallback={c.login} size="sm" />
                      <span className="truncate text-sm font-medium">{c.login}</span>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {c.contributions} commits
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          <div className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot size={16} className="text-primary" />
                    AI Repository Summary
                  </CardTitle>
                  <Button onClick={runSummary} loading={busy === "summary"} size="sm">
                    <Sparkles size={14} />
                    {summary ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {busy === "summary" ? (
                  <div className="py-8">
                    <InlineSpinner message="Analyzing repository with AI..." />
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    <SummaryBlock title="Overview" text={summary.overview} />
                    <ArchitectureSummary text={summary.architecture} />
                    <StackSummary items={summary.detected_stack} />
                    <SummaryBlock title="Purpose" text={summary.probable_purpose} />
                    <SummaryBlock title="Beginner explanation" text={summary.beginner_explanation} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    Click &quot;Generate&quot; to create an AI-powered summary of this repository&apos;s architecture,
                    stack, purpose, and onboarding context.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Chat Tab ───────────────────────── */}
        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ minHeight: "60vh" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot size={16} className="text-primary" />
                Codebase Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-[50vh]">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot size={28} />
                    </div>
                    <h3 className="font-semibold">Ask anything about this codebase</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      GitSense uses repository context to answer questions like a senior engineer would.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {[
                        "How is authentication handled?",
                        "What's the project architecture?",
                        "Where are API routes defined?"
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuestion(q);
                          }}
                          className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed animate-slide-up ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "border border-border bg-muted/40 text-foreground rounded-bl-md"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {busy === "chat" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-border bg-muted/40 px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary animate-[typing-dot_1.2s_infinite]" />
                        <span className="h-2 w-2 rounded-full bg-primary animate-[typing-dot_1.2s_infinite_0.2s]" />
                        <span className="h-2 w-2 rounded-full bg-primary animate-[typing-dot_1.2s_infinite_0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()}
                  placeholder="Ask about this repository..."
                  className="flex-1"
                  disabled={busy === "chat"}
                />
                <Button onClick={ask} disabled={busy === "chat" || !question.trim()} size="icon">
                  <Send size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Commits Tab ────────────────────── */}
        <TabsContent value="commits">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitCommit size={16} className="text-primary" />
                  Commit Intelligence
                </CardTitle>
                <Button onClick={analyzeCommits} loading={busy === "commits"} size="sm" variant="secondary">
                  <Sparkles size={14} />
                  {intel ? "Re-analyze" : "Analyze with AI"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {busy === "commits" ? (
                <div className="py-8">
                  <InlineSpinner message="Analyzing commit history..." />
                </div>
              ) : intel ? (
                <div className="space-y-4">
                  <SummaryBlock title="Weekly Progress" text={intel.weekly_progress_summary} />
                  {intel.commit_summaries.map((s, i) => (
                    <SummaryBlock key={i} title={`Commit ${i + 1}`} text={s} />
                  ))}
                  {intel.contributor_insights.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="mb-3 text-sm font-semibold text-foreground">Contributor Insights</div>
                      <ul className="space-y-2">
                        {intel.contributor_insights.map((insight, i) => (
                          <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {workspace.commits.slice(0, 8).map((commit) => (
                    <div
                      key={commit.sha}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GitCommit size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-primary">
                            {commit.sha.slice(0, 7)}
                          </span>
                          {commit.author_name && (
                            <span className="text-xs text-muted-foreground">by {commit.author_name}</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{commit.message}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Click &quot;Analyze with AI&quot; for intelligent commit summaries
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Docs Tab ──────────────────────── */}
        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  README Generator
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={generateReadme} loading={busy === "readme"} size="sm">
                    <Sparkles size={14} />
                    {readme ? "Regenerate" : "Generate"}
                  </Button>
                  {readme && (
                    <Button variant="secondary" size="sm" onClick={copyReadme}>
                      <Copy size={14} />
                      Copy
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {busy === "readme" ? (
                <div className="py-8">
                  <InlineSpinner message="Generating README..." />
                </div>
              ) : (
                <Textarea
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  placeholder="Click &quot;Generate&quot; to create a professional README for this repository."
                  className="min-h-[400px] font-mono text-sm leading-relaxed"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ─── Helper Components ───────────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight truncate">{value}</div>
    </GlassCard>
  );
}

function SummaryBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-2 text-sm font-semibold text-foreground">{title}</div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function StackSummary({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-3 text-sm font-semibold text-foreground">Detected Stack</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="primary">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ArchitectureSummary({ text }: { text: string }) {
  const parsed = parseArchitecture(text);
  if (!parsed) return <SummaryBlock title="Architecture" text={text} />;

  const sections = getArchitectureSections(parsed);
  if (!sections.length) return <SummaryBlock title="Architecture" text={text} />;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Architecture</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Structured map generated from the AI summary.
          </p>
        </div>
        <Sparkles size={16} className="shrink-0 text-primary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <ArchitectureCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}

function ArchitectureCard({ section }: { section: ArchitectureSection }) {
  const config = ARCHITECTURE_SECTIONS.find((item) => item.key === section.key);
  const Icon = config?.icon ?? Network;
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-card/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={14} />
        </span>
        {section.title}
      </div>
      <ArchitectureValueView value={section.value} />
    </div>
  );
}

function ArchitectureValueView({ value }: { value: ArchitectureValue }) {
  if (typeof value === "string") {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{value}</p>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1.5">
        {value.map((item, i) => (
          <li key={i} className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground">
            {renderInlineValue(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="space-y-1.5">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="rounded-md bg-muted/50 px-2.5 py-1.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-primary">{formatTitle(key)}</dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{renderInlineValue(item)}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── Utilities ───────────────────────────────── */

function renderInlineValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(renderInlineValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${formatTitle(k)}: ${renderInlineValue(v)}`)
      .join("; ");
  }
  return String(value);
}

function parseArchitecture(text: string): ArchitectureJson | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
    return parsed as ArchitectureJson;
  } catch {
    return null;
  }
}

function getArchitectureSections(parsed: ArchitectureJson): ArchitectureSection[] {
  const preferred = ARCHITECTURE_SECTIONS.flatMap(({ key, title }) => {
    const value = parsed[key];
    return value == null ? [] : [{ key, title, value }];
  });
  const used = new Set<string>(preferred.map((s) => s.key));
  const remaining = Object.entries(parsed)
    .filter(([key, value]) => !used.has(key) && value != null)
    .map(([key, value]) => ({ key, title: formatTitle(key), value }));
  return [...preferred, ...remaining];
}

function formatTitle(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RepositoryWorkspacePage() {
  return (
    <ToastProvider>
      <WorkspaceContent />
    </ToastProvider>
  );
}
