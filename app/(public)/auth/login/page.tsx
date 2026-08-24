"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in.");
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password. Contact your admin if you don't have an account yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="RollCall logo" width={56} height={56} className="rounded-2xl" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">Sign in to RollCall</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts are provisioned by your admin — there&apos;s no public signup.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
