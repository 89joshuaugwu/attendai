import Link from "next/link";
import Image from "next/image";
import { ScanFace, ShieldCheck, BarChart3, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-bg">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2.5"><Image src="/logo.png" alt="RollCall logo" width={40} height={40} className="rounded-xl" /><span className="font-display text-xl font-bold tracking-tight text-text-primary">RollCall</span></div>
        <Link href="/auth/login" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(15,118,110,0.2)] transition hover:bg-primary-dark">Sign in</Link>
      </header>
      <main className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <section className="grid items-center gap-12 py-12 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Smart attendance</span>
            <h1 className="page-heading mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.08] text-text-primary sm:text-6xl">Attendance that feels <span className="text-primary">effortless.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">No QR codes, no roll call, no manual entry. Students register once and get marked present in seconds, while lecturers keep a clear, trustworthy record.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/auth/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,118,110,0.2)] transition hover:-translate-y-0.5 hover:bg-primary-dark">Sign in to your workspace <ArrowUpRight className="h-4 w-4" /></Link></div>
          </div>
          <div className="surface-grid relative mx-auto flex aspect-square w-full max-w-[30rem] items-center justify-center overflow-hidden rounded-[2rem] border border-primary/10 bg-white/70 shadow-[0_30px_80px_rgba(15,118,110,0.12)]">
            <div className="absolute h-64 w-64 rounded-full bg-accent/20 blur-3xl" /><Image src="/logo.png" alt="RollCall facial recognition illustration" width={480} height={480} priority className="relative w-[78%] drop-shadow-[0_25px_30px_rgba(15,23,42,0.18)]" />
            <div className="absolute bottom-6 left-5 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur sm:bottom-8 sm:left-8"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-xs font-semibold text-text-primary">Attendance verified</span></div><p className="mt-1 pl-6 text-[11px] text-text-secondary">Secure - accurate - fast</p></div>
          </div>
        </section>
        <section className="grid gap-4 pb-20 sm:grid-cols-3"><Feature icon={ScanFace} title="One-to-many recognition" desc="Each capture is matched against the whole enrolled roster server-side, not a one-to-one check." /><Feature icon={ShieldCheck} title="Server decides" desc="Matching and attendance writes happen on the server, keeping the browser lightweight and secure." /><Feature icon={BarChart3} title="Real attendance data" desc="Confidence-scored records, manual overrides, and per-course trends keep everyone informed." /></section>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-text-secondary">Copyright {new Date().getFullYear()} RollCall. Built for enrolled students, lecturers, and admins.</footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof ScanFace; title: string; desc: string }) {
  return <div className="group rounded-2xl border border-border/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="h-5 w-5" aria-hidden="true" /></div><h3 className="mt-5 font-display text-base font-bold text-text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{desc}</p></div>;
}
