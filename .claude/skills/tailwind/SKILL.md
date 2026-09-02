---
name: tailwind
description: Add or update Tailwind CSS styling on components, fix layout/spacing issues, apply theme tokens, or convert inline styles to Tailwind classes. Use when asked to style, restyle, or fix visual appearance of components.
argument-hint: <component-or-file> [description of desired style]
---

Apply or update Tailwind CSS v4 styling for `$ARGUMENTS`.

## Project conventions

**Color tokens** — always use CSS variable-based theme tokens, never hardcoded colors:
- `bg-background`, `text-foreground` — page background and primary text
- `bg-card`, `text-card-foreground` — card surfaces
- `bg-primary`, `text-primary-foreground` — primary actions
- `bg-muted`, `text-muted-foreground` — subdued backgrounds and secondary text
- `bg-destructive`, `text-destructive-foreground` — error/danger states
- `border-border` — default border color
- `ring-ring` — focus ring color

**Class merging** — always use `cn()` from `@/lib/utils` when combining conditional or dynamic classes:
```tsx
import { cn } from "@/lib/utils"
className={cn("base-classes", condition && "conditional-class", className)}
```

**Variants** — use `cva` from `class-variance-authority` for components with multiple visual variants:
```tsx
const variants = cva("base", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
})
```

**Responsive** — mobile-first: base classes for mobile, `sm:`, `md:`, `lg:` for larger breakpoints.

**Dark mode** — handled automatically via CSS variables and `next-themes`; do not use `dark:` variants for color — only for structural differences (e.g. `dark:border-white/10`).

**Spacing scale** — use Tailwind's default scale (4 = 1rem). Prefer `gap-*` over margin for flex/grid layouts.

**Typography** — use `text-sm`, `text-base`, `text-lg`, `font-medium`, `font-semibold`. Avoid arbitrary font sizes.

**Avoid** — inline `style={}`, arbitrary values like `w-[347px]` unless truly necessary, mixing Tailwind with raw CSS classes.

After applying styles, report which classes were added/changed and why.
