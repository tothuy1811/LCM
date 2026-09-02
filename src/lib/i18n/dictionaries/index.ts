import type { Language } from "@/types/preferences/language";

import { en } from "./en";
import { vi } from "./vi";

export type Dictionary = typeof vi;

export const dictionaries: Record<Language, Dictionary> = { vi, en };
