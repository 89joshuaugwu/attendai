"use client";

import { FaceRegistrationFlow } from "@/components/organisms/FaceRegistrationFlow";

export default function RegisterFacePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Register your face</h1>
      <p className="mt-1 text-sm text-text-secondary">
        A one-time setup. Once registered, you&apos;ll be recognized automatically in every session for your enrolled courses.
      </p>
      <div className="mt-6">
        <FaceRegistrationFlow />
      </div>
    </div>
  );
}
