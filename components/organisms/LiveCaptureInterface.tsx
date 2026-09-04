"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";
import { Pause, Play, UserPlus } from "lucide-react";
import { loadFaceApiModels } from "@/lib/face-matching";
import { detectBlink } from "@/lib/liveness";
import { FaceBoundingBox } from "@/components/molecules/FaceBoundingBox";
import { RecognitionResult } from "@/components/molecules/RecognitionResult";
import { LivenessPrompt } from "@/components/molecules/LivenessPrompt";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { IdentifyResponse } from "@/types";
import { useAuth } from "@/lib/auth-context";

type FlowState =
  | "loading"
  | "camera-error"
  | "watching" // scanning for a face
  | "liveness" // blink check in progress
  | "identifying" // POST in flight
  | "result"; // showing RecognitionResult

interface FeedEntry {
  id: string;
  studentName: string;
  status: "marked" | "needs_confirmation" | "not_recognized";
  timestamp: number;
}

interface LiveCaptureInterfaceProps {
  sessionId: string;
  onManualEntry: () => void;
}

const RESET_DELAY_MS = 2000;

export function LiveCaptureInterface({ sessionId, onManualEntry }: LiveCaptureInterfaceProps) {
  const { firebaseUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedRef = useRef(false);
  const busyRef = useRef(false); // guards against overlapping detection loops
  const flowRef = useRef<FlowState>("loading");

  const [flow, setFlow] = useState<FlowState>("loading");
  const [paused, setPaused] = useState(false);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState<number | null>(null);
  const [feed, setFeed] = useState<FeedEntry[]>([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  // Bootstrap models + camera
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadFaceApiModels();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        // Don't attach to videoRef here — the <video> element only renders
        // once `flow` leaves "loading", so it hasn't mounted yet at this
        // point. The effect below attaches it as soon as it does.
        setFlow("watching");
      } catch {
        setFlow("camera-error");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Attaches the already-granted stream to the video element as soon as it
  // mounts (whenever `flow` moves into a state that renders the <video> tag).
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [flow]);

  const resetForNext = useCallback(() => {
    setResult(null);
    setResultTimestamp(null);
    setBox(null);
    setLivenessProgress(0);
    setFlow("watching");
    busyRef.current = false;
  }, []);

  const runIdentification = useCallback(
    async (descriptor: Float32Array) => {
      setFlow("identifying");
      try {
        if (!firebaseUser) throw new Error("Not signed in");
        const res = await fetch(`/api/attendance/${sessionId}/identify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
          body: JSON.stringify({ descriptor: Array.from(descriptor), livenessVerified: true }),
        });
        const data: IdentifyResponse = await res.json();
        setResult(data);
        setResultTimestamp(Date.now());
        setFlow("result");

        if (data.status === "marked" && data.studentName) {
          setFeed((prev) => [{ id: `${data.uid}-${Date.now()}`, studentName: data.studentName!, status: "marked" as const, timestamp: Date.now() }, ...prev].slice(0, 8));
          setTimeout(() => resetForNext(), RESET_DELAY_MS);
        } else if (data.status === "not_recognized") {
          setTimeout(() => resetForNext(), RESET_DELAY_MS + 1000);
        }
        // needs_confirmation waits for the lecturer to act — no auto-reset
      } catch {
        toast.error("Couldn't reach the server. Check your connection.");
        resetForNext();
      }
    },
    [sessionId, resetForNext, firebaseUser]
  );

  const handleConfirm = async () => {
    if (!result?.uid) return;
    try {
      if (!firebaseUser) throw new Error("Not signed in");
      const res = await fetch(`/api/attendance/${sessionId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
        body: JSON.stringify({ uid: result.uid, distance: result.distance, confirmed: true }),
      });
      if (!res.ok) throw new Error();
      setFeed((prev) => [{ id: `${result.uid}-${Date.now()}`, studentName: result.studentName ?? result.uid!, status: "marked" as const, timestamp: Date.now() }, ...prev].slice(0, 8));
      toast.success(`${result.studentName ?? "Student"} marked present`);
    } catch {
      toast.error("Couldn't confirm attendance.");
    }
    resetForNext();
  };

  const handleReject = () => {
    toast("Skipped — not confirmed as a match.", { icon: "↩️" });
    resetForNext();
  };

  // Keep this loop alive while flow changes. Previously setting "liveness"
  // re-ran this effect and cancelled the check that had just begun.
  useEffect(() => {
    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        if (pausedRef.current || busyRef.current || flowRef.current !== "watching") {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          await new Promise((r) => setTimeout(r, 150));
          continue;
        }

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection && !cancelled) {
          const { box: rawBox } = detection.detection;
          setBox({
            x: (rawBox.x / video.videoWidth) * 100,
            y: (rawBox.y / video.videoHeight) * 100,
            width: (rawBox.width / video.videoWidth) * 100,
            height: (rawBox.height / video.videoHeight) * 100,
          });

          busyRef.current = true;
          setFlow("liveness");

          const controller = new AbortController();
          const passed = await detectBlink(video, {
            durationMs: 6000,
            signal: controller.signal,
            onSample: () => setLivenessProgress((p) => Math.min(100, p + 2.5)),
          });

          if (cancelled) return;

          if (!passed) {
            toast.error("Liveness check didn't pass — please blink naturally and try again.");
            resetForNext();
            continue;
          }

          const finalDescriptor = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!finalDescriptor) {
            resetForNext();
            continue;
          }

          await runIdentification(finalDescriptor.descriptor);
        } else {
          setBox(null);
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    loop();
    return () => {
      cancelled = true;
    };
  }, [resetForNext, runIdentification]);

  if (flow === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner label="Loading camera & face detection models…" />
      </div>
    );
  }

  if (flow === "camera-error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-error/30 bg-error/10 py-16 text-center">
        <p className="max-w-sm text-sm text-slate-200">
          Camera access was denied or unavailable. Enable camera permission, or use manual entry below.
        </p>
        <Button onClick={onManualEntry} variant="outline" className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
          <UserPlus className="h-4 w-4" /> Use manual entry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          <FaceBoundingBox
            box={box}
            status={flow === "liveness" ? "detecting" : flow === "identifying" ? "detecting" : "idle"}
          />
          <LivenessPrompt active={flow === "liveness"} progress={livenessProgress} />
          {flow === "identifying" && (
            <div className="absolute right-4 top-4">
              <Spinner label="Identifying…" />
            </div>
          )}
          {!box && flow === "watching" && (
            <p className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-slate-300">
              Step up and look at the camera
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
            className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManualEntry}
            className="gap-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <UserPlus className="h-4 w-4" /> Manual entry
          </Button>
        </div>

        {result && flow === "result" && (
          <div className="mt-5">
            <RecognitionResult
              status={result.status as "marked" | "needs_confirmation" | "not_recognized"}
              studentName={result.studentName}
              distance={result.distance}
              timestamp={resultTimestamp ?? undefined}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onManualEntry={onManualEntry}
            />
          </div>
        )}
      </div>

      {/* Live session feed */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Just marked</h3>
        {feed.length === 0 ? (
          <p className="text-sm text-slate-400">No one marked present yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {feed.map((entry) => (
              <li key={entry.id} className="animate-fade-in flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-100">
                <span className="truncate">{entry.studentName}</span>
                <span className="font-mono text-xs text-slate-400">
                  {new Date(entry.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
