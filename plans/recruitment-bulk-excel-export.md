# Plan: Bulk Excel export for multiple recruitment candidates

## Context

The `/recruitments` list currently only supports downloading one candidate
at a time (a zip containing an Excel of their answers + their attachments,
built by `buildRecruitmentWorkbook` in `src/lib/recruitment-export.ts`,
whose column layout was verified against the reference file
`documents/Example_Format.xlsx`). The user wants to select several
candidates on that list and export them all into **one Excel file**, using
that same column layout (one column-group per form section, section titles
merged across their columns) — but with **one row per candidate** instead
of the single sample row the reference file shows.

The tricky part: two of the form's sections (work history, family members)
are repeating groups whose entry count varies per candidate. To keep every
row in a shared table aligned to the same columns, the sheet's column
structure must be sized to the **widest** candidate in the batch, padding
shorter candidates' rows with dashes for the columns they don't have data
for.

Row-selection UI (checkboxes, `enableRowSelection`/`onSelectionChange`) and
a `rightContent` toolbar slot already exist in the shared `DataTable`
component but are unused on this page — this feature is their first
real usage.

Attachments are **not** part of this export — the user explicitly asked
for "one file excel"; bundling N candidates' attachment files stays a
per-candidate concern via the existing single-download route.

## 1. `src/lib/recruitment-export.ts` — decouple structure from data

Today `buildAnswerBlocks(submission, dict)` returns
`{ title, columns: { label, value }[] }[]`, computing both labels and
values from one submission in a single pass, with the two repeating
sections (`s5.companyHeading`, `f.section8.memberHeading`) iterating
`submission.workHistory` / `submission.familyMembers` directly.

Refactor so the block **schema** (titles + labels, plus which
submission-array index each repeating column reads) is computed
independently of any one candidate's data:

- Change `Column` to `{ label: string; getValue: (s: TRecruitmentSubmission) => string }`.
- Change `buildAnswerBlocks(dict: Dictionary, repeatCounts: { workHistory: number; familyMembers: number }): Block[]` — drop the `submission` param. Every existing column becomes a `getValue: s => s.fullName || DASH` style closure. The two repeating sections become:
  ```ts
  Array.from({ length: repeatCounts.workHistory }, (_, index) => ({
    title: s5.companyHeading(index + 1),
    columns: [
      { label: s5.fromDate, getValue: s => s.workHistory?.[index]?.fromDate || DASH },
      // ...same pattern for toDate, jobTitle, companyNameAddress
    ],
  }))
  ```
  (same pattern for `familyMembers` / `f.section8.memberHeading`). This is the one part of the diff to write carefully — every field inside these two blocks needs `?.[index]?.` optional chaining since the entry may not exist for a shorter candidate.
- `buildRecruitmentWorkbook(submission, dict)`: derive `repeatCounts` from that one submission (`{ workHistory: submission.workHistory?.length ?? 0, familyMembers: submission.familyMembers?.length ?? 0 }`), call the refactored `buildAnswerBlocks(dict, repeatCounts)` once, and when writing row 3 use `field.getValue(submission)` instead of `field.value`. Output is byte-identical to today — no behavior change for the existing single-candidate route.
- Add `buildRecruitmentsWorkbook(submissions: TRecruitmentSubmission[], dict: Dictionary): Promise<ExcelJS.Buffer>`:
  - `workHistoryCount = Math.max(0, ...submissions.map(s => s.workHistory?.length ?? 0))`, same for `familyMembersCount`.
  - Call `buildAnswerBlocks(dict, { workHistory: workHistoryCount, familyMembers: familyMembersCount })` **once** — this is the shared column schema for every row.
  - Write row 1 (titles, merged per block) and row 2 (labels) exactly like `buildRecruitmentWorkbook` does today.
  - For each submission, write one row (starting at row 3) by mapping the same block/column list through `field.getValue(submission)` — reusing the identical column list guarantees every row has the same shape by construction, not by convention.
  - Apply the same `wrapText` + row height (51) styling as the existing value row.
  - No attachments sheet.

## 2. `src/server/recruitment-actions.ts` — one batched, auth-checked fetch

Looping the existing `getRecruitmentSubmission(id)` per selected id would
re-resolve the session (`verifySessionCookie` with revocation check, a
network call to Firebase Auth) and re-read the user's role doc once per
id — wasteful and pointless when it's the same requesting user for the
whole batch. Add a dedicated batched action instead, next to the existing
ones:

```ts
export async function getRecruitmentSubmissionsByIds(
  ids: string[]
): Promise<ActionResult<TRecruitmentSubmission[]>> {
  const check = await requireRecruitmentAccess();
  if (!check.ok) return check;
  const { dict, user } = check;

  const uniqueIds = [...new Set(ids)].slice(0, 200);
  if (uniqueIds.length === 0) return { ok: true, data: [] };

  try {
    const docs = await adminDb.getAll(
      ...uniqueIds.map(id => adminDb.collection(COLLECTION).doc(id))
    );

    const submissions = docs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }) as TRecruitmentSubmission)
      .filter(s => user.role !== "ad" || s.managerUid === user.uid);

    return { ok: true, data: submissions };
  } catch {
    return { ok: false, error: dict.errors.recruitment.listFailed };
  }
}
```

This applies the exact same ownership predicate `getRecruitmentSubmission`
already uses (an "ad" user only gets rows they manage), just evaluated
once against one resolved `user` — same security boundary, no per-id
re-auth. Caps + dedupes ids defensively (mirrors the existing 200-row cap
used elsewhere in this file).

## 3. New route: `src/app/api/recruitments/export/route.ts` (POST)

```ts
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : [];
  if (ids.length === 0) {
    return new Response("Invalid request", { status: 400 });
  }

  const result = await getRecruitmentSubmissionsByIds(ids);
  if (!result.ok) return new Response(result.error, { status: 403 });
  if (result.data.length === 0) {
    const dict = await getDictionary();
    return new Response(dict.errors.recruitment.exportFailed, { status: 404 });
  }

  const dict = await getDictionary();
  const buffer = await buildRecruitmentsWorkbook(result.data, dict);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `danh-sach-ung-vien-${result.data.length}-${timestamp}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
```

Follows the same shape as the existing `[id]/download/route.ts` (plain
`Response`, `ActionResult` error passthrough, no new validation library —
no other route body in this app uses Zod, so a basic array/type guard is
enough here too).

## 4. `src/components/recruitments-view.tsx` — selection + export button

- Add `const [selectedSubmissions, setSelectedSubmissions] = useState<TRecruitmentSubmission[]>([])` and `const [isExporting, setIsExporting] = useState(false)`.
- Pass `enableRowSelection` and `onSelectionChange={setSelectedSubmissions}` to `<DataTable>`.
- Add `handleExportSelected`, mirroring the existing `handleDownload`'s fetch/blob/anchor-download pattern:
  ```ts
  const handleExportSelected = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/recruitments/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedSubmissions.map(s => s.id) }),
      });
      if (!response.ok) throw new Error("export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `danh-sach-ung-vien-${selectedSubmissions.length}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t.errors.recruitment.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };
  ```
- Pass `rightContent` to `<DataTable>`:
  ```tsx
  rightContent={
    selectedSubmissions.length > 0 && (
      <Button size="sm" disabled={isExporting} onClick={handleExportSelected}>
        {isExporting ? (
          <IconLoader2 className="size-4 animate-spin" />
        ) : (
          <IconDownload className="size-4" />
        )}
        {t.recruitmentsList.exportSelected(selectedSubmissions.length)}
      </Button>
    )
  }
  ```
  (import `Button` from `@/components/ui/button` and the two icons from `@tabler/icons-react`, matching `recruitments-columns.tsx`'s existing icon usage.)

Not doing in this pass (flagged, not blocking): clearing the checkbox
selection after a successful export isn't possible from the consumer
today — `DataTable` only exposes selection outward via
`onSelectionChange`, with no controlled-selection or reset prop. Leaving
selection as-is after export is harmless; adding a reset hook to
`DataTable` can be a follow-up if requested.

## 5. Dictionary strings

Add one new key under `recruitmentsList` in both
`src/lib/i18n/dictionaries/vi.ts` and `en.ts`, next to `downloadSr`:

- vi: `exportSelected: (count: number) => \`Xuất Excel đã chọn (${count})\``
- en: `exportSelected: (count: number) => \`Export selected (${count})\``

No new `errors.recruitment.*` string needed — reuse the existing
`exportFailed` for both the route's "nothing to export" case and the
client's fetch-failure toast.

## Verification

- `npx tsc --noEmit` and `yarn eslint` on all touched/added files.
- `yarn build` — confirms the new `/api/recruitments/export` route compiles and registers alongside the existing `[id]/download` route.
- Manual smoke test against the running dev server (Playwright, as used earlier in this session):
  1. Log in as an admin, select 2-3 candidates with differing work-history/family-member counts on `/recruitments`, click the export button, confirm the downloaded `.xlsx` opens with one row per selected candidate, correct headers/merges matching the existing single-download format, and dashes in the padded/missing repeat-group cells.
  2. Confirm the existing single-row `/api/recruitments/[id]/download` zip is unaffected (same output as before the refactor) — this is the regression check for the `buildAnswerBlocks` signature change.
  3. Log in as an "ad"-role user, confirm the export button only ever offers their own candidates (list is already scoped) and that a crafted request with a foreign id is silently dropped rather than exported (via `getRecruitmentSubmissionsByIds`'s ownership filter).
