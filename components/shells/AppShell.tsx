"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScanFace,
  History,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navByRole: Record<string, NavItem[]> = {
  student: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/register-face", label: "Register Face", icon: ScanFace },
    { href: "/dashboard/attendance-history", label: "My Attendance", icon: History },
  ],
  lecturer: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/lecturer/sessions", label: "Sessions", icon: ScanFace },
    { href: "/dashboard/lecturer/reports", label: "Reports", icon: BarChart3 },
  ],
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/lecturers", label: "Lecturers", icon: Users },
    { href: "/dashboard/admin/students", label: "Students", icon: GraduationCap },
    { href: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = navByRole[profile?.role ?? "student"];

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 flex h-[4.5rem] items-center justify-between border-b border-border/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-slate-100 hover:text-text-primary md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="RollCall logo" width={34} height={34} className="rounded-xl" />
            <span className="font-display text-lg font-bold tracking-tight text-text-primary">RollCall</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
              {profile?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="max-w-36 truncate text-sm font-semibold text-text-primary">{profile?.displayName}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-red-50 hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 top-[4.5rem] z-30 w-[17rem] border-r border-border/80 bg-white transition-transform md:sticky md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b border-border/70 px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Workspace</p>
            <p className="mt-2 truncate font-display text-sm font-semibold text-text-primary">{profile?.role} portal</p>
          </div>
          <nav className="flex flex-col gap-1.5 p-4">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-white shadow-[0_6px_16px_rgba(15,118,110,0.18)]"
                      : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", active ? "opacity-70" : "group-hover:opacity-50")} />
                </Link>
              );
            })}
          </nav>
        </aside>

        {mobileOpen && (
          <button
            className="fixed inset-0 top-[4.5rem] z-20 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
