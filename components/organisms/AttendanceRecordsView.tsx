"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { AttendanceRecord, RosterStudent } from "@/types";
import { AttendanceRow } from "@/components/molecules/AttendanceRow";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SelectField } from "@/components/ui/Field";

interface AttendanceRecordsViewProps {
  sessionId: string;
  enrolledStudentIds: string[];
}

export function AttendanceRecordsView({ sessionId, enrolledStudentIds }: AttendanceRecordsViewProps) {
  const { firebaseUser } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualUid, setManualUid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const availableRoster = enrolledStudentIds.length > 0 ? roster : [];

  useEffect(() => {
    const attendanceQuery = query(collection(db, "attendanceSessions", sessionId, "records"), orderBy("markedAt", "desc"));
    return onSnapshot(attendanceQuery, (snap) => {
      setRecords(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AttendanceRecord, "uid">) })));
      setLoading(false);
    });
  }, [sessionId]);

  useEffect(() => {
    if (enrolledStudentIds.length === 0) {
      return;
    }
    const usersQuery = query(collection(db, "users"), where("role", "==", "student"));
    return onSnapshot(usersQuery, (snap) => {
      const students = snap.docs
        .map((d) => ({ uid: d.id, ...(d.data() as Omit<RosterStudent, "uid">) }))
        .filter((student) => enrolledStudentIds.includes(student.uid));
      setRoster(students);
      setManualUid((current) => students.some((student) => student.uid === current) ? current : (students[0]?.uid ?? ""));
    });
  }, [enrolledStudentIds]);

  const handleManualAdd = async () => {
    if (!manualUid || !firebaseUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${sessionId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
        body: JSON.stringify({ uid: manualUid, distance: null, confirmed: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Attendance added manually.");
      setShowManualAdd(false);
    } catch {
      toast.error("Couldn't add this student. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Attendance register</p>
          <CardTitle className="mt-1">Session records</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary sm:inline">{records.length} present</span>
          <Button size="sm" variant="outline" onClick={() => setShowManualAdd((value) => !value)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Manual add
          </Button>
        </div>
      </div>

      {showManualAdd && (
        <div className="animate-fade-in border-b border-border bg-primary/[0.025] px-6 py-5">
          <p className="text-sm font-semibold text-text-primary">Mark a student present</p>
          <p className="mb-4 mt-0.5 text-xs text-text-secondary">Only students enrolled in this course appear here. This is logged as a manual entry.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <SelectField label="Student" value={manualUid} onChange={(e) => setManualUid(e.target.value)} disabled={availableRoster.length === 0}>
                {availableRoster.length === 0 ? <option>No enrolled students available</option> : availableRoster.map((student) => (
                  <option key={student.uid} value={student.uid}>{student.displayName} · {student.email}</option>
                ))}
              </SelectField>
            </div>
            <Button onClick={handleManualAdd} loading={submitting} disabled={!manualUid || availableRoster.length === 0}>Add</Button>
          </div>
        </div>
      )}

      {loading ? <div className="p-8"><Spinner label="Loading records…" /></div> : records.length === 0 ? (
        <div className="px-8 py-12 text-center"><p className="text-sm font-medium text-text-primary">No attendance recorded yet</p><p className="mt-1 text-sm text-text-secondary">Use live capture or add an enrolled student manually.</p></div>
      ) : <div>{records.map((record) => {
        const rosterName = availableRoster.find((student) => student.uid === record.uid)?.displayName;
        return <AttendanceRow key={record.uid} record={{ ...record, studentName: record.studentName ?? rosterName }} />;
      })}</div>}
    </Card>
  );
}
