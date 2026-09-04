import "server-only";

import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/** Confirms that the caller owns this session or is an administrator. */
export async function canManageAttendance(req: NextRequest, sessionId: string): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const [userSnap, sessionSnap] = await Promise.all([
      adminDb.collection("users").doc(decoded.uid).get(),
      adminDb.collection("attendanceSessions").doc(sessionId).get(),
    ]);
    if (!userSnap.exists || !sessionSnap.exists) return false;
    return userSnap.data()?.role === "admin" || sessionSnap.data()?.createdBy === decoded.uid;
  } catch {
    return false;
  }
}
