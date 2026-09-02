"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  IconCloudUpload,
  IconDownload,
  IconLoader2,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatBytes } from "@/lib/utils";
import {
  uploadRecruitmentAttachment,
  type TAttachment,
} from "@/server/recruitment-actions";
import type { TManagerOption } from "@/server/user-actions";
import type { RecruitmentValues } from "@/lib/validations/recruitment";
import type { Language } from "@/types/preferences/language";

function SectionCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
      <FieldSet>
        <div className="mb-1 flex items-center gap-3">
          <span className="bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {number}
          </span>
          <FieldLegend className="mb-0">{title}</FieldLegend>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
        {children}
      </FieldSet>
    </div>
  );
}

function AddressCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  emptyText,
  disabled,
  invalid,
}: {
  items: string[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Combobox
      items={items}
      value={value ?? null}
      onValueChange={v => onValueChange(v ?? "")}
      disabled={disabled}
    >
      <ComboboxInput placeholder={placeholder} aria-invalid={invalid} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const BANK_OPTIONS = [
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "Agribank",
  "Techcombank",
  "MB Bank",
  "ACB",
  "VPBank",
  "Sacombank",
  "HDBank",
  "TPBank",
  "SHB",
  "VIB",
  "Eximbank",
  "SCB",
  "OCB",
  "MSB",
  "SeABank",
  "PVcomBank",
  "Nam A Bank",
  "Bac A Bank",
  "ABBANK",
  "BaoViet Bank",
  "LienVietPostBank",
  "Kienlongbank",
  "NCB",
  "PGBank",
  "SaigonBank",
  "VietBank",
  "VietCapitalBank",
  "Woori Bank",
  "Standard Chartered",
  "HSBC",
  "Shinhan Bank",
] as const;

type TProvinceDivision = {
  name: string;
  wards: string[];
};

type TRawDivision = {
  tentinhmoi: string;
  phuongxa: { tenphuongxa: string }[];
};

const TEMPLATE_DOCUMENTS = [
  {
    file: "F-01_Phieu_thong_tin_tuyen_dung_VN.docx",
    label: "F-01 – Phiếu thông tin tuyển dụng",
  },
  {
    file: "F-01_Phieu_thong_tin_tuyen_dung_VN_V2.docx",
    label: "F-01 – Phiếu thông tin tuyển dụng (V2)",
  },
  {
    file: "F-03_Phieu_dang_ky_dai_ly_VN.docx",
    label: "F-03 – Phiếu đăng ký đại lý",
  },
  {
    file: "F-04_Phieu_cam_ket_chu_ky_mau_VN.docx",
    label: "F-04 – Phiếu cam kết chữ ký mẫu",
  },
  {
    file: "F-05_Phieu_danh_gia_ung_vien_VN.docx",
    label: "F-05 – Phiếu đánh giá ứng viên",
  },
  {
    file: "F-06_Phieu_danh_gia_phe_duyet_tuyen_dung_VN.docx",
    label: "F-06 – Phiếu đánh giá phê duyệt tuyển dụng",
  },
  {
    file: "F-07_Danh_muc_ho_so_VN.docx",
    label: "F-07 – Danh mục hồ sơ",
  },
  {
    file: "F-08_Phieu_danh_gia_tai_ky_VN.docx",
    label: "F-08 – Phiếu đánh giá tái ký",
  },
] as const;

export function RecruitmentFormFields({
  t,
  control,
  register,
  errors,
  watch,
  setValue,
  managers,
  onDownloadAttachment,
  locale,
}: {
  t: Dictionary;
  control: Control<RecruitmentValues>;
  register: UseFormRegister<RecruitmentValues>;
  errors: FieldErrors<RecruitmentValues>;
  watch: UseFormWatch<RecruitmentValues>;
  setValue: UseFormSetValue<RecruitmentValues>;
  managers: TManagerOption[];
  onDownloadAttachment?: (attachment: TAttachment) => void;
  locale?: Language;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<TProvinceDivision[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/vn-administrative-divisions.json")
      .then(res => res.json())
      .then((data: TRawDivision[]) => {
        if (cancelled) return;
        setProvinces(
          data.map(p => ({
            name: p.tentinhmoi.replace(/^Tp /, "Thành phố "),
            wards: p.phuongxa.map(w => w.tenphuongxa),
          }))
        );
      })
      .catch(() => setProvinces([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const CHANNEL_OPTIONS = [
    { value: "agency", label: t.recruitmentForm.options.channel.agency },
    { value: "other", label: t.recruitmentForm.options.channel.other },
  ] as const;

  const AGENCY_TYPE_OPTIONS = [
    {
      value: "full_time",
      label: t.recruitmentForm.options.agencyType.full_time,
    },
    {
      value: "part_time",
      label: t.recruitmentForm.options.agencyType.part_time,
    },
  ] as const;

  const POSITION_OPTIONS = [
    { value: "agent", label: t.recruitmentForm.options.position.agent },
    {
      value: "unit_manager",
      label: t.recruitmentForm.options.position.unit_manager,
    },
    {
      value: "district_manager",
      label: t.recruitmentForm.options.position.district_manager,
    },
    { value: "gad", label: t.recruitmentForm.options.position.gad },
    { value: "other", label: t.recruitmentForm.options.position.other },
  ] as const;

  const PROGRAM_OPTIONS = [
    {
      value: "near_mdrt_700m",
      label: t.recruitmentForm.options.program.near_mdrt_700m,
    },
    { value: "mdrt", label: t.recruitmentForm.options.program.mdrt },
    {
      value: "mdrt_2_years",
      label: t.recruitmentForm.options.program.mdrt_2_years,
    },
    {
      value: "cot_mdrt_3_years",
      label: t.recruitmentForm.options.program.cot_mdrt_3_years,
    },
    {
      value: "gad_buyout",
      label: t.recruitmentForm.options.program.gad_buyout,
    },
    { value: "other", label: t.recruitmentForm.options.program.other },
  ] as const;

  const REFERRAL_OPTIONS = [
    { value: "ads", label: t.recruitmentForm.options.referral.ads },
    { value: "fanpage", label: t.recruitmentForm.options.referral.fanpage },
    { value: "website", label: t.recruitmentForm.options.referral.website },
    { value: "other", label: t.recruitmentForm.options.referral.other },
  ] as const;

  const MARITAL_STATUS_OPTIONS = [
    { value: "single", label: t.recruitmentForm.options.maritalStatus.single },
    {
      value: "married",
      label: t.recruitmentForm.options.maritalStatus.married,
    },
    {
      value: "divorced",
      label: t.recruitmentForm.options.maritalStatus.divorced,
    },
    {
      value: "widowed",
      label: t.recruitmentForm.options.maritalStatus.widowed,
    },
  ] as const;

  const INCOME_OPTIONS = [
    { value: "under5m", label: t.recruitmentForm.options.income.under5m },
    { value: "from5to10m", label: t.recruitmentForm.options.income.from5to10m },
    {
      value: "from10to20m",
      label: t.recruitmentForm.options.income.from10to20m,
    },
    {
      value: "from20to50m",
      label: t.recruitmentForm.options.income.from20to50m,
    },
    { value: "over50m", label: t.recruitmentForm.options.income.over50m },
  ] as const;

  const EDUCATION_OPTIONS = [
    { value: "thpt", label: t.recruitmentForm.options.education.thpt },
    { value: "trungCap", label: t.recruitmentForm.options.education.trungCap },
    { value: "caoDang", label: t.recruitmentForm.options.education.caoDang },
    { value: "daiHoc", label: t.recruitmentForm.options.education.daiHoc },
    {
      value: "sauDaiHoc",
      label: t.recruitmentForm.options.education.sauDaiHoc,
    },
  ] as const;

  const RELATIONSHIP_OPTIONS = [
    { value: "cha", label: t.recruitmentForm.options.relationship.cha },
    { value: "me", label: t.recruitmentForm.options.relationship.me },
    { value: "vo", label: t.recruitmentForm.options.relationship.vo },
    { value: "chong", label: t.recruitmentForm.options.relationship.chong },
    { value: "con", label: t.recruitmentForm.options.relationship.con },
    { value: "anh", label: t.recruitmentForm.options.relationship.anh },
    { value: "chi", label: t.recruitmentForm.options.relationship.chi },
    { value: "em", label: t.recruitmentForm.options.relationship.em },
  ] as const;

  const TRAINING_OPTIONS = [
    { value: "lpfc", label: t.recruitmentForm.options.training.lpfc },
    {
      value: "sales_skills",
      label: t.recruitmentForm.options.training.sales_skills,
    },
    {
      value: "sales_management",
      label: t.recruitmentForm.options.training.sales_management,
    },
  ] as const;

  const Q2_OPTIONS = [
    {
      value: "financial_protection",
      label: t.recruitmentForm.options.q2.financial_protection,
    },
    {
      value: "savings_investment",
      label: t.recruitmentForm.options.q2.savings_investment,
    },
    {
      value: "important_not_explored",
      label: t.recruitmentForm.options.q2.important_not_explored,
    },
    { value: "other", label: t.recruitmentForm.options.q2.other },
  ] as const;

  const Q3_OPTIONS = [
    { value: "supportive", label: t.recruitmentForm.options.q3.supportive },
    {
      value: "surprised_respectful",
      label: t.recruitmentForm.options.q3.surprised_respectful,
    },
    { value: "proud", label: t.recruitmentForm.options.q3.proud },
    { value: "other", label: t.recruitmentForm.options.q3.other },
  ] as const;

  const Q6_OPTIONS = [
    {
      value: "product_training",
      label: t.recruitmentForm.options.q6.product_training,
    },
    {
      value: "manager_coaching",
      label: t.recruitmentForm.options.q6.manager_coaching,
    },
    {
      value: "compensation_benefits",
      label: t.recruitmentForm.options.q6.compensation_benefits,
    },
    { value: "other", label: t.recruitmentForm.options.q6.other },
  ] as const;

  const {
    fields: workHistoryFields,
    append: appendWorkHistory,
    remove: removeWorkHistory,
  } = useFieldArray({ control, name: "workHistory" });

  const {
    fields: familyMemberFields,
    append: appendFamilyMember,
    remove: removeFamilyMember,
  } = useFieldArray({ control, name: "familyMembers" });

  const channel = watch("channel");
  const positionApplied = watch("positionApplied");
  const participatingProgram = watch("participatingProgram");
  const sameAsPermanentAddress = watch("sameAsPermanentAddress");
  const permanentProvince = watch("permanentProvince");
  const temporaryProvince = watch("temporaryProvince");
  const hasPepRelationship = watch("hasPepRelationship");
  const q2View = watch("q2View");
  const q3FamilyReaction = watch("q3FamilyReaction");
  const q6Support = watch("q6Support");
  const attachments = watch("attachments");
  const fullName = watch("fullName");

  const permanentWards =
    provinces.find(p => p.name === permanentProvince)?.wards ?? [];
  const temporaryWards =
    provinces.find(p => p.name === temporaryProvince)?.wards ?? [];

  useEffect(() => {
    setValue("accountHolderName", fullName);
  }, [fullName, setValue]);

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setUploadError(null);
    if (attachments.length + files.length > MAX_FILES) {
      setUploadError(t.recruitmentForm.maxFilesError(MAX_FILES));
      return;
    }
    const oversized = files.find(f => f.size > MAX_FILE_BYTES);
    if (oversized) {
      setUploadError(t.recruitmentForm.maxFileSizeError);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadRecruitmentAttachment(formData, locale);
        if (!result.ok) {
          setUploadError(result.error);
          continue;
        }
        setValue("attachments", [...watch("attachments"), result.data]);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (storagePath: string) => {
    setValue(
      "attachments",
      attachments.filter(a => a.storagePath !== storagePath)
    );
  };

  return (
    <>
      <SectionCard number={1} title={t.recruitmentForm.section1.title}>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.fullName}>
              <FieldLabel htmlFor="fullName">
                {t.recruitmentForm.section1.fullName}
              </FieldLabel>
              <Input
                id="fullName"
                placeholder={t.recruitmentForm.section1.fullNamePlaceholder}
                {...register("fullName")}
              />
              <FieldError
                errors={errors.fullName ? [errors.fullName] : undefined}
              />
            </Field>

            <Controller
              control={control}
              name="managerUid"
              render={({ field }) => (
                <Field data-invalid={!!errors.managerUid}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.managerLabel}
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={uid => {
                      field.onChange(uid);
                      const manager = managers.find(m => m.uid === uid);
                      setValue("managerName", manager?.name ?? "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section1.managerPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map(manager => (
                        <SelectItem key={manager.uid} value={manager.uid}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={errors.managerUid ? [errors.managerUid] : undefined}
                  />
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Field data-invalid={!!errors.gender}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.genderLabel}
                  </FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="male" id="gender-male" />
                      <FieldLabel htmlFor="gender-male" className="font-normal">
                        {t.recruitmentForm.section1.genderMale}
                      </FieldLabel>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="female" id="gender-female" />
                      <FieldLabel
                        htmlFor="gender-female"
                        className="font-normal"
                      >
                        {t.recruitmentForm.section1.genderFemale}
                      </FieldLabel>
                    </div>
                  </RadioGroup>
                  <FieldError
                    errors={errors.gender ? [errors.gender] : undefined}
                  />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="maritalStatus"
              render={({ field }) => (
                <Field data-invalid={!!errors.maritalStatus}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.maritalStatusLabel}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section1.maritalStatusPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={
                      errors.maritalStatus ? [errors.maritalStatus] : undefined
                    }
                  />
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.dateOfBirth}>
              <FieldLabel htmlFor="dateOfBirth">
                {t.recruitmentForm.section1.dateOfBirth}
              </FieldLabel>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
              <FieldError
                errors={errors.dateOfBirth ? [errors.dateOfBirth] : undefined}
              />
            </Field>
            <Field data-invalid={!!errors.idNumber}>
              <FieldLabel htmlFor="idNumber">
                {t.recruitmentForm.section1.idNumber}
              </FieldLabel>
              <Input
                id="idNumber"
                placeholder={t.recruitmentForm.section1.idNumberPlaceholder}
                {...register("idNumber")}
              />
              <FieldError
                errors={errors.idNumber ? [errors.idNumber] : undefined}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="idIssueDate">
                {t.recruitmentForm.section1.idIssueDate}
              </FieldLabel>
              <Input
                id="idIssueDate"
                type="date"
                {...register("idIssueDate")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="idIssuePlace">
                {t.recruitmentForm.section1.idIssuePlace}
              </FieldLabel>
              <Input
                id="idIssuePlace"
                placeholder={t.recruitmentForm.section1.idIssuePlacePlaceholder}
                {...register("idIssuePlace")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.mobile1}>
              <FieldLabel htmlFor="mobile1">
                {t.recruitmentForm.section1.mobile1}
              </FieldLabel>
              <Input
                id="mobile1"
                placeholder={t.recruitmentForm.section1.mobile1Placeholder}
                {...register("mobile1")}
              />
              <FieldError
                errors={errors.mobile1 ? [errors.mobile1] : undefined}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="mobile2">
                {t.recruitmentForm.section1.mobile2}
              </FieldLabel>
              <Input id="mobile2" {...register("mobile2")} />
            </Field>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">
              {t.recruitmentForm.section1.email}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t.recruitmentForm.section1.emailPlaceholder}
              {...register("email")}
            />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="taxCode">
                {t.recruitmentForm.section1.taxCode}
              </FieldLabel>
              <Input id="taxCode" {...register("taxCode")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="taxCodeIssueDate">
                {t.recruitmentForm.section1.taxCodeIssueDate}
              </FieldLabel>
              <Input
                id="taxCodeIssueDate"
                type="date"
                {...register("taxCodeIssueDate")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="taxCodeIssuePlace">
                {t.recruitmentForm.section1.taxCodeIssuePlace}
              </FieldLabel>
              <Input
                id="taxCodeIssuePlace"
                {...register("taxCodeIssuePlace")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="averageMonthlyIncome"
              render={({ field }) => (
                <Field data-invalid={!!errors.averageMonthlyIncome}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.averageMonthlyIncomeLabel}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section1
                            .averageMonthlyIncomePlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={
                      errors.averageMonthlyIncome
                        ? [errors.averageMonthlyIncome]
                        : undefined
                    }
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="educationLevel"
              render={({ field }) => (
                <Field data-invalid={!!errors.educationLevel}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.educationLevelLabel}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section1.educationLevelPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={
                      errors.educationLevel
                        ? [errors.educationLevel]
                        : undefined
                    }
                  />
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="isCivilServant"
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  {t.recruitmentForm.section1.civilServantLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="civilServant-no" />
                    <FieldLabel
                      htmlFor="civilServant-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section1.civilServantNo}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="civilServant-yes" />
                    <FieldLabel
                      htmlFor="civilServant-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section1.civilServantYes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.accountHolderName}>
              <FieldLabel htmlFor="accountHolderName">
                {t.recruitmentForm.section1.accountHolderNameLabel}
              </FieldLabel>
              <Input
                id="accountHolderName"
                disabled
                placeholder={
                  t.recruitmentForm.section1.accountHolderNamePlaceholder
                }
                value={fullName ?? ""}
                readOnly
              />
              <FieldError
                errors={
                  errors.accountHolderName
                    ? [errors.accountHolderName]
                    : undefined
                }
              />
            </Field>
            <Field data-invalid={!!errors.bankAccountNumber}>
              <FieldLabel htmlFor="bankAccountNumber">
                {t.recruitmentForm.section1.bankAccountNumberLabel}
              </FieldLabel>
              <Input
                id="bankAccountNumber"
                {...register("bankAccountNumber")}
              />
              <FieldError
                errors={
                  errors.bankAccountNumber
                    ? [errors.bankAccountNumber]
                    : undefined
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="bankName"
              render={({ field }) => (
                <Field data-invalid={!!errors.bankName}>
                  <FieldLabel>
                    {t.recruitmentForm.section1.bankNameLabel}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section1.bankNamePlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_OPTIONS.map(bank => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={errors.bankName ? [errors.bankName] : undefined}
                  />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.branch}>
              <FieldLabel htmlFor="branch">
                {t.recruitmentForm.section1.branchLabel}
              </FieldLabel>
              <Input id="branch" {...register("branch")} />
              <FieldError
                errors={errors.branch ? [errors.branch] : undefined}
              />
            </Field>
          </div>

          <FieldSeparator />

          <p className="text-sm font-medium">
            {t.recruitmentForm.section3.title}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="permanentProvince"
              render={({ field }) => (
                <Field data-invalid={!!errors.permanentProvince}>
                  <FieldLabel>
                    {t.recruitmentForm.section3.provinceLabel}
                  </FieldLabel>
                  <AddressCombobox
                    items={provinces.map(p => p.name)}
                    value={field.value}
                    onValueChange={value => {
                      field.onChange(value);
                      setValue("permanentWard", "");
                    }}
                    placeholder={t.recruitmentForm.section3.provincePlaceholder}
                    emptyText={t.searchDialog.empty}
                    invalid={!!errors.permanentProvince}
                  />
                  <FieldError
                    errors={
                      errors.permanentProvince
                        ? [errors.permanentProvince]
                        : undefined
                    }
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="permanentWard"
              render={({ field }) => (
                <Field data-invalid={!!errors.permanentWard}>
                  <FieldLabel>
                    {t.recruitmentForm.section3.wardLabel}
                  </FieldLabel>
                  <AddressCombobox
                    items={permanentWards}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t.recruitmentForm.section3.wardPlaceholder}
                    emptyText={t.searchDialog.empty}
                    disabled={permanentWards.length === 0}
                    invalid={!!errors.permanentWard}
                  />
                  <FieldError
                    errors={
                      errors.permanentWard ? [errors.permanentWard] : undefined
                    }
                  />
                </Field>
              )}
            />
          </div>

          <Field data-invalid={!!errors.permanentStreetAddress}>
            <FieldLabel htmlFor="permanentStreetAddress">
              {t.recruitmentForm.section3.streetLabel}
            </FieldLabel>
            <Input
              id="permanentStreetAddress"
              {...register("permanentStreetAddress")}
            />
            <FieldError
              errors={
                errors.permanentStreetAddress
                  ? [errors.permanentStreetAddress]
                  : undefined
              }
            />
          </Field>

          <FieldSeparator />

          <p className="text-sm font-medium">
            {t.recruitmentForm.section4.title}
          </p>
          <Controller
            control={control}
            name="sameAsPermanentAddress"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="same" id="sameAddress-same" />
                  <FieldLabel
                    htmlFor="sameAddress-same"
                    className="font-normal"
                  >
                    {t.recruitmentForm.section4.same}
                  </FieldLabel>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="different"
                    id="sameAddress-different"
                  />
                  <FieldLabel
                    htmlFor="sameAddress-different"
                    className="font-normal"
                  >
                    {t.recruitmentForm.section4.different}
                  </FieldLabel>
                </div>
              </RadioGroup>
            )}
          />
          {sameAsPermanentAddress === "different" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="temporaryProvince"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        {t.recruitmentForm.section4.provinceLabel}
                      </FieldLabel>
                      <AddressCombobox
                        items={provinces.map(p => p.name)}
                        value={field.value}
                        onValueChange={value => {
                          field.onChange(value);
                          setValue("temporaryWard", "");
                        }}
                        placeholder={
                          t.recruitmentForm.section4.provincePlaceholder
                        }
                        emptyText={t.searchDialog.empty}
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="temporaryWard"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        {t.recruitmentForm.section4.wardLabel}
                      </FieldLabel>
                      <AddressCombobox
                        items={temporaryWards}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t.recruitmentForm.section4.wardPlaceholder}
                        emptyText={t.searchDialog.empty}
                        disabled={temporaryWards.length === 0}
                      />
                    </Field>
                  )}
                />
              </div>

              <Field>
                <FieldLabel htmlFor="temporaryStreetAddress">
                  {t.recruitmentForm.section4.streetLabel}
                </FieldLabel>
                <Input
                  id="temporaryStreetAddress"
                  {...register("temporaryStreetAddress")}
                />
              </Field>
            </>
          )}
        </FieldGroup>
      </SectionCard>

      <SectionCard number={2} title={t.recruitmentForm.section2.title}>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="channel"
              render={({ field }) => (
                <Field data-invalid={!!errors.channel}>
                  <FieldLabel>
                    {t.recruitmentForm.section2.channelLabel}
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          t.recruitmentForm.section2.channelPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={errors.channel ? [errors.channel] : undefined}
                  />
                </Field>
              )}
            />
            {channel === "agency" && (
              <Controller
                control={control}
                name="agencyType"
                render={({ field }) => (
                  <Field data-invalid={!!errors.agencyType}>
                    <FieldLabel>
                      {t.recruitmentForm.section2.agencyTypeLabel}
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            t.recruitmentForm.section2.agencyTypePlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENCY_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        errors.agencyType ? [errors.agencyType] : undefined
                      }
                    />
                  </Field>
                )}
              />
            )}
          </div>

          <FieldSeparator />

          <Controller
            control={control}
            name="positionApplied"
            render={({ field }) => (
              <Field data-invalid={!!errors.positionApplied}>
                <FieldLabel>
                  {t.recruitmentForm.section2.positionLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {POSITION_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opt.value}
                        id={`position-${opt.value}`}
                      />
                      <FieldLabel
                        htmlFor={`position-${opt.value}`}
                        className="font-normal"
                      >
                        {opt.label}
                      </FieldLabel>
                    </div>
                  ))}
                </RadioGroup>
                <FieldError
                  errors={
                    errors.positionApplied
                      ? [errors.positionApplied]
                      : undefined
                  }
                />
              </Field>
            )}
          />
          {positionApplied === "other" && (
            <Field>
              <FieldLabel htmlFor="positionOther">
                {t.recruitmentForm.section2.specifyOther}
              </FieldLabel>
              <Input id="positionOther" {...register("positionOther")} />
            </Field>
          )}

          <FieldSeparator />

          <Controller
            control={control}
            name="participatingProgram"
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  {t.recruitmentForm.section2.programLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="participatingProgram-no" />
                    <FieldLabel
                      htmlFor="participatingProgram-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section2.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="participatingProgram-yes" />
                    <FieldLabel
                      htmlFor="participatingProgram-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section2.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
              </Field>
            )}
          />
          {participatingProgram === "yes" && (
            <Controller
              control={control}
              name="programTypes"
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  {PROGRAM_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`program-${opt.value}`}
                        checked={(field.value ?? []).includes(opt.value)}
                        onCheckedChange={checked => {
                          const current = field.value ?? [];
                          field.onChange(
                            checked
                              ? [...current, opt.value]
                              : current.filter(v => v !== opt.value)
                          );
                        }}
                      />
                      <FieldLabel
                        htmlFor={`program-${opt.value}`}
                        className="font-normal"
                      >
                        {opt.label}
                      </FieldLabel>
                    </div>
                  ))}
                </div>
              )}
            />
          )}

          <FieldSeparator />

          <Controller
            control={control}
            name="isRehire"
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  {t.recruitmentForm.section2.rehireLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="isRehire-no" />
                    <FieldLabel htmlFor="isRehire-no" className="font-normal">
                      {t.recruitmentForm.section2.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="isRehire-yes" />
                    <FieldLabel htmlFor="isRehire-yes" className="font-normal">
                      {t.recruitmentForm.section2.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
              </Field>
            )}
          />

          <FieldSeparator />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="recruiterCode">
                {t.recruitmentForm.section2.recruiterCode}
              </FieldLabel>
              <Input id="recruiterCode" {...register("recruiterCode")} />
            </Field>
            <Field data-invalid={!!errors.recruiterName}>
              <FieldLabel htmlFor="recruiterName">
                {t.recruitmentForm.section2.recruiterName}
              </FieldLabel>
              <Input id="recruiterName" {...register("recruiterName")} />
              <FieldError
                errors={
                  errors.recruiterName ? [errors.recruiterName] : undefined
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="referrerCode">
                {t.recruitmentForm.section2.referrerCode}
              </FieldLabel>
              <Input id="referrerCode" {...register("referrerCode")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="referrerName">
                {t.recruitmentForm.section2.referrerName}
              </FieldLabel>
              <Input id="referrerName" {...register("referrerName")} />
            </Field>
          </div>

          <Field data-invalid={!!errors.potentialCustomers}>
            <FieldLabel htmlFor="potentialCustomers">
              {t.recruitmentForm.section1.potentialCustomers}
            </FieldLabel>
            <Input
              id="potentialCustomers"
              {...register("potentialCustomers")}
            />
            <FieldError
              errors={
                errors.potentialCustomers
                  ? [errors.potentialCustomers]
                  : undefined
              }
            />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard number={3} title={t.recruitmentForm.section5.title}>
        <FieldGroup>
          <Controller
            control={control}
            name="hasInsuranceExperience"
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  {t.recruitmentForm.section5.hasInsuranceExperienceLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="hasInsuranceExperience-no" />
                    <FieldLabel
                      htmlFor="hasInsuranceExperience-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section5.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="yes"
                      id="hasInsuranceExperience-yes"
                    />
                    <FieldLabel
                      htmlFor="hasInsuranceExperience-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section5.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
              </Field>
            )}
          />

          <FieldSeparator />

          {workHistoryFields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-4">
              <p className="text-sm font-medium">
                {t.recruitmentForm.section5.companyHeading(index + 1)}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`workHistory.${index}.fromDate`}>
                    {t.recruitmentForm.section5.fromDate}
                  </FieldLabel>
                  <Input
                    id={`workHistory.${index}.fromDate`}
                    placeholder={
                      t.recruitmentForm.section5.monthYearPlaceholder
                    }
                    {...register(`workHistory.${index}.fromDate` as const)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`workHistory.${index}.toDate`}>
                    {t.recruitmentForm.section5.toDate}
                  </FieldLabel>
                  <Input
                    id={`workHistory.${index}.toDate`}
                    placeholder={
                      t.recruitmentForm.section5.monthYearPlaceholder
                    }
                    {...register(`workHistory.${index}.toDate` as const)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`workHistory.${index}.title`}>
                    {t.recruitmentForm.section5.jobTitle}
                  </FieldLabel>
                  <Input
                    id={`workHistory.${index}.title`}
                    {...register(`workHistory.${index}.title` as const)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor={`workHistory.${index}.companyNameAddress`}
                  >
                    {t.recruitmentForm.section5.companyNameAddress}
                  </FieldLabel>
                  <Input
                    id={`workHistory.${index}.companyNameAddress`}
                    {...register(
                      `workHistory.${index}.companyNameAddress` as const
                    )}
                  />
                </Field>
              </div>
              {workHistoryFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive w-fit"
                  onClick={() => removeWorkHistory(index)}
                >
                  <IconX className="size-4" />
                  {t.recruitmentForm.section5.removeCompany}
                </Button>
              )}
              {index < workHistoryFields.length - 1 && <FieldSeparator />}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              appendWorkHistory({
                fromDate: "",
                toDate: "",
                title: "",
                companyNameAddress: "",
              })
            }
          >
            <IconPlus className="size-4" />
            {t.recruitmentForm.section5.addCompany}
          </Button>
        </FieldGroup>
      </SectionCard>

      <SectionCard number={4} title={t.recruitmentForm.section6.title}>
        <FieldGroup>
          <Controller
            control={control}
            name="referralChannel"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {REFERRAL_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`referral-${opt.value}`}
                      checked={(field.value ?? []).includes(opt.value)}
                      onCheckedChange={checked => {
                        const current = field.value ?? [];
                        field.onChange(
                          checked
                            ? [...current, opt.value]
                            : current.filter(v => v !== opt.value)
                        );
                      }}
                    />
                    <FieldLabel
                      htmlFor={`referral-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </FieldLabel>
                  </div>
                ))}
              </div>
            )}
          />
          {(watch("referralChannel") ?? []).includes("other") && (
            <Field>
              <FieldLabel htmlFor="referralOther">
                {t.recruitmentForm.section2.specifyOther}
              </FieldLabel>
              <Input id="referralOther" {...register("referralOther")} />
            </Field>
          )}
        </FieldGroup>
      </SectionCard>

      <SectionCard number={5} title={t.recruitmentForm.section8.title}>
        <FieldGroup>
          {familyMemberFields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-4">
              <p className="text-sm font-medium">
                {t.recruitmentForm.section8.memberHeading(index + 1)}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`familyMembers.${index}.name`}>
                    {t.recruitmentForm.section8.name}
                  </FieldLabel>
                  <Input
                    id={`familyMembers.${index}.name`}
                    {...register(`familyMembers.${index}.name` as const)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`familyMembers.${index}.birthYear`}>
                    {t.recruitmentForm.section8.birthYear}
                  </FieldLabel>
                  <Input
                    id={`familyMembers.${index}.birthYear`}
                    {...register(`familyMembers.${index}.birthYear` as const)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`familyMembers.${index}.relationship` as const}
                  render={({ field: relField }) => (
                    <Field>
                      <FieldLabel>
                        {t.recruitmentForm.section8.relationshipLabel}
                      </FieldLabel>
                      <Select
                        value={relField.value}
                        onValueChange={relField.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              t.recruitmentForm.section8.relationshipPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel htmlFor={`familyMembers.${index}.occupation`}>
                    {t.recruitmentForm.section8.occupation}
                  </FieldLabel>
                  <Input
                    id={`familyMembers.${index}.occupation`}
                    {...register(`familyMembers.${index}.occupation` as const)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor={`familyMembers.${index}.address`}>
                  {t.recruitmentForm.section8.address}
                </FieldLabel>
                <Input
                  id={`familyMembers.${index}.address`}
                  {...register(`familyMembers.${index}.address` as const)}
                />
              </Field>
              {familyMemberFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive w-fit"
                  onClick={() => removeFamilyMember(index)}
                >
                  <IconX className="size-4" />
                  {t.recruitmentForm.section8.removeMember}
                </Button>
              )}
              {index < familyMemberFields.length - 1 && <FieldSeparator />}
            </div>
          ))}

          {familyMemberFields.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() =>
                appendFamilyMember({
                  name: "",
                  birthYear: "",
                  relationship: "",
                  occupation: "",
                  address: "",
                })
              }
            >
              <IconPlus className="size-4" />
              {t.recruitmentForm.section8.addMember}
            </Button>
          )}
        </FieldGroup>
      </SectionCard>

      <SectionCard number={6} title={t.recruitmentForm.section7.title}>
        <FieldGroup>
          <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
            <span className="text-foreground font-semibold">
              {t.recruitmentForm.section7.definitionLabel}
            </span>{" "}
            {t.recruitmentForm.section7.definitionText}
          </div>
          <Controller
            control={control}
            name="hasPepRelationship"
            render={({ field }) => (
              <Field data-invalid={!!errors.hasPepRelationship}>
                <FieldLabel>
                  {t.recruitmentForm.section7.questionLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="hasPepRelationship-no" />
                    <FieldLabel
                      htmlFor="hasPepRelationship-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section7.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="hasPepRelationship-yes" />
                    <FieldLabel
                      htmlFor="hasPepRelationship-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section7.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
                <FieldError
                  errors={
                    errors.hasPepRelationship
                      ? [errors.hasPepRelationship]
                      : undefined
                  }
                />
              </Field>
            )}
          />
          {hasPepRelationship === "yes" && (
            <FieldGroup>
              <Field data-invalid={!!errors.pepRelationship}>
                <FieldLabel htmlFor="pepRelationship">
                  {t.recruitmentForm.section7.relationship}
                </FieldLabel>
                <Input
                  id="pepRelationship"
                  placeholder={
                    t.recruitmentForm.section7.relationshipPlaceholder
                  }
                  {...register("pepRelationship")}
                />
                <FieldError
                  errors={
                    errors.pepRelationship
                      ? [errors.pepRelationship]
                      : undefined
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.pepFullName}>
                  <FieldLabel htmlFor="pepFullName">
                    {t.recruitmentForm.section7.fullName}
                  </FieldLabel>
                  <Input id="pepFullName" {...register("pepFullName")} />
                  <FieldError
                    errors={
                      errors.pepFullName ? [errors.pepFullName] : undefined
                    }
                  />
                </Field>
                <Field data-invalid={!!errors.pepPosition}>
                  <FieldLabel htmlFor="pepPosition">
                    {t.recruitmentForm.section7.position}
                  </FieldLabel>
                  <Input id="pepPosition" {...register("pepPosition")} />
                  <FieldError
                    errors={
                      errors.pepPosition ? [errors.pepPosition] : undefined
                    }
                  />
                </Field>
              </div>
              <Field data-invalid={!!errors.pepOrganization}>
                <FieldLabel htmlFor="pepOrganization">
                  {t.recruitmentForm.section7.organization}
                </FieldLabel>
                <Input id="pepOrganization" {...register("pepOrganization")} />
                <FieldError
                  errors={
                    errors.pepOrganization
                      ? [errors.pepOrganization]
                      : undefined
                  }
                />
              </Field>
            </FieldGroup>
          )}
        </FieldGroup>
      </SectionCard>

      <SectionCard number={7} title={t.recruitmentForm.section9.title}>
        <FieldGroup>
          <Controller
            control={control}
            name="q1Experience"
            render={({ field }) => (
              <Field data-invalid={!!errors.q1Experience}>
                <FieldLabel>{t.recruitmentForm.section9.q1Label}</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="q1Experience-no" />
                    <FieldLabel
                      htmlFor="q1Experience-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section9.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="q1Experience-yes" />
                    <FieldLabel
                      htmlFor="q1Experience-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section9.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
                <FieldError
                  errors={
                    errors.q1Experience ? [errors.q1Experience] : undefined
                  }
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="q2View"
            render={({ field }) => (
              <Field data-slot="checkbox-group" data-invalid={!!errors.q2View}>
                <FieldLabel>{t.recruitmentForm.section9.q2Label}</FieldLabel>
                {Q2_OPTIONS.map(opt => (
                  <Field
                    key={opt.value}
                    orientation="horizontal"
                    className="items-start"
                  >
                    <Checkbox
                      checked={field.value.includes(opt.value)}
                      onCheckedChange={checked => {
                        field.onChange(
                          checked
                            ? [...field.value, opt.value]
                            : field.value.filter(v => v !== opt.value)
                        );
                      }}
                      id={`q2View-${opt.value}`}
                    />
                    <FieldLabel
                      htmlFor={`q2View-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </FieldLabel>
                  </Field>
                ))}
                <FieldError
                  errors={errors.q2View ? [errors.q2View] : undefined}
                />
              </Field>
            )}
          />
          {(q2View ?? []).includes("other") && (
            <Field>
              <FieldLabel htmlFor="q2ViewOther">
                {t.recruitmentForm.section9.specifyOther}
              </FieldLabel>
              <Input id="q2ViewOther" {...register("q2ViewOther")} />
            </Field>
          )}

          <Controller
            control={control}
            name="q3FamilyReaction"
            render={({ field }) => (
              <Field
                data-slot="checkbox-group"
                data-invalid={!!errors.q3FamilyReaction}
              >
                <FieldLabel>{t.recruitmentForm.section9.q3Label}</FieldLabel>
                {Q3_OPTIONS.map(opt => (
                  <Field
                    key={opt.value}
                    orientation="horizontal"
                    className="items-start"
                  >
                    <Checkbox
                      checked={field.value.includes(opt.value)}
                      onCheckedChange={checked => {
                        field.onChange(
                          checked
                            ? [...field.value, opt.value]
                            : field.value.filter(v => v !== opt.value)
                        );
                      }}
                      id={`q3FamilyReaction-${opt.value}`}
                    />
                    <FieldLabel
                      htmlFor={`q3FamilyReaction-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </FieldLabel>
                  </Field>
                ))}
                <FieldError
                  errors={
                    errors.q3FamilyReaction
                      ? [errors.q3FamilyReaction]
                      : undefined
                  }
                />
              </Field>
            )}
          />
          {(q3FamilyReaction ?? []).includes("other") && (
            <Field>
              <FieldLabel htmlFor="q3FamilyReactionOther">
                {t.recruitmentForm.section9.specifyOther}
              </FieldLabel>
              <Input
                id="q3FamilyReactionOther"
                {...register("q3FamilyReactionOther")}
              />
            </Field>
          )}

          <Field data-invalid={!!errors.q4FirstTenPeople}>
            <FieldLabel htmlFor="q4FirstTenPeople">
              {t.recruitmentForm.section9.q4Label}
            </FieldLabel>
            <Input id="q4FirstTenPeople" {...register("q4FirstTenPeople")} />
            <FieldError
              errors={
                errors.q4FirstTenPeople ? [errors.q4FirstTenPeople] : undefined
              }
            />
          </Field>

          <Controller
            control={control}
            name="q5Training"
            render={({ field }) => (
              <Field
                data-slot="checkbox-group"
                data-invalid={!!errors.q5Training}
              >
                <FieldLabel>{t.recruitmentForm.section9.q5Label}</FieldLabel>
                {TRAINING_OPTIONS.map(opt => (
                  <Field
                    key={opt.value}
                    orientation="horizontal"
                    className="items-start"
                  >
                    <Checkbox
                      checked={field.value.includes(opt.value)}
                      onCheckedChange={checked => {
                        field.onChange(
                          checked
                            ? [...field.value, opt.value]
                            : field.value.filter(v => v !== opt.value)
                        );
                      }}
                      id={`training-${opt.value}`}
                    />
                    <FieldLabel
                      htmlFor={`training-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </FieldLabel>
                  </Field>
                ))}
                <FieldError
                  errors={errors.q5Training ? [errors.q5Training] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="q6Support"
            render={({ field }) => (
              <Field
                data-slot="checkbox-group"
                data-invalid={!!errors.q6Support}
              >
                <FieldLabel>{t.recruitmentForm.section9.q6Label}</FieldLabel>
                {Q6_OPTIONS.map(opt => (
                  <Field
                    key={opt.value}
                    orientation="horizontal"
                    className="items-start"
                  >
                    <Checkbox
                      checked={field.value.includes(opt.value)}
                      onCheckedChange={checked => {
                        field.onChange(
                          checked
                            ? [...field.value, opt.value]
                            : field.value.filter(v => v !== opt.value)
                        );
                      }}
                      id={`q6Support-${opt.value}`}
                    />
                    <FieldLabel
                      htmlFor={`q6Support-${opt.value}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </FieldLabel>
                  </Field>
                ))}
                <FieldError
                  errors={errors.q6Support ? [errors.q6Support] : undefined}
                />
              </Field>
            )}
          />
          {(q6Support ?? []).includes("other") && (
            <Field>
              <FieldLabel htmlFor="q6SupportOther">
                {t.recruitmentForm.section9.specifyOther}
              </FieldLabel>
              <Input id="q6SupportOther" {...register("q6SupportOther")} />
            </Field>
          )}
        </FieldGroup>
      </SectionCard>

      <SectionCard
        number={8}
        title={t.recruitmentForm.section10.title}
        description={t.recruitmentForm.section10.description(MAX_FILES)}
      >
        <div className="border-input bg-muted/30 rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">
            {t.recruitmentForm.section10.templatesIntro}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {TEMPLATE_DOCUMENTS.map(doc => (
              <li key={doc.file}>
                <a
                  href={`/templates/${doc.file}`}
                  download
                  className="border-input bg-background hover:bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <IconDownload className="text-muted-foreground size-4 shrink-0" />
                  <span className="flex-1 truncate">{doc.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Field>
          <label
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-10 text-center ${
              uploading || attachments.length >= MAX_FILES
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-muted/50 cursor-pointer"
            }`}
          >
            {uploading ? (
              <IconLoader2 className="text-muted-foreground size-6 animate-spin" />
            ) : (
              <IconCloudUpload className="text-muted-foreground size-6" />
            )}
            <span className="text-sm font-medium">
              {t.recruitmentForm.section10.dropzoneTitle}
            </span>
            <span className="text-muted-foreground text-xs">
              {t.recruitmentForm.section10.dropzoneSubtitle}
            </span>
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={handleFilesSelected}
              disabled={uploading || attachments.length >= MAX_FILES}
            />
          </label>
          {uploadError && (
            <p className="text-destructive text-sm">{uploadError}</p>
          )}
          {attachments.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2">
              {attachments.map(a => (
                <li
                  key={a.storagePath}
                  className="bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {a.fileName}{" "}
                    <span className="text-muted-foreground">
                      ({formatBytes(a.size)})
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {onDownloadAttachment && (
                      <button
                        type="button"
                        onClick={() => onDownloadAttachment(a)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <IconDownload className="size-4" />
                        <span className="sr-only">
                          {t.recruitmentForm.section10.downloadSr}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.storagePath)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <IconX className="size-4" />
                      <span className="sr-only">
                        {t.recruitmentForm.section10.removeSr}
                      </span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Field>
      </SectionCard>

      <SectionCard number={9} title={t.recruitmentForm.section11.title}>
        <FieldGroup data-slot="checkbox-group">
          <Field orientation="horizontal" className="items-start">
            <Controller
              control={control}
              name="commitmentVoluntary"
              render={({ field }) => (
                <Checkbox
                  id="commitmentVoluntary"
                  checked={field.value ?? false}
                  onCheckedChange={v => field.onChange(v === true)}
                />
              )}
            />
            <FieldLabel htmlFor="commitmentVoluntary" className="font-normal">
              {t.recruitmentForm.section11.voluntary}
            </FieldLabel>
          </Field>
          <FieldError
            errors={
              errors.commitmentVoluntary
                ? [errors.commitmentVoluntary]
                : undefined
            }
          />

          <Field orientation="horizontal" className="items-start">
            <Controller
              control={control}
              name="commitmentDataConsent"
              render={({ field }) => (
                <Checkbox
                  id="commitmentDataConsent"
                  checked={field.value ?? false}
                  onCheckedChange={v => field.onChange(v === true)}
                />
              )}
            />
            <FieldLabel htmlFor="commitmentDataConsent" className="font-normal">
              {t.recruitmentForm.section11.dataConsent}
            </FieldLabel>
          </Field>
          <FieldError
            errors={
              errors.commitmentDataConsent
                ? [errors.commitmentDataConsent]
                : undefined
            }
          />

          <Controller
            control={control}
            name="confirmationConsent"
            render={({ field }) => (
              <Field data-invalid={!!errors.confirmationConsent}>
                <FieldLabel>
                  {t.recruitmentForm.section11.consentLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="confirmationConsent-no" />
                    <FieldLabel
                      htmlFor="confirmationConsent-no"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section11.no}
                    </FieldLabel>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="confirmationConsent-yes" />
                    <FieldLabel
                      htmlFor="confirmationConsent-yes"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section11.yes}
                    </FieldLabel>
                  </div>
                </RadioGroup>
                <FieldError
                  errors={
                    errors.confirmationConsent
                      ? [errors.confirmationConsent]
                      : undefined
                  }
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="confirmationMethod"
            render={({ field }) => (
              <Field data-invalid={!!errors.confirmationMethod}>
                <FieldLabel>
                  {t.recruitmentForm.section11.methodLabel}
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="handwritten"
                      id="confirmationMethod-handwritten"
                    />
                    <FieldLabel
                      htmlFor="confirmationMethod-handwritten"
                      className="font-normal"
                    >
                      {t.recruitmentForm.section11.handwritten}
                    </FieldLabel>
                  </div>
                </RadioGroup>
                <FieldError
                  errors={
                    errors.confirmationMethod
                      ? [errors.confirmationMethod]
                      : undefined
                  }
                />
              </Field>
            )}
          />

          <Field data-invalid={!!errors.signDate}>
            <FieldLabel htmlFor="signDate">
              {t.recruitmentForm.section11.signDateLabel}
            </FieldLabel>
            <Input id="signDate" type="date" {...register("signDate")} />
            <FieldError
              errors={errors.signDate ? [errors.signDate] : undefined}
            />
          </Field>
        </FieldGroup>
      </SectionCard>
    </>
  );
}
