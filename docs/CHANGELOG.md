# Changelog

All notable changes to this project (developed by the USAS STEM Club) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.10] - 2026-10-13

Security hardening and UI polish after the first release.

### Security
* Login proxy now fails closed: if `TURNSTILE_SECRET_KEY` is not configured, login is refused instead of skipping captcha verification.
* The client no longer falls back to Cloudflare's always-pass test site key in production builds.
* Content-Security-Policy no longer allows inline scripts; `img-src` was narrowed to `'self' data: blob:`.
* Sentry strips query strings from error events and breadcrumbs so shared timetable payloads are not sent to a third party.
* Compare-schedule payload decompression is size-capped, and `/agent-intake` plus the API proxy enforce request-size limits.
* The proxy drops client-supplied network headers (spoofable IP/proxy headers) before forwarding upstream.

### Changed
* The project is clearly marked as an **unofficial, independent STEM USAS project** (README, page metadata, landing footer, and login screen); the login screen also shows a privacy note and "not an official USAS portal".
* Attendance QR scanning now rejects invalid codes with a localized message and error styling instead of showing the server's message in a success (green) box.
* The compare/share scan hint now states what to do, and differs between adding the first friend and adding more friends.

### Fixed
* The compare/share schedule scroll area no longer hugs the scrollbar.
* The prayer-times modal is more compact on mobile.

## [1.0.9] - 2026-10-13

First public release of the USAS Class Timetable portal.

### Added

**Platform & Access**
* Cloudflare Pages Function proxy for the USAS API (`/api/usas/*`).
* Cloudflare Turnstile captcha integration on the login form, with server-side token verification in the Pages Function.
* Friendly error handling with a cached-timetable fallback when the USAS API is unavailable.
* Optional Sentry client error tracking (`VITE_SENTRY_DSN`).
* Structured logging in the API proxy.

**Timetable & Planning**
* Lecturer directory lookup — official e-mail, position and extension fetched on demand.
* Live Next Class card, clash detection and an attendance meter.
* GPA target calculator and exam schedule viewer.
* Smart QR attendance scanning.

**Exports & Sharing**
* Printable A4 landscape PDF and PNG export.
* Lockscreen wallpaper exports: Phone (9:20, default), Small Phone (9:16), Tablet (4:3), Desktop (16:9) and Square (1:1) presets.
* Grid, Minimal and Liquid Glass wallpaper layouts with timetable-theme-aware glass styling.
* Optional custom lockscreen background image with an adjustable background-blur slider (0–40 px).
* Universal `.ICS` calendar export (Google Calendar, Apple iCal, Microsoft Outlook).
* WhatsApp and QR timetable sharing, plus a schedule comparison tool.
* Compare schedule results show both **common free time** and a **combined class schedule** (your classes and your friend's, labelled per day). Colour marks the owner — your classes are amber, your friend's are blue.
* **Group compare**: add several friends (scan/upload their QR codes or paste invite links) and see the **common free time for everyone** plus a per-person class schedule, each person in their own colour.

**Landing Page & Presentation**
* Interactive landing page with a hero area, 3D tilt timetable mockup and a bento feature grid.
* Embedded **video tutorial walkthrough player** on the landing page (custom controls: play/pause, seek, mute and fullscreen), loaded from `public/videos/usas-timetable-guide.mp4`.
* Installable PWA with an in-app install prompt and a standalone offline service worker.
* Complete project documentation suite following open-source repository standards.

**Internationalisation & Theming**
* Full 4-language support: English (default), Bahasa Melayu, Simplified Chinese (zh) and Tamil (ta).
* Custom glassmorphic language selection dropdown in the top navigation.
* Five distinct timetable themes (Dark, Light, OLED, Emerald and Warm Amber).
* Basic accessibility improvements (visible keyboard focus, dialog roles, live regions, reduced-motion support) and dialog accessibility (Escape-to-close and focus management) for all modals via `useModalA11y`.
* Full localisation of the lecturer, prayer times, attendance, exam, compare and GPA modals (ms/en/zh/ta).

**Tooling & Quality**
* Unit tests for API error/outcome handling and the lecturer directory.
* JavaScript bundle-size budget check (`npm run size`).
* Scheduled USAS API schema monitor (`scripts/check-usas-schema.mjs`).
* Console banner on load showing the build version (package version + git commit) and the repository link.

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
* Turnstile captcha no longer restarts the challenge or drops the solved token when the app theme changes.
* Custom lockscreen background no longer disappears outside the blurred grid on low-memory devices (the cover image is capped to a safe resolution before export).
* Modal headers now vertically centre against their icon on small screens.

### Changed
* Common free time now spans **8:00 AM to 12:00 AM (midnight)**, Monday to Friday, instead of ending at 5:00 PM.
* Login Turnstile captcha now loads earlier (preconnect + a preloaded script) to reduce the "Verifying…" wait. The widget stays visible so users can see and complete the check.
* Compare schedule results now reuse the app's course-card colour palette, and the free-time and combined class lists are compact and mobile-responsive.
* Wallpaper ratios: 9:20 is now the default **Phone** preset, and 9:16 is relabelled **Small Phone**.
* Labeled phone wallpaper presets by aspect ratio and removed redundant attendance scan footer actions.
* Deduplicated the global stylesheet.
* Refactored top navigation with a custom language dropdown selector.
* Standardized theme name to Dark Theme without the Navy suffix.
* Upgraded the standalone error pages (404, 500, 502, 503, 504) with dark glassmorphic styling and the USAS emblem.
* Locked the browser tab header strictly to USAS Class Timetable.
* Removed fabricated placeholder data shown to real accounts (faculty, venues, groups, attendance week numbers); values now come from the API or display as unknown.
* Attendance history no longer falls back to a default group when the real group ID is missing.
* Ongoing/upcoming class status now uses a coloured dot indicator instead of a card border ring.
* Demo timetable uses realistic USAS room codes (e.g. BK B4, BK G10, BKB, MAKMAL KOMPUTER, MS TEAMS).
* Removed dead code and the unused `workbox-window` dependency.
* Compare-schedule 12-hour time labels read "8AM - 10AM".
* The attendance scanner now uses a true full-screen viewport, and its neutral status message is plain text instead of a placeholder-style box.
* Repo-wide pass to keep only concise, non-obvious "why" code comments.

### Fixed
* The compare-schedule camera scanner is more robust: the scan loop can no longer die on a bad frame, and the "Camera Ready" preview is tappable to start the camera manually.
* QR timetable scan/upload is now reliable on mobile: large photos are decoded at several scales (avoiding mobile canvas/memory limits), the camera requests a higher resolution, and the share QR is generated and displayed larger.
* The compare schedule results view ("Common Free Time") now scrolls instead of being clipped when the merged schedule is long.
* Compare/share and attendance QR scanning now detects both normal and light-on-dark (inverted) codes. Phone screens and dark-mode displays often render the QR inverted, which the previous `jsQR` inversion setting skipped entirely — this was the main reason "nothing was detected" when scanning or uploading a QR.
* Turnstile captcha failures are now reported with their real reason instead of a generic "invalid response" message: the proxy logs and returns the Cloudflare `error-codes`, and the login client surfaces a 403 captcha rejection correctly.
* Compare schedule share links now work for signed-out recipients: the `?compare_schedule=` payload is captured and kept across the login flow instead of being dropped when the recipient is not yet authenticated.
* The "back to scan" control in the compare modal now restarts the camera (previously it returned early because the scan state was still `success`).
* The camera is properly stopped when switching to the Share tab or when the scan succeeds, so it no longer keeps running in the background.
* The QR scan loop no longer re-processes the same code once a schedule has been captured, and no longer reprocesses while analysing.
* Scanning your own timetable QR code is now rejected with a clear message, and the payload carries the sender's student ID for this check (older codes without an ID still decode).
* The compare Share tab now shows an empty-state message instead of generating a useless QR code when the timetable has not loaded yet.
* `decompressTimetable` now validates that the payload contains a timetable array and sanitises the embedded student name.

[1.0.10]: https://github.com/zis3c/USAS-Class-Timetable/releases/tag/v1.0.10
[1.0.9]: https://github.com/zis3c/USAS-Class-Timetable/releases/tag/v1.0.9

