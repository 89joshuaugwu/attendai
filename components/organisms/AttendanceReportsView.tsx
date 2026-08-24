"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { AttendanceSession, Course } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";

interface TrendPoint {
  date: string;
  present: number;
  enrolled: number;
  rate: number;
}

export function AttendanceReportsView() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const coursesQuery =
      profile.role === "admin"
        ? collection(db, "courses")
        : query(collection(db, "courses"), where("lecturerId", "==", profile.uid));

    const unsub = onSnapshot(coursesQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, "id">) }));
      setCourses(list);
      if (!selectedCourseId && list.length > 0) setSelectedCourseId(list[0].id);
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!selectedCourseId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const course = courses.find((c) => c.id === selectedCourseId);
      const enrolledCount = course?.enrolledStudentIds.length ?? 0;

      const sessionsSnap = await getDocs(
        query(collection(db, "attendanceSessions"), where("courseId", "==", selectedCourseId))
      );
      const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceSession, "id">) }));

      const points: TrendPoint[] = [];
      for (const session of sessions.sort((a, b) => a.startTime - b.startTime)) {
        const recordsSnap = await getDocs(collection(db, "attendanceSessions", session.id, "records"));
        const present = recordsSnap.size;
        points.push({
          date: formatDate(session.date),
          present,
          enrolled: enrolledCount,
          rate: enrolledCount > 0 ? Math.round((present / enrolledCount) * 100) : 0,
        });
      }

      if (!cancelled) {
        setTrend(points);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, courses]);

  if (courses.length === 0 && !loading) {
    return (
      <Card>
        <p className="text-center text-sm text-text-secondary">No courses assigned yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance trends</CardTitle>
        <div className="w-56">
          <SelectField
            label="Course"
            className="h-9"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </SelectField>
        </div>
      </CardHeader>

      {loading ? (
        <div className="py-12">
          <Spinner label="Loading attendance trend…" />
        </div>
      ) : trend.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">No sessions recorded yet for this course.</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                cursor={{ fill: "#0F766E11" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
                formatter={(value, name) => (name === "rate" ? [`${value}%`, "Attendance rate"] : [value, name])}
              />
              <Bar dataKey="rate" fill="#0F766E" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
