"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { Plus, BookOpen, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import type { AppUser, Course } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, "id">) })));
      setLoading(false);
    });
    const unsubLecturers = onSnapshot(query(collection(db, "users"), where("role", "==", "lecturer")), (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) }));
      setLecturers(list);
      if (list.length > 0) setLecturerId((prev) => prev || list[0].uid);
    });
    const unsubStudents = onSnapshot(query(collection(db, "users"), where("role", "==", "student")), (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) })));
    });
    return () => {
      unsubCourses();
      unsubLecturers();
      unsubStudents();
    };
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!lecturerId) {
      toast.error("Create a lecturer account first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_course", name, code, lecturerId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Course created.");
      setName("");
      setCode("");
      setShowForm(false);
    } catch {
      toast.error("Couldn't create the course.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnrollment = async (course: Course, studentUid: string) => {
    const enrolled = course.enrolledStudentIds.includes(studentUid);
    const next = enrolled
      ? course.enrolledStudentIds.filter((id) => id !== studentUid)
      : [...course.enrolledStudentIds, studentUid];
    try {
      await updateDoc(doc(db, "courses", course.id), { enrolledStudentIds: next });
      setManagingCourse({ ...course, enrolledStudentIds: next });
    } catch {
      toast.error("Couldn't update enrollment.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Courses</h1>
          <p className="mt-1 text-sm text-text-secondary">Create courses and manage student enrollment.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" /> New course
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <TextField label="Course name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Course code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CSC 466" required />
            <SelectField label="Lecturer" value={lecturerId} onChange={(e) => setLecturerId(e.target.value)}>
              {lecturers.map((l) => (
                <option key={l.uid} value={l.uid}>
                  {l.displayName}
                </option>
              ))}
            </SelectField>
            <Button type="submit" loading={submitting} className="mt-2">
              Create course
            </Button>
          </form>
        </Card>
      )}

      <Card className="mt-6 p-0 overflow-hidden">
        <div className="border-b border-border p-6">
          <CardTitle>All courses ({courses.length})</CardTitle>
        </div>
        {loading ? (
          <div className="p-8">
            <Spinner label="Loading courses…" />
          </div>
        ) : courses.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">No courses created yet.</p>
        ) : (
          <div>
            {courses.map((c) => (
              <div key={c.id} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {c.code} — {c.name}
                  </p>
                  <p className="text-xs text-text-secondary">{c.enrolledStudentIds.length} enrolled</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setManagingCourse(c)}>
                  <Users className="h-4 w-4" /> Enrollment
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {managingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="max-h-[80vh] w-full max-w-md overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>{managingCourse.code} enrollment</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setManagingCourse(null)}>
                Close
              </Button>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-text-secondary">No student accounts yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {students.map((s) => {
                  const enrolled = managingCourse.enrolledStudentIds.includes(s.uid);
                  return (
                    <label
                      key={s.uid}
                      className="flex items-center justify-between rounded-[var(--radius-control)] border border-border px-3 py-2.5 text-sm"
                    >
                      <span className="text-text-primary">{s.displayName}</span>
                      <input
                        type="checkbox"
                        checked={enrolled}
                        onChange={() => toggleEnrollment(managingCourse, s.uid)}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
