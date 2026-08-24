"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { Course } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";

export default function NewSessionPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const coursesQuery =
      profile.role === "admin" ? collection(db, "courses") : query(collection(db, "courses"), where("lecturerId", "==", profile.uid));

    const unsub = onSnapshot(coursesQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, "id">) }));
      setCourses(list);
      if (list.length > 0) setCourseId((prev) => prev || list[0].id);
    });
    return unsub;
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !courseId) return;
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "attendanceSessions"), {
        courseId,
        createdBy: profile.uid,
        date,
        startTime: Date.now(),
        endTime: null,
        status: "open",
      });
      toast.success("Session opened.");
      router.push(`/dashboard/lecturer/sessions/${docRef.id}/capture`);
    } catch {
      toast.error("Couldn't create the session.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Start a new session</h1>
      <p className="mt-1 text-sm text-text-secondary">Choose a course and date, then open it for capture.</p>

      <Card className="mt-6">
        {courses.length === 0 ? (
          <p className="text-sm text-text-secondary">
            You have no courses assigned yet. Ask an admin to enroll you as a lecturer on a course first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <SelectField label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Button type="submit" loading={submitting} className="mt-2">
              Open session
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
