# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start Next.js development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn lint:fix     # Run ESLint with auto-fix
yarn format       # Format code with Prettier
yarn format:check # Check formatting without changes
```

No test runner is configured yet.

## Tech Stack

- **Framework**: Next.js (App Router) with React 19
- **Language**: TypeScript 5 (strict mode, path alias `@/*` → `src/*`)
- **Styling**: TailwindCSS v4 + CSS variables (OKLCH color system)
- **Components**: shadcn/ui built on Radix UI and Base UI
- **State**: Zustand v5 wrapped in React Context (see `src/stores/preferences/`)
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack React Table

No backend/database is wired up yet — this is a UI foundation only.

## Architecture

### App Router Structure

`src/app/` contains route segments. Layouts are server components by default; interactive components require `"use client"`. Server actions live in `src/server/server-actions.ts` (currently handles cookie-based preference persistence only). `src/app/(app)/` holds the authenticated-shell routes (sidebar + header); there is no `(auth)` group yet since no auth provider is wired up.

### Preferences / Theme System

User preferences (theme mode, theme preset, sidebar/layout settings) follow a three-layer pattern:

1. **Server** — `src/server/server-actions.ts` reads/writes cookies at request time and hydrates initial state into the root layout
2. **Store** — `src/stores/preferences/preferences-store.ts` defines the Zustand store
3. **Provider** — `src/stores/preferences/preferences-provider.tsx` wraps the store in React Context and exposes the `usePreferencesStore(selector)` hook

Theme presets are defined under `src/styles/presets/` and typed in `src/types/preferences/theme.ts`.

### Component Layers

- `src/components/ui/` — Unstyled, reusable shadcn primitives (forms, layout, data display). These follow compound-component patterns (e.g. `<Card>`, `<CardHeader>`, `<CardContent>`).
- `src/components/` — Feature-level components assembled from primitives: `AppSidebar`, `NavMain`, `NavUser`, `SearchDialog`, `ThemeSwitcher`, `LayoutControls`.

### Navigation

Routes and sidebar structure are typed in `src/types/navigation/sidebar.tsx`. The sidebar supports nested items, `comingSoon`, `isNew`, and `newTab` flags.

### Data Layer

No backend or auth integration exists yet. `src/lib/types.ts` holds only the generic `ActionResult` helper type for server actions. The `DataTable` component (`src/components/ui/data-table/`) is built on TanStack React Table and ready to receive API-sourced data once a backend is added.

## Code Style

Prettier config (`.prettierrc`): double quotes, semicolons, trailing commas (ES5), 80-char print width, 2-space tabs, LF line endings, arrow-function parens omitted when possible.

ESLint uses flat config (`eslint.config.mjs`) extending `next/core-web-vitals` with Prettier integration.
