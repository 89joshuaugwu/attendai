"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { UserPlus, GraduationCap } from "lucide-react";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { CredentialReveal } from "@/components/molecules/CredentialReveal";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCredential, setNewCredential] = useState<{ email: string; tempPassword: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(
        snap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_student", name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed");

      toast.success("Student account created.");
      setNewCredential({ email, tempPassword: data.tempPassword });
      setName("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the student account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Students</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Create student accounts here, then enroll them into a course from the Courses page.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <UserPlus className="h-4 w-4" /> New student
        </Button>
      </div>

      {newCredential && (
        <div className="mt-6">
          <CredentialReveal
            email={newCredential.email}
            tempPassword={newCredential.tempPassword}
            onDismiss={() => setNewCredential(null)}
          />
        </div>
      )}

      {showForm && (
        <Card className="mt-6">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" loading={submitting} className="mt-2">
              Create account
            </Button>
          </form>
        </Card>
      )}

      <Card className="mt-6 p-0 overflow-hidden">
        <div className="border-b border-border p-6">
          <CardTitle>Student accounts ({students.length})</CardTitle>
        </div>
        {loading ? (
          <div className="p-8">
            <Spinner label="Loading students…" />
          </div>
        ) : students.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">No student accounts yet.</p>
        ) : (
          <div>
            {students.map((s) => (
              <div key={s.uid} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{s.displayName}</p>
                  <p className="text-xs text-text-secondary">{s.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.faceDescriptor ? "bg-success/10 text-success" : "bg-slate-100 text-text-secondary"
                  }`}
                >
                  {s.faceDescriptor ? "Face registered" : "Not registered"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
