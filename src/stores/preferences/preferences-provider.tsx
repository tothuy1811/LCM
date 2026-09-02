"use client";

import { createContext, useContext, useRef } from "react";

import { type StoreApi, useStore } from "zustand";

import { PreferencesState, createPreferencesStore } from "./preferences-store";

const PreferencesStoreContext =
  createContext<StoreApi<PreferencesState> | null>(null);

export const PreferencesStoreProvider = ({
  children,
  themeMode,
  themePreset,
  language,
}: {
  children: React.ReactNode;
  themeMode: PreferencesState["themeMode"];
  themePreset: PreferencesState["themePreset"];
  language: PreferencesState["language"];
}) => {
  const storeRef = useRef<StoreApi<PreferencesState> | null>(null);

  storeRef.current ??= createPreferencesStore({
    themeMode,
    themePreset,
    language,
  });

  return (
    <PreferencesStoreContext.Provider value={storeRef.current}>
      {children}
    </PreferencesStoreContext.Provider>
  );
};

export const usePreferencesStore = <T,>(
  selector: (state: PreferencesState) => T
): T => {
  const store = useContext(PreferencesStoreContext);
  if (!store) throw new Error("Missing PreferencesStoreProvider");
  return useStore(store, selector);
};
