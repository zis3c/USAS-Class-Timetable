# USAS Class Timetable Installation Guide

Welcome to the detailed installation guide for the **USAS Class Timetable** portal, developed by the USAS STEM Club. This document will walk you through setting up the project for both **local development** and **production deployment**.

---

## Prerequisites

Before you begin, ensure your system meets the following requirements:

### Frontend Environment
* **Node.js**: `v18.x` or higher (v20+ recommended)
* **NPM**: `v9.x` or higher (or `pnpm` / `yarn`)
* **Modern Web Browser**: Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge.

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

### 3. Environment Configuration (Optional)
Create an optional `.env` file in the project root if configuring custom Cloudflare Turnstile keys:
```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### 4. Start Development Server
Launch the Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server. |
| `npm run build` | Compiles and optimizes assets into `dist/` for production. |
| `npm run preview` | Previews the production bundle locally. |
| `npm run typecheck` | Executes TypeScript type checking without emitting files. |
| `npm run test:unit` | Executes all unit test suites using Vitest. |
| `npm run test:e2e` | Executes Playwright end-to-end browser integration tests. |
| `npm run test:strict` | Runs linter, typecheck, unit tests, and production build in sequence. |

---

## Production Deployment

The build output consists of static HTML, CSS, and JavaScript files generated in `dist/`.

### Building for Production
```bash
npm run build
```

### Deploying to Cloudflare Pages
1. Connect your repository in the Cloudflare Pages dashboard.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. The included `public/_headers` file will automatically configure Content Security Policy (CSP) and cache headers.

### Deploying to Vercel
1. Import the repository into Vercel.
2. Framework Preset: **Vite**.
3. Output Directory: `dist`.

### Deploying to Netlify
1. Connect the repository in Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
