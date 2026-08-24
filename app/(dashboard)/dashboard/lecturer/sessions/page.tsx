/* eslint-disable react-hooks/purity -- Date.now() below runs inside an async
   click handler (toggleStatus), never during render; this experimental rule
   doesn't distinguish handler scope from render scope for inline usage. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { Plus, ScanFace, FileText, CircleDot } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { AttendanceSession, Course } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";

export default function LecturerSessionsPage() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const coursesQuery =
      profile.role === "admin" ? collection(db, "courses") : query(collection(db, "courses"), where("lecturerId", "==", profile.uid));

    const unsubCourses = onSnapshot(coursesQuery, (snap) => {
      const map: Record<string, Course> = {};
      snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...(d.data() as Omit<Course, "id">) }));
      setCourses(map);
    });

    const sessionsQuery =
      profile.role === "admin"
        ? collection(db, "attendanceSessions")
        : query(collection(db, "attendanceSessions"), where("createdBy", "==", profile.uid));

    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      setSessions(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSession, "id">) }))
          .sort((a, b) => b.startTime - a.startTime)
      );
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubSessions();
    };
  }, [profile]);

  const toggleStatus = async (session: AttendanceSession) => {
    try {
      const endTime = session.status === "open" ? Date.now() : null;
      await updateDoc(doc(db, "attendanceSessions", session.id), {
        status: session.status === "open" ? "closed" : "open",
        endTime,
      });
      toast.success(session.status === "open" ? "Session closed." : "Session reopened.");
    } catch {
      toast.error("Couldn't update session status.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Attendance sessions</h1>
          <p className="mt-1 text-sm text-text-secondary">Open a session to start recognizing students.</p>
        </div>
        <Link href="/dashboard/lecturer/sessions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New session
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-8">
          <Spinner label="Loading sessions…" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="mt-6 text-center text-sm text-text-secondary">
          No attendance session currently open for this course. Start one to begin.
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {sessions.map((s) => {
            const course = courses[s.courseId];
            return (
              <Card key={s.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">
                      {course ? `${course.code} — ${course.name}` : s.courseId}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "open" ? "bg-success/10 text-success" : "bg-slate-100 text-text-secondary"
                      }`}
                    >
                      <CircleDot className="h-3 w-3" />
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{formatDate(s.date)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/lecturer/sessions/${s.id}/records`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FileText className="h-4 w-4" /> Records
                    </Button>
                  </Link>
                  {s.status === "open" ? (
                    <Link href={`/dashboard/lecturer/sessions/${s.id}/capture`}>
                      <Button size="sm" className="gap-1.5">
                        <ScanFace className="h-4 w-4" /> Capture
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(s)}>
                      Reopen
                    </Button>
                  )}
                  {s.status === "open" && (
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(s)}>
                      Close
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
