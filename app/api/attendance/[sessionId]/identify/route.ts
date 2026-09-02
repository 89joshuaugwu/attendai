import { NextRequest, NextResponse } from "next/server";
import { handleIdentify } from "@/lib/attendance";

// This route receives ONLY a raw
// descriptor + a livenessVerified flag — never a claimed identity. The
// actual FaceMatcher comparison against the enrolled roster happens here,
// server-side, using firebase-admin. This is the ONLY code path that can
// write a "recognized" attendance record (see firestore.rules — the
// /records/{uid} subcollection has allow write: if false for clients).
export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  try {
    const body = await req.json();
    const { descriptor, livenessVerified } = body as { descriptor: number[]; livenessVerified: boolean };

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json({ status: "error", message: "Invalid descriptor." }, { status: 400 });
    }

    const result = await handleIdentify(sessionId, descriptor, !!livenessVerified);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[/api/attendance/${sessionId}/identify]`, err);
    return NextResponse.json({ status: "error", message: "Server error during identification." }, { status: 500 });
  }
}
