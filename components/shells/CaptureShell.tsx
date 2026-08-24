"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface CaptureShellProps {
  children: React.ReactNode;
  courseLabel: string;
  backHref: string;
  headerRight?: React.ReactNode;
}

export function CaptureShell({ children, courseLabel, backHref, headerRight }: CaptureShellProps) {
  return (
    <div className="min-h-screen bg-capture-bg text-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Back to session"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Image src="/logo.png" alt="AttendAI logo" width={28} height={28} className="rounded-md" />
          <div>
            <p className="font-display text-sm font-semibold text-white">AttendAI</p>
            <p className="text-xs text-slate-400">{courseLabel}</p>
          </div>
        </div>
        {headerRight}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
