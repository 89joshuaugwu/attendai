"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import type { AttendanceRecord } from "@/types";
import { AttendanceRow } from "@/components/molecules/AttendanceRow";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/Field";

interface AttendanceRecordsViewProps {
  sessionId: string;
}

export function AttendanceRecordsView({ sessionId }: AttendanceRecordsViewProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualUid, setManualUid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "attendanceSessions", sessionId, "records"),
      orderBy("markedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecords(
        snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AttendanceRecord, "uid">) }))
      );
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  const handleManualAdd = async () => {
    if (!manualUid.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${sessionId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: manualUid.trim(), distance: null, confirmed: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Attendance added manually.");
      setManualUid("");
      setShowManualAdd(false);
    } catch {
      toast.error("Couldn't add that student. Check the ID and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-6">
        <CardTitle>Session records ({records.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowManualAdd((v) => !v)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Manual add
        </Button>
      </div>

      {showManualAdd && (
        <div className="flex items-end gap-3 border-b border-border bg-bg p-4">
          <div className="flex-1">
            <TextField
              label="Student UID"
              value={manualUid}
              onChange={(e) => setManualUid(e.target.value)}
              placeholder="Firebase user ID"
              hint="Use for recognition failures or technical issues — logged as manual_override."
            />
          </div>
          <Button onClick={handleManualAdd} loading={submitting}>
            Add
          </Button>
        </div>
      )}

      {loading ? (
        <div className="p-8">
          <Spinner label="Loading records…" />
        </div>
      ) : records.length === 0 ? (
        <p className="p-8 text-center text-sm text-text-secondary">No one has been marked present yet.</p>
      ) : (
        <div>
          {records.map((r) => (
            <AttendanceRow key={r.uid} record={r} />
          ))}
        </div>
      )}
    </Card>
  );
}
