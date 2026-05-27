"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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

function isNavActive(pathname: string, href: string): boolean {
  const basePath = href.split("#")[0];
  if (href === "/dashboard" && pathname === "/dashboard") return true;
  if (href !== "/dashboard" && pathname.startsWith(basePath)) return true;
  return false;
}

export function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await api.logout();
    router.push("/");
  }

  const navLinks = (
    <nav className="space-y-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              active
                ? "bg-primary/10 text-primary font-medium shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={18} className={active ? "text-primary" : ""} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col glass-strong border-r border-border/50 p-5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-primary transition-shadow group-hover:shadow-[0_0_32px_hsla(166,76%,46%,0.25)]">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">GitSense</div>
            <div className="text-[11px] text-muted-foreground">AI developer workspace</div>
          </div>
        </Link>

        <div className="mt-8 flex-1">{navLinks}</div>

        {/* User profile at bottom */}
        {user && (
          <div className="mt-auto border-t border-border/50 pt-4">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar_url} alt={user.username} fallback={user.name || user.username} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.name || user.username}</div>
                <div className="truncate text-xs text-muted-foreground">@{user.username}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout" title="Logout" className="shrink-0">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 glass-strong border-r border-border/50 p-5 animate-slide-down flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Sparkles size={18} />
                </div>
                <span className="text-lg font-bold">GitSense</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1">{navLinks}</div>
            {user && (
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar_url} alt={user.username} fallback={user.name || user.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{user.name || user.username}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                    <LogOut size={16} />
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 glass-strong px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </Button>
            <Link href="/dashboard" className="font-bold lg:hidden">
              GitSense
            </Link>
            <div className="hidden text-sm text-muted-foreground lg:block">
              Repository intelligence, without leaving your flow.
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">@{user.username}</span>
                <Avatar src={user.avatar_url} alt={user.username} fallback={user.name || user.username} size="sm" />
              </>
            )}
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
