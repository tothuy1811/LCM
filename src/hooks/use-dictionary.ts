import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function useDictionary(): Dictionary {
  const language = usePreferencesStore(s => s.language);
  return dictionaries[language];
}
