export type Role = "admin" | "lecturer" | "student";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  faceDescriptor: number[] | null;
  createdAt?: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  lecturerId: string;
  lecturerName?: string;
  enrolledStudentIds: string[];
  createdAt?: number;
}

export type SessionStatus = "open" | "closed";

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  createdBy: string;
  date: string; // ISO date, e.g. 2026-08-23
  startTime: number; // epoch ms
  endTime: number | null;
  status: SessionStatus;
}

export type AttendanceMethod = "recognized" | "manual_override";

export interface AttendanceRecord {
  uid: string;
  studentName?: string;
  markedAt: number;
  confidence: number | null; // distance score, lower = better match; null for manual
  method: AttendanceMethod;
  confirmedBy: string | null;
}

export type ConfidenceTier = "high" | "medium" | "none";

export interface IdentifyResponse {
  status: "marked" | "needs_confirmation" | "not_recognized" | "liveness_failed" | "error";
  uid?: string;
  studentName?: string;
  distance?: number;
  message?: string;
}

export interface EnrolledStudent {
  uid: string;
  name: string;
  descriptor: Float32Array;
}
