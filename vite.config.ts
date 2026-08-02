import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/usas/, ''),
      },
    },
  },
});
