"use client";

import { useRef, useState } from "react";
import { Check, Copy, FileUp } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ImportResult = { name: string; email: string; activationLink?: string; error?: string };

export function BulkStudentImport({ onClose }: { onClose: () => void }) {
  const { firebaseUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Array<{ name: string; email: string }>>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const readFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...data] = lines;
    const columns = header.toLowerCase().split(",").map((value) => value.trim());
    const nameIndex = columns.findIndex((value) => value === "name" || value === "full name");
    const emailIndex = columns.indexOf("email");
    if (nameIndex < 0 || emailIndex < 0) {
      toast.error("CSV needs Name and Email columns.");
      return;
    }
    const parsed = data.map((line) => line.split(",")).map((cells) => ({ name: cells[nameIndex]?.trim(), email: cells[emailIndex]?.trim() }))
      .filter((student) => student.name || student.email);
    if (!parsed.length || parsed.length > 100) {
      toast.error("Upload between 1 and 100 students.");
      return;
    }
    setRows(parsed as Array<{ name: string; email: string }>);
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

  const copyLinks = async () => {
    await navigator.clipboard.writeText(results.filter((result) => result.activationLink).map((result) => `${result.name} (${result.email})\n${result.activationLink}`).join("\n\n"));
    toast.success("Activation links copied.");
  };

  return <Card className="mt-6">
    <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">Import students</h2><p className="mt-1 text-sm text-text-secondary">Upload a CSV with <strong>Name</strong> and <strong>Email</strong> columns (up to 100 students).</p></div><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></div>
    {!results.length ? <div className="mt-5 rounded-[var(--radius-control)] border border-dashed border-primary/30 bg-primary/[0.025] p-5 text-center"><FileUp className="mx-auto h-6 w-6 text-primary" /><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} /><p className="mt-2 text-sm font-medium">{rows.length ? `${rows.length} students ready to import` : "Choose your student CSV"}</p><div className="mt-4 flex justify-center gap-2"><Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose CSV</Button>{rows.length > 0 && <Button size="sm" loading={submitting} onClick={submit}>Create & generate links</Button>}</div></div> : <div className="mt-5"><div className="mb-3 flex items-center justify-between"><p className="text-sm text-text-secondary">Send each student their private activation link so they can set a password.</p><Button size="sm" variant="outline" className="gap-2" onClick={copyLinks}><Copy className="h-4 w-4" /> Copy links</Button></div><div className="max-h-56 divide-y divide-border overflow-y-auto rounded-[var(--radius-control)] border border-border">{results.map((result) => <div key={result.email} className="px-3 py-2 text-sm"><p className="font-medium">{result.name}</p><p className={result.error ? "text-error" : "text-success"}>{result.error ?? "Activation link generated"}</p></div>)}</div><div className="mt-4 flex justify-end"><Button size="sm" onClick={onClose}><Check className="h-4 w-4" /> Done</Button></div></div>}
  </Card>;
}
