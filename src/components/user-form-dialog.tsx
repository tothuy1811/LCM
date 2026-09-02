"use client";

import { useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDictionary } from "@/hooks/use-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { TAppUser } from "@/server/user-actions";

function buildUserFormSchema(t: Dictionary) {
  return z.object({
    email: z.string(),
    password: z.string(),
    name: z.string().min(1, t.users.form.nameRequired),
    role: z.enum(["admin", "ad"]),
  });
}

export type UserFormValues = z.infer<ReturnType<typeof buildUserFormSchema>>;
export type UserEditValues = UserFormValues;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TAppUser | null;
  onSubmit: (values: UserFormValues | UserEditValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const t = useDictionary();
  const isEdit = !!user;
  const schema = useMemo(() => buildUserFormSchema(t), [t]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "ad", email: "", password: "", name: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        user
          ? {
              name: user.name,
              role: user.role,
              email: user.email,
              password: "",
            }
          : { name: "", role: "ad", email: "", password: "" }
      );
    }
  }, [open, user, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t.users.form.editTitle : t.users.form.createTitle}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t.users.form.editDescription
                : t.users.form.createDescription}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {!isEdit && (
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">{t.users.form.email}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  {...register("email")}
                />
                <FieldError
                  errors={errors.email ? [errors.email] : undefined}
                />
              </Field>
            )}
            {!isEdit && (
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">
                  {t.users.form.password}
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  {...register("password")}
                />
                <FieldError
                  errors={errors.password ? [errors.password] : undefined}
                />
              </Field>
            )}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">{t.users.form.name}</FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>
            <Field data-invalid={!!errors.role}>
              <FieldLabel>{t.users.form.role}</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.users.form.rolePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.permissions.roleLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.role ? [errors.role] : undefined} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.users.form.saving : t.users.form.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
