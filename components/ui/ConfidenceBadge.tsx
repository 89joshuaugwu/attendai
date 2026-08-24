import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ConfidenceTier } from "@/types";
import { cn } from "@/lib/utils";

const config: Record<ConfidenceTier, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  high: {
    label: "High confidence",
    icon: CheckCircle2,
    classes: "bg-success/10 text-success border-success/30",
  },
  medium: {
    label: "Needs confirmation",
    icon: AlertTriangle,
    classes: "bg-warning/10 text-warning border-warning/30",
  },
  none: {
    label: "Not recognized",
    icon: XCircle,
    classes: "bg-error/10 text-error border-error/30",
  },
};

export function ConfidenceBadge({ tier, distance }: { tier: ConfidenceTier; distance?: number }) {
  const { label, icon: Icon, classes } = config[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        classes
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
      {typeof distance === "number" && (
        <span className="font-mono text-[10px] opacity-70">· {distance.toFixed(3)}</span>
      )}
    </span>
  );
}
