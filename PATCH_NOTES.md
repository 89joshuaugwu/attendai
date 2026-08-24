# AttendAI patch — student accounts + visible temp passwords

Drop these files into your existing repo at the same paths (they overwrite
2 existing files and add 3 new ones), commit, push, redeploy.

## New files
- app/api/auth/session/route.ts            (overwrite — adds create_student action)
- app/(dashboard)/dashboard/admin/lecturers/page.tsx  (overwrite — shows temp password)
- app/(dashboard)/dashboard/admin/students/page.tsx   (NEW — create student accounts)
- app/(dashboard)/dashboard/page.tsx        (overwrite — adds Students card to admin overview)
- components/molecules/CredentialReveal.tsx (NEW — password reveal panel)
- components/shells/AppShell.tsx            (overwrite — adds Students nav item)

## What changed and why
1. Lecturer creation now shows the temp password on-screen (copy button) right
   after creation. Before, it was generated and silently discarded — you had
   no way to actually log in as the lecturer you just created.
2. New /dashboard/admin/students page — same pattern as Lecturers. Creates a
   real Firebase Auth account + Firestore /users/{uid} doc with role: "student".
   This didn't exist before, so there was no way to get students into the
   roster the Courses enrollment modal expects.
3. Admin nav + overview updated to link to the new Students page.

## After deploying: re-generate credentials for the lecturer you already made
Mr. Joshua Ugwu's account exists in Firebase Auth, but the temp password was
never surfaced anywhere — it's gone. Easiest fix: Firebase Console →
Authentication → Users → find joshuaugwu89@gmail.com → the "⋮" menu →
"Reset password" → this emails a reset link to that address (only works if
that inbox is real and reachable, which it is per your profile). Or delete
that Auth user and recreate the lecturer from the (now-fixed) admin panel to
get a fresh visible temp password.
