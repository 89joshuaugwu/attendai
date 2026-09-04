"use client";

import { UserCog, ScanFace, Trash2 } from "lucide-react";
import type { AttendanceRecord } from "@/types";
import { formatTime, distanceToPercent } from "@/lib/utils";

interface AttendanceRowProps {
  record: AttendanceRecord;
  onRemove?: (uid: string) => void;
}

export function AttendanceRow({ record, onRemove }: AttendanceRowProps) {
  const isManual = record.method === "manual_override";

  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {isManual ? <UserCog className="h-4.5 w-4.5" /> : <ScanFace className="h-4.5 w-4.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{record.studentName ?? "Student record"}</p>
        <p className="text-xs text-text-secondary">
          {isManual ? "Added manually" : "Recognized"} {formatTime(record.markedAt)}
          {isManual ? " · Manual override" : record.confidence !== null ? ` · ${distanceToPercent(record.confidence)}% match` : ""}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(record.uid)}
          className="rounded-md p-2 text-text-secondary hover:bg-error/10 hover:text-error"
          aria-label={`Remove attendance record for ${record.studentName ?? record.uid}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
