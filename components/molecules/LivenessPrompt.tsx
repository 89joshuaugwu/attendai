"use client";

import { Eye } from "lucide-react";

interface LivenessPromptProps {
  active: boolean;
  progress: number; // 0-100
}

export function LivenessPrompt({ active, progress }: LivenessPromptProps) {
  if (!active) return null;

  return (
    <div className="animate-fade-in absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-3 rounded-full bg-slate-900/90 px-5 py-3 shadow-lg backdrop-blur-sm">
      <Eye className="h-5 w-5 text-accent" aria-hidden="true" />
      <span className="text-sm font-medium text-white">Blink or nod to confirm you&apos;re here</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
