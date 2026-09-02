---
name: new-page
description: Scaffold a new Next.js App Router page and its layout if needed. Use when asked to add a new route or page.
argument-hint: <route-path> [page title]
---

Create a new Next.js App Router page at the route `$ARGUMENTS`.

Follow these project conventions:
- Create `app/<route>/page.tsx` (and `app/<route>/layout.tsx` if a dedicated layout is needed)
- Pages are server components by default — only add `"use client"` if the page itself needs interactivity
- Extract interactive sections into separate client components under `components/`
- Import `AppSidebar` and wrap content in `<SidebarProvider>` + `<SidebarInset>` for dashboard-style pages that need the sidebar
- Use `<Breadcrumb>` from `components/ui/breadcrumb` to reflect the current route
- Type any route params as `{ params: { id: string } }` (Next.js convention)
- Use `Metadata` export for SEO: `export const metadata: Metadata = { title: '...' }`
- No placeholder lorem ipsum — use realistic CRM field names relevant to the route

## Unit test (required)

After creating the page file, create a co-located test file at `app/<route>/page.test.tsx`. Follow the conventions in the `jest` skill:

- Import and render the page component with `render()` from `@testing-library/react`
- Assert the page title / heading is visible with `getByRole("heading", { name: /…/i })`
- Assert key UI landmarks are present (breadcrumb, sidebar trigger, primary action buttons)
- Mock `next/navigation` if the page calls `useRouter` or `usePathname`:
  ```ts
  jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => "/dashboard/your-route",
  }));
  ```
- For server components, render them directly — no special wrapper needed
- Do not snapshot the full page output

Example skeleton:

```tsx
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("<Page />", () => {
  it("renders the page heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: /page title/i })).toBeInTheDocument();
  });
});
```

After creating both files, report the route path, the test file location, and what still needs to be wired up (navigation entry in `types/navigation/sidebar.tsx`, data fetching, etc.).
