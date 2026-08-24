// Basic anti-spoofing via blink detection, per AttendAI_CONTEXT.md Section 3.
//
// HONEST LIMITATION (state this in your defense): face-api.js with a single
// static capture can be fooled by a photo held up to the camera. This blink
// check raises the bar against *casual* photo spoofing — a printed photo
// can't blink — but it does NOT defeat a determined attacker with a video
// replay. It is a mitigation, not a guarantee. Full anti-spoofing needs
// dedicated liveness hardware/models, which is explicitly out of scope
// (see CONTEXT.md Section 9, Non-Goals).
import * as faceapi from "face-api.js";

function distance(a: faceapi.Point, b: faceapi.Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function computeEyeAspectRatio(eyeLandmarks: faceapi.Point[]): number {
  const vertical1 = distance(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = distance(eyeLandmarks[2], eyeLandmarks[4]);
  const horizontal = distance(eyeLandmarks[0], eyeLandmarks[3]);
  return (vertical1 + vertical2) / (2 * horizontal);
}

export interface BlinkDetectionOptions {
  durationMs?: number;
  /** Called on every sampled frame so the UI can show a live "watching" indicator. */
  onSample?: (ear: number) => void;
  /** Allows the caller to cancel early (e.g. component unmount, user leaves the flow). */
  signal?: AbortSignal;
}

/**
 * Samples eye-aspect-ratio over a short window and looks for a clear dip,
 * which is what a real blink produces. The 0.06 delta threshold is
 * calibrated for face-api.js's TinyFaceDetector + 68-point landmarks,
 * where the raw EAR range per blink is typically 0.06–0.12.
 * Adjust if you switch to a higher-resolution detector.
 */
export async function detectBlink(
  videoElement: HTMLVideoElement,
  options: BlinkDetectionOptions = {}
): Promise<boolean> {
  const { durationMs = 4000, onSample, signal } = options;
  const readings: number[] = [];
  const start = Date.now();

  while (Date.now() - start < durationMs) {
    if (signal?.aborted) return false;

    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detection) {
      const leftEAR = computeEyeAspectRatio(detection.landmarks.getLeftEye());
      readings.push(leftEAR);
      onSample?.(leftEAR);
    }

    await new Promise((r) => setTimeout(r, 60));
  }

  if (readings.length < 3) return false; // not enough samples to trust a result

  const min = Math.min(...readings);
  const max = Math.max(...readings);
  return max - min > 0.06;
}
