import ExcelJS from "exceljs";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TRecruitmentSubmission } from "@/server/recruitment-actions";

type Column = {
  label: string;
  getValue: (submission: TRecruitmentSubmission) => string;
};
type Block = { title: string; columns: Column[] };
type RepeatCounts = { workHistory: number; familyMembers: number };

const DASH = "—";

function yesNo(t: { yes: string; no: string }, value: string | undefined) {
  if (value === "yes") return t.yes;
  if (value === "no") return t.no;
  return DASH;
}

function lookup(options: Record<string, string>, value: string | undefined) {
  if (!value) return DASH;
  return options[value] ?? value;
}

function joinLookup(
  options: Record<string, string>,
  values: string[] | string | undefined
) {
  // Some fields (e.g. q1Experience) changed from a single enum value to an
  // array of values; older submissions may still store the legacy shape.
  const list = Array.isArray(values) ? values : values ? [values] : [];
  if (list.length === 0) return DASH;
  return list.map(v => options[v] ?? v).join(", ");
}

function withOther(base: string, other: string | undefined) {
  if (base !== DASH && other) return `${base} (${other})`;
  return base;
}

function formatDateTime(value: string | undefined) {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildAnswerBlocks(
  dict: Dictionary,
  repeatCounts: RepeatCounts
): Block[] {
  const f = dict.recruitmentForm;
  const opt = f.options;
  const s1 = f.section1;
  const s2 = f.section2;
  const genderLabels = { male: s1.genderMale, female: s1.genderFemale };
  const civilServant = { yes: s1.civilServantYes, no: s1.civilServantNo };
  const s5 = f.section5;
  const s7 = f.section7;
  const s9 = f.section9;
  const s11 = f.section11;

  const blocks: Block[] = [
    {
      title: dict.pages.recruitmentDetail.title,
      columns: [
        {
          label: dict.recruitmentsList.columns.status,
          getValue: s =>
            (s.statusUpdatedByRole === "ad" &&
              (s.status === "agreed" || s.status === "rejected") &&
              dict.recruitmentsList.adStatusLabels[s.status]) ||
            dict.recruitmentsList.statusLabels[s.status] ||
            s.status,
        },
        {
          label: dict.recruitmentDetailView.submittedAt,
          getValue: s => formatDateTime(s.submittedAt),
        },
      ],
    },
    {
      title: s1.title,
      columns: [
        { label: s1.fullName, getValue: s => s.fullName || DASH },
        { label: s1.dateOfBirth, getValue: s => s.dateOfBirth || DASH },
        { label: s1.idNumber, getValue: s => s.idNumber || DASH },
        { label: s1.idIssueDate, getValue: s => s.idIssueDate || DASH },
        { label: s1.idIssuePlace, getValue: s => s.idIssuePlace || DASH },
        {
          label: s1.genderLabel,
          getValue: s => lookup(genderLabels, s.gender),
        },
        {
          label: s1.maritalStatusLabel,
          getValue: s => lookup(opt.maritalStatus, s.maritalStatus),
        },
        { label: s1.taxCode, getValue: s => s.taxCode || DASH },
        {
          label: s1.averageMonthlyIncomeLabel,
          getValue: s => lookup(opt.income, s.averageMonthlyIncome),
        },
        {
          label: s1.potentialCustomers,
          getValue: s => s.potentialCustomers || DASH,
        },
        {
          label: s1.educationLevelLabel,
          getValue: s =>
            withOther(
              lookup(opt.education, s.educationLevel),
              s.educationLevelOther
            ),
        },
        {
          label: s1.civilServantLabel,
          getValue: s => lookup(civilServant, s.isCivilServant),
        },
        {
          label: s1.civilServantTypeLabel,
          getValue: s =>
            withOther(
              joinLookup(opt.civilServantType, s.civilServantType),
              s.civilServantTypeOther
            ),
        },
        {
          label: s1.accountHolderNameLabel,
          getValue: s => s.accountHolderName || DASH,
        },
        {
          label: s1.bankAccountNumberLabel,
          getValue: s => s.bankAccountNumber || DASH,
        },
        { label: s1.bankNameLabel, getValue: s => s.bankName || DASH },
        { label: s1.branchLabel, getValue: s => s.branch || DASH },
        { label: s1.mobile1, getValue: s => s.mobile1 || DASH },
        { label: s1.mobile2, getValue: s => s.mobile2 || DASH },
        { label: s1.email, getValue: s => s.email || DASH },
        { label: s1.managerLabel, getValue: s => s.managerName || DASH },
      ],
    },
    {
      title: s2.title,
      columns: [
        {
          label: s2.channelLabel,
          getValue: s =>
            withOther(lookup(opt.channel, s.channel), s.channelOther),
        },
        {
          label: s2.agencyTypeLabel,
          getValue: s => lookup(opt.agencyType, s.agencyType),
        },
        {
          label: s2.positionLabel,
          getValue: s =>
            withOther(lookup(opt.position, s.positionApplied), s.positionOther),
        },
        {
          label: s2.programLabel,
          getValue: s => yesNo(s2, s.participatingProgram),
        },
        {
          label: s2.programLabel,
          getValue: s =>
            withOther(
              joinLookup(opt.program, s.programTypes),
              s.programTypesOther
            ),
        },
        { label: s2.rehireLabel, getValue: s => yesNo(s2, s.isRehire) },
        {
          label: s2.rehireFromDateLabel,
          getValue: s => s.rehireFromDate || DASH,
        },
        {
          label: s2.rehireToDateLabel,
          getValue: s => s.rehireToDate || DASH,
        },
        {
          label: s2.rehireChannelLabel,
          getValue: s =>
            withOther(
              lookup(opt.channel, s.rehireChannel),
              s.rehireChannelOther
            ),
        },
        { label: s2.recruiterCode, getValue: s => s.recruiterCode || DASH },
        { label: s2.recruiterName, getValue: s => s.recruiterName || DASH },
        {
          label: s2.recruiterIdNumber,
          getValue: s => s.recruiterIdNumber || DASH,
        },
        { label: s2.referrerCode, getValue: s => s.referrerCode || DASH },
        { label: s2.referrerName, getValue: s => s.referrerName || DASH },
        {
          label: s2.referrerIdNumber,
          getValue: s => s.referrerIdNumber || DASH,
        },
      ],
    },
    {
      title: f.section3.title,
      columns: [
        {
          label: f.section3.provinceLabel,
          getValue: s => s.permanentProvince || DASH,
        },
        {
          label: f.section3.wardLabel,
          getValue: s => s.permanentWard || DASH,
        },
        {
          label: f.section3.streetLabel,
          getValue: s => s.permanentStreetAddress || DASH,
        },
      ],
    },
    {
      title: f.section4.title,
      columns: [
        {
          label: f.section4.title,
          getValue: s =>
            s.sameAsPermanentAddress === "same"
              ? f.section4.same
              : s.sameAsPermanentAddress === "different"
                ? f.section4.different
                : DASH,
        },
        {
          label: f.section4.provinceLabel,
          getValue: s => s.temporaryProvince || DASH,
        },
        {
          label: f.section4.wardLabel,
          getValue: s => s.temporaryWard || DASH,
        },
        {
          label: f.section4.streetLabel,
          getValue: s => s.temporaryStreetAddress || DASH,
        },
      ],
    },
    {
      title: s5.title,
      columns: [
        {
          label: s5.hasInsuranceExperienceLabel,
          getValue: s => yesNo(s5, s.hasInsuranceExperience),
        },
      ],
    },
    ...Array.from({ length: repeatCounts.workHistory }, (_, index): Block => ({
      title: s5.companyHeading(index + 1),
      columns: [
        {
          label: s5.fromDate,
          getValue: s => s.workHistory?.[index]?.fromDate || DASH,
        },
        {
          label: s5.toDate,
          getValue: s => s.workHistory?.[index]?.toDate || DASH,
        },
        {
          label: s5.jobTitle,
          getValue: s => s.workHistory?.[index]?.title || DASH,
        },
        {
          label: s5.companyNameAddress,
          getValue: s => s.workHistory?.[index]?.companyNameAddress || DASH,
        },
      ],
    })),
    {
      title: f.section6.title,
      columns: [
        {
          label: f.section6.title,
          getValue: s => joinLookup(opt.referral, s.referralChannel),
        },
        {
          label: opt.referral.other,
          getValue: s => s.referralOther || DASH,
        },
      ],
    },
    {
      title: s7.title,
      columns: [
        {
          label: s7.questionLabel,
          getValue: s => yesNo(s7, s.hasPepRelationship),
        },
        {
          label: s7.relationship,
          getValue: s => s.pepRelationship || DASH,
        },
        { label: s7.fullName, getValue: s => s.pepFullName || DASH },
        { label: s7.position, getValue: s => s.pepPosition || DASH },
        {
          label: s7.organization,
          getValue: s => s.pepOrganization || DASH,
        },
      ],
    },
    ...Array.from(
      { length: repeatCounts.familyMembers },
      (_, index): Block => ({
        title: f.section8.memberHeading(index + 1),
        columns: [
          {
            label: f.section8.name,
            getValue: s => s.familyMembers?.[index]?.name || DASH,
          },
          {
            label: f.section8.birthYear,
            getValue: s => s.familyMembers?.[index]?.birthYear || DASH,
          },
          {
            label: f.section8.relationshipLabel,
            getValue: s =>
              lookup(opt.relationship, s.familyMembers?.[index]?.relationship),
          },
          {
            label: f.section8.occupation,
            getValue: s => s.familyMembers?.[index]?.occupation || DASH,
          },
        ],
      })
    ),
    {
      title: s9.title,
      columns: [
        {
          label: s9.q1Label,
          getValue: s => joinLookup(opt.q1, s.q1Experience),
        },
        {
          label: s9.q2Label,
          getValue: s => withOther(joinLookup(opt.q2, s.q2View), s.q2ViewOther),
        },
        {
          label: s9.q3Label,
          getValue: s =>
            withOther(
              joinLookup(opt.q3, s.q3TargetAudience),
              s.q3TargetAudienceOther
            ),
        },
        { label: s9.q4Label, getValue: s => s.q4FirstTenPeople || DASH },
        {
          label: s9.q5Label,
          getValue: s => joinLookup(opt.training, s.q5Training),
        },
        {
          label: s9.q6Label,
          getValue: s =>
            withOther(joinLookup(opt.q6, s.q6Support), s.q6SupportOther),
        },
      ],
    },
    {
      title: s11.title,
      columns: [
        {
          label: s11.voluntary,
          getValue: s => yesNo(s11, s.commitmentVoluntary ? "yes" : "no"),
        },
        {
          label: s11.dataConsent,
          getValue: s => yesNo(s11, s.commitmentDataConsent ? "yes" : "no"),
        },
        {
          label: s11.consentLabel,
          getValue: s => yesNo(s11, s.confirmationConsent),
        },
        {
          label: s11.methodLabel,
          getValue: s =>
            s.confirmationMethod === "handwritten" ? s11.handwritten : DASH,
        },
        { label: s11.signDateLabel, getValue: s => s.signDate || DASH },
      ],
    },
  ];

  return blocks;
}

function repeatCountsFor(submission: TRecruitmentSubmission): RepeatCounts {
  return {
    workHistory: submission.workHistory?.length ?? 0,
    familyMembers: submission.familyMembers?.length ?? 0,
  };
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" },
};
const LABEL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F4F6" },
};

function writeHeaderRows(sheet: ExcelJS.Worksheet, blocks: Block[]) {
  const titleRow = sheet.getRow(1);
  const labelRow = sheet.getRow(2);
  labelRow.height = 80;

  let column = 1;
  for (const block of blocks) {
    const startColumn = column;
    for (const field of block.columns) {
      titleRow.getCell(column).value = block.title;
      labelRow.getCell(column).value = field.label;
      column += 1;
    }
    const endColumn = column - 1;
    if (endColumn > startColumn) {
      sheet.mergeCells(1, startColumn, 1, endColumn);
    }
  }

  titleRow.font = { bold: true };
  labelRow.font = { bold: true };
  titleRow.eachCell(cell => (cell.fill = HEADER_FILL));
  labelRow.eachCell(cell => {
    cell.fill = LABEL_FILL;
    cell.alignment = { vertical: "top", wrapText: true };
  });
}

function writeValueRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  blocks: Block[],
  submission: TRecruitmentSubmission
) {
  const row = sheet.getRow(rowNumber);
  row.height = 51;

  let column = 1;
  for (const block of blocks) {
    for (const field of block.columns) {
      row.getCell(column).value = field.getValue(submission);
      column += 1;
    }
  }

  row.eachCell(cell => {
    cell.alignment = { vertical: "top", wrapText: true };
  });
}

export async function buildRecruitmentWorkbook(
  submission: TRecruitmentSubmission,
  dict: Dictionary
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  const blocks = buildAnswerBlocks(dict, repeatCountsFor(submission));
  writeHeaderRows(sheet, blocks);
  writeValueRow(sheet, 3, blocks, submission);

  if (submission.attachments?.length) {
    const attachmentsSheet = workbook.addWorksheet(
      dict.recruitmentForm.section10.title.slice(0, 31)
    );
    attachmentsSheet.columns = [
      { header: dict.documents.columns.fileName, width: 45 },
      { header: dict.documents.columns.size, width: 15 },
    ];
    attachmentsSheet.getRow(1).font = { bold: true };
    for (const attachment of submission.attachments) {
      attachmentsSheet.addRow([attachment.fileName, attachment.size]);
    }
  }

  return workbook.xlsx.writeBuffer();
}

export async function buildRecruitmentsWorkbook(
  submissions: TRecruitmentSubmission[],
  dict: Dictionary
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  const repeatCounts: RepeatCounts = {
    workHistory: Math.max(
      0,
      ...submissions.map(s => s.workHistory?.length ?? 0)
    ),
    familyMembers: Math.max(
      0,
      ...submissions.map(s => s.familyMembers?.length ?? 0)
    ),
  };

  const blocks = buildAnswerBlocks(dict, repeatCounts);
  writeHeaderRows(sheet, blocks);
  submissions.forEach((submission, index) => {
    writeValueRow(sheet, index + 3, blocks, submission);
  });

  return workbook.xlsx.writeBuffer();
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "recruitment";
}

export function uniqueName(fileName: string, used: Set<string>): string {
  if (!used.has(fileName)) {
    used.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex > 0 ? fileName.slice(dotIndex) : "";

  let candidate: string;
  let counter = 1;
  do {
    candidate = `${base} (${counter})${ext}`;
    counter += 1;
  } while (used.has(candidate));

  used.add(candidate);
  return candidate;
}
