# AttendAI patch — "Missing or insufficient permissions" on My Attendance

## Root cause
The attendance-history page ran an *unfiltered* collectionGroup("records")
query, then filtered the results down to the current student in JavaScript.
That doesn't work with Firestore security rules: Firestore validates a
`list` query against its entire *possible* result set, not the documents
that actually come back. Since the rule (`request.auth.uid == uid`, where
uid is the document ID) depends on document data with no matching `where`
clause in the query, Firestore rejects the whole query up front — hence
"Missing or insufficient permissions," even though every document the
student *would* have gotten back was actually theirs.

## Fix
1. `lib/attendance.ts` — attendance records now also store a `studentUid`
   field (duplicate of the doc ID) when written.
2. `firestore/firestore.rules` — the `/records/{uid}` rule now also checks
   `resource.data.studentUid == request.auth.uid`, so a query filtered by
   that field can be validated.
3. `app/(dashboard)/dashboard/attendance-history/page.tsx` — the query now
   filters with `where("studentUid", "==", profile.uid)` instead of
   fetching everything and filtering client-side.
4. `firestore/firestore.indexes.json` — added the collection-group index
   Firestore needs for that filtered query (without it you'd get a
   different error with a Firebase-console link to auto-create it; this
   just does that ahead of time).
5. `types/index.ts` — added the `studentUid` field to `AttendanceRecord`.

## Files (overwrite these five)
- app/(dashboard)/dashboard/attendance-history/page.tsx
- lib/attendance.ts
- firestore/firestore.rules
- firestore/firestore.indexes.json
- types/index.ts

## ⚠️ You must republish rules AND indexes — both manual steps
1. Firebase Console → Firestore Database → Rules → paste the updated
   `firestore.rules` → Publish.
2. Firebase Console → Firestore Database → Indexes → the composite/
   collection-group index for `records.studentUid` needs to exist. Easiest
   path: after deploying the code, just visit "My Attendance" as a student
   once — if the index isn't there yet, Firestore's error message includes
   a direct "create it now" link. Or deploy `firestore.indexes.json` via
   the Firebase CLI (`firebase deploy --only firestore:indexes`) if you set
   that up.

## One more thing
Any attendance records marked *before* this patch won't have the new
`studentUid` field, so they won't show up in a student's history until
they're re-marked. Given where you are in setup (no attendance marked yet
per your screenshots), this shouldn't affect you.
