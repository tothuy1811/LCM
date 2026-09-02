"use client";

import { useRouter } from "next/navigation";

import { Check, ChevronDown, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDictionary } from "@/hooks/use-dictionary";
import { setValueToCookie } from "@/server/server-actions";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { LANGUAGE_OPTIONS, type Language } from "@/types/preferences/language";

export function LanguageSwitcher() {
  const router = useRouter();
  const language = usePreferencesStore(s => s.language);
  const setLanguage = usePreferencesStore(s => s.setLanguage);
  const t = useDictionary();

  const handleSelect = async (next: Language) => {
    if (next === language) return;
    setLanguage(next);
    await setValueToCookie("language", next);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          aria-label={t.languageSwitcher.label}
        >
          <Globe className="size-4" />
          {language.toUpperCase()}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGE_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="justify-between"
          >
            {option.label}
            {option.value === language && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
