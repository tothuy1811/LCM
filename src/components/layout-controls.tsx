"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { updateContentLayout, updateNavbarStyle } from "@/lib/layout-utils";
import { updateThemeMode, updateThemePreset } from "@/lib/theme-utils";
import { setValueToCookie } from "@/server/server-actions";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  ContentLayout,
  NavbarStyle,
  SidebarCollapsible,
  SidebarVariant,
} from "@/types/preferences/layout";
import {
  THEME_PRESET_OPTIONS,
  ThemeMode,
  ThemePreset,
} from "@/types/preferences/theme";

type LayoutControlsProps = {
  readonly variant: SidebarVariant;
  readonly collapsible: SidebarCollapsible;
  readonly contentLayout: ContentLayout;
  readonly navbarStyle: NavbarStyle;
};

export function LayoutControls(props: LayoutControlsProps) {
  const { variant, collapsible, contentLayout, navbarStyle } = props;
  const t = useDictionary();

  const themeMode = usePreferencesStore(s => s.themeMode);
  const setThemeMode = usePreferencesStore(s => s.setThemeMode);
  const themePreset = usePreferencesStore(s => s.themePreset);
  const setThemePreset = usePreferencesStore(s => s.setThemePreset);

  const handleValueChange = async (key: string, value: any) => {
    if (key === "theme_mode") {
      updateThemeMode(value);
      setThemeMode(value as ThemeMode);
    }

    if (key === "theme_preset") {
      updateThemePreset(value);
      setThemePreset(value as ThemePreset);
    }

    if (key === "content_layout") {
      updateContentLayout(value);
    }

    if (key === "navbar_style") {
      updateNavbarStyle(value);
    }
    await setValueToCookie(key, value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium">
              {t.layoutControls.heading}
            </h4>
            <p className="text-muted-foreground text-xs">
              {t.layoutControls.description}
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.theme}
              </Label>
              <Select
                value={themePreset}
                onValueChange={value =>
                  handleValueChange("theme_preset", value)
                }
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder={t.layoutControls.theme} />
                </SelectTrigger>
                <SelectContent>
                  {THEME_PRESET_OPTIONS.map(preset => (
                    <SelectItem
                      key={preset.value}
                      className="text-xs"
                      value={preset.value}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            themeMode === "dark"
                              ? preset.primary.dark
                              : preset.primary.light,
                        }}
                      />
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.mode}
              </Label>
              <ToggleGroup
                className="w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs"
                size="sm"
                variant="outline"
                type="single"
                value={themeMode}
                onValueChange={value => handleValueChange("theme_mode", value)}
              >
                <ToggleGroupItem
                  value="light"
                  aria-label={t.layoutControls.toggleInset}
                >
                  {t.layoutControls.light}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="dark"
                  aria-label={t.layoutControls.toggleSidebar}
                >
                  {t.layoutControls.dark}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.sidebarStyle}
              </Label>
              <ToggleGroup
                className="w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs"
                size="sm"
                variant="outline"
                type="single"
                value={variant}
                onValueChange={value =>
                  handleValueChange("sidebar_variant", value)
                }
              >
                <ToggleGroupItem
                  value="inset"
                  aria-label={t.layoutControls.toggleInset}
                >
                  {t.layoutControls.inset}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="sidebar"
                  aria-label={t.layoutControls.toggleSidebar}
                >
                  {t.layoutControls.sidebar}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="floating"
                  aria-label={t.layoutControls.toggleFloating}
                >
                  {t.layoutControls.floating}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.navbarStyle}
              </Label>
              <ToggleGroup
                className="w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs"
                size="sm"
                variant="outline"
                type="single"
                value={navbarStyle}
                onValueChange={value =>
                  handleValueChange("navbar_style", value)
                }
              >
                <ToggleGroupItem
                  value="sticky"
                  aria-label={t.layoutControls.toggleSticky}
                >
                  {t.layoutControls.sticky}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="scroll"
                  aria-label={t.layoutControls.toggleScroll}
                >
                  {t.layoutControls.scroll}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.collapseSidebar}
              </Label>
              <ToggleGroup
                className="w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs"
                size="sm"
                variant="outline"
                type="single"
                value={collapsible}
                onValueChange={value =>
                  handleValueChange("sidebar_collapsible", value)
                }
              >
                <ToggleGroupItem
                  value="icon"
                  aria-label={t.layoutControls.toggleIcon}
                >
                  {t.layoutControls.icon}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="offcanvas"
                  aria-label={t.layoutControls.toggleOffcanvas}
                >
                  {t.layoutControls.offcanvas}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                {t.layoutControls.contentLayout}
              </Label>
              <ToggleGroup
                className="w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs"
                size="sm"
                variant="outline"
                type="single"
                value={contentLayout}
                onValueChange={value =>
                  handleValueChange("content_layout", value)
                }
              >
                <ToggleGroupItem
                  value="centered"
                  aria-label={t.layoutControls.toggleCentered}
                >
                  {t.layoutControls.centered}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="full-width"
                  aria-label={t.layoutControls.toggleFullWidth}
                >
                  {t.layoutControls.fullWidth}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
