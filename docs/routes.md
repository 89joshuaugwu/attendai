# Routes and User Flows

## Public routes

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/auth/login` | Firebase email/password sign-in |

There is no public signup. Accounts are provisioned by an admin.

## Authenticated routes

| Route | Roles | Purpose |
| --- | --- | --- |
| `/dashboard` | all | Role-specific overview |
| `/dashboard/register-face` | student | Camera flow and face descriptor registration |
| `/dashboard/attendance-history` | student | Collection-group history for the signed-in student |
| `/dashboard/lecturer/sessions` | lecturer, admin | List and manage attendance sessions |
| `/dashboard/lecturer/sessions/new` | lecturer, admin | Create a session for an assigned course |
| `/dashboard/lecturer/sessions/[id]/capture` | lecturer, admin | Live camera recognition and manual fallback |
| `/dashboard/lecturer/sessions/[id]/records` | lecturer, admin | View records for one session and resume capture |
| `/dashboard/lecturer/reports` | lecturer, admin | Course attendance trends |
| `/dashboard/admin/lecturers` | admin | Provision lecturer accounts |
| `/dashboard/admin/students` | admin | Provision student accounts |
| `/dashboard/admin/courses` | admin | Create courses and manage enrollment |

The dashboard layout redirects unauthenticated users to `/auth/login` and redirects users away from role-inappropriate URL prefixes. Firestore rules remain the actual data-access boundary.

## API routes

| Method/route | Purpose |
| --- | --- |
| `POST /api/auth/session` | Creates lecturer/student accounts or courses based on an `action` field |
| `POST /api/attendance/[sessionId]/identify` | Accepts a 128-value descriptor and liveness result; returns marked/confirmation/rejected status |
| `POST /api/attendance/[sessionId]/manual` | Writes a manual override after confirmation |

See [security.md](./security.md) for the authentication and authorization work required on these routes.

