// Server-side attendance logic, per AttendAI_CONTEXT.md Section 4.
//
// Architecture: client detects + computes descriptor, server decides.
// The client NEVER gets to claim "this is student X" and NEVER writes
// directly to /attendanceSessions/{id}/records — Firestore rules enforce
// `allow write: if false` on that subcollection (see firestore/firestore.rules).
// Every record write goes through this file, using firebase-admin, which
// bypasses rules by design because it IS the trusted server.
import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { buildFaceMatcher, identifyFace, getConfidenceTier } from "@/lib/face-matching";
import type { EnrolledStudent, IdentifyResponse } from "@/types";

/** Fetches the enrolled roster for a session's course, including each student's stored face descriptor. */
export async function getEnrolledStudentsWithDescriptors(
  sessionId: string
): Promise<EnrolledStudent[]> {
  const sessionSnap = await adminDb.collection("attendanceSessions").doc(sessionId).get();
  if (!sessionSnap.exists) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const { courseId } = sessionSnap.data() as { courseId: string };
  const courseSnap = await adminDb.collection("courses").doc(courseId).get();
  if (!courseSnap.exists) {
    throw new Error(`Course ${courseId} not found`);
  }

  const { enrolledStudentIds = [] } = courseSnap.data() as { enrolledStudentIds: string[] };
  if (enrolledStudentIds.length === 0) return [];

  // Firestore 'in' queries cap at 30 — chunk for larger rosters.
  const chunks: string[][] = [];
  for (let i = 0; i < enrolledStudentIds.length; i += 30) {
    chunks.push(enrolledStudentIds.slice(i, i + 30));
  }

  const roster: EnrolledStudent[] = [];
  for (const chunk of chunks) {
    const usersSnap = await adminDb
      .collection("users")
      .where("__name__", "in", chunk)
      .get();

    usersSnap.forEach((doc) => {
      const data = doc.data() as { displayName?: string; faceDescriptor?: number[] };
      if (data.faceDescriptor && data.faceDescriptor.length === 128) {
        roster.push({
          uid: doc.id,
          name: data.displayName ?? "Unknown",
          descriptor: new Float32Array(data.faceDescriptor),
        });
      }
    });
  }

  return roster;
}

/** Writes a marked-present record. Only ever called server-side, after a high-confidence match or a lecturer confirmation/manual override. */
export async function markAttendance(
  sessionId: string,
  uid: string,
  distance: number | null,
  method: "recognized" | "manual_override" = "recognized",
  confirmedBy: string | null = null
): Promise<void> {
  const recordRef = adminDb
    .collection("attendanceSessions")
    .doc(sessionId)
    .collection("records")
    .doc(uid);

  await recordRef.set(
    {
      studentUid: uid, // duplicated from the doc ID so collectionGroup
      // queries can filter on it directly — Firestore rules can't validate
      // an unfiltered list query against a per-document condition like
      // "doc ID == request.auth.uid"; it needs a matching `where` clause
      // on an actual field. See firestore.rules and attendance-history/page.tsx.
      markedAt: Date.now(),
      confidence: distance,
      method,
      confirmedBy,
    },
    { merge: true }
  );
}

/**
 * The core identify handler used by /api/attendance/[sessionId]/identify.
 * Receives only a raw descriptor + liveness flag — never a claimed identity.
 */
export async function handleIdentify(
  sessionId: string,
  descriptor: number[],
  livenessVerified: boolean
): Promise<IdentifyResponse> {
  if (!livenessVerified) {
    return { status: "liveness_failed", message: "Liveness check did not pass." };
  }

  const sessionSnap = await adminDb.collection("attendanceSessions").doc(sessionId).get();
  if (!sessionSnap.exists) {
    return { status: "error", message: "Session not found." };
  }
  const session = sessionSnap.data() as { status: string };
  if (session.status !== "open") {
    return { status: "error", message: "This attendance session is closed." };
  }

  const roster = await getEnrolledStudentsWithDescriptors(sessionId);
  if (roster.length === 0) {
    return { status: "not_recognized", message: "No enrolled students with a registered face for this course." };
  }

  const matcher = buildFaceMatcher(roster);
  const { uid, distance } = identifyFace(matcher, new Float32Array(descriptor));
  const tier = getConfidenceTier(distance);

  if (tier === "none" || !uid) {
    return { status: "not_recognized" };
  }

  const matchedStudent = roster.find((s) => s.uid === uid);

  if (tier === "medium") {
    return {
      status: "needs_confirmation",
      uid,
      studentName: matchedStudent?.name,
      distance,
    };
  }

  // High confidence — server writes the record directly.
  await markAttendance(sessionId, uid, distance, "recognized", null);
  return {
    status: "marked",
    uid,
    studentName: matchedStudent?.name,
    distance,
  };
}
