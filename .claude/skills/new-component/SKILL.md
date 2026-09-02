---
name: new-component
description: Scaffold a new reusable UI component under components/ui/ following the project's shadcn/Radix patterns. Use when asked to create a new component.
argument-hint: <ComponentName>
---

Create a new UI component named `$ARGUMENTS` under `components/ui/`.

Follow these project conventions:
- File: `components/ui/<component-name>.tsx` (kebab-case filename, PascalCase export)
- Add `"use client"` only if the component uses hooks or browser APIs
- Use `cn()` from `@/lib/utils` for className merging
- Use `class-variance-authority` (`cva`) for variants when the component has size/variant props
- Accept a `className` prop and forward it via `cn()`
- Use Radix UI or Base UI primitives when the component needs accessibility (dialog, dropdown, tooltip, etc.)
- Use Lucide React for any icons
- Export the component as a named export
- No comments unless there is a non-obvious constraint

Compound component pattern (use when the component has sub-parts):
```tsx
const Root = ...
const Header = ...
export { Root as Card, Header as CardHeader }
```

After creating the file, report the full path and the exported names.
