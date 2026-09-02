# Architecture

## Product scope

RollCall is a role-based attendance application for enrolled students, lecturers, and administrators. Students register a face once. A lecturer opens an attendance session, the browser captures a face and proves basic liveness, and the server matches the descriptor against the course roster before writing attendance.

The interface is branded **RollCall**. The package name and GitHub repository still use the legacy **AttendAI** name.

## Technology stack

- Next.js 16 App Router and React 19
- TypeScript with strict mode
- Tailwind CSS v4
- Firebase Authentication and Cloud Firestore
- Firebase Admin SDK for trusted server operations
- face-api.js for browser detection/descriptor generation and server-side matching
- Recharts for lecturer reports
- Vercel-compatible deployment model

## Runtime boundaries

### Browser/client

Client components use `lib/firebase.ts` for Firebase Auth and Firestore. They render the dashboard, subscribe to user/course/session data, run face-api.js models from `/public/models`, and send only a raw 128-value face descriptor plus a liveness result to the identify endpoint.

### Server

API routes import `lib/firebase-admin.ts` and `lib/attendance.ts`. Firebase Admin has privileged access and bypasses Firestore rules. The server fetches the session, course, and enrolled roster; performs the face match; and writes the record only after a high-confidence match or an explicit manual confirmation.

## Attendance flow

1. An admin creates lecturer/student accounts and courses.
2. An admin enrolls students by adding their UIDs to `courses.enrolledStudentIds`.
3. A student enables the camera and saves a 128-value face descriptor on their own user document.
4. A lecturer creates and opens an `attendanceSessions` document.
5. The browser loads the face models, detects one face, and runs blink/head-motion liveness.
6. The browser sends `{ descriptor, livenessVerified }` to `POST /api/attendance/{sessionId}/identify`.
7. The server loads the enrolled students with valid descriptors and calculates the nearest match.
8. Distance `< 0.45` is automatically marked; `0.45 <= distance < 0.6` requires lecturer confirmation; `>= 0.6` is rejected.
9. Manual confirmation or manual entry uses `POST /api/attendance/{sessionId}/manual` and records `method: "manual_override"`.

## Important limitations

- Liveness is a mitigation, not complete anti-spoofing. A replayed video may still defeat this approach.
- Match thresholds are starting values and must be calibrated with real cameras, lighting, and test faces.
- Face descriptors are sensitive biometric data. Access, retention, and consent procedures are application-owner responsibilities.

