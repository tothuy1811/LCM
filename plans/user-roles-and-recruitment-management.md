# User Roles & Recruitment Management

## Context

The app had Firebase Auth (email/password) and Firestore/Storage wired in
(`plans/firebase-integration.md`), but every signed-in user had identical,
unrestricted access — there was no concept of a role, no user-management UI,
and no staff-facing view of the submissions coming in from the public
`/recruitment` application form (only the public form itself existed; it
could write submissions but nothing could read them back).

This adds two roles and the screens needed to act on them:

- **Administrator (Quản trị)** — full read/write access to every page.
- **AD — Quản lý Đại lý (Agency Manager)** — `/dashboard` only, plus full
  CRUD on recruitment submissions. No access to documents, settings, or
  user management.

## Key design decisions

- **Role storage: Firestore, not custom claims.** Firebase custom claims are
  the more common way to carry a role inside the ID token, but they only
  take effect on a *new* token — a role changed by an admin wouldn't apply
  to an already-signed-in user until they re-authenticated. A Firestore
  `users/{uid}` doc, looked up in `getSessionUser()` on every request,
  makes a role change take effect on the very next page load instead, at
  the cost of one extra Firestore read per request — an acceptable
  trade-off for an internal tool at this scale.
- **Self-provisioning bootstrap.** Before this change, the one real account
  in the system was created directly in the Firebase Console and has no
  `users/{uid}` doc. Rather than a manual migration step, `getSessionUser()`
  auto-creates the doc with `role: "admin"` the first time it sees a UID
  with none — this is what lets that existing account (and the pattern in
  general) bootstrap the rest of the system instead of being locked out the
  moment role checks went live.
- **Two enforcement layers, not one.** `src/proxy.ts` (Edge middleware)
  still only does the coarse "is there a session cookie" check it always
  did — it now also covers `/recruitments` and `/users`, but it does *not*
  attempt role checks, because it can't import `firebase-admin` (Edge
  runtime) and reading the role would mean either a second, unverified
  cookie-decode path or a Firestore call from the edge. Real authorization
  happens where the Admin SDK already lives: each restricted page
  (`/documents`, `/settings`, `/users`) calls `getSessionUser()` itself and
  redirects to `/dashboard` if the role doesn't allow it, and every
  server action re-checks the role independently before touching
  Firestore/Storage/Auth. A page-level check alone would leave the server
  actions callable directly by anyone signed in; checking in both places is
  what actually enforces the boundary.
- **`/recruitments` (management) vs `/recruitment` (the public form).**
  Deliberately different, non-overlapping paths — the public application
  form has no auth requirement and must keep working for anonymous
  candidates; the staff-facing list is a completely separate, protected
  route rather than an authenticated variant of the same one.
- **User deletion removes the Firebase Auth account, not just the Firestore
  role doc** — the alternative (soft-delete via a Firestore flag) would
  leave a real, usable login credential behind. `deleteUser` also refuses
  to let an admin delete their own account, the one guard against an admin
  locking themselves out.
- **Recruitment status is a fixed 4-value enum** (`new`, `contacted`,
  `hired`, `rejected`) rather than free-text, edited via the existing
  detail dialog's status `Select` — "edit" for a submission means changing
  its pipeline status; the applicant-entered fields themselves stay
  read-only (they're evidentiary, not something staff should silently
  rewrite).
- **Sidebar nav is now a function of role**, not a static list —
  `getSidebarItems(role)` in `src/types/navigation/sidebar.tsx` builds the
  item list per-request from the same `canAccess*` predicates the pages and
  actions use, so there's one source of truth for "what can this role see"
  rather than the sidebar and the page guards drifting out of sync.

## Implementation steps (as done)

### 1. `src/lib/permissions.ts` (new)

`Role = "admin" | "ad"`, `ROLE_OPTIONS`/`ROLE_LABELS` (Vietnamese labels for
the UI), and one `canAccess*(role)` predicate per restricted area
(`Documents`, `Settings`, `Users`, `Recruitments`) — the single source of
truth every page, server action, and the sidebar all import from.

### 2. `src/lib/firebase/session.ts` (edited)

`TSessionUser` gained a required `role: Role` field. `getSessionUser()` now
looks up `users/{uid}` in Firestore after verifying the session cookie, via
a new `resolveRole()` helper that self-provisions an `admin` doc on first
sight of a UID with none (see bootstrap decision above).

### 3. `src/server/user-actions.ts` (new, `"use server"`)

Admin-gated (`requireAdmin()`) CRUD over the `users` Firestore collection
and the underlying Firebase Auth accounts:

- `listUsers()` — most recent 200, `orderBy("createdAt", "desc")`.
- `createUser({ email, password, name, role })` — `adminAuth.createUser`
  then a matching Firestore doc; maps `auth/email-already-exists` to a
  Vietnamese error.
- `updateUser(uid, { name, role })` — updates the Firestore doc and the
  Auth `displayName`.
- `deleteUser(uid)` — deletes the Firestore doc then the Auth account;
  refuses self-deletion.

### 4. `src/server/recruitment-actions.ts` (edited)

Added a `requireRecruitmentAccess()` guard (admin or ad) and:

- `TRecruitmentSubmission` type (`RecruitmentValues & { id, submittedAt,
status }`).
- `submitRecruitmentForm` now writes `status: "new"` on every new
  submission (the public action itself stays unauthenticated — only the
  new staff-facing functions are gated).
- `listRecruitmentSubmissions()` — most recent 200.
- `updateRecruitmentSubmissionStatus(id, status)` — validates `status`
  against the fixed enum.
- `deleteRecruitmentSubmission(id)` — deletes the submission's Storage
  attachments before the Firestore doc.

### 5. Users page (new)

- `src/app/(app)/users/page.tsx` — server component; redirects to
  `/dashboard` if `!canAccessUsers(role)`, otherwise calls `listUsers()`
  and renders `<UsersView>`.
- `src/components/users-view.tsx` (`"use client"`) — owns local `users`
  state, optimistic delete (revert + toast on failure), wires
  `<UserFormDialog>` and a delete `<AlertDialog>`.
- `src/components/user-form-dialog.tsx` — shared add/edit dialog. Uses one
  Zod object for both modes (email/password are plain, unconstrained
  strings in the schema, `required`/`minLength` on the `<Input>`s for
  native browser validation in create mode) rather than two schemas —
  `react-hook-form`'s `useForm<T>` needs one static type, and switching the
  Zod resolver between a "create" and an "edit" schema at runtime doesn't
  type-check against a single generic. The server action re-validates
  properly regardless, so this only trades away client-side format
  checking on a low-stakes internal form.
- `src/components/users-columns.tsx` — name, email, role (`Badge`),
  created date, edit/delete actions.

### 6. Recruitments management page (new)

- `src/app/(app)/recruitments/page.tsx` — same guard pattern, gated on
  `canAccessRecruitments(role)`.
- `src/components/recruitments-view.tsx` (`"use client"`) — local state,
  optimistic delete, wires the detail dialog and a delete `<AlertDialog>`.
- `src/components/recruitment-detail-dialog.tsx` — read-only summary of
  the applicant's key fields plus a status `Select` and a "Cập nhật trạng
  thái" save button.
- `src/components/recruitments-columns.tsx` — name, phone, email, position
  (label), status (`Badge`), submitted date, view/delete actions; also
  exports the `POSITION_LABELS`/`STATUS_LABELS` maps the detail dialog
  reuses.

### 7. Route protection (edited)

- `src/proxy.ts` — `PROTECTED_PREFIXES`/`matcher` extended with
  `/recruitments` and `/users` (same coarse "has a session" check as the
  existing prefixes — see the two-layer decision above).
- `src/app/(app)/documents/page.tsx`, `src/app/(app)/settings/page.tsx` —
  each now calls `getSessionUser()` and redirects to `/dashboard` when the
  role doesn't pass `canAccessDocuments`/`canAccessSettings`.

### 8. Sidebar (edited)

- `src/types/navigation/sidebar.tsx` — `sidebarItems` (static array)
  replaced with `getSidebarItems(role): NavGroup[]`, built from the
  `canAccess*` predicates; every role always sees Dashboard and Ứng viên
  tuyển dụng (recruitments).
- `src/components/app-sidebar.tsx` — takes a new `role: Role` prop, calls
  `getSidebarItems(role)` instead of importing the old static list.
- `src/app/(app)/layout.tsx` — passes `sessionUser.role` into
  `<AppSidebar>`.

## Verification

No test runner exists in this project — verified by build/lint plus manual
route checks:

1. `yarn build` — clean compile, typecheck, and all expected routes
   present (`/dashboard`, `/documents`, `/login`, `/recruitment`,
   `/recruitments`, `/settings`, `/users`).
2. `yarn lint:fix` — zero errors in any new/edited file; the remaining
   lint findings are pre-existing `react-hooks` issues inherited from the
   shadcn template (`sidebar.tsx`, `use-mobile.ts`, `date-picker.tsx`,
   the two Zustand providers), unrelated to this change.
3. `curl` against a fresh `yarn dev`, unauthenticated:
   - `/users`, `/recruitments`, `/dashboard` → `307` to
     `/login?redirect=...` (proxy gate working for the new prefixes).
   - `/recruitment` (the public form) → `200` (unaffected).
4. **Not yet verified**: the actual authenticated flows (role-gated page
   redirects for a signed-in AD user, add/edit/delete for both users and
   recruitment submissions, the self-provisioning bootstrap for the
   existing account). This needs a real sign-in, which requires a
   password — sign in manually and click through: as the bootstrapped
   admin, confirm `/users` and `/settings` are reachable and a `users/{uid}`
   doc now exists in Firestore with `role: "admin"`; create an `ad` user
   from the Users page, sign in as them, and confirm `/documents`,
   `/settings`, and `/users` all redirect to `/dashboard` while
   `/recruitments` (list, status change, delete) works fully.

## Critical files

- `src/lib/permissions.ts`
- `src/lib/firebase/session.ts`
- `src/server/user-actions.ts`
- `src/server/recruitment-actions.ts`
- `src/proxy.ts`
- `src/types/navigation/sidebar.tsx`
- `src/app/(app)/users/page.tsx`
- `src/app/(app)/recruitments/page.tsx`

## Follow-ups (not in scope)

- No way for an admin to reset another user's password from the UI —
  Firebase Console → Authentication is the only option today.
- Recruitment attachments aren't viewable/downloadable from the detail
  dialog yet (only a file count) — would reuse the same signed-URL pattern
  `getDocumentDownloadUrl` already established for `/documents`.
- `listUsers`/`listRecruitmentSubmissions` cap at 200 records with no
  pagination beyond that, same limitation `listDocuments` already has.
