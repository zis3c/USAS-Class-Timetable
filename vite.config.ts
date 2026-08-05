import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          jspdf: ['jspdf'],
          canvas: ['html2canvas'],
          icons: ['lucide-react'],
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
