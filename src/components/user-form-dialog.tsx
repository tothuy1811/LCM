"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function randomChar(chars: string) {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % chars.length;
  return chars[index];
}

function generateStrongPassword(length = 14) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*-_+=?";

  const required = [
    randomChar(lower),
    randomChar(upper),
    randomChar(digits),
    randomChar(special),
  ];
  const all = lower + upper + digits + special;
  const rest = Array.from({ length: length - required.length }, () =>
    randomChar(all)
  );

  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

function buildUserFormSchema(t: Dictionary, isEdit: boolean) {
  return z.object({
    email: z.string(),
    // Editing leaves the password blank to keep the current one, so an
    // empty value is allowed there; a non-empty value still must be strong.
    password: isEdit
      ? z.string().refine(v => v === "" || STRONG_PASSWORD_REGEX.test(v), {
          error: t.users.form.passwordRequirements,
        })
      : z.string().regex(STRONG_PASSWORD_REGEX, {
          error: t.users.form.passwordRequirements,
        }),
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
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(() => buildUserFormSchema(t, isEdit), [t, isEdit]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "ad", email: "", password: "", name: "" },
  });
  const password = watch("password");

  const handleGeneratePassword = () => {
    setValue("password", generateStrongPassword(), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t.users.form.passwordCopied);
    } catch {
      toast.error(t.users.form.passwordCopyFailed);
    }
  };

  useEffect(() => {
    if (open) {
      setShowPassword(false);
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
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">
                {isEdit ? t.users.form.newPasswordLabel : t.users.form.password}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required={!isEdit}
                  {...register("password")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      showPassword
                        ? t.users.form.hidePasswordSr
                        : t.users.form.showPasswordSr
                    }
                    onClick={() => setShowPassword(show => !show)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={t.users.form.generatePasswordSr}
                    onClick={handleGeneratePassword}
                  >
                    <RefreshCw />
                  </InputGroupButton>
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={t.users.form.copyPasswordSr}
                    disabled={!password}
                    onClick={handleCopyPassword}
                  >
                    <Copy />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {isEdit && (
                <FieldDescription>
                  {t.users.form.newPasswordDescription}
                </FieldDescription>
              )}
              <FieldDescription>
                {t.users.form.passwordRequirements}
              </FieldDescription>
              <FieldError
                errors={errors.password ? [errors.password] : undefined}
              />
            </Field>
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
