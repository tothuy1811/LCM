# Compensation

An internal Next.js app for Asahi Livwell, styled to match the
[home.asahilivwell.com](https://home.asahilivwell.com/) brand.

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

Other scripts: `yarn build`, `yarn start`, `yarn lint` / `yarn lint:fix`,
`yarn format` / `yarn format:check`.

## Asahi Livwell branding & theming

The app ships with an `asahi-livwell` theme preset built from colors and
assets pulled directly from the public Asahi Livwell website, and it's set
as the **default** theme (both the color preset and dark mode) — see
`src/types/preferences/theme.ts` and `src/app/layout.tsx`.

- **Colors** — navy primary (`#002364`) and pink accent (`#f1005f`),
  converted to OKLCH in `src/styles/presets/asahi-livwell.css`. The same
  palette is also baked directly into the base `:root` / `.dark` variables
  in `src/app/globals.css`, so the "Default" preset renders identically to
  "Asahi Livwell" even for browsers with a stale preset cookie.
- **Typography** — Noto Sans (matching the site) instead of Geist, loaded
  in `src/app/layout.tsx`.
- **Brand assets** — logo, imagery, and the looping hero video downloaded
  from the site live under `public/brand/` (`logo/`, `images/`,
  `images-webp/`, `videos/`).
- **Favicon** — `src/app/icon.svg`, the Asahi symbol mark.

### Login page (`src/app/(auth)/layout.tsx`)

A 60/40 split: a fixed navy/white brand panel on the left (desktop) with
the looping hero video, logo, tagline, and an auto-scrolling marquee quote,
and the sign-in form on the right. Below the `lg` breakpoint the brand
panel collapses and the video becomes a full-bleed background behind the
form instead. The panel's colors are hardcoded (not tied to `--primary`),
since it's fixed brand imagery that should look the same in light or dark
mode.

### App shell (`src/app/(app)/layout.tsx`, `src/components/ui/sidebar.tsx`)

- The sidebar has a glassmorphism treatment — no background color, just
  `backdrop-blur-xl` and a subtle border — over a `bg.webp` background image
  applied to the outer sidebar wrapper.
- Dark mode content panel uses a navy gradient background
  (`.dark [data-slot="sidebar-inset"]` in `globals.css`).
- The unused "Quick Create" sidebar menu item was removed.

### Localization

All user-facing UI copy (navigation, login form, documents table, search
dialog, layout settings, user menu) is in Vietnamese. Brand/product names
("Compensation", "Asahi Livwell") are left untranslated.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
