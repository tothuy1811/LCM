"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/hooks/use-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { auth } from "@/lib/firebase/client";
import { establishSession } from "@/server/auth-actions";

function buildLoginSchema(t: Dictionary) {
  return z.object({
    email: z.email(t.auth.login.validation.email),
    password: z.string().min(8, t.auth.login.validation.password),
  });
}

type LoginValues = z.infer<ReturnType<typeof buildLoginSchema>>;

export function LoginForm() {
  const router = useRouter();
  const t = useDictionary();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => buildLoginSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const idToken = await credential.user.getIdToken();
      const result = await establishSession(idToken);

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      router.push("/recruitments");
      router.refresh();
    } catch {
      setFormError(t.auth.login.invalidCredentials);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold">{t.auth.login.heading}</h1>
          <p className="text-muted-foreground text-sm">
            {t.auth.login.subtitle}
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">{t.auth.login.email}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">{t.auth.login.password}</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <FieldError>{formError}</FieldError>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t.auth.login.submitting : t.auth.login.submit}
        </Button>
      </FieldGroup>
    </form>
  );
}
