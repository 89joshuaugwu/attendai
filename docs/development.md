# Development Guide

## Requirements

- Node.js compatible with the Next.js 16 toolchain
- npm
- A Firebase project with Authentication and Firestore enabled

## Install and run

```bash
npm ci
copy .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Client variables begin with `NEXT_PUBLIC_` and are safe for Firebase web configuration. Server Admin variables must never be exposed to the browser:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `NEXT_PUBLIC_APP_URL`

Keep `.env.local` and `attendai-firebase-admin-sdk.json` out of Git. Never paste the service-account private key into an issue, commit, or client-side code.

## Quality checks

```bash
npm run lint
npm run build
```

The build may need network access because `app/layout.tsx` uses `next/font/google`.

## Firebase bootstrap

1. Enable Email/Password Authentication.
2. Create the first admin user in Firebase Authentication.
3. Add a matching `users/{uid}` document with `role: "admin"`, `displayName`, `email`, and `faceDescriptor: null`.
4. Deploy Firestore and Realtime Database rules/indexes.
5. Use the admin screens to create lecturer/student accounts and courses.

