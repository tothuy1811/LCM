import { ReactNode } from "react";

import Image from "next/image";

import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const dict = await getDictionary();
  const QUOTE = dict.auth.login.hero.quote;

  return (
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-[60%] overflow-hidden lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat [background-image:url('/brand/images-webp/bg.webp')]" />
        <div className="absolute inset-0 bg-[oklch(0.283_0.121_260.9)]/55" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[oklch(0.283_0.121_260.9)]/80 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Image
            src="/brand/logo/ASAHI_HORIZONTAL_VECTOR.svg"
            alt="Asahi Livwell"
            width={124}
            height={51}
            className="mr-auto h-10 w-auto self-start"
            priority
          />

          <div className="max-w-md space-y-3">
            <Image
              src="/brand/images/pink_circle.svg"
              alt=""
              width={44}
              height={28}
              className="h-7 w-11"
            />
            <h2 className="text-3xl leading-tight font-semibold text-balance">
              {dict.auth.login.hero.heading}
            </h2>
            <p className="text-sm text-white/70">
              {dict.auth.login.hero.subtitle}
            </p>
          </div>

          <div className="overflow-hidden whitespace-nowrap">
            <div className="animate-marquee flex w-max items-center text-sm">
              {[0, 1].map(i => (
                <span key={i} className="flex shrink-0 items-center">
                  <span className="px-6">{QUOTE}</span>
                  <span className="px-6 text-white/40">—</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex w-full flex-col items-center justify-center p-6 md:p-10 lg:w-[40%]">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat [background-image:url('/brand/images-webp/bg.webp')] lg:hidden" />
        <div className="absolute inset-0 bg-[oklch(0.283_0.121_260.9)]/55 lg:hidden" />
        <Image
          src="/brand/logo/ASAHI_HORIZONTAL_VECTOR.svg"
          alt="Asahi Livwell"
          width={124}
          height={51}
          className="absolute top-6 left-6 h-9 w-auto lg:hidden"
        />
        <div className="bg-background/95 relative w-full max-w-sm rounded-xl p-6 shadow-lg backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
