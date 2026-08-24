"use client";

import Link from "next/link";
import { ScanFace, History, Users, BookOpen, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";

export default function DashboardOverviewPage() {
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Welcome back, {profile?.displayName?.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Here&apos;s what you can do from your {profile?.role} dashboard.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {profile?.role === "student" && (
          <>
            <OverviewLink href="/dashboard/register-face" icon={ScanFace} title="Register your face" desc="One-time setup so you're recognized automatically in class." />
            <OverviewLink href="/dashboard/attendance-history" icon={History} title="Attendance history" desc="See your own records across every course and session." />
          </>
        )}
        {profile?.role === "lecturer" && (
          <>
            <OverviewLink href="/dashboard/lecturer/sessions" icon={ScanFace} title="Attendance sessions" desc="Open a session and run live capture for your class." />
            <OverviewLink href="/dashboard/lecturer/reports" icon={BarChart3} title="Reports" desc="Attendance rate trends across your courses." />
          </>
        )}
        {profile?.role === "admin" && (
          <>
            <OverviewLink href="/dashboard/admin/lecturers" icon={Users} title="Manage lecturers" desc="Provision lecturer accounts — no public signup." />
            <OverviewLink href="/dashboard/admin/courses" icon={BookOpen} title="Manage courses" desc="Create courses and manage student enrollment." />
          </>
        )}
      </div>
    </div>
  );
}

function OverviewLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof ScanFace;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="group flex items-start gap-4 transition-colors hover:border-primary/40">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text-primary">{title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
