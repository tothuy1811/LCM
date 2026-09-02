import { Language } from "@/types/preferences/language";
import { ThemeMode, ThemePreset } from "@/types/preferences/theme";
import { createStore } from "zustand/vanilla";

export type PreferencesState = {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setLanguage: (language: Language) => void;
};

export const createPreferencesStore = (init?: Partial<PreferencesState>) =>
  createStore<PreferencesState>()(set => ({
    themeMode: init?.themeMode ?? "dark",
    themePreset: init?.themePreset ?? "asahi-livwell",
    language: init?.language ?? "vi",
    setThemeMode: mode => set({ themeMode: mode }),
    setThemePreset: preset => set({ themePreset: preset }),
    setLanguage: language => set({ language }),
  }));
