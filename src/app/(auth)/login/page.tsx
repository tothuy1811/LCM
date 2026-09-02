import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LoginForm } from "@/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.login.pageTitle };
}

export default function LoginPage() {
  return <LoginForm />;
}
