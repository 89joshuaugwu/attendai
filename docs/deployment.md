# Deployment Guide

## Vercel/Next.js deployment

1. Connect the GitHub repository to the deployment provider.
2. Set the variables from `.env.local.example` in the production environment.
3. Use `npm run build` as the build command and the provider's standard Next.js output.
4. Set `NEXT_PUBLIC_APP_URL` to the real deployed URL.
5. Deploy Firebase rules/indexes separately with the Firebase CLI.
6. Create the first admin manually in Firebase before inviting users.

## Pre-launch checklist

- [ ] API ID-token verification is implemented.
- [ ] Admin/lecturer ownership checks are implemented on every Admin SDK route.
- [ ] Request schemas, rate limits, and error handling are in place.
- [ ] Firestore rules are deployed and reviewed.
- [ ] Realtime Database rules are deployed as deny-all.
- [ ] Face thresholds are calibrated with real test data.
- [ ] Biometric consent and retention policy is documented.
- [ ] Temporary-password onboarding is replaced with a secure invitation flow.
- [ ] Production Firebase credentials are stored only in deployment secrets.

