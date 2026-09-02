---
name: jest
description: Set up Jest and write tests for utilities, React components, and Zustand stores. Use when asked to add tests, write unit tests, or configure the test runner.
argument-hint: <file-or-feature> [unit|component|store]
---

Write Jest tests for `$ARGUMENTS`.

## First-time setup (run once if not already configured)

```bash
yarn add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest ts-jest
```

Create `jest.config.ts` at the project root:

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
```

Create `jest.setup.ts`:

```ts
import "@testing-library/jest-dom";
```

Add to `package.json` scripts:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

## File placement

Co-locate tests next to the file they test:

```
lib/utils.ts           → lib/utils.test.ts
components/ui/foo.tsx  → components/ui/foo.test.tsx
stores/preferences/    → stores/preferences/preferences-store.test.ts
```

## Unit tests — utility functions

Example based on `lib/utils.ts`:

```ts
import { cn, getInitials, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("getInitials", () => {
  it("returns first two initials uppercased", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });
  it("falls back to U for empty string", () => {
    expect(getInitials("")).toBe("U");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    expect(formatDate("2026-01-18")).toBe("Jan 18, 2026");
  });
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });
});
```

## Component tests — React Testing Library

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchDialog } from "@/components/search-dialog";

describe("SearchDialog", () => {
  it("opens on ⌘J", async () => {
    render(<SearchDialog />);
    await userEvent.keyboard("{Meta>}j{/Meta}");
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<SearchDialog />);
    await userEvent.keyboard("{Meta>}j{/Meta}");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });
});
```

**Query priority** (prefer in this order):
1. `getByRole` — most accessible
2. `getByLabelText` — for form inputs
3. `getByPlaceholderText` — fallback for inputs
4. `getByText` — visible text
5. `getByTestId` — last resort; add `data-testid` only when nothing else works

## Store tests — Zustand

```ts
import { act, renderHook } from "@testing-library/react";
import { createPreferencesStore } from "@/stores/preferences/preferences-store";

describe("preferences store", () => {
  it("updates theme mode", () => {
    const store = createPreferencesStore({ themeMode: "light", themePreset: "default" });
    act(() => store.getState().setThemeMode("dark"));
    expect(store.getState().themeMode).toBe("dark");
  });
});
```

## Project conventions

- Test file extension: `.test.ts` for pure logic, `.test.tsx` for components
- No snapshot tests — they obscure intent and break on minor markup changes
- Do not mock internal modules (`@/lib/*`, `@/stores/*`) — test real code
- Mock only at system boundaries: `fetch`, `next/navigation`, `next/headers`, browser APIs
- Mock `next/navigation` when a component calls `useRouter` or `usePathname`:
  ```ts
  jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => "/" }));
  ```
- The `@/*` alias is resolved via `moduleNameMapper` in `jest.config.ts` — no extra config needed
