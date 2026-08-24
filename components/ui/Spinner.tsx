import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary" role="status">
      <Loader2 className={cn("h-5 w-5 animate-spin text-primary", className)} aria-hidden="true" />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">Loading{label ? `: ${label}` : ""}</span>
    </div>
  );
}
