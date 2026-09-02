export const LANGUAGE_OPTIONS = [
  { label: "Tiếng Việt", value: "vi" },
  { label: "English", value: "en" },
] as const;

export const LANGUAGE_VALUES = LANGUAGE_OPTIONS.map(l => l.value);

export type Language = (typeof LANGUAGE_VALUES)[number];
