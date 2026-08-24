"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AttendanceSession, Course } from "@/types";
import { CaptureShell } from "@/components/shells/CaptureShell";
import { LiveCaptureInterface } from "@/components/organisms/LiveCaptureInterface";
import { Spinner } from "@/components/ui/Spinner";

export default function CapturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "attendanceSessions", sessionId), (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...(snap.data() as Omit<AttendanceSession, "id">) });
      }
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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-capture-bg">
        <Spinner label="Loading session…" />
      </div>
    );
  }

  return (
    <CaptureShell
      courseLabel={course ? `${course.code} — ${course.name}` : "Loading course…"}
      backHref={`/dashboard/lecturer/sessions/${sessionId}/records`}
    >
      <LiveCaptureInterface
        sessionId={sessionId}
        onManualEntry={() => router.push(`/dashboard/lecturer/sessions/${sessionId}/records`)}
      />
    </CaptureShell>
  );
}
