# Security Policy

## Supported Versions

Currently, only the latest release of USAS Class Timetable is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Architecture

The browser sends USAS API requests through a Cloudflare Pages Function proxy. The function checks the endpoint and method allowlist, optionally verifies login challenges, and forwards requests to `https://mobile.usas.edu.my`. It does not write request bodies or student sessions to a project database. Cloudflare processes requests as the hosting and proxy provider. See the [Privacy Notice](PRIVACY.md) for storage and service details.

* **Turnstile**: Login challenge verification is required. If `TURNSTILE_SECRET_KEY` is not configured, the proxy refuses login (fails closed) instead of skipping the check. The client never falls back to Cloudflare's test site key in production.
* **Abuse / rate limiting**: The proxy enforces an endpoint/method allowlist, a request-size limit, and drops client-supplied network headers before forwarding. Add a Cloudflare Rate Limiting rule on `POST /api/usas/student/login_student.php` (e.g. 10 requests/minute per IP) to blunt credential stuffing; the in-browser login throttle is only a convenience and is not a security control.
* **Browser storage**: The session is stored in `sessionStorage`; timetable cache and preferences use `localStorage`. Logout clears the session and timetable cache.
* **Content Security Policy**: Response headers restrict content sources and framing. Inline scripts are disallowed (`script-src` has no `'unsafe-inline'`). CSP reduces risk; it does not prevent every XSS or browser compromise.
* **Monitoring**: Sentry is optional (`VITE_SENTRY_DSN`) and strips query strings from error events and breadcrumbs so shared timetable payloads are not sent to a third party.

---

## Reporting a Vulnerability

If you discover a security vulnerability within USAS Class Timetable, report it privately to the USAS STEM Club through the contact details listed on the project's GitHub page. Do not include real student credentials or timetable data in the report. Response time depends on maintainer availability.

Please do not publicly disclose the issue until it has been addressed by the maintainers. We will work with you to ensure a timely resolution.
