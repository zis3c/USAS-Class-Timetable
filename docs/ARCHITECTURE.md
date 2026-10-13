# Architecture

## Overview

USAS Class Timetable is a single-page application built with **React 18**, **TypeScript**, **Vite** and **Tailwind CSS**, shipped as an installable **PWA**. Student data is fetched from the official USAS UMC API through a stateless **Cloudflare Pages Function** proxy.

## High-level flow

```text
Browser (React SPA)
  │  fetch /api/usas/*        (same origin; CSP connect-src 'self')
  ▼
Cloudflare Pages Function      functions/api/usas/_middleware.ts
  │  • enforces the endpoint allowlist and request-size limit
  │  • drops client-supplied network headers
  ▼
https://mobile.usas.edu.my/umc_v2   (official USAS UMC API)
```

## Why a proxy

- The USAS API is not CORS-enabled for browsers.
- All outbound endpoints are allowlisted in `src/shared/lib/usasProxy.ts`.
- The function code does not persist credentials or session tokens to a project database or log request bodies. Cloudflare still processes requests as the hosting and proxy provider.

## Authentication

1. `LoginForm` calls `AuthProvider.login(userId, password)`.
2. `loginStudentAPI` POSTs to `/api/usas/student/login_student.php` through the Pages Function proxy.
3. On success, `sid_1`/`sid_2`/`sid_3` are stored in `sessionStorage` and the timetable is cached in `localStorage`. The cache can remain after the browser tab closes; logout or clearing site storage removes it.
4. Login throttling state lives in `sessionStorage`.

## Data layer

- `src/services/usas/Api.ts` is the single integration point: payload builders, response parsing, field mapping, sanitization and error handling.
- `postUSASOutcome` distinguishes a **network failure** from an **invalid response**, so the UI can show friendly messages and fall back to cached data.

## State management

- Providers: `ThemeProvider`, `AuthProvider`, `NotificationProvider`, `LanguageProvider`.
- `AuthProvider` owns the session, the cached timetable, the login throttle and connectivity (`isOffline`).

## Timetable views

- The Grid (matrix) view builds **adaptive time slots** (`src/shared/lib/adaptiveTimeGrid.ts`) that compress empty hours while keeping dense ranges grouped; slots become columns and days become rows.
- Course blocks are positioned as a percentage of the time axis, so each session aligns to the minute regardless of column width.
- The grid fits the desktop viewport (no horizontal scroll); on small screens it keeps a minimum column width and scrolls horizontally. Card text scales with the **row height** via container query units (`cqh`) so every block renders at a consistent, readable size.

## Wallpaper exports

- The lockscreen exporter supports the standard grid, Minimal weekly-card and Liquid Glass weekly-card layouts.
- Minimal and Liquid Glass share `MinimalWeekCard`; Liquid Glass applies a theme-specific translucent surface and course colors. Long chip details are shortened to the available width so they never overflow into neighbouring chips.
- An optional custom background image can be supplied for the lockscreen; its blur is adjustable with a slider and re-rendered on change.
- Wallpaper layout controls position the timetable at the bottom of the lockscreen so the device clock area stays clear.
- PNG rendering is performed in the browser with `html2canvas`; platform-specific clone adjustments keep exported text aligned with the preview.
- Because `html2canvas` strips CSS `filter` during capture, the background blur is **baked into a canvas bitmap** (with an SVG `feGaussianBlur` fallback) rather than applied as a live CSS filter.

## Landing experience & video tutorial

- `LandingPage` composes the public (unauthenticated) marketing view: a hero area, a 3D tilt timetable mockup and a bento feature grid.
- The landing content is driven by `src/features/landing/data/landingCopy.ts`, localised across all four supported languages.
- The video walkthrough lives in `src/features/landing/components/VideoTutorialPlayer.tsx` and plays `/videos/usas-timetable-guide.mp4` from `public/videos/`. It is a self-contained HTML5 `<video>` player with custom play/pause, seek, mute and fullscreen controls; it loads only metadata until the user presses play.
- The tutorial asset is a plain static file served from the public directory. It is intentionally excluded from the PWA precache (see `public/sw.js` and the VitePWA `globPatterns`) so the service worker never downloads the media file, and `media-src 'self'` in the Content Security Policy allows same-origin playback.

## Third parties

- **Prayer times**: `https://api.waktusolat.app/v2/solat/<zone>` (JAKIM), called directly from the client.
- **Sentry** (optional): client error tracking, enabled by `VITE_SENTRY_DSN`.

## Monitoring

- The Pages Function logs upstream path/status errors, but not request bodies. Logs are visible in Cloudflare Functions logs / `wrangler pages deployment tail`.
- `.github/workflows/api-schema-check.yml` runs `scripts/check-usas-schema.mjs` daily to detect upstream schema drift.
- Cloudflare Web Analytics (traffic) and optional Sentry (errors).

## Project layout

```text
functions/api/usas/   Cloudflare Pages Function proxy
src/app/              Providers, shell (Navbar, ToolsDrawer), routing & SEO
src/features/         auth, export, landing, planning, sharing, timetable, pwa
src/services/         USAS API client and JAKIM prayer-time client
src/shared/           i18n, types, and reusable libraries (security, cache, time)
src/styles/           Tailwind entry & global styles
scripts/              Tooling (e.g. schema monitor)
tests/                Vitest unit suites & Playwright e2e specs
public/videos/        Landing page tutorial media (served as a static asset)
```
