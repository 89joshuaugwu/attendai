# AttendAI patch — camera preview stays black

## Bug
Both the face-registration screen and the lecturer's live-capture screen
requested the camera stream *before* their `<video>` element existed in the
DOM (it's conditionally rendered based on component state that only flips
to "ready"/"watching" after the stream is already granted). Result: camera
permission is genuinely granted (no error, camera light on), but the stream
never gets attached to anything, so the preview box stays solid black.

## Fix
`videoRef.current` was being checked and assigned synchronously inside the
same async function that calls `getUserMedia()` and then flips state —
timing that doesn't work with React's conditional rendering. Replaced with
a small `useEffect` keyed on the state variable that gates the `<video>`
tag's render, so the stream gets attached the instant the element actually
mounts, however many renders that takes.

## Files (overwrite these two)
- components/organisms/FaceRegistrationFlow.tsx
- components/organisms/LiveCaptureInterface.tsx

## After applying
Redeploy, then re-test: /dashboard/register-face should show your live
camera feed inside the dashed guide box immediately after clicking "Enable
camera" — no more black box.
