"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpenText, FolderGit2, LayoutDashboard, LogOut, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type User } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard#repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/dashboard#insights", label: "AI Insights", icon: Sparkles },
  { href: "/dashboard#activity", label: "Activity", icon: BarChart3 },
  { href: "/dashboard#docs", label: "Docs", icon: BookOpenText },
  { href: "/dashboard#chat", label: "Code Chat", icon: MessageSquareText }
];

export function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await api.logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-background/80 p-5 backdrop-blur lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-lg font-semibold">GitSense</div>
            <div className="text-xs text-muted-foreground">AI developer workspace</div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  pathname === item.href && "bg-muted text-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/78 px-4 backdrop-blur md:px-8">
          <Link href="/dashboard" className="font-semibold lg:hidden">GitSense</Link>
          <div className="hidden text-sm text-muted-foreground lg:block">Repository intelligence, without leaving your flow.</div>
          <div className="flex items-center gap-3">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" /> : null}
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.username}</span>
            {user ? (
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout" title="Logout">
                <LogOut size={18} />
              </Button>
            ) : null}
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
