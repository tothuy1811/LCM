# Firebase Integration Plan

## Context

The app currently has no backend — no auth, no database, no file storage. The
`(app)` route group hardcodes a placeholder user (`{ name: "User", email: "" }`)
in `src/app/(app)/layout.tsx`, there is no `proxy.ts` for route protection,
and the `(auth)` route group exists but is empty. The goal is to wire in
Firebase to provide:

- **Auth**: email/password sign-in, gating the `(app)` shell.
- **Firestore**: a generic data layer, proven end-to-end via a demo feature.
- **Storage**: document/image upload, backing the same demo feature.

Decisions confirmed with the user up front:

1. **Sign-in method**: email/password only (no OAuth).
2. **Session strategy**: server-side session cookies (Firebase Admin verifies
   the ID token and mints an HttpOnly cookie), checked in `proxy.ts` and
   in `(app)/layout.tsx` — this matches the app's existing cookie-based
   preferences pattern rather than introducing a purely client-side auth
   model.
3. **Firebase project**: none exists yet — scaffold with placeholder env vars
   (`.env.example`) for the user to fill in themselves. No real credentials
   are fabricated.
4. **Firestore/Storage scope**: generic reusable infrastructure plus one demo
   "Documents" page (list/upload/delete files with Firestore-stored
   metadata) — no business entities are invented since none exist in the
   codebase today.

The plan reuses existing conventions rather than inventing new ones: the
`ActionResult<T>` type (`src/lib/types.ts`), the cookie server-action pattern
(`src/server/server-actions.ts`), the Zustand store+provider+hook pattern
documented in `.claude/skills/add-store/SKILL.md` and implemented in
`src/stores/preferences/`, and the existing `Field`/`FieldLabel`/`FieldError`
primitives in `src/components/ui/field.tsx` (shadcn's newer Field API,
already present but unused — first real consumer will be the login form).

## Key design decisions

- **Admin credentials**: one `FIREBASE_SERVICE_ACCOUNT_BASE64` env var
  (base64-encoded service-account JSON) instead of three separate vars —
  avoids multiline-private-key escaping issues in env UIs like Vercel.
- **Session minting**: a Server Action (`src/server/auth-actions.ts`), not a
  Route Handler — Server Actions can call `cookies().set()` directly, so no
  extra API route is needed.
- **`proxy.ts` location**: `src/proxy.ts` (must sit next to
  `src/app`).
- **Edge-safety split**: `src/proxy.ts` runs on the Edge runtime and
  must never import `firebase-admin`. The session cookie _name_/_max-age_
  constants live in a dependency-free `src/lib/firebase/session-cookie.ts`;
  the Admin-SDK-backed verifier lives in a separate `src/lib/firebase/session.ts`
  that only Server Components/Actions import.
- **Storage upload path**: uploads go through a Server Action (bytes posted
  to the Next server), not client-direct-to-Storage. Only the trusted Admin
  SDK ever touches Storage/Firestore, matching the existing single-gateway
  convention (`src/server/*.ts`) and avoiding a second, parallel
  client-side-Firebase-Auth-session story. Trade-off: Server Actions default
  to a 1MB body limit, so `next.config.ts` raises
  `experimental.serverActions.bodySizeLimit` to `"10mb"`.
- **Firestore/Storage rules**: committed as default-deny
  (`firestore.rules`/`storage.rules`/`firebase.json`/`.firebaserc`) since the
  Admin SDK bypasses rules entirely today — they document intent and give a
  ready `firebase deploy` path if client-direct access is added later.
  Deploying them is optional for the app to function.
- **Download URLs**: never stored in Firestore or made public. Only
  `storagePath` is stored; a short-lived (15 min) signed URL is minted
  on-demand via a `getDocumentDownloadUrl` server action.
- **No sign-up page**: only sign-in/sign-out are in scope. Users are
  provisioned manually via Firebase Console → Authentication → Users → Add
  user.
- **Auth store scope**: `AuthStoreProvider` wraps only the `(app)` layout,
  not the root layout — `/login` doesn't need reactive client auth state,
  since middleware + the cookie already drive its redirect logic
  server-side.
- **`TUser` extended with `uid`**, not a parallel `TAuthUser` type — its only
  two consumers (`nav-user.tsx`, `app-sidebar.tsx`) already accept `TUser`
  structurally.
- **Demo Documents list uses `<DataTable>` in its existing client-managed
  pagination mode** (no `meta`/`pagination`/`setPagination` props).
  Firestore's cursor pagination doesn't map cleanly onto `DataTable`'s
  1-based `pageIndex`, so `listDocuments()` fetches the most recent 100 docs
  in one shot and lets `DataTable` paginate client-side — this is the first
  real consumer of the currently-unused `DataTable` component. (Follow-up,
  not in scope: a "load more" beyond 100 docs.)
- **No new `.md` setup doc** — setup instructions live as comments in
  `.env.example` plus the verification checklist below, per this repo's
  convention of not adding unsolicited docs.

## Implementation steps

### 1. Install packages

```bash
yarn add firebase firebase-admin server-only
```

### 2. `.env.example` (new, committed)

```
# ── Firebase Client SDK (public — safe to expose to the browser) ──────────
# Firebase Console → Project settings → General → "Your apps" → SDK setup and configuration
NEXT_PUBLIC_FIREBASE_API_KEY=REPLACE_ME
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=REPLACE_ME.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=REPLACE_ME
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=REPLACE_ME.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=REPLACE_ME
NEXT_PUBLIC_FIREBASE_APP_ID=REPLACE_ME

# ── Firebase Admin SDK (server-only secret — never expose to the client) ──
# Firebase Console → Project settings → Service accounts → Generate new private key
# Downloads a JSON file. Base64-encode the ENTIRE file into a single line:
#   macOS/Linux:  base64 -i service-account.json | tr -d '\n'
# Never commit the raw JSON file.
FIREBASE_SERVICE_ACCOUNT_BASE64=REPLACE_ME

# Session cookie lifetime in seconds (Firebase createSessionCookie max is 14 days = 1209600)
SESSION_COOKIE_MAX_AGE_SECONDS=432000
```

Copy to `.env.local` to fill in real values — `.env*` is already gitignored,
no `.gitignore` change needed.

### 3. `src/lib/firebase/client.ts` (new)

Initializes the client SDK with a `getApps().length` guard against HMR
re-initialization; exports `auth`, `db`, `storage`.

### 4. `src/lib/firebase/admin.ts` (new, `import "server-only"`)

Decodes `FIREBASE_SERVICE_ACCOUNT_BASE64`, initializes the Admin app once;
exports `adminAuth`, `adminDb`, `adminStorage`.

### 5. `src/lib/firebase/session-cookie.ts` (new — Edge-safe, no Admin SDK import)

Exports `SESSION_COOKIE_NAME` and `SESSION_COOKIE_MAX_AGE_SECONDS`.

### 6. `src/lib/firebase/session.ts` (new, `import "server-only"`)

Exports `getSessionUser()`: reads the session cookie, calls
`adminAuth.verifySessionCookie(cookie, true)`, returns
`{ uid, email, name?, picture? } | null`.

### 7. `src/server/auth-actions.ts` (new, `"use server"`)

- `establishSession(idToken: string): Promise<ActionResult<{ uid, email }>>` —
  verifies the ID token, calls `adminAuth.createSessionCookie`, sets the
  HttpOnly/secure/sameSite=lax cookie via `cookies().set(...)`.
- `endSession(): Promise<ActionResult>` — deletes the cookie.

### 8. `src/proxy.ts` (new)

Checks for the session cookie's presence only (no Admin SDK — Edge-safe).
Redirects protected prefixes (`/dashboard`, `/settings`, `/documents`) →
`/login` when absent, and `/login` → `/dashboard` when a cookie is present.
`matcher` scoped to those paths.

### 9. `src/types/user.d.ts` (edit)

Add `uid: string` to `TUser`.

### 10. Auth store — `src/stores/auth/auth-store.ts` + `auth-provider.tsx` (new)

Mirrors `src/stores/preferences/` exactly: `createStore` from
`zustand/vanilla`, state `{ user: { uid, email } | null, isLoading, setUser }`,
a `"use client"` provider ref-instantiating the store once and wiring
`onAuthStateChanged`, and a `useAuthStore(selector)` hook that throws outside
the provider.

### 11. `src/app/(app)/layout.tsx` (edit)

Call `getSessionUser()`; `redirect("/login")` if null. Build a real `TUser`
from the session (falling back to email-derived name), pass it to
`<AppSidebar user={...}>` instead of the hardcoded placeholder. Wrap
`{children}` in `<AuthStoreProvider initialUser={...}>`.

### 12. `(auth)` route group (new)

- `src/app/(auth)/layout.tsx` — centered, sidebar-less shell.
- `src/app/(auth)/login/page.tsx` — server component rendering `<LoginForm />`.
- `src/components/login-form.tsx` (`"use client"`) — React Hook Form + Zod
  (`email`, `password: min 8`) using the existing `Field`/`FieldLabel`/
  `FieldError` primitives. Submit flow: client `signInWithEmailAndPassword`
  → `getIdToken()` → `establishSession(idToken)` server action → on success
  `router.push("/dashboard")`, on failure render the error via `FieldError`.

### 13. `src/components/nav-user.tsx` (edit)

Add a "Sign out" menu item: `signOut(auth)` (client SDK) then `endSession()`
(server action) then `router.push("/login")`.

### 14. `src/server/documents-actions.ts` (new, `"use server"`)

`TDocument` type: `{ id, fileName, contentType, size, storagePath,
uploadedByUid, uploadedByEmail, uploadedAt }`. Functions, each calling
`getSessionUser()` first and returning `{ ok: false, error: "Not
authenticated." }` if null — never trust a client-passed uid:

- `listDocuments(): Promise<ActionResult<TDocument[]>>` — most recent 100,
  `orderBy("uploadedAt", "desc").limit(100)`.
- `uploadDocument(formData: FormData): Promise<ActionResult<TDocument>>` —
  validates `File`, enforces a 5MB cap, writes to
  `documents/${uid}/${uuid}-${fileName}` in Storage, then adds the Firestore
  doc (no download URL stored).
- `deleteDocument(id: string): Promise<ActionResult>` — deletes the Storage
  object then the Firestore doc.
- `getDocumentDownloadUrl(id: string): Promise<ActionResult<{ url: string }>>`
  — mints a 15-minute signed URL on demand.

### 15. `src/types/navigation/sidebar.tsx` (edit)

Add a "Documents" nav item (`/documents`, `FileText` icon).

### 16. Demo page (new)

- `src/app/(app)/documents/page.tsx` — server component, calls
  `listDocuments()`, passes results into a client view.
- `src/components/documents-view.tsx` (`"use client"`) — owns local
  `documents` state, renders `<DocumentUpload>` and `<DataTable>` (client
  pagination mode, no `meta`/`pagination` props). Delete → optimistic
  removal + `sonner` toast. Download → `getDocumentDownloadUrl` then
  `window.open`.
- `src/components/document-upload.tsx` (`"use client"`) — file input +
  upload button, `useTransition` around `uploadDocument(formData)`, `sonner`
  toast on success/failure.
- `src/components/documents-columns.tsx` — `ColumnDef<TDocument>[]`:
  fileName, size (new `formatBytes` helper added to `src/lib/utils.ts`
  alongside the existing `formatCurrency`/`formatDate`), uploadedByEmail,
  uploadedAt (reuse existing `formatDate`), actions cell.

### 17. `next.config.ts` (edit)

Add `experimental.serverActions.bodySizeLimit: "10mb"`. (`images.remotePatterns`
intentionally not added — the demo opens signed URLs in a new tab rather
than rendering Storage images via `next/image`.)

### 18. Firebase CLI scaffolding (new)

`.firebaserc` (placeholder project id), `firebase.json`, `firestore.rules`,
`storage.rules` — default-deny (`allow read, write: if false;`) with a
comment explaining the Admin SDK bypasses these rules today, and what to
change if client-direct access is added later.

## Verification (no test runner exists — do not add one)

1. `yarn lint` and `yarn format:check` pass after all edits.
2. Create a Firebase project, enable Email/Password sign-in, download a
   service account key, populate `.env.local` from `.env.example`, create
   one test user in the console.
3. `yarn dev`: `/` → `/dashboard` → middleware redirects to `/login` (no
   cookie yet).
4. Sign in with the test user → redirected to `/dashboard`, sidebar shows
   the real email/derived name; revisiting `/login` now redirects to
   `/dashboard`.
5. Visit `/documents`, upload a small file, confirm it appears in the table,
   click Download (opens a signed URL), click Delete (removed from
   Firestore + Storage — verify in the Firebase Console).
6. Sign out → cookie cleared, `/dashboard` redirects to `/login` again.
7. Confirm `src/proxy.ts` doesn't pull in `firebase-admin` (check
   `next build` output / no Edge runtime errors).

## Critical files

- `src/lib/firebase/admin.ts`
- `src/lib/firebase/session-cookie.ts`
- `src/proxy.ts`
- `src/server/auth-actions.ts`
- `src/app/(app)/layout.tsx`
- `src/server/documents-actions.ts`
- `src/components/ui/field.tsx` (existing, reused for the login form)
