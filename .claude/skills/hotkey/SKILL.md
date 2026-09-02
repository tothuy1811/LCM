---
name: hotkey
description: Add or update keyboard shortcuts (hotkeys) in the app. Use when asked to wire up a key binding, add a ⌘/Ctrl shortcut, display a <kbd> badge, or register a hotkey for a dialog, action, or command palette item.
argument-hint: <component-or-feature> <key-combo> [description]
---

Add or update a keyboard shortcut for `$ARGUMENTS`.

## Existing hotkey pattern

Shortcuts use a raw `document.addEventListener` inside `useEffect`. The canonical example is `components/search-dialog.tsx`:

```tsx
React.useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(open => !open);
    }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);
```

**Rules:**
- Always check `e.metaKey || e.ctrlKey` for cross-platform ⌘/Ctrl shortcuts
- Always call `e.preventDefault()` to suppress browser defaults
- Return the cleanup function to avoid stacking listeners
- Components that register hotkeys must be `"use client"`
- **macOS `Alt` key caveat:** `e.key` with `altKey` produces special characters (`⌥C` → `"ç"`, `⌥D` → `"∂"`, `⌥T` → `"†"`). Always use `e.code` (e.g. `"KeyC"`) instead of `e.key` when `altKey` is involved.

## Displaying the shortcut badge

Use the `<kbd>` element with these exact Tailwind classes (already in use by `SearchDialog`):

```tsx
<kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
  <span className="text-xs">⌘</span>K
</kbd>
```

For Ctrl (non-Mac fallback label), use `Ctrl` text instead of `⌘`.

## Shortcut inside a CommandPalette item

Use `CommandShortcut` from `components/ui/command.tsx` to show the hint inline:

```tsx
import { CommandItem, CommandShortcut } from "@/components/ui/command";

<CommandItem onSelect={...}>
  <IconSearch />
  Open Search
  <CommandShortcut>⌘J</CommandShortcut>
</CommandItem>
```

## Key naming reference

| Modifier display | Event property |
|---|---|
| `⌘` / `Ctrl` | `e.metaKey \|\| e.ctrlKey` |
| `⇧` / `Shift` | `e.shiftKey` |
| `⌥` / `Alt` | `e.altKey` |
| Letter key | `e.key === "k"` (lowercase) |
| `Escape` | `e.key === "Escape"` |
| `Enter` | `e.key === "Enter"` |

## Reserved shortcuts

| Shortcut | Action | File |
|---|---|---|
| `⌘J` / `Ctrl+J` | Open Search dialog | `components/search-dialog.tsx` |
| `⌥C` | New Contact | `components/dashboard-quick-actions.tsx` |
| `⌥D` | New Deal | `components/dashboard-quick-actions.tsx` |
| `⌥T` | New Task | `components/dashboard-quick-actions.tsx` |

Add new shortcuts to this table when registering them.

## Checklist

After adding a hotkey:
1. Verify the key combo is not already in the Reserved shortcuts table above
2. Add it to the Reserved shortcuts table
3. Add the `<kbd>` badge wherever the trigger button is rendered
4. Add a `CommandItem` + `CommandShortcut` entry in `SearchDialog` if the action should be discoverable via the command palette
