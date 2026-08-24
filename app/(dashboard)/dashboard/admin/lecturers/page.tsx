"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { UserPlus, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "lecturer"));
    const unsub = onSnapshot(q, (snap) => {
      setLecturers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) })));
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
        body: JSON.stringify({ action: "create_lecturer", name, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed");
      }
      toast.success(`Lecturer account created. Temporary password sent to ${email}.`);
      setName("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the lecturer account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Lecturers</h1>
          <p className="mt-1 text-sm text-text-secondary">Provision lecturer accounts — there&apos;s no public signup.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <UserPlus className="h-4 w-4" /> New lecturer
        </Button>
      </div>

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
          <CardTitle>Lecturer accounts ({lecturers.length})</CardTitle>
        </div>
        {loading ? (
          <div className="p-8">
            <Spinner label="Loading lecturers…" />
          </div>
        ) : lecturers.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">No lecturer accounts yet.</p>
        ) : (
          <div>
            {lecturers.map((l) => (
              <div key={l.uid} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{l.displayName}</p>
                  <p className="text-xs text-text-secondary">{l.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
