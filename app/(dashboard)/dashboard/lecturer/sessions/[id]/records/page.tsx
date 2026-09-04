"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { ScanFace } from "lucide-react";
import { db } from "@/lib/firebase";
import type { AttendanceSession, Course } from "@/types";
import { AttendanceRecordsView } from "@/components/organisms/AttendanceRecordsView";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function SessionRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "attendanceSessions", sessionId), (snap) => {
      if (snap.exists()) setSession({ id: snap.id, ...(snap.data() as Omit<AttendanceSession, "id">) });
    });
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, "courses", session.courseId), (snap) => {
      if (snap.exists()) setCourse({ id: snap.id, ...(snap.data() as Omit<Course, "id">) });
    });
    return unsub;
  }, [session]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {course ? `${course.code} — ${course.name}` : "Session"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {session ? formatDate(session.date) : "…"} · {session?.status}
          </p>
        </div>
        {session?.status === "open" && (
          <Link href={`/dashboard/lecturer/sessions/${sessionId}/capture`}>
            <Button className="gap-2">
              <ScanFace className="h-4 w-4" /> Resume capture
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6">
        <AttendanceRecordsView sessionId={sessionId} enrolledStudentIds={course?.enrolledStudentIds ?? []} />
      </div>
    </div>
  );
}
