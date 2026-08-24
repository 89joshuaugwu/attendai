"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

interface CredentialRevealProps {
  email: string;
  tempPassword: string;
  onDismiss: () => void;
}

/**
 * Shown once, right after an admin creates a lecturer/student account.
 * There's no SMTP wired up yet (see README "Known gaps"), so the temp
 * password only ever exists here — copy it and relay it to the person
 * yourself (WhatsApp, in person, etc). It won't be shown again after
 * this panel is dismissed; if lost, the admin has to reset it in the
 * Firebase Console (Authentication → Users → Reset password).
 */
export function CredentialReveal({ email, tempPassword, onDismiss }: CredentialRevealProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${tempPassword}`);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[var(--radius-control)] border border-warning/30 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            Account created — share this password now, it won&apos;t be shown again
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Emailing isn&apos;t wired up yet, so copy this and send it to them yourself.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 font-mono text-sm">
            <span className="truncate text-text-secondary">{email}</span>
            <span className="text-border">·</span>
            <span className="font-semibold text-text-primary">{tempPassword}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy credentials"}
            </button>
            <button
              onClick={onDismiss}
              className="rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
