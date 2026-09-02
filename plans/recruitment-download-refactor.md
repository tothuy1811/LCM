# Plan: Recruitment download (route reuse + Excel format)

## Context

`/api/recruitments/[id]/download` (the "download all" action on the
`/recruitments` list) returns a zip containing every attachment plus an
Excel file of the candidate's answers. This plan covers two related
corrections made to that route after the initial implementation:

1. The route originally duplicated auth/fetch logic that already existed in
   `src/server/recruitment-actions.ts`.
2. The Excel file's layout didn't match the format the business actually
   wants, captured in the reference file `documents/Example_Format.xlsx`.

## 1. Reuse `recruitment-actions.ts` instead of duplicating auth/fetch logic

**Problem:** the route re-implemented two things that already exist in
`recruitment-actions.ts`:

- Auth check (`getSessionUser()` + `canAccessRecruitments(role)`) duplicated
  `requireRecruitmentAccess()` (`recruitment-actions.ts:27`).
- Fetch-by-id from Firestore (`adminDb.collection(COLLECTION).doc(id).get()`)
  duplicated `getRecruitmentSubmission(id)` (`recruitment-actions.ts:146`).

**Status: done.** `src/app/api/recruitments/[id]/download/route.ts` now
calls `getRecruitmentSubmission(id)` directly (server actions are plain
async functions, safe to call from a Route Handler) and returns
`new Response(result.error, { status: 403 })` on any failure — collapsing
"not authenticated," "forbidden," and "not found" into the same
`ActionResult` pattern used everywhere else, with translated error text
instead of hardcoded strings. The local `COLLECTION` constant, the
`adminDb` import, and the manual role check were removed; `adminStorage`
stays (needed to download attachment bytes for the zip) and `getDictionary()`
stays as a separate call (needed to build the Excel export, a distinct
concern from access-checking).

## 2. Match the Excel layout to `documents/Example_Format.xlsx`

**Problem:** the first version of `buildRecruitmentWorkbook`
(`src/lib/recruitment-export.ts`) laid the answers out **vertically** — one
merged section-title row per section, stacked down the sheet, each followed
by its own label row and value row. The actual required format, given in
`documents/Example_Format.xlsx`, is a single **horizontal** record: one row
per candidate, with grouped section headers merged across that section's own
columns.

**Reference file structure** (`documents/Example_Format.xlsx`, sheet
`Sheet1`):

- Row 1: section-group titles, merged across their column range
  (`A1:B1` = "Candidate details", `C1:X1` = "Personal information",
  `Y1:AH1` = "Recruitment information", ...), bold, fill `FFE5E7EB`.
- Row 2: individual field labels, bold, fill `FFF3F4F6`, `wrapText`, height 80.
- Row 3: exactly one row of answers for the candidate, `wrapText`, height 51.

**Status: done.** `buildRecruitmentWorkbook` now builds `Sheet1` with a
single column cursor: for each block returned by `buildAnswerBlocks`
(section title + its ordered field label/value pairs — unchanged from
before), it writes the title into row 1, the label into row 2, and the value
into row 3 at the current column, then merges row 1 across that block's
column range if it spans more than one column. Repeating groups (work
history entries, family members) each still produce their own block/column
group, placed sequentially in the same row rather than as separate stacked
sections. Verified column-for-column against the reference file: the first
three groups (`A1:B1`, `C1:X1`, `Y1:AH1`) match exactly, including fill
colors and field ordering.

## Verification

- `npx tsc --noEmit`
- `yarn eslint` on the touched files
- `yarn build` — confirms `ƒ /api/recruitments/[id]/download` still compiles
  and registers
- Smoke test: generate a workbook from a sample submission via `tsx`, read
  it back with `exceljs`, and diff merges/labels/fills against
  `documents/Example_Format.xlsx`
