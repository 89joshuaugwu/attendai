// One-to-many face matching, per docs/architecture.md.
//
// IMPORTANT — calibration is not optional. The 0.45 / 0.6 thresholds below
// are starting points from common face-api.js usage, not verified numbers.
// Calibration requires running identifyFace() against your own
// registered test roster (several real people, plus one unregistered face)
// and adjusting these until "high" consistently means "actually them" and
// an unregistered face reliably returns "none". Do not ship the defaults
// unverified.
import * as faceapi from "face-api.js";
import type { ConfidenceTier, EnrolledStudent } from "@/types";

/**
 * Builds a FaceMatcher from the enrolled roster's stored descriptors.
 * Runs on the server inside the identify route, using descriptors fetched
 * via firebase-admin — never trust a client-supplied roster.
 */
export function buildFaceMatcher(roster: EnrolledStudent[]): faceapi.FaceMatcher {
  const labeledDescriptors = roster
    .filter((s) => s.descriptor && s.descriptor.length === 128)
    .map((s) => new faceapi.LabeledFaceDescriptors(s.uid, [s.descriptor]));

  // Second constructor arg is the matcher's internal max-distance gate.
  // Kept generous (0.6) here; the real accept/confirm/reject decision is
  // made afterwards by getConfidenceTier() using the finer 0.45 / 0.6 bands.
  return new faceapi.FaceMatcher(labeledDescriptors, 0.6);
}

export interface IdentifyResult {
  uid: string | null;
  distance: number;
}

export function identifyFace(
  matcher: faceapi.FaceMatcher,
  liveDescriptor: Float32Array
): IdentifyResult {
  const bestMatch = matcher.findBestMatch(liveDescriptor);
  return {
    uid: bestMatch.label === "unknown" ? null : bestMatch.label,
    distance: bestMatch.distance,
  };
}

/**
 * Confidence tiers used by ConfidenceBadge:
 *  - high   (< 0.45): auto-mark present, no human in the loop
 *  - medium (< 0.6):  lecturer must confirm before it's recorded
 *  - none   (>= 0.6): not recognized, offer manual entry
 *
 * Calibrate these against real captures in Phase 2 before trusting them —
 * lighting, camera quality, and distance from lens all shift the real
 * distance distribution for a given room/device.
 */
export function getConfidenceTier(distance: number): ConfidenceTier {
  if (distance < 0.45) return "high";
  if (distance < 0.6) return "medium";
  return "none";
}

/** Loads the tiny face detector + landmark + recognition model weights. Call once, client-side. */
export async function loadFaceApiModels(modelUrl = "/models"): Promise<void> {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ]);
}

/** Detects a single face in a video/image element and returns its 128-d descriptor, or null if no face found. */
export async function computeFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
}
