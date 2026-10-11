# Changelog

All notable changes to this project (developed by the USAS STEM Club) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
* Tall phone wallpaper ratio (9:20), contributed by @xfnx-17 in PR #10.
* Minimal and Liquid Glass lockscreen wallpaper layouts with timetable-theme-aware glass styling, contributed by @xfnx-17 in PR #8.
* Full 4-language support for English (default), Bahasa Melayu, Simplified Chinese (zh), and Tamil (ta).
* Custom glassmorphic language selection dropdown in top navigation.
* Five distinct timetable themes (Dark, Light, OLED, Emerald, and Warm Amber).
* Cloudflare Turnstile Captcha integration on login form.
* Server-side Cloudflare Turnstile verification on login (token checked in the Pages Function).
* Cloudflare Pages Function proxy for the USAS API (`/api/usas/*`).
* Lecturer directory lookup — official e-mail, position and extension fetched on demand.
* Structured logging in the API proxy.
* Optional Sentry client error tracking (`VITE_SENTRY_DSN`).
* Friendly error handling with a cached-timetable fallback when the USAS API is unavailable.
* Basic accessibility improvements (visible keyboard focus, dialog roles, live regions, reduced-motion support).
* Dialog accessibility: Escape-to-close and focus management for all modals via `useModalA11y`.
* Full localisation of the lecturer, prayer times, attendance, exam, compare and GPA modals (ms/en/zh/ta).
* Unit tests for API error/outcome handling and the lecturer directory.
* JavaScript bundle-size budget check (`npm run size`).
* Scheduled USAS API schema monitor (`scripts/check-usas-schema.mjs`).
* Complete project documentation suite following open-source repository standards.
* Adjustable background-blur slider (0–40 px) for custom lockscreen wallpaper images.

### Fixed
* Live Next Class card now shows "No classes on (DAY)" for days with no sessions scheduled, instead of the misleading "Today's Classes Completed" message which is reserved for days whose sessions have all finished.
* iOS lockscreen exports of the Minimal and Liquid Glass designs no longer mis-space letter-tracked text (e.g. course codes rendering as "MK G").
* Grid (matrix) view now fits the desktop viewport with no horizontal scroll; horizontal swipe is reserved for small screens.
* Grid-view class-block text scales with row height so every block renders at a consistent, readable size regardless of how many time slots it spans.
* Minimal and Liquid Glass weekly-card chips truncate long time/room details instead of overflowing into neighbouring chips.
* Repaired the Playwright e2e suite for the current Formal/Wallpaper export tabs and demo timetable data.
* Aligned Minimal and Liquid Glass wallpaper blur rendering between preview and PNG export.
* Fixed export progress overlay hang after file generation.
* Eliminated sub-pixel typography vibration and jitter on 3D card tilt unfocus.
* Eliminated landing page flash during authenticated page reload.
* Resolved subject code resolution fallbacks between kod_kursus and course_id.
* Updated Playwright e2e test locators for multi-language compatibility.
* Prayer reminder chime no longer replays on every page refresh (notified state is persisted).
* Resolved all ESLint warnings across the repository.

### Changed
* Wallpaper ratios: 9:20 is now the default **Phone** preset, and 9:16 is relabelled **Small Phone**.
* Labeled phone wallpaper presets by aspect ratio and removed redundant attendance scan footer actions.
* Deduplicated the global stylesheet.
* Refactored top navigation with custom language dropdown selector.
* Standardized theme name to Dark Theme without Navy suffix.
* Upgraded standalone error pages (404, 500, 502, 503, 504) with dark glassmorphic styling and USAS emblem.
* Locked browser tab header strictly to USAS Class Timetable.
* Removed fabricated placeholder data shown to real accounts (faculty, venues, groups, attendance week numbers); values now come from the API or display as unknown.
* Attendance history no longer falls back to a default group when the real group ID is missing.
* Ongoing/upcoming class status now uses a coloured dot indicator instead of a card border ring.
* Demo timetable uses realistic USAS room codes (e.g. BK B4, BK G10, BKB, MAKMAL KOMPUTER, MS TEAMS).
* Removed dead code and the unused `workbox-window` dependency.
