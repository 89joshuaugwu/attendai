"use client";

import { AttendanceReportsView } from "@/components/organisms/AttendanceReportsView";

export default function LecturerReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Reports</h1>
      <p className="mt-1 text-sm text-text-secondary">Attendance rate trends per course, over time.</p>
      <div className="mt-6">
        <AttendanceReportsView />
      </div>
    </div>
  );
}
