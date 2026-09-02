---
name: add-store
description: Add a new Zustand store following the project's preferences-store pattern (store + context provider + typed hook). Use when asked to add new global state.
argument-hint: <store-name>
---

Create a new Zustand store named `$ARGUMENTS` following the project's three-layer pattern in `stores/preferences/` as the reference.

Files to create under `stores/<store-name>/`:

1. **`<store-name>-store.ts`** — Zustand store definition
   - Define a TypeScript interface for state + actions
   - Use `createStore` (not `create`) so the store is instantiable per provider
   - Keep actions co-located with state in the same interface
   - No default export — named export only

2. **`<store-name>-provider.tsx`** — React Context wrapper
   - `"use client"`
   - Create a Context with `createContext`
   - Export a `<StoreNameProvider>` component that accepts `initialState` props and children
   - Export a `useStoreNameStore(selector)` hook that reads from context and throws if used outside the provider
   - Follow the same ref-based pattern used in `stores/preferences/preferences-provider.tsx`

Type definitions:
- If state types are non-trivial, place them in `types/<store-name>/` and import from there
- Keep primitive/simple types inline in the store file

After creating the files, report:
- The exported store, provider, and hook names
- What props `<StoreNameProvider>` accepts
- Where to add the provider in the layout tree
