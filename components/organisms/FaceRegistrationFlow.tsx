"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw, ScanFace, Camera } from "lucide-react";
import { db } from "@/lib/firebase";
import { loadFaceApiModels, computeFaceDescriptor } from "@/lib/face-matching";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

type Step = "loading-models" | "camera-permission" | "ready" | "capturing" | "review" | "saving" | "done" | "error";

/**
 * One-time face registration flow. Reuses the capture pattern from
 * ExamGuard: request camera -> detect a stable face -> compute a 128-d
 * descriptor -> store it on /users/{uid}.faceDescriptor. This project's
 * FaceMatcher reads that field directly (see lib/attendance.ts).
 */
export function FaceRegistrationFlow() {
  const { firebaseUser, profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("loading-models");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);

  const alreadyRegistered = !!profile?.faceDescriptor;

  useEffect(() => {
    let cancelled = false;
    loadFaceApiModels()
      .then(() => !cancelled && setStep("camera-permission"))
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Couldn't load face detection models. Check /public/models is deployed.");
          setStep("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      // Don't try to attach to videoRef here — the <video> element for the
      // "ready" step hasn't mounted yet at this point in the function (it's
      // conditionally rendered below, gated on `step`). Flip the step and
      // let the effect below attach the stream once the element exists.
      setStep("ready");
    } catch {
      setErrorMsg("Camera access was denied. Enable camera permission in your browser settings to register your face.");
      setStep("error");
    }
  }, []);

  // Attaches the already-granted stream to the video element as soon as it
  // mounts (whenever `step` moves into a state that renders the <video> tag).
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [step]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setStep("capturing");
    const descriptor = await computeFaceDescriptor(videoRef.current);
    if (!descriptor) {
      toast.error("No face detected — center your face in the frame and try again.");
      setStep("ready");
      return;
    }
    setCapturedDescriptor(descriptor);
    setStep("review");
  };

  const handleSave = async () => {
    if (!firebaseUser || !capturedDescriptor) return;
    setStep("saving");
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        faceDescriptor: Array.from(capturedDescriptor),
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setStep("done");
      toast.success("Face registered successfully.");
    } catch {
      toast.error("Couldn't save your face data. Try again.");
      setStep("review");
    }
  };

  const handleRetake = () => {
    setCapturedDescriptor(null);
    setStep("ready");
  };

  if (step === "error") {
    return (
      <Card className="border-error/30 bg-error/5">
        <p className="text-sm text-error">{errorMsg}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (step === "done" || (alreadyRegistered && step === "camera-permission")) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h3 className="font-display text-lg font-semibold text-text-primary">Face already registered</h3>
        <p className="max-w-sm text-sm text-text-secondary">
          You&apos;re all set for facial recognition attendance. Re-register below if your appearance has changed significantly.
        </p>
        <Button variant="outline" onClick={() => { setStep("camera-permission"); }}>
          Re-register face
        </Button>
      </Card>
    );
  }

  if (step === "loading-models") {
    return (
      <Card className="flex flex-col items-center gap-3 py-10">
        <Spinner label="Loading face detection models…" />
      </Card>
    );
  }

  if (step === "camera-permission") {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <Camera className="h-10 w-10 text-primary" />
        <div>
          <h3 className="font-display text-lg font-semibold text-text-primary">Enable your camera</h3>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            We&apos;ll capture one snapshot of your face to enroll you for recognition-based attendance. This never leaves your account.
          </p>
        </div>
        <Button onClick={startCamera}>Enable camera</Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[var(--radius-card)] bg-slate-900">
        <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        {step !== "review" && (
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-dashed border-accent/60" />
        )}
        {step === "capturing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
            <Spinner label="Analyzing…" />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        {step === "ready" && (
          <>
            <p className="text-sm text-text-secondary">Center your face in the frame, then capture.</p>
            <Button onClick={handleCapture} className="gap-2">
              <ScanFace className="h-4 w-4" /> Capture face
            </Button>
          </>
        )}

        {step === "review" && (
          <>
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Face detected clearly
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRetake} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retake
              </Button>
              <Button onClick={handleSave}>Save & finish</Button>
            </div>
          </>
        )}

        {step === "saving" && <Spinner label="Saving your registration…" />}
      </div>
    </Card>
  );
}
