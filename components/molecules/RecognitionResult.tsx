"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatTime, distanceToPercent } from "@/lib/utils";

interface RecognitionResultProps {
  status: "marked" | "needs_confirmation" | "not_recognized";
  studentName?: string;
  distance?: number;
  timestamp?: number;
  onConfirm?: () => void;
  onReject?: () => void;
  onManualEntry?: () => void;
}

export function RecognitionResult({
  status,
  studentName,
  distance,
  timestamp,
  onConfirm,
  onReject,
  onManualEntry,
}: RecognitionResultProps) {
  if (status === "marked") {
    return (
      <div className="animate-fade-in flex items-center gap-4 rounded-2xl border border-success/30 bg-success/10 p-5">
        <CheckCircle2 className="h-9 w-9 shrink-0 text-success" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-white">{studentName}</p>
          <p className="text-sm text-slate-300">
            Marked present{timestamp ? ` at ${formatTime(timestamp)}` : ""}
            {typeof distance === "number" && (
              <span className="ml-2 font-mono text-xs text-slate-400">
                {distanceToPercent(distance)}% match
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (status === "needs_confirmation") {
    return (
      <div className="animate-fade-in rounded-2xl border border-warning/30 bg-warning/10 p-5">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-9 w-9 shrink-0 text-warning" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold text-white">{studentName ?? "Possible match"}</p>
            <p className="text-sm text-slate-300">
              Confidence is borderline — confirm identity before marking present.
              {typeof distance === "number" && (
                <span className="ml-2 font-mono text-xs text-slate-400">
                  {distanceToPercent(distance)}% match
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-[var(--radius-control)] bg-warning px-4 py-2.5 text-sm font-medium text-white hover:brightness-95"
          >
            Confirm — mark present
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-[var(--radius-control)] border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Not this student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-error/30 bg-error/10 p-5">
      <div className="flex items-center gap-4">
        <XCircle className="h-9 w-9 shrink-0 text-error" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-white">Not recognized</p>
          <p className="text-sm text-slate-300">Check registration status, or use manual entry.</p>
        </div>
      </div>
      {onManualEntry && (
        <button
          onClick={onManualEntry}
          className="mt-4 w-full rounded-[var(--radius-control)] border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          Use manual entry
        </button>
      )}
    </div>
  );
}
