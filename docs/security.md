# Security and Production Readiness

## Current controls

- Firestore attendance records have `allow write: if false` for clients.
- Face matching is performed against a server-loaded enrolled roster, not against a student ID supplied by the browser.
- Medium-confidence matches require lecturer confirmation in the UI.
- Realtime Database is explicitly denied.
- The Firebase Admin app is initialized only on the server and reads credentials from environment variables.
- The service-account JSON file is ignored by Git.

## Required before production

The following gaps are present in the current implementation and must be fixed before real deployment:

1. **Authenticate API callers.** The admin provisioning route and both attendance routes currently accept requests without verifying a Firebase ID token. A caller could otherwise invoke privileged actions or submit attendance requests directly.
2. **Authorize by role and ownership.** Confirm that account-creation actions are initiated by an admin. Confirm that manual attendance and session operations belong to the session lecturer or an admin.
3. **Validate request bodies.** Add schema validation, strict types, length limits, and rate limiting to API routes. Do not trust `confirmedBy`, `uid`, or other client-supplied identity fields.
4. **Protect biometric data.** Define consent, retention/deletion, export, and breach-response policies for stored face descriptors. Consider encrypting sensitive data at rest through an architecture appropriate for the deployment.
5. **Calibrate matching.** Test several enrolled people, unregistered people, lighting conditions, camera qualities, and false-match cases before selecting production thresholds.
6. **Harden account onboarding.** Temporary passwords are currently returned to the admin UI for manual delivery. Add a secure invitation/password-reset workflow and avoid displaying reusable credentials.
7. **Review Firebase rules with the deployed schema.** Rules are a security boundary, but server routes using Admin SDK bypass them and therefore need their own authentication and authorization.

## Threat model notes

The browser is treated as untrusted. It may send arbitrary descriptors, liveness flags, UIDs, or confirmation values. Server routes must validate and authorize every request independently; client UI restrictions are not security controls.

The current liveness implementation checks blink and small head motion. It can raise the bar against a static printed photo but does not reliably stop video replay or a determined attacker.

