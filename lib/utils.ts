import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ms: number | string): string {
  return new Date(ms).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(ms: number): string {
  return `${formatDate(ms)}, ${formatTime(ms)}`;
}

/** Converts a match distance into a 0-100 "confidence" percentage for display. Lower distance = higher confidence. */
export function distanceToPercent(distance: number): number {
  const clamped = Math.max(0, Math.min(1, distance));
  return Math.round((1 - clamped) * 100);
}
