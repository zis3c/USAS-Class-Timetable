# Privacy Notice

Last updated: 7 October 2026

This notice describes data handling in USAS Class Timetable. The app has no project database, but some data passes through service providers and some stays in browser storage.

## Data flow

```
Browser (student device)
  │  HTTPS POST /api/usas/*                 ┌──────────────────────────────┐
  ▼                                         │ Cloudflare Turnstile         │
Cloudflare Pages Function  ────────────────▶│ siteverify (login only)      │
  │  endpoint + method allowlist            └──────────────────────────────┘
  │  body-size limit, no body or password logging
  ▼
https://mobile.usas.edu.my   (official USAS UMC API — receives credentials)

Stored on device: sessionStorage = session (per tab) · localStorage = timetable cache, notes, preferences
Third parties: Turnstile (login), optional Sentry (errors), optional Cloudflare Web Analytics
```

- **USAS login and timetable:** The browser sends login requests to this site's `/api/usas/*` endpoint. A Cloudflare Pages Function forwards allowed requests to the official USAS UMC API at `https://mobile.usas.edu.my`. The function code does not write request bodies, passwords, or session tokens to a project database or application logs. Cloudflare processes requests as the hosting and proxy provider, and USAS processes credentials and academic records as the destination service.
- **Browser storage:** After login, the USAS session is stored in `sessionStorage`. The timetable cache, course notes, and preferences are stored in `localStorage`. Browser storage stays on the device, but may remain after closing the tab or browser. Use **Log out** to clear the session and timetable cache, and clear this site's browser data to remove remaining preferences or notes.
- **Turnstile:** Cloudflare Turnstile runs on the login page. When `TURNSTILE_SECRET_KEY` is configured, the Pages Function verifies the challenge. The Function logs captcha rejection metadata, including request IP when available, plus the request path. It does not log the submitted login body. If the secret is missing, the proxy refuses login (fails closed) instead of skipping verification.
- **Prayer times:** If used, the browser requests prayer-time data from `api.waktusolat.app` using the selected zone.
- **Optional Sentry:** If `VITE_SENTRY_DSN` is configured by the operator, the app sends client error and sampled browser-tracing telemetry to Sentry. The app works without this setting.
- **Cloudflare analytics:** The deployed site may load Cloudflare Web Analytics. Cloudflare handles traffic and request metadata as the hosting and analytics provider.
- **Agent intake:** The separate `/agent-intake` page logs submitted disclosure fields and request metadata such as IP, country, and user-agent to Function logs. Do not submit student credentials or timetable data there.

## What maintainers store

The application code has no student account database and does not intentionally retain passwords or USAS sessions on its server. Cloudflare and USAS process network requests to provide the site and university service. Their handling and retention are governed by their own policies and controls.

## Student safety

Use only your own official USAS UMC credentials. Avoid shared or public devices. Log out when finished, especially on a device other people can access. Do not share exported timetables if they contain personal or academic information.

For security concerns, see the [Security Policy](SECURITY.md). For source-level data flow, see [Architecture](ARCHITECTURE.md).
