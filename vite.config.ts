import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version: string };
// Prefer the CI commit, fall back to the local git SHA so the console banner
// always points at a build a user can trace back to GitHub.
const buildCommit = (() => {
  const ci = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || process.env.VITE_GIT_COMMIT;
  if (ci) return ci.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
})();
const appVersion = buildCommit ? `${pkg.version}+${buildCommit}` : pkg.version;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['usas-logo.png', 'usas-logo-dark.png', 'usas-logo-light.png', 'seo-preview.svg', 'manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/api)/],
      },
      manifest: {
        name: 'USAS Class Timetable',
        short_name: 'USAS Timetable',
        description: 'An unofficial, independent student timetable portal by STEM USAS. Not affiliated with Universiti Sultan Azlan Shah.',
        theme_color: '#070F22',
        background_color: '#070F22',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/usas-logo-dark.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/usas-logo-dark.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  experimental: {
    bundledDev: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'jspdf';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'canvas';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/usas': {
        target: 'https://mobile.usas.edu.my/umc_v2',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/usas/, ''),
      },
    },
  },
});
