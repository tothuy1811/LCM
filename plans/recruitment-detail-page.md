# Recruitment Submission Detail Page

## Context

`/recruitments` (visible to `admin` and `ad` roles per `canAccessRecruitments`)
currently only offers a quick-look popup, `RecruitmentDetailDialog`, that shows
9 of the ~40 submitted fields and lets staff change only the status enum.
There is no way for an AD or Administrator to review the candidate's full
application or correct/update any of the information after submission. This
plan replaces the popup with a real detail page at `/recruitments/[id]` that
displays every field the candidate submitted, using the exact same
inputs/validation as the public application form, and lets staff edit and
save changes plus manage the status and attachments.

The server-side data functions this depends on
(`getRecruitmentSubmission`, `updateRecruitmentSubmission`,
`getRecruitmentAttachmentUrl` in `src/server/recruitment-actions.ts`)
are already implemented and gated by the existing `requireRecruitmentAccess()`
guard — no further backend work is needed.

## Approach

Extract the ~700 lines of field JSX currently hard-coded inside
`RecruitmentForm` (`src/components/recruitment-form.tsx`) into a new shared,
presentational component, `RecruitmentFormFields`, so the admin edit page
reuses the identical inputs and Zod validation (`recruitmentSchema`) as the
public form — no duplicated markup, no risk of the two forms drifting apart.

**Reused as-is (no changes needed):**
- `recruitmentSchema` / `RecruitmentValues` (`src/lib/validations/recruitment.ts`)
- `uploadRecruitmentAttachment` (public/unauthenticated, safe to call from the admin view too)
- `getRecruitmentSubmission`, `updateRecruitmentSubmission`, `getRecruitmentAttachmentUrl` (already added to `recruitment-actions.ts`)
- `requireRecruitmentAccess()` / `canAccessRecruitments()`
- `listRecruitmentManagers()` (`src/server/user-actions.ts`)
- `STATUS_LABELS`, `POSITION_LABELS` (`src/components/recruitments-columns.tsx`)
- The `SectionCard` layout pattern (numbered badge + `FieldSet`)
- The `(app)` layout's existing auth guard (`getSessionUser()` + `redirect`)

## Implementation

### 1. `src/components/recruitment-form-fields.tsx` (new)

Cut the local `SectionCard` component, the option constants
(`POSITION_OPTIONS`, `REFERRAL_OPTIONS`, `FAMILY_STATUS_OPTIONS`,
`TRAINING_OPTIONS`, `OPEN_QUESTIONS`, `MAX_FILES`, `MAX_FILE_BYTES`,
`ACCEPTED_TYPES`), and all 8 `SectionCard` blocks out of
`recruitment-form.tsx` into this new component. It also owns the file-upload
interaction (`uploading`/`uploadError` local state, `handleFilesSelected`,
`removeAttachment`) since that logic only touches `watch("attachments")` /
`setValue` and the public, unauthenticated `uploadRecruitmentAttachment`
action — both callers can use it unchanged.

```ts
export function RecruitmentFormFields({
  control, register, errors, watch, setValue, managers,
  onDownloadAttachment,
}: {
  control: Control<RecruitmentValues>;
  register: UseFormRegister<RecruitmentValues>;
  errors: FieldErrors<RecruitmentValues>;
  watch: UseFormWatch<RecruitmentValues>;
  setValue: UseFormSetValue<RecruitmentValues>;
  managers: TManagerOption[];
  onDownloadAttachment?: (attachment: TAttachment) => void;
}) { ... }
```

`onDownloadAttachment` is optional: when provided (only by the admin detail
view), section 7's attachment list renders a download button next to the
existing remove button for each file. The public form omits it and behaves
exactly as today.

No `useForm` call and no submit button of its own — both callers keep
control of submission independently.

### 2. `src/components/recruitment-form.tsx` (edit)

Keep the public-form shell: `useForm` setup, `submitted`/`formError` state,
the thank-you screen, `onSubmit` → `submitRecruitmentForm`, and the submit
button. Replace the inline `SectionCard` 1–8 JSX with:

```tsx
<RecruitmentFormFields
  control={control} register={register} errors={errors}
  watch={watch} setValue={setValue} managers={managers}
/>
```

### 3. `src/app/(app)/recruitments/[id]/page.tsx` (new)

Server component mirroring `src/app/(app)/recruitments/page.tsx`'s guard
pattern:

```tsx
export default async function RecruitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessRecruitments(sessionUser.role)) {
    redirect("/dashboard");
  }

  const [submissionResult, managersResult] = await Promise.all([
    getRecruitmentSubmission(id),
    listRecruitmentManagers(),
  ]);
  if (!submissionResult.ok) notFound();

  const managers = managersResult.ok ? managersResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{submissionResult.data.fullName}</h1>
      <RecruitmentDetailView submission={submissionResult.data} managers={managers} />
    </div>
  );
}
```

### 4. `src/components/recruitment-detail-view.tsx` (new, `"use client"`)

- `useForm<RecruitmentValues>({ resolver: zodResolver(recruitmentSchema), defaultValues: submission })`.
- Local `status` state (`useState(submission.status)`), same approach as the
  dialog it replaces.
- Renders `<RecruitmentFormFields ... onDownloadAttachment={handleDownload} />`.
- A status `Select` (reusing `STATUS_LABELS`) and a read-only "Nộp ngày
  {formatDate(submission.submittedAt)}" line, placed above or alongside the
  form fields.
- `handleDownload(attachment)`: calls `getRecruitmentAttachmentUrl(attachment.storagePath)` and `window.open(url, "_blank")` on success, else `toast.error`.
- Save button (`onSubmit`): calls `updateRecruitmentSubmission(id, values)`;
  if `status !== submission.status`, also calls
  `updateRecruitmentSubmissionStatus(id, status)`. Show `toast.success` /
  `toast.error` (`sonner`, already used in `recruitments-view.tsx`).
- Delete button: confirmation `AlertDialog` (same pattern as
  `recruitments-view.tsx`) → `deleteRecruitmentSubmission(id)` →
  `router.push("/recruitments")` on success (`useRouter` from
  `next/navigation`).

### 5. List wiring (edit)

- `recruitments-columns.tsx`: drop the `onView` param entirely; wrap the eye
  icon `Button` in a `next/link` `<Link href={`/recruitments/${row.original.id}`}>`.
- `recruitments-view.tsx`: remove `RecruitmentDetailDialog` import/usage and
  the `viewing`/`handleStatusChange`/`isSaving` state (status changes now
  happen on the detail page). Keep the delete `AlertDialog` and its state
  as-is. Update the `createRecruitmentsColumns(...)` call to only pass
  `onDelete`.

### 6. `src/components/recruitment-detail-dialog.tsx` (delete)

Fully superseded by the new page.

## Verification

- `yarn build` and `yarn lint:fix` — must pass with no new errors, and the
  build output must list `/recruitments/[id]` as a new dynamic route.
- `yarn dev` (background) + `curl -i http://localhost:3000/recruitments/test-id`
  → expect a `307` redirect to `/login` (unauthenticated), confirming the
  page-level guard is wired the same way as the existing `/recruitments`
  list.
- Kill the dev server afterward.
- Authenticated review/edit/delete flows are not verifiable without
  credentials — call this out explicitly rather than claiming full
  end-to-end verification.

## Critical files

- `src/server/recruitment-actions.ts` (already done — no change)
- `src/components/recruitment-form-fields.tsx` (new)
- `src/components/recruitment-form.tsx` (edit)
- `src/app/(app)/recruitments/[id]/page.tsx` (new)
- `src/components/recruitment-detail-view.tsx` (new)
- `src/components/recruitments-columns.tsx` (edit)
- `src/components/recruitments-view.tsx` (edit)
- `src/components/recruitment-detail-dialog.tsx` (delete)
