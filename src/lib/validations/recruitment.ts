import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/dictionaries";

export function buildRecruitmentSchema(
  t: Dictionary["recruitmentForm"]["validation"]
) {
  const recruitmentObjectSchema = z.object({
    fullName: z.string().min(1, t.fullNameRequired),
    dateOfBirth: z.string().min(1, t.dateOfBirthRequired),
    idNumber: z.string().min(1, t.idNumberRequired),
    idIssueDate: z.string().optional(),
    idIssuePlace: z.string().optional(),
    gender: z.enum(["male", "female"], {
      error: t.genderRequired,
    }),
    maritalStatus: z.enum(["single", "married", "divorced", "widowed"], {
      error: t.maritalStatusRequired,
    }),
    mobile1: z.string().min(1, t.mobile1Required),
    mobile2: z.string().optional(),
    email: z.email(t.emailInvalid),
    managerUid: z.string().min(1, t.managerRequired),
    managerName: z.string().min(1, t.managerRequired),

    taxCode: z.string().optional(),
    averageMonthlyIncome: z.enum(
      ["under5m", "from5to10m", "from10to20m", "from20to50m", "over50m"],
      { error: t.averageMonthlyIncomeRequired }
    ),
    potentialCustomers: z.string().min(1, t.potentialCustomersRequired),
    educationLevel: z.enum(
      ["thpt", "trungCap", "caoDang", "daiHoc", "sauDaiHoc", "other"],
      { error: t.educationLevelRequired }
    ),
    educationLevelOther: z.string().optional(),
    isCivilServant: z.enum(["no", "yes"]).optional(),
    civilServantType: z
      .array(z.enum(["teacher", "police", "doctor", "other"]))
      .optional(),
    civilServantTypeOther: z.string().optional(),

    accountHolderName: z.string().min(1, t.accountHolderNameRequired),
    bankAccountNumber: z.string().min(1, t.bankAccountNumberRequired),
    bankName: z.string().min(1, t.bankNameRequired),
    branch: z.string().min(1, t.branchRequired),

    channel: z.enum(["agency", "other"], {
      error: t.channelRequired,
    }),
    channelOther: z.string().optional(),
    agencyType: z.enum(["full_time", "part_time"]).optional(),

    positionApplied: z.enum(
      ["agent", "unit_manager", "district_manager", "gad", "other"],
      { error: t.positionRequired }
    ),
    positionOther: z.string().optional(),

    participatingProgram: z.enum(["no", "yes"]).optional(),
    programTypes: z
      .array(
        z.enum([
          "near_mdrt_700m",
          "mdrt",
          "mdrt_2_years",
          "cot_mdrt_3_years",
          "gad_buyout",
          "other",
        ])
      )
      .optional(),

    isRehire: z.enum(["no", "yes"]).optional(),
    rehireFromDate: z.string().optional(),
    rehireToDate: z.string().optional(),
    rehireChannel: z.enum(["agency", "other"]).optional(),
    rehireChannelOther: z.string().optional(),

    recruiterCode: z.string().optional(),
    recruiterName: z.string().min(1, t.recruiterNameRequired),
    referrerCode: z.string().optional(),
    referrerName: z.string().optional(),

    permanentProvince: z.string().min(1, t.permanentProvinceRequired),
    permanentWard: z.string().min(1, t.permanentWardRequired),
    permanentStreetAddress: z.string().min(1, t.permanentStreetRequired),

    sameAsPermanentAddress: z.enum(["same", "different"]).optional(),
    temporaryProvince: z.string().optional(),
    temporaryWard: z.string().optional(),
    temporaryStreetAddress: z.string().optional(),

    hasInsuranceExperience: z.enum(["no", "yes"]).optional(),
    workHistory: z
      .array(
        z.object({
          fromDate: z.string().optional(),
          toDate: z.string().optional(),
          title: z.string().optional(),
          companyNameAddress: z.string().optional(),
        })
      )
      .optional(),

    referralChannel: z
      .array(
        z.enum([
          "ads",
          "fanpage",
          "website",
          "friend",
          "colleague",
          "referral",
          "other",
        ])
      )
      .optional(),
    referralOther: z.string().optional(),

    hasPepRelationship: z.enum(["no", "yes"], {
      error: t.pepStatusRequired,
    }),
    pepRelationship: z.string().optional(),
    pepFullName: z.string().optional(),
    pepPosition: z.string().optional(),
    pepOrganization: z.string().optional(),

    familyMembers: z
      .array(
        z.object({
          name: z.string().optional(),
          birthYear: z.string().optional(),
          relationship: z.string().optional(),
          occupation: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .optional(),

    q1Experience: z
      .array(z.enum(["family", "friend_colleague", "heard_no_detail", "none"]))
      .min(1, t.atLeastOneAnswerRequired),
    q2View: z
      .array(
        z.enum([
          "financial_protection",
          "savings_investment",
          "important_not_explored",
          "other",
        ])
      )
      .optional(),
    q2ViewOther: z.string().optional(),
    q3TargetAudience: z
      .array(
        z.enum([
          "main_earner",
          "young_children",
          "debt_loan",
          "retirement_age",
          "everyone",
          "other",
        ])
      )
      .optional(),
    q3TargetAudienceOther: z.string().optional(),
    q4FirstTenPeople: z.string().optional(),
    q5Training: z
      .array(z.enum(["lpfc", "sales_skills", "sales_management"]))
      .optional(),
    q6Support: z
      .array(
        z.enum([
          "product_training",
          "manager_coaching",
          "compensation_benefits",
          "other",
        ])
      )
      .optional(),
    q6SupportOther: z.string().optional(),

    attachments: z
      .array(
        z.object({
          storagePath: z.string(),
          fileName: z.string(),
          size: z.number(),
          contentType: z.string(),
        })
      )
      .max(5, t.attachmentsMax),

    commitmentVoluntary: z.literal(true, {
      error: t.commitmentRequired,
    }),
    commitmentDataConsent: z.literal(true, {
      error: t.commitmentRequired,
    }),
    confirmationConsent: z.enum(["no", "yes"]).optional(),
    confirmationMethod: z.enum(["handwritten"], {
      error: t.confirmationMethodRequired,
    }),
    signDate: z.string().min(1, t.signDateRequired),
  });

  return recruitmentObjectSchema.superRefine((data, ctx) => {
    if (data.channel === "agency" && !data.agencyType) {
      ctx.addIssue({
        code: "custom",
        path: ["agencyType"],
        message: t.agencyTypeRequired,
      });
    }

    if (data.confirmationConsent !== "yes") {
      ctx.addIssue({
        code: "custom",
        path: ["confirmationConsent"],
        message: t.confirmationConsentRequired,
      });
    }

    if (!data.q1Experience.includes("none")) {
      if (!data.q2View || data.q2View.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["q2View"],
          message: t.atLeastOneAnswerRequired,
        });
      }
      if (!data.q3TargetAudience || data.q3TargetAudience.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["q3TargetAudience"],
          message: t.atLeastOneAnswerRequired,
        });
      }
      if (!data.q4FirstTenPeople) {
        ctx.addIssue({
          code: "custom",
          path: ["q4FirstTenPeople"],
          message: t.questionRequired,
        });
      }
      if (!data.q5Training || data.q5Training.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["q5Training"],
          message: t.trainingRequired,
        });
      }
      if (!data.q6Support || data.q6Support.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["q6Support"],
          message: t.atLeastOneAnswerRequired,
        });
      }
    }

    if (data.hasPepRelationship !== "yes") return;

    const requiredWhenPep: {
      field:
        "pepRelationship" | "pepFullName" | "pepPosition" | "pepOrganization";
      message: string;
    }[] = [
      { field: "pepRelationship", message: t.pepRelationshipRequired },
      { field: "pepFullName", message: t.pepFullNameRequired },
      { field: "pepPosition", message: t.pepPositionRequired },
      { field: "pepOrganization", message: t.pepOrganizationRequired },
    ];

    for (const { field, message } of requiredWhenPep) {
      if (!data[field]) {
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    }
  });
}

export type RecruitmentValues = z.infer<
  ReturnType<typeof buildRecruitmentSchema>
>;
