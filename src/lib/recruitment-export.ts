import ExcelJS from "exceljs";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TRecruitmentSubmission } from "@/server/recruitment-actions";

type Column = { label: string; value: string };
type Block = { title: string; columns: Column[] };

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
  values: string[] | undefined
) {
  if (!values || values.length === 0) return DASH;
  return values.map(v => options[v] ?? v).join(", ");
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
  submission: TRecruitmentSubmission,
  dict: Dictionary
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
          value: dict.recruitmentsList.statusLabels[submission.status],
        },
        {
          label: dict.recruitmentDetailView.submittedAt,
          value: formatDateTime(submission.submittedAt),
        },
      ],
    },
    {
      title: s1.title,
      columns: [
        { label: s1.fullName, value: submission.fullName || DASH },
        { label: s1.dateOfBirth, value: submission.dateOfBirth || DASH },
        { label: s1.idNumber, value: submission.idNumber || DASH },
        { label: s1.idIssueDate, value: submission.idIssueDate || DASH },
        { label: s1.idIssuePlace, value: submission.idIssuePlace || DASH },
        {
          label: s1.genderLabel,
          value: lookup(genderLabels, submission.gender),
        },
        {
          label: s1.maritalStatusLabel,
          value: lookup(opt.maritalStatus, submission.maritalStatus),
        },
        { label: s1.taxCode, value: submission.taxCode || DASH },
        {
          label: s1.taxCodeIssueDate,
          value: submission.taxCodeIssueDate || DASH,
        },
        {
          label: s1.taxCodeIssuePlace,
          value: submission.taxCodeIssuePlace || DASH,
        },
        {
          label: s1.averageMonthlyIncomeLabel,
          value: lookup(opt.income, submission.averageMonthlyIncome),
        },
        {
          label: s1.potentialCustomers,
          value: submission.potentialCustomers || DASH,
        },
        {
          label: s1.educationLevelLabel,
          value: lookup(opt.education, submission.educationLevel),
        },
        {
          label: s1.civilServantLabel,
          value: lookup(civilServant, submission.isCivilServant),
        },
        {
          label: s1.accountHolderNameLabel,
          value: submission.accountHolderName || DASH,
        },
        {
          label: s1.bankAccountNumberLabel,
          value: submission.bankAccountNumber || DASH,
        },
        { label: s1.bankNameLabel, value: submission.bankName || DASH },
        { label: s1.branchLabel, value: submission.branch || DASH },
        { label: s1.mobile1, value: submission.mobile1 || DASH },
        { label: s1.mobile2, value: submission.mobile2 || DASH },
        { label: s1.email, value: submission.email || DASH },
        { label: s1.managerLabel, value: submission.managerName || DASH },
      ],
    },
    {
      title: s2.title,
      columns: [
        {
          label: s2.channelLabel,
          value: lookup(opt.channel, submission.channel),
        },
        {
          label: s2.agencyTypeLabel,
          value: lookup(opt.agencyType, submission.agencyType),
        },
        {
          label: s2.positionLabel,
          value: withOther(
            lookup(opt.position, submission.positionApplied),
            submission.positionOther
          ),
        },
        {
          label: s2.programLabel,
          value: yesNo(s2, submission.participatingProgram),
        },
        {
          label: s2.programLabel,
          value: joinLookup(opt.program, submission.programTypes),
        },
        { label: s2.rehireLabel, value: yesNo(s2, submission.isRehire) },
        { label: s2.recruiterCode, value: submission.recruiterCode || DASH },
        { label: s2.recruiterName, value: submission.recruiterName || DASH },
        { label: s2.referrerCode, value: submission.referrerCode || DASH },
        { label: s2.referrerName, value: submission.referrerName || DASH },
      ],
    },
    {
      title: f.section3.title,
      columns: [
        {
          label: f.section3.provinceLabel,
          value: submission.permanentProvince || DASH,
        },
        {
          label: f.section3.wardLabel,
          value: submission.permanentWard || DASH,
        },
        {
          label: f.section3.streetLabel,
          value: submission.permanentStreetAddress || DASH,
        },
      ],
    },
    {
      title: f.section4.title,
      columns: [
        {
          label: f.section4.title,
          value:
            submission.sameAsPermanentAddress === "same"
              ? f.section4.same
              : submission.sameAsPermanentAddress === "different"
                ? f.section4.different
                : DASH,
        },
        {
          label: f.section4.provinceLabel,
          value: submission.temporaryProvince || DASH,
        },
        {
          label: f.section4.wardLabel,
          value: submission.temporaryWard || DASH,
        },
        {
          label: f.section4.streetLabel,
          value: submission.temporaryStreetAddress || DASH,
        },
      ],
    },
    {
      title: s5.title,
      columns: [
        {
          label: s5.hasInsuranceExperienceLabel,
          value: yesNo(s5, submission.hasInsuranceExperience),
        },
      ],
    },
    ...(submission.workHistory ?? []).map((entry, index): Block => ({
      title: s5.companyHeading(index + 1),
      columns: [
        { label: s5.fromDate, value: entry.fromDate || DASH },
        { label: s5.toDate, value: entry.toDate || DASH },
        { label: s5.jobTitle, value: entry.title || DASH },
        {
          label: s5.companyNameAddress,
          value: entry.companyNameAddress || DASH,
        },
      ],
    })),
    {
      title: f.section6.title,
      columns: [
        {
          label: f.section6.title,
          value: joinLookup(opt.referral, submission.referralChannel),
        },
        { label: opt.referral.other, value: submission.referralOther || DASH },
      ],
    },
    {
      title: s7.title,
      columns: [
        {
          label: s7.questionLabel,
          value: yesNo(s7, submission.hasPepRelationship),
        },
        { label: s7.relationship, value: submission.pepRelationship || DASH },
        { label: s7.fullName, value: submission.pepFullName || DASH },
        { label: s7.position, value: submission.pepPosition || DASH },
        { label: s7.organization, value: submission.pepOrganization || DASH },
      ],
    },
    ...(submission.familyMembers ?? []).map((member, index): Block => ({
      title: f.section8.memberHeading(index + 1),
      columns: [
        { label: f.section8.name, value: member.name || DASH },
        { label: f.section8.birthYear, value: member.birthYear || DASH },
        {
          label: f.section8.relationshipLabel,
          value: lookup(opt.relationship, member.relationship),
        },
        { label: f.section8.occupation, value: member.occupation || DASH },
        { label: f.section8.address, value: member.address || DASH },
      ],
    })),
    {
      title: s9.title,
      columns: [
        { label: s9.q1Label, value: yesNo(s9, submission.q1Experience) },
        {
          label: s9.q2Label,
          value: withOther(
            joinLookup(opt.q2, submission.q2View),
            submission.q2ViewOther
          ),
        },
        {
          label: s9.q3Label,
          value: withOther(
            joinLookup(opt.q3, submission.q3FamilyReaction),
            submission.q3FamilyReactionOther
          ),
        },
        { label: s9.q4Label, value: submission.q4FirstTenPeople || DASH },
        {
          label: s9.q5Label,
          value: joinLookup(opt.training, submission.q5Training),
        },
        {
          label: s9.q6Label,
          value: withOther(
            joinLookup(opt.q6, submission.q6Support),
            submission.q6SupportOther
          ),
        },
      ],
    },
    {
      title: s11.title,
      columns: [
        {
          label: s11.voluntary,
          value: yesNo(s11, submission.commitmentVoluntary ? "yes" : "no"),
        },
        {
          label: s11.dataConsent,
          value: yesNo(s11, submission.commitmentDataConsent ? "yes" : "no"),
        },
        {
          label: s11.consentLabel,
          value: yesNo(s11, submission.confirmationConsent),
        },
        {
          label: s11.methodLabel,
          value:
            submission.confirmationMethod === "handwritten"
              ? s11.handwritten
              : DASH,
        },
        { label: s11.signDateLabel, value: submission.signDate || DASH },
      ],
    },
  ];

  return blocks;
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

export async function buildRecruitmentWorkbook(
  submission: TRecruitmentSubmission,
  dict: Dictionary
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  const titleRow = sheet.getRow(1);
  const labelRow = sheet.getRow(2);
  const valueRow = sheet.getRow(3);
  labelRow.height = 80;
  valueRow.height = 51;

  let column = 1;
  for (const block of buildAnswerBlocks(submission, dict)) {
    const startColumn = column;
    for (const field of block.columns) {
      titleRow.getCell(column).value = block.title;
      labelRow.getCell(column).value = field.label;
      valueRow.getCell(column).value = field.value;
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
  valueRow.eachCell(cell => {
    cell.alignment = { vertical: "top", wrapText: true };
  });

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

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "recruitment";
}
