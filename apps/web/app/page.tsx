"use client";

import { useEffect, useState, useRef } from "react";
import {
  Github,
  Sparkles,
  Code2,
  MessageSquareText,
  FileText,
  GitCommit,
  ArrowRight,
  Zap,
  Shield,
  Eye,
  Star,
  Activity,
  Terminal,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  Lock,
  ExternalLink,
  Users,
  ShieldCheck,
  Heart,
  HelpCircle,
  Copy,
  FolderGit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

// Capabilities / Bento Grid static data
const FEATURES = [
  {
    icon: Eye,
    title: "Deep Repository Intelligence",
    badge: "Insight",
    description: "Deep-dives into project structure, architecture, package manifests, and code dependencies instantly.",
    className: "md:col-span-2"
  },
  {
    icon: MessageSquareText,
    title: "Context-Aware Code Chat",
    badge: "Interactive",
    description: "Ask technical questions grounded in your actual code base. Get production-grade answers instantly.",
    className: "md:col-span-1"
  },
  {
    icon: GitCommit,
    title: "AI Commit Intelligence",
    badge: "Velocity",
    description: "Auto-summarize commit history, review architectural impacts, and map developer contributions.",
    className: "md:col-span-1"
  },
  {
    icon: FileText,
    title: "README & Docs Auto-Generator",
    badge: "Efficiency",
    description: "Create standard README files, install instructions, developer guides, and contribution guidelines on autopilot.",
    className: "md:col-span-2"
  }
];

const SCANNING_STEPS = [
  { text: "gitsense://analysis-agent.start", style: "muted" as const },
  { text: "→ cloning repository head...", style: "muted" as const },
  { text: "✓ git tree cloned successfully (124 modules)", style: "success" as const },
  { text: "→ parsing AST trees & module imports...", style: "muted" as const },
  { text: "✓ parsed 48 package targets in 320ms", style: "primary" as const },
  { text: "  architecture: Next.js App Router + monorepo architecture", style: "default" as const },
  { text: "  database: PostgreSQL via Prisma ORM client", style: "default" as const },
  { text: "⚠ warning: missing CSRF headers in /api/webhook", style: "warning" as const },
  { text: "✓ documentation scan complete", style: "success" as const },
  { text: 'chat indexer ready: search vector maps updated successfully', style: "primary" as const }
];

const FAQ_ITEMS = [
  {
    question: "How secure is GitSense? Does it store my codebase?",
    answer: "No, we never store your codebase. GitSense securely accesses your repository via GitHub OAuth on-the-fly, creating temporary, highly-secure semantic mapping indexes. Your source files are fully private and never used to train global AI models."
  },
  {
    question: "Does GitSense support both public and private repositories?",
    answer: "Yes, absolutely! When you connect with GitHub, you can selectively authorize access to both public repositories and private repositories. You maintain absolute, granular control over access scopes at all times."
  },
  {
    question: "How does the Context-Aware Chat understand codebase structure?",
    answer: "Unlike simple LLM windows, GitSense builds a complete Abstract Syntax Tree (AST) map of folder structures, import-export relationships, and active routes. This semantic graph is injected directly into context to give highly accurate, senior-grade responses."
  },
  {
    question: "Is there a repository size or complexity limit?",
    answer: "Our standard pricing supports indexing codebases up to 500,000 lines of code. For massive enterprise monorepos, we provide custom configurations with dedicated semantic databases and isolated runners."
  },
  {
    question: "How does the README generator determine installation steps?",
    answer: "GitSense inspects package manifest files (package.json, Cargo.toml, go.mod), active service configs, dockerfiles, and environment setups to accurately compile clean, professional setup guides that you can instantly commit."
  }
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "scan" | "insights">("chat");
  const [chatTopic, setChatTopic] = useState<"oauth" | "folder" | "security">("oauth");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; code?: string }>>([]);
  const [visibleScanLines, setVisibleScanLines] = useState(6);
  const [scanningActive, setScanningActive] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  // Detect scroll to style Navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle active simulator chat changes
  useEffect(() => {
    setChatTyping(true);
    setChatMessages([]);

    const timer1 = setTimeout(() => {
      let userQuery = "";
      let aiResponse = "";
      let codeSnippet = "";

      if (chatTopic === "oauth") {
        userQuery = "Where are OAuth callback tokens validated in this code?";
        aiResponse = "OAuth callback validation is handled inside `/app/auth/callback/route.ts`. The exchange token logic communicates directly with your secure API client, setting authentication cookies via HTTP-only flags. Here is the active code handler:";
        codeSnippet = `// apps/web/app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (code) {
    const { user, token } = await api.exchangeCode(code);
    await cookies().set("auth_token", token, { 
      httpOnly: true,
      secure: true,
      sameSite: "lax"
    });
  }
  return NextResponse.redirect("/dashboard");
}`;
      } else if (chatTopic === "folder") {
        userQuery = "Generate a technical audit of the current project modules.";
        aiResponse = "Here is the architectural review for this workspace. The repository utilizes a modern Turborepo design structure divided into core modules:";
        codeSnippet = `// Repository Structural Overview
├── apps/
│   └── web/            # Next.js 15 Client utilizing Tailwind CSS
├── packages/
│   ├── tsconfig/       # Shared TypeScript environments
│   └── ui/             # Core UI Design system and Radix tokens
└── lib/
    ├── api.ts          # Authentication and GitHub SDK exchange
    └── utils.ts        # Dynamic Class merger helper definitions`;
      } else {
        userQuery = "Find architectural warnings or security issues.";
        aiResponse = "Analyzing file maps for security threats... Identified one high-priority configuration risk regarding custom webhooks. All standard token storages are secure:";
        codeSnippet = `// ⚠ HIGH: CSRF vulnerability detected in /app/api/webhook/route.ts
// Remediation: Implement dynamic token signatures or check signature headers
export async function POST(req: Request) {
  const sig = req.headers.get("x-gitsense-signature");
  if (!verifySignature(req.body, sig)) {
    return new Response("Invalid signature", { status: 401 });
  }
  // Proceed securely...
}`;
      }

      setChatMessages([{ sender: "user", text: userQuery }]);
      
      const timer2 = setTimeout(() => {
        setChatTyping(false);
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: aiResponse, code: codeSnippet }
        ]);
      }, 1200);

      return () => clearTimeout(timer2);
    }, 400);

    return () => clearTimeout(timer1);
  }, [chatTopic]);

  // Handle Scanning Animation simulator
  const handleRerunScan = () => {
    if (scanningActive) return;
    setScanningActive(true);
    setVisibleScanLines(0);
  };

  useEffect(() => {
    if (!scanningActive) return;
    if (visibleScanLines < SCANNING_STEPS.length) {
      const timer = setTimeout(() => {
        setVisibleScanLines((prev) => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setScanningActive(false);
    }
  }, [visibleScanLines, scanningActive]);

  async function login() {
    try {
      const { url } = await api.authUrl();
      window.location.href = url;
    } catch (e) {
      console.error("Auth error", e);
    }
  }

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-white">
      {/* Decorative dynamic meshes and grids */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Modern Dot Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(hsla(var(--border),0.4)_1px,transparent_1px)] [background-size:24px_24px] opacity-75" />
        
        {/* Soft glowing ambient lighting meshes */}
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px] animate-float" />
        <div className="absolute top-1/4 -right-20 h-[600px] w-[600px] rounded-full bg-accent/8 blur-[140px] animate-float delay-500" />
        <div className="absolute bottom-10 left-1/3 h-[450px] w-[450px] rounded-full bg-primary/8 blur-[120px] animate-float delay-300" />
      </div>

      {/* ─── Navigation Header ────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-md py-4 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-primary transition-shadow group-hover:shadow-[0_0_32px_hsla(166,76%,46%,0.25)]">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              GitSense
            </span>
          </a>

          {/* Nav links (Desktop) */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Workflows</a>
            <a href="#integrations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Integrations</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-4">
            {/* GitHub Stars Indicator */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-muted-foreground/30 hover:bg-card hover:text-foreground md:flex"
            >
              <Github size={13} />
              <span>Star on GitHub</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-400">4.8k</span>
            </a>
            
            <Button variant="glow" size="sm" onClick={login}>
              <Github size={15} />
              Sign in
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 md:px-12 md:pt-24 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          {/* Left Hero Text */}
          <div className="flex flex-col text-left">
            {/* Announcement Badge */}
            <div className="inline-flex self-start">
              <Badge variant="primary" className="mb-6 flex items-center gap-1.5 py-1 px-3 shadow-glow-primary">
                <Zap size={11} className="fill-primary" />
                <span>v1.0 Release — Context Grounded LLMs</span>
              </Badge>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-[56px]">
              Understand any codebase <br />
              <span className="text-gradient">like its master creator.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Connect your GitHub, securely parse files, ask complex architecture questions, and auto-synthesize READMEs instantly. Built for elite engineers and growing engineering teams.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button variant="glow" size="lg" className="w-full sm:w-auto font-semibold" onClick={login}>
                <Github size={18} />
                Continue with GitHub
                <ArrowRight size={16} />
              </Button>
              <a href="#demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full border-border/80 hover:border-primary/30 transition-all font-semibold">
                  <Terminal size={16} />
                  Explore Demo Dashboard
                </Button>
              </a>
            </div>

            {/* Security Guarantee & No Card Badge */}
            <div className="mt-5 flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Secure OAuth Auth &bull; SOC-2 Compliant Pipelines &bull; Free Sandbox</span>
            </div>
          </div>

          {/* Right Hero Interactive Simulator Box */}
          <div id="demo" className="w-full">
            <GlassCard className="relative overflow-hidden border border-border/80 bg-card/45 shadow-glow shadow-accent/5 backdrop-blur-xl transition-all duration-300 hover:border-border hover:shadow-[0_0_50px_rgba(99,102,241,0.08)]">
              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs font-mono font-medium text-muted-foreground">GitSense Cockpit Preview</span>
                </div>
                
                {/* Active connection light */}
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE PREVIEW
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-border/40 bg-muted/10 p-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "chat"
                      ? "bg-card text-foreground shadow-sm border border-border/30"
                      : "text-muted-foreground hover:bg-muted/25 hover:text-foreground"
                  }`}
                >
                  <MessageSquareText size={14} className={activeTab === "chat" ? "text-primary" : ""} />
                  Codebase Chat
                </button>
                <button
                  onClick={() => setActiveTab("scan")}
                  className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "scan"
                      ? "bg-card text-foreground shadow-sm border border-border/30"
                      : "text-muted-foreground hover:bg-muted/25 hover:text-foreground"
                  }`}
                >
                  <Terminal size={14} className={activeTab === "scan" ? "text-accent" : ""} />
                  Intelligence Scan
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "insights"
                      ? "bg-card text-foreground shadow-sm border border-border/30"
                      : "text-muted-foreground hover:bg-muted/25 hover:text-foreground"
                  }`}
                >
                  <BarChart3 size={14} className={activeTab === "insights" ? "text-primary" : ""} />
                  Repo Insights
                </button>
              </div>

              {/* Tab Content 1: Codebase Chat */}
              {activeTab === "chat" && (
                <div className="p-5 font-sans min-h-[320px] flex flex-col justify-between">
                  {/* Topic suggestions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setChatTopic("oauth")}
                      className={`rounded-full px-3 py-1 text-xs transition-all border ${
                        chatTopic === "oauth"
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      OAuth Flows
                    </button>
                    <button
                      onClick={() => setChatTopic("folder")}
                      className={`rounded-full px-3 py-1 text-xs transition-all border ${
                        chatTopic === "folder"
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      Folder Audit
                    </button>
                    <button
                      onClick={() => setChatTopic("security")}
                      className={`rounded-full px-3 py-1 text-xs transition-all border ${
                        chatTopic === "security"
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      Security Webhook
                    </button>
                  </div>

                  {/* Chat dialog simulation */}
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground shadow-glow-primary rounded-br-none"
                              : "bg-muted/50 border border-border/80 text-foreground rounded-bl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {msg.code && (
                          <div className="mt-2.5 w-full overflow-hidden rounded-xl border border-border bg-black/60 shadow-inner">
                            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-1.5">
                              <span className="text-[10px] font-mono text-muted-foreground">TSX Source Snippet</span>
                              <span className="flex items-center gap-1 text-[10px] font-mono text-primary font-bold">
                                <Check size={10} /> Verified context
                              </span>
                            </div>
                            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap select-all">
                              <code>{msg.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Chat Loading State */}
                    {chatTyping && (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-mono text-muted-foreground">GitSense Agent is thinking...</span>
                        <div className="flex items-center gap-1.5 rounded-2xl bg-muted/40 px-4 py-3 border border-border/40">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary delay-75" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary delay-150" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary delay-300" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content 2: Intelligence Scan */}
              {activeTab === "scan" && (
                <div className="p-5 font-mono text-xs leading-relaxed min-h-[320px] flex flex-col justify-between">
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                    {SCANNING_STEPS.slice(0, visibleScanLines).map((line, idx) => (
                      <div
                        key={idx}
                        className={`animate-fade-in ${
                          line.style === "primary"
                            ? "text-primary font-semibold"
                            : line.style === "success"
                            ? "text-emerald-400 font-medium"
                            : line.style === "warning"
                            ? "text-warning font-medium"
                            : line.style === "muted"
                            ? "text-muted-foreground"
                            : "text-white"
                        }`}
                      >
                        {line.text}
                      </div>
                    ))}
                    {visibleScanLines < SCANNING_STEPS.length && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block h-3.5 w-2 animate-pulse bg-primary/80 rounded-sm" />
                        <span className="text-[10px] text-muted-foreground">Parsing files...</span>
                      </div>
                    )}
                  </div>

                  {/* Trigger Analysis Button */}
                  <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Index depth: <span className="font-semibold text-white">Full AST Graph</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRerunScan}
                      disabled={scanningActive}
                      className="h-8 border-border bg-card/60 hover:bg-card text-xs text-foreground"
                    >
                      <Activity size={12} className={scanningActive ? "animate-spin text-primary" : ""} />
                      {scanningActive ? "Analyzing..." : "Re-run Diagnostics"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Repo Insights */}
              {activeTab === "insights" && (
                <div className="p-5 min-h-[320px] flex flex-col justify-between">
                  {/* Overview Metrics Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Codebase Health</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white">98%</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Excellent</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Technical Debt</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white">4.2%</span>
                        <span className="text-[10px] text-muted-foreground font-bold">Very Low</span>
                      </div>
                    </div>
                  </div>

                  {/* Language Distribution */}
                  <div className="mt-4 rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-white">Language Breakdowns</span>
                      <span className="text-muted-foreground">124 modules mapped</span>
                    </div>
                    {/* Visual custom language strip */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                      <div className="bg-primary h-full transition-all" style={{ width: "74%" }} />
                      <div className="bg-accent h-full transition-all" style={{ width: "16%" }} />
                      <div className="bg-yellow-500 h-full transition-all" style={{ width: "7%" }} />
                      <div className="bg-muted-foreground h-full transition-all" style={{ width: "3%" }} />
                    </div>
                    {/* Language Legends */}
                    <div className="grid grid-cols-4 gap-2 mt-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        <span className="font-semibold text-neutral-300">TypeScript (74%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                        <span className="font-semibold text-neutral-300">PostCSS (16%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                        <span className="font-semibold text-neutral-300">JavaScript (7%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                        <span className="font-semibold text-neutral-300">Markdown (3%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Tags */}
                  <div className="mt-4 border-t border-border/40 pt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 py-1 px-2.5">
                      ✓ App Router Grounded
                    </span>
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 py-1 px-2.5">
                      ✓ ESM Modules Verified
                    </span>
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 py-1 px-2.5">
                      ✓ CSS Modules Configured
                    </span>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ─── Trust and Metrics Showcase ──────── */}
      <section className="relative z-10 border-y border-border/40 bg-card/15 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {/* Headline */}
          <div className="text-center">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Trusted by tech leaders and software engineers around the globe
            </span>
          </div>

          {/* Trusted Brand names as clean high-contrast text logs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">Vercel</span>
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">Supabase</span>
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">Tailwind CSS</span>
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">Github</span>
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">Netlify</span>
            <span className="text-sm font-bold tracking-tight text-neutral-300 hover:text-white transition-colors cursor-default md:text-base">DigitalOcean</span>
          </div>

          {/* Trust Metrics */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4">
              <div className="text-4xl font-extrabold text-white">3.2M+</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Lines of Code Analyzed</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-extrabold text-white">48k+</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Summarized Commits</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-extrabold text-white">99.9%</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Context Accuracy Rate</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-extrabold text-white">15k+</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Developer Hours Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid Features Layout ───────── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
        <div className="mb-16 text-center">
          <Badge variant="accent" className="mb-4">
            <Code2 size={12} className="fill-accent/25" />
            Capabilities Cockpit
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Smarter analysis. <span className="text-gradient">Zero context switching.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A comprehensive suite of deep integration tools to turn complex code into understandable concepts in minutes.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <GlassCard
                key={feature.title}
                className={`group cursor-default p-6 transition-all border border-border/80 bg-card/35 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow hover:shadow-primary/5 ${feature.className}`}
              >
                {/* Badge and Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon size={20} />
                  </div>
                  <Badge variant="default" className="text-[10px] font-mono border-border bg-card/65 group-hover:border-primary/20">
                    {feature.badge}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-bold text-white transition-colors group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                {/* Micro interactivity footer in bento */}
                <div className="mt-6 flex items-center gap-1 text-[11px] font-mono font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn workflow</span>
                  <ArrowRight size={11} />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ─── Timeline: How It Works ──────────── */}
      <section id="how-it-works" className="relative z-10 border-t border-border/40 bg-card/5 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              Onboarding
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Get integrated in <span className="text-gradient">three simple steps</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-sm">
              We sync safely with your GitHub workspace. Follow this workflow to get started:
            </p>
          </div>

          {/* Timeline steps */}
          <div className="grid gap-12 md:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground shadow-glow-primary group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Link Repositories</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Connect via GitHub OAuth with one-click permissions. GitSense supports public or private projects securely.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground shadow-glow-primary group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Deep Semantic Scan</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Our parsing agent reads imports, files, routes, and histories, building a rich Abstract Syntax Tree vector index.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground shadow-glow-primary group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Query & Collaborate</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Chat with code, write dynamic setup README files, summarize commits, and audit architectural structural patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Integrations Showcase ──── */}
      <section id="integrations" className="relative z-10 border-t border-border/40 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12 text-center">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">Multi-Stack support</span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-3 md:text-3xl">
            Integrates natively with <span className="text-gradient">any programming stack</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Our language-agnostic parsing agents support comprehensive syntax trees for all your favorite environments:
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">TypeScript & JS</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Next.js App Router</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Python & Django</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Rust Cargo</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Go Lang Modules</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Java & Gradle</span>
            <span className="rounded-xl border border-border bg-card/60 py-2.5 px-4 text-xs font-semibold text-white hover:border-primary/20 transition-all hover:bg-card select-none">Docker Compose</span>
          </div>
        </div>
      </section>

      {/* ─── Premium Testimonials Section ─────── */}
      <section className="relative z-10 border-t border-border/40 bg-card/5 py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Loved by <span className="text-gradient">builders who ship fast</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6 border border-border/80 bg-card/45 relative">
              <div className="flex items-center gap-1.5 text-yellow-500 mb-4">
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
              </div>
              <p className="text-sm text-neutral-300 italic leading-relaxed">
                &quot;GitSense completely changed how our developer onboarding works. New engineering hires are codebase-grounded and pushing production commits in hours, rather than spending weeks digging through obscure wikis.&quot;
              </p>
              <div className="mt-5 border-t border-border/40 pt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-glow-primary">
                  AL
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Alex L.</div>
                  <div className="text-[10px] text-muted-foreground">Staff Engineer, Vercel Core Team</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border border-border/80 bg-card/45 relative">
              <div className="flex items-center gap-1.5 text-yellow-500 mb-4">
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
                <Star size={14} className="fill-yellow-500" />
              </div>
              <p className="text-sm text-neutral-300 italic leading-relaxed">
                &quot;The Codebase Chat is ridiculously context-accurate. It feels like pair programming with a veteran senior engineer who remembers every single line of configuration that has ever been written here.&quot;
              </p>
              <div className="mt-5 border-t border-border/40 pt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-glow-primary">
                  DK
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Danielle K.</div>
                  <div className="text-[10px] text-muted-foreground">Founder, DevCo Web Solutions</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ─── Premium FAQ Accordion Section ────── */}
      <section id="faq" className="relative z-10 border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          {/* Header */}
          <div className="mb-16 text-center">
            <Badge variant="accent" className="mb-4">
              Information
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Frequently <span className="text-gradient">Asked Questions</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-sm">
              Answers to technical queries about permissions, data protection, security controls, and repository scales.
            </p>
          </div>

          {/* Accordion container */}
          <div className="flex flex-col gap-4">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = faqOpen[idx] || false;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card/45 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-white hover:bg-muted/20 transition-colors focus:outline-none focus:bg-muted/15"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-primary shrink-0" />
                      {item.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[300px] border-t border-border/40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Stunning Final CTA Banner ────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 md:px-12 md:pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card to-card/65 px-8 py-16 text-center shadow-glow shadow-accent/5 backdrop-blur-md md:px-16 md:py-24">
          {/* Subtle colored background blobs inside final CTA */}
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-[80px]" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-72 w-72 rounded-full bg-accent/8 blur-[80px]" />

          <Badge variant="primary" className="mb-6 flex-row gap-1 border-primary/20 bg-primary/5 px-3 py-1">
            <Sparkles size={11} className="fill-primary" />
            <span>SUPERCHARGE WORKFLOW</span>
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Understand your stack <span className="text-gradient">today.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Sign in with Github, connect your repository scope, and start chatting with code structure vectors in minutes.
          </p>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <Button variant="glow" size="lg" className="w-full sm:w-auto font-bold" onClick={login}>
              <Github size={18} />
              Start Analyzing for Free
              <ArrowRight size={16} />
            </Button>
          </div>
          <span className="mt-4 block text-xs text-muted-foreground">
            No credit card required &bull; Free up to 3 active repositories
          </span>
        </div>
      </section>

      {/* ─── Polished SaaS Footer ──────────────── */}
      <footer className="relative z-10 border-t border-border/50 bg-card/60 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Branding Column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Sparkles size={16} />
                </div>
                <span className="text-base font-bold text-white tracking-tight">GitSense</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                Vector-grounded repository search and AI developer workspace.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-white transition-colors">Capabilities</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Cockpit Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Beta Pipeline</a></li>
              </ul>
            </div>

            {/* Integrations */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Integrations</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <li><a href="https://github.com" className="hover:text-white transition-colors">GitHub OAuth</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Next.js Framework</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Turborepo Config</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Visual Studio Code Extension</a></li>
              </ul>
            </div>

            {/* Compliance & Socials */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Compliance</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-white transition-colors">Security Controls</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR Auditing</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart size={12} className="text-primary fill-primary" />
              <span>GitSense &copy; {new Date().getFullYear()}. Made by engineers, for engineers.</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <span className="text-neutral-600">&bull;</span>
              <a href="#" className="hover:text-white transition-colors">Twitter / X</a>
              <span className="text-neutral-600">&bull;</span>
              <a href="#" className="hover:text-white transition-colors">Discord Community</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

