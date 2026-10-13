# USAS Class Timetable Installation Guide

Welcome to the detailed installation guide for the **USAS Class Timetable** portal, developed by the USAS STEM Club. This document will walk you through setting up the project for both **local development** and **production deployment**.

---

## Prerequisites

Before you begin, ensure your system meets the following requirements:

### Frontend Environment
* **Node.js**: `v18.x` or higher (v20+ recommended)
* **NPM**: `v9.x` or higher (or `pnpm` / `yarn`)
* **Modern Web Browser**: Chrome 111+, Safari 16.4+, or Firefox 128+. These are Tailwind CSS 4's minimum supported browser versions.

---

## Local Development Setup

Follow these steps to get a full development environment running on your local machine.

### 1. Clone the Repository
Clone the project and navigate into the application directory:
```bash
git clone https://github.com/zis3c/USAS-Class-Timetable.git
cd "USAS Class Timetable"
```

### 2. Install Dependencies
Install the required Node.js packages:
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root with the Cloudflare Turnstile **Site Key** (public):

```env
VITE_TURNSTILE_SITE_KEY=0x4AAAAAA...
```

The login captcha is verified server-side by the Pages Function, which needs the Turnstile **Secret Key**. For local testing create a `.dev.vars` file in the project root (already gitignored):

```env
TURNSTILE_SECRET_KEY=0x4AAAAAA...
```

> Without `TURNSTILE_SECRET_KEY`, the server-side captcha check is skipped. Use this only for local UI work. Set a real secret in every production and preview environment. Cloudflare's testing site key `1x00000000000000000000AA` always passes on the client widget and is not suitable for production.

Optionally enable client error tracking by adding a Sentry DSN:

```env
VITE_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

### 4. Start Development Server

Launch the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

> `npm run dev` serves the Vite UI only (plus demo mode). Because the `/api/usas/*` requests are handled by a Cloudflare Pages Function, run **`npm run dev:cf`** to exercise real USAS API calls locally.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server (UI/demo only). |
| `npm run dev:cf` | Builds and serves the app with Cloudflare Pages Functions (real API + captcha). |
| `npm run build` | Compiles and optimizes assets into `dist/` for production. |
| `npm run preview` | Previews the production bundle locally. |
| `npm run preview:cf` | Builds and previews with Cloudflare Pages Functions. |
| `npm run deploy:cf` | Builds and deploys to Cloudflare Pages via Wrangler. |
| `npm run lint` | Runs ESLint across the repository. |
| `npm run typecheck` | Executes TypeScript type checking without emitting files. |
| `npm run test:unit` | Executes all unit test suites using Vitest. |
| `npm run test:e2e` | Executes Playwright end-to-end browser integration tests. |
| `npm run test:strict` | Runs linter, typecheck, unit tests, and production build in sequence. |
| `npm run test:all` | Runs the full strict suite followed by Playwright end-to-end tests. |

## Landing Page Media Assets

The landing page plays a tutorial video from `public/videos/usas-timetable-guide.mp4`. It is a plain static file that ships inside the repository, so keep it small.

### Replacing the video

Drop the new clip at the same path (or update `GUIDE_VIDEO_SRC` in `src/features/landing/components/LandingSecondarySections.tsx`). Prefer an **H.264 / AAC MP4** so every modern browser can play it, and keep 1080p as the maximum resolution — the player renders at roughly 672 px wide on the landing page.

### Compressing with FFmpeg

Recorded clips are often far larger than needed. Downscale to 1080p and re-encode with a quality target (`-crf`) to shrink them dramatically:

```bash
ffmpeg -i input.mp4 \
  -vf "scale='min(1920,iw)':-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
  -profile:v high -level 4.1 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  public/videos/usas-timetable-guide.mp4
```

- `-movflags +faststart` moves the `moov` atom to the front so the browser can start playing before the whole file is downloaded.
- Increase `-crf` (e.g. 30–32) for a smaller file, or lower it (e.g. 23–25) for higher quality.

> [!NOTE]
> The tutorial video is intentionally **not** precached by the service worker (`public/sw.js` / the VitePWA `globPatterns` in `vite.config.ts`), so it is only downloaded on demand. Any large media you add to `public/` should follow the same rule.

---

## Production Deployment

The build output consists of static HTML, CSS, and JavaScript files generated in `dist/`.

### Building for Production
```bash
npm run build
```

### Deploying to Cloudflare Pages

The `/api/usas/*` proxy and captcha verification run as Cloudflare Pages Functions, so Cloudflare Pages is the recommended host.

1. Connect your repository in the Cloudflare Pages dashboard (or deploy with `npm run deploy:cf`).
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Add environment variables under **Settings → Environment variables** (Production and Preview):
   - `VITE_TURNSTILE_SITE_KEY` — Turnstile Site Key (public, baked into the build).
5. Add the Turnstile Secret Key as an encrypted secret:
   ```bash
   npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name=<your-project>
   ```
   Confirm `TURNSTILE_SECRET_KEY` exists in the Pages production environment. The GitHub deployment workflow deploys the Function but does not configure this Pages secret.
6. The included `public/_headers` file automatically configures Content Security Policy (CSP) and cache headers.

#### Automated deployment (GitHub Actions)

The bundled `.github/workflows/deploy.yml` deploys on every push to `main`. Add these repository secrets (**Settings → Secrets and variables → Actions**):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_TURNSTILE_SITE_KEY`

### Deploying to Vercel / Netlify

Both hosts can serve the static `dist/` output. However, real API login depends on the Cloudflare Pages Function proxy (`/api/usas/*`) and its server-side Turnstile check, which are Cloudflare-specific. On Vercel or Netlify you must supply an equivalent serverless function that proxies `/api/usas/*` to the USAS API and verifies the Turnstile token.

- **Vercel**: Framework Preset **Vite**, Output Directory `dist`.
- **Netlify**: Build command `npm run build`, Publish directory `dist`.

---

## Rate Limiting & Monitoring

### API rate limiting

Login abuse is mitigated by server-side Cloudflare Turnstile verification. Cloudflare Pages Functions do not support Worker rate-limiting bindings, and the app's custom domain does not need to be hosted on Cloudflare DNS.

If your domain is proxied through Cloudflare, you can add an additional edge limit via **Security → WAF → Rate limiting rules** matching `/api/usas/*`.

### Monitoring

- **Traffic & Web Vitals**: Cloudflare dashboard → **Web Analytics** → enable for the Pages project (privacy-first, cookieless).
- **Function logs & errors**: the proxy emits `console.warn` entries for captcha rejections and upstream path/status failures. It does not log request bodies. View them live with:
  ```bash
  npx wrangler pages deployment tail --project-name=<your-project>
  ```
  or via the Pages project → **Functions → Logs** in the dashboard.
- **Client error tracking (optional)**: the app initialises Sentry automatically when `VITE_SENTRY_DSN` is set.
  1. Create a Sentry project (platform **React**) and copy its DSN.
  2. Set `VITE_SENTRY_DSN` in `.env` (local), Cloudflare Pages environment variables, and the GitHub Actions secret `VITE_SENTRY_DSN`.
  3. The Sentry ingest hosts are already allowed in the Content Security Policy.
- **API schema monitor**: the scheduled workflow `.github/workflows/api-schema-check.yml` runs `scripts/check-usas-schema.mjs` daily to detect upstream schema drift or outages. Add repository secrets `USAS_MONITOR_USER` and `USAS_MONITOR_PASS` to also validate the authenticated timetable and course-list schemas; without them only the login endpoint shape is checked.
