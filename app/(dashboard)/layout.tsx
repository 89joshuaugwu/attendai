"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/shells/AppShell";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/auth/login");
    }
  }, [loading, firebaseUser, router]);

  // Firestore rules are the real security boundary (a lecturer genuinely
  // can't read/write admin-only data even if they reach this page), but
  // without this check a lecturer or student who types /dashboard/admin/...
  // directly would land on a page that just renders empty/broken instead
  // of bouncing them somewhere sensible. This is UX, not the security fix.
  useEffect(() => {
    if (loading || !profile) return;
    const isAdminRoute = pathname?.startsWith("/dashboard/admin");
    const isLecturerRoute = pathname?.startsWith("/dashboard/lecturer");

    if (isAdminRoute && profile.role !== "admin") {
      toast.error("That page is admin-only.");
      router.replace("/dashboard");
    } else if (isLecturerRoute && profile.role !== "lecturer" && profile.role !== "admin") {
      toast.error("That page is for lecturers.");
      router.replace("/dashboard");
    }
  }, [loading, profile, pathname, router]);

  if (loading || !firebaseUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner label="Loading your account…" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
