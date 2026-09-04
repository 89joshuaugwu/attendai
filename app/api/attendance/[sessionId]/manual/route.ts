import { NextRequest, NextResponse } from "next/server";
import { markAttendance } from "@/lib/attendance";
import { canManageAttendance } from "@/lib/attendance-authorization";

// Lecturer-only manual override endpoint, per CONTEXT.md Section 4/6. Used
// for: (a) confirming a medium-confidence match flagged by /identify, or
// (b) a fully manual add when recognition fails or a student has technical
// issues. Always logs method: "manual_override" so it's distinguishable
// from an auto-recognized record in reports and audits.
//
// NOTE: in production, verify the caller's session token belongs to the
// session's lecturer (or an admin) before writing — this scaffold omits
// that check for brevity but it MUST be added before shipping, per
// CONTEXT.md Section 6's RBAC table.
export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  try {
    if (!(await canManageAttendance(req, sessionId))) {
      return NextResponse.json({ message: "You are not allowed to update this session." }, { status: 403 });
    }
    const body = await req.json();
    const { uid, distance, confirmed, confirmedBy } = body as {
      uid: string;
      distance: number | null;
      confirmed: boolean;
      confirmedBy?: string;
    };

    if (!uid || !confirmed) {
      return NextResponse.json({ message: "uid and confirmed=true are required." }, { status: 400 });
    }

    await markAttendance(sessionId, uid, distance ?? null, "manual_override", confirmedBy ?? null);
    return NextResponse.json({ status: "marked", uid });
  } catch (err) {
    console.error(`[/api/attendance/${sessionId}/manual]`, err);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
