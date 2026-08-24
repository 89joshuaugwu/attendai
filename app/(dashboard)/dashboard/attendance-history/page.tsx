"use client";

import { useEffect, useState } from "react";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { CheckCircle2, UserCog } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { AttendanceSession, Course } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/utils";

interface HistoryEntry {
  sessionId: string;
  courseLabel: string;
  date: string;
  markedAt: number;
  method: "recognized" | "manual_override";
  confidence: number | null;
}

export default function AttendanceHistoryPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      // collectionGroup query across every session's /records subcollection.
      // Firestore rules allow reading a /records/{uid} doc only if
      // request.auth.uid === uid (or the reader is lecturer/admin), so this
      // naturally returns only this student's own records.
      const recordsSnap = await getDocs(collectionGroup(db, "records"));
      const relevant = recordsSnap.docs.filter((d) => d.id === profile.uid);
      if (relevant.length === 0) {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }

      const sessionIds = [...new Set(relevant.map((d) => d.ref.parent.parent!.id))];
      const sessionsSnap = await getDocs(
        query(collection(db, "attendanceSessions"), where("__name__", "in", sessionIds.slice(0, 30)))
      );
      const sessions = new Map(
        sessionsSnap.docs.map((d) => [d.id, { id: d.id, ...(d.data() as Omit<AttendanceSession, "id">) }])
      );

      const courseIds = [...new Set([...sessions.values()].map((s) => s.courseId))];
      const courses = new Map<string, Course>();
      for (let i = 0; i < courseIds.length; i += 30) {
        const chunk = courseIds.slice(i, i + 30);
        if (chunk.length === 0) continue;
        const coursesSnap = await getDocs(query(collection(db, "courses"), where("__name__", "in", chunk)));
        coursesSnap.docs.forEach((d) => courses.set(d.id, { id: d.id, ...(d.data() as Omit<Course, "id">) }));
      }

      const result: HistoryEntry[] = relevant
        .map((docSnap) => {
          const sessionId = docSnap.ref.parent.parent!.id;
          const session = sessions.get(sessionId);
          const course = session ? courses.get(session.courseId) : undefined;
          const data = docSnap.data() as { markedAt: number; method: "recognized" | "manual_override"; confidence: number | null };
          return {
            sessionId,
            courseLabel: course ? `${course.code} — ${course.name}` : "Unknown course",
            date: session?.date ?? "",
            markedAt: data.markedAt,
            method: data.method,
            confidence: data.confidence,
          };
        })
        .sort((a, b) => b.markedAt - a.markedAt);

      if (!cancelled) {
        setEntries(result);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-text-primary">My attendance</h1>
      <p className="mt-1 text-sm text-text-secondary">Your records across every course and session.</p>

      <Card className="mt-6 p-0 overflow-hidden">
        <div className="border-b border-border p-6">
          <CardTitle>Records ({entries.length})</CardTitle>
        </div>
        {loading ? (
          <div className="p-8">
            <Spinner label="Loading your history…" />
          </div>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">No sessions recorded yet.</p>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  {entry.method === "manual_override" ? <UserCog className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{entry.courseLabel}</p>
                  <p className="text-xs text-text-secondary">{formatDateTime(entry.markedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
