import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";
import {
  THEME_MODE_VALUES,
  THEME_PRESET_VALUES,
  ThemeMode,
  ThemePreset,
} from "@/types/preferences/theme";
import { LANGUAGE_VALUES, Language } from "@/types/preferences/language";
import { getPreference } from "@/server/server-actions";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Asahi Livwell",
    template: "Asahi Livwell - %s",
  },
  description: "Compensation Asahi Livwell",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeMode = await getPreference<ThemeMode>(
    "theme_mode",
    THEME_MODE_VALUES,
    "dark"
  );
  const themePreset = await getPreference<ThemePreset>(
    "theme_preset",
    THEME_PRESET_VALUES,
    "asahi-livwell"
  );
  const language = await getPreference<Language>(
    "language",
    LANGUAGE_VALUES,
    "vi"
  );

  return (
    <html
      lang={language}
      className={themeMode === "dark" ? "dark" : ""}
      data-theme-preset={themePreset}
      suppressHydrationWarning
    >
      <body
        className={`${notoSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <PreferencesStoreProvider
          themeMode={themeMode}
          themePreset={themePreset}
          language={language}
        >
          {children}
          <Toaster />
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}
