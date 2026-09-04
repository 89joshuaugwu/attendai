"use client";

import { useRef, useState } from "react";
import { Check, FileUp } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ImportResult = { name: string; email: string; registrationNumber: string; error?: string };

export function BulkStudentImport({ onClose }: { onClose: () => void }) {
  const { firebaseUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Array<{ name?: string; email: string; registrationNumber: string }>>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const readFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...data] = lines;
    const columns = header.toLowerCase().split(",").map((value) => value.trim());
    const nameIndex = columns.findIndex((value) => value === "name" || value === "full name");
    const emailIndex = columns.indexOf("email");
    const registrationNumberIndex = columns.findIndex((value) => ["reg number", "registration number", "reg", "matric number"].includes(value));
    if (emailIndex < 0 || registrationNumberIndex < 0) {
      toast.error("CSV needs Reg Number and Email columns.");
      return;
    }
    const parsed = data.map((line) => line.split(",")).map((cells) => ({ name: nameIndex >= 0 ? cells[nameIndex]?.trim() : undefined, email: cells[emailIndex]?.trim(), registrationNumber: cells[registrationNumberIndex]?.trim() }))
      .filter((student) => student.registrationNumber || student.email);
    if (!parsed.length || parsed.length > 100) {
      toast.error("Upload between 1 and 100 students.");
      return;
    }
    setRows(parsed as Array<{ name?: string; email: string; registrationNumber: string }>);
    setResults([]);
  };

  const submit = async () => {
    if (!firebaseUser || !rows.length) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
        body: JSON.stringify({ action: "bulk_create_students", students: rows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResults(data.results);
      toast.success("Student import completed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't import students.");
    } finally {
      setSubmitting(false);
    }
  };

  return <Card className="mt-6">
    <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">Import students</h2><p className="mt-1 text-sm text-text-secondary">Upload a CSV with <strong>Reg Number</strong> and <strong>Email</strong> columns. Full Name is optional (up to 100 students).</p><a href="/student-import-template.csv" download className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Download sample CSV</a></div><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></div>
    {!results.length ? <div className="mt-5 rounded-[var(--radius-control)] border border-dashed border-primary/30 bg-primary/[0.025] p-5 text-center"><FileUp className="mx-auto h-6 w-6 text-primary" /><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} /><p className="mt-2 text-sm font-medium">{rows.length ? `${rows.length} students ready to import` : "Choose your student CSV"}</p><div className="mt-4 flex justify-center gap-2"><Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose CSV</Button>{rows.length > 0 && <Button size="sm" loading={submitting} onClick={submit}>Create accounts</Button>}</div></div> : <div className="mt-5"><p className="mb-3 text-sm text-text-secondary">Students can activate with their registration number and school email from the sign-in page.</p><div className="max-h-56 divide-y divide-border overflow-y-auto rounded-[var(--radius-control)] border border-border">{results.map((result) => <div key={result.email} className="px-3 py-2 text-sm"><p className="font-medium">{result.name}</p><p className={result.error ? "text-error" : "text-success"}>{result.error ?? `${result.registrationNumber} · Account ready for activation`}</p></div>)}</div><div className="mt-4 flex justify-end"><Button size="sm" onClick={onClose}><Check className="h-4 w-4" /> Done</Button></div></div>}
  </Card>;
}
