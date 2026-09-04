import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Role } from "@/types";
import { randomBytes } from "crypto";

// Server-only admin actions: creates lecturer/student accounts (no public
// signup — see CONTEXT.md Section 5-6) and courses using firebase-admin,
// which bypasses Firestore rules by design because this route IS the
// trusted server boundary. In production, gate this route behind a check
// that the caller's session token actually belongs to an admin — this
// scaffold keeps it simple, but do not ship it without that check.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Only administrators can manage accounts." }, { status: 403 });
    }
    if (action === "create_lecturer" || action === "create_student") {
      const role: Role = action === "create_lecturer" ? "lecturer" : "student";
      const { name, email } = body as { name: string; email: string };
      if (!name || !email) {
        return NextResponse.json({ message: "Name and email are required." }, { status: 400 });
      }

      const tempPassword = generateTempPassword();
      const userRecord = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name,
      });

      await adminDb.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: name,
        role,
        faceDescriptor: null,
        createdAt: Date.now(),
      });

      // No SMTP wired up yet (see README "Known gaps") — the temp password
      // is returned here so the admin UI can display it directly for the
      // admin to relay manually (WhatsApp, in person, etc). Wire up
      // Nodemailer/Gmail SMTP before onboarding at real scale.
      return NextResponse.json({ uid: userRecord.uid, tempPassword });
    }

    if (action === "bulk_create_students") {
      const students = body.students as Array<{ name?: string; email?: string }>;
      if (!Array.isArray(students) || students.length === 0 || students.length > 100) {
        return NextResponse.json({ message: "Upload between 1 and 100 students at a time." }, { status: 400 });
      }

      const results = await Promise.all(students.map(async ({ name, email }) => {
        const cleanName = name?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        if (!cleanName || !cleanEmail) return { name: cleanName ?? "", email: cleanEmail ?? "", error: "Name and email are required." };
        try {
          const userRecord = await adminAuth.createUser({ email: cleanEmail, password: generateTempPassword(), displayName: cleanName });
          await adminDb.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid, email: cleanEmail, displayName: cleanName, role: "student",
            faceDescriptor: null, activationStatus: "pending", createdAt: Date.now(),
          });
          const activationLink = await adminAuth.generatePasswordResetLink(cleanEmail);
          return { name: cleanName, email: cleanEmail, activationLink };
        } catch (error: unknown) {
          const code = (error as { code?: string }).code;
          return { name: cleanName, email: cleanEmail, error: code === "auth/email-already-exists" ? "Email is already registered." : "Could not create account." };
        }
      }));
      return NextResponse.json({ results });
    }

    if (action === "create_course") {
      const { name, code, lecturerId } = body as { name: string; code: string; lecturerId: string };
      if (!name || !code || !lecturerId) {
        return NextResponse.json({ message: "Name, code, and lecturer are required." }, { status: 400 });
      }

      const courseRef = await adminDb.collection("courses").add({
        name,
        code,
        lecturerId,
        enrolledStudentIds: [],
        createdAt: Date.now(),
      });

      return NextResponse.json({ id: courseRef.id });
    }

    return NextResponse.json({ message: "Unknown action." }, { status: 400 });
  } catch (err: unknown) {
    console.error("[/api/auth/session]", err);
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ message: "That email is already registered." }, { status: 409 });
    }
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

function generateTempPassword(): string {
  return `${randomBytes(12).toString("base64url")}Aa1!`;
}

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const profile = await adminDb.collection("users").doc(decoded.uid).get();
    return profile.data()?.role === "admin";
  } catch {
    return false;
  }
}
