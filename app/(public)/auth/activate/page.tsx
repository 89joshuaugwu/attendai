"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";

export default function ActivateAccountPage() {
  const [email, setEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const activate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const verification = await fetch("/api/auth/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, registrationNumber }) });
      if (!verification.ok) throw new Error();
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      toast.success("Activation email sent.");
    } catch {
      toast.error("We could not verify those details. Please check them or contact your admin.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-bg px-4"><div className="w-full max-w-sm"><h1 className="font-display text-2xl font-semibold text-text-primary">Activate your student account</h1><p className="mt-2 text-sm text-text-secondary">Confirm the school email and registration number your admin imported. We&apos;ll email a link to choose your password.</p><Card className="mt-6">{sent ? <div className="text-center"><p className="font-medium text-text-primary">Check your inbox</p><p className="mt-1 text-sm text-text-secondary">Open the email to set your password, then return to sign in.</p><Link href="/auth/login" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">Back to sign in</Link></div> : <form onSubmit={activate} className="flex flex-col gap-4"><TextField label="School email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><TextField label="Registration number" value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} required /><Button type="submit" loading={loading}>Send activation email</Button></form>}</Card><Link href="/auth/login" className="mt-4 inline-block text-sm text-text-secondary hover:text-primary">← Back to sign in</Link></div></div>;
}
