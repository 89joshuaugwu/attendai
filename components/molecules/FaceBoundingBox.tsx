"use client";

interface FaceBoundingBoxProps {
  box: { x: number; y: number; width: number; height: number } | null;
  status: "detecting" | "high" | "medium" | "none" | "idle";
}

const statusColor: Record<FaceBoundingBoxProps["status"], string> = {
  idle: "border-white/30",
  detecting: "border-accent",
  high: "border-success",
  medium: "border-warning",
  none: "border-error",
};

/**
 * Draws the signature cyan (or status-colored) bounding box over the live
 * video feed, per DESIGN.md's "signature moment". Respects
 * prefers-reduced-motion by relying on globals.css's animation override,
 * which strips the draw-in transition and shows the final state directly.
 */
export function FaceBoundingBox({ box, status }: FaceBoundingBoxProps) {
  if (!box) return null;

  return (
    <div
      className={`animate-draw-box pointer-events-none absolute rounded-2xl border-2 shadow-[0_0_0_4px_rgba(6,182,212,0.15)] transition-colors duration-200 ${statusColor[status]}`}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
    >
      {/* Corner accents for a more "scanner" feel, matching the logo's viewfinder motif */}
      {(["-top-1 -left-1 border-t-2 border-l-2", "-top-1 -right-1 border-t-2 border-r-2", "-bottom-1 -left-1 border-b-2 border-l-2", "-bottom-1 -right-1 border-b-2 border-r-2"] as const).map(
        (pos, i) => (
          <span
            key={i}
            className={`absolute h-4 w-4 ${pos} ${statusColor[status]} rounded-sm`}
          />
        )
      )}
    </div>
  );
}
