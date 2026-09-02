"use client";

import Link from "next/link";
import { ScanFace, History, Users, BookOpen, BarChart3, ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";

export default function DashboardOverviewPage() {
  const { profile } = useAuth();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="surface-grid relative overflow-hidden rounded-3xl border border-primary/10 bg-white px-5 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Your workspace</span><h1 className="page-heading mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">Welcome back, {profile?.displayName?.split(" ")[0]}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">Here&apos;s what you can do from your {profile?.role} dashboard. Keep every class organized and every record easy to trust.</p></div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile?.role === "student" && <><OverviewLink href="/dashboard/register-face" icon={ScanFace} title="Register your face" desc="One-time setup so you are recognized automatically in class." /><OverviewLink href="/dashboard/attendance-history" icon={History} title="Attendance history" desc="See your own records across every course and session." /></>}
        {profile?.role === "lecturer" && <><OverviewLink href="/dashboard/lecturer/sessions" icon={ScanFace} title="Attendance sessions" desc="Open a session and run live capture for your class." /><OverviewLink href="/dashboard/lecturer/reports" icon={BarChart3} title="Reports" desc="Attendance rate trends across your courses." /></>}
        {profile?.role === "admin" && <><OverviewLink href="/dashboard/admin/lecturers" icon={Users} title="Manage lecturers" desc="Provision lecturer accounts with no public signup." /><OverviewLink href="/dashboard/admin/students" icon={GraduationCap} title="Manage students" desc="Create student accounts before enrolling them." /><OverviewLink href="/dashboard/admin/courses" icon={BookOpen} title="Manage courses" desc="Create courses and manage student enrollment." /></>}
      </div>
    </div>
  );
}

function OverviewLink({ href, icon: Icon, title, desc }: { href: string; icon: typeof ScanFace; title: string; desc: string }) {
  return <Link href={href}><Card className="group flex h-full items-start gap-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{title}</p><p className="mt-1 text-sm leading-6 text-text-secondary">{desc}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition group-hover:translate-x-0.5 group-hover:text-primary" /></Card></Link>;
}
