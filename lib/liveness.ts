// Basic anti-spoofing via blink detection + motion fallback.
//
// HONEST LIMITATION (state this in your defense): face-api.js with a single
// static capture can be fooled by a photo held up to the camera. This blink
// check raises the bar against *casual* photo spoofing — a printed photo
// can't blink — but it does NOT defeat a determined attacker with a video
// replay. It is a mitigation, not a guarantee. Full anti-spoofing needs
// dedicated liveness hardware/models, which is explicitly out of scope
// (see CONTEXT.md Section 9, Non-Goals).
import * as faceapi from "face-api.js";

function dist(a: faceapi.Point, b: faceapi.Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function computeEyeAspectRatio(eyeLandmarks: faceapi.Point[]): number {
  const vertical1 = dist(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = dist(eyeLandmarks[2], eyeLandmarks[4]);
  const horizontal = dist(eyeLandmarks[0], eyeLandmarks[3]);
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
 * Detects liveness through two complementary signals:
 *
 * 1. **Blink detection** — averages the Eye Aspect Ratio (EAR) from BOTH
 *    eyes and looks for a dip (delta > 0.03). Using both eyes halves
 *    landmark noise compared to a single-eye check.
 *
 * 2. **Head motion fallback** — tracks nose-tip position across frames.
 *    If the user moves their head (nod, tilt, lean) by more than 3% of
 *    the face bounding box, that also counts as "live". A static photo
 *    held up to the camera can't produce this kind of motion.
 *
 * Liveness passes if EITHER signal fires.
 */
export async function detectBlink(
  videoElement: HTMLVideoElement,
  options: BlinkDetectionOptions = {}
): Promise<boolean> {
  const { durationMs = 4000, onSample, signal } = options;
  const earReadings: number[] = [];
  const nosePositions: { x: number; y: number }[] = [];
  let faceWidth = 0;
  const start = Date.now();

  while (Date.now() - start < durationMs) {
    if (signal?.aborted) return false;

    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detection) {
      // --- EAR from both eyes, averaged ---
      const leftEye = detection.landmarks.getLeftEye();
      const rightEye = detection.landmarks.getRightEye();
      const leftEAR = computeEyeAspectRatio(leftEye);
      const rightEAR = computeEyeAspectRatio(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2;
      earReadings.push(avgEAR);
      onSample?.(avgEAR);

      // --- Nose-tip position for motion tracking ---
      const nose = detection.landmarks.getNose();
      // Nose tip is typically landmark index 3 (tip of the nose)
      const noseTip = nose[3] ?? nose[0];
      nosePositions.push({ x: noseTip.x, y: noseTip.y });
      faceWidth = detection.detection.box.width;

      // --- Check 1: Blink (EAR dip) ---
      if (earReadings.length >= 3) {
        const minEAR = Math.min(...earReadings);
        const maxEAR = Math.max(...earReadings);
        if (maxEAR - minEAR > 0.03) {
          return true; // Blink detected!
        }
      }

      // --- Check 2: Head motion (nose displacement) ---
      if (nosePositions.length >= 3 && faceWidth > 0) {
        const first = nosePositions[0];
        let maxDisplacement = 0;
        for (let i = 1; i < nosePositions.length; i++) {
          const dx = nosePositions[i].x - first.x;
          const dy = nosePositions[i].y - first.y;
          const displacement = Math.hypot(dx, dy);
          if (displacement > maxDisplacement) maxDisplacement = displacement;
        }
        // If the nose moved more than 3% of the face width, it's live
        if (maxDisplacement > faceWidth * 0.03) {
          return true; // Motion detected!
        }
      }
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  // If the time window expires without detecting a blink or motion
  return false;
}
