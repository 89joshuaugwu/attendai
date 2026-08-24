import Link from "next/link";
import Image from "next/image";
import { ScanFace, ShieldCheck, Users, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AttendAI logo" width={36} height={36} className="rounded-lg" />
          <span className="font-display text-xl font-semibold text-text-primary">AttendAI</span>
        </div>
        <Link
          href="/auth/login"
          className="rounded-[var(--radius-control)] bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Facial recognition attendance
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-text-primary sm:text-5xl">
              Attendance that identifies students automatically.
            </h1>
            <p className="mt-4 max-w-md text-base text-text-secondary">
              No QR codes, no roll call, no manual entry. Students register their face once — every
              subsequent class, they&apos;re recognized and marked present just by looking at the camera.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/auth/login"
                className="rounded-[var(--radius-control)] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <Image src="/logo.png" alt="AttendAI facial recognition illustration" width={480} height={480} priority className="w-full" />
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          <Feature
            icon={ScanFace}
            title="One-to-many recognition"
            desc="Each capture is matched against the whole enrolled roster server-side — not a one-to-one check."
          />
          <Feature
            icon={ShieldCheck}
            title="Server decides, not the client"
            desc="The browser only ever sends a raw face descriptor. Matching and attendance writes happen on the server."
          />
          <Feature
            icon={BarChart3}
            title="Real attendance data"
            desc="Confidence-scored records, manual override for edge cases, and per-course trend reports for lecturers."
          />
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-text-secondary">
        © {new Date().getFullYear()} AttendAI. Built for enrolled students, lecturers, and admins only — no public signup.
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Users; title: string; desc: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-white p-6">
      <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
      <h3 className="mt-4 font-display text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{desc}</p>
    </div>
  );
}
