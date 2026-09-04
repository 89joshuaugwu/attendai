import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/** Verifies school-issued identifiers before the browser sends a password-setup email. */
export async function POST(req: NextRequest) {
  try {
    const { email, registrationNumber } = await req.json() as { email?: string; registrationNumber?: string };
    if (!email?.trim() || !registrationNumber?.trim()) {
      return NextResponse.json({ message: "Email and registration number are required." }, { status: 400 });
    }
    const matches = await adminDb.collection("users").where("registrationNumber", "==", registrationNumber.trim()).limit(1).get();
    const account = matches.docs[0];
    if (!account || account.data().email?.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({ message: "We could not verify those school details." }, { status: 403 });
    }
    await account.ref.update({ activationStatus: "activation_requested" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to start activation." }, { status: 500 });
  }
}
