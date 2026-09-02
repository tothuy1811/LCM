"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { RecruitmentFormFields } from "@/components/recruitment-form-fields";
import { vi } from "@/lib/i18n/dictionaries/vi";
import { submitRecruitmentForm } from "@/server/recruitment-actions";
import type { TManagerOption } from "@/server/user-actions";
import {
  buildRecruitmentSchema,
  type RecruitmentValues,
} from "@/lib/validations/recruitment";

// The public application form is always in Vietnamese, regardless of the
// site-wide language preference used by the authenticated admin/AD pages.
const t = vi;

export function RecruitmentForm({ managers }: { managers: TManagerOption[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () => buildRecruitmentSchema(t.recruitmentForm.validation),
    []
  );
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecruitmentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isCivilServant: "no",
      participatingProgram: "no",
      isRehire: "no",
      programTypes: [],
      sameAsPermanentAddress: "same",
      hasInsuranceExperience: "no",
      workHistory: [
        { fromDate: "", toDate: "", title: "", companyNameAddress: "" },
      ],
      referralChannel: [],
      familyMembers: [
        {
          name: "",
          birthYear: "",
          relationship: "",
          occupation: "",
          address: "",
        },
      ],
      q2View: [],
      q3FamilyReaction: [],
      q5Training: [],
      q6Support: [],
      attachments: [],
      commitmentVoluntary: undefined,
      commitmentDataConsent: undefined,
    },
  });

  const onSubmit = async (values: RecruitmentValues) => {
    setFormError(null);
    const result = await submitRecruitmentForm(values, "vi");
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">
          {t.recruitmentForm.thankYouTitle}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {t.recruitmentForm.thankYouBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <RecruitmentFormFields
        t={t}
        control={control}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        managers={managers}
        locale="vi"
      />

      <FieldError>{formError}</FieldError>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.recruitmentForm.submitting : t.recruitmentForm.submit}
      </Button>
    </form>
  );
}
