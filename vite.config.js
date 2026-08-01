import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/usas': {
        target: 'https://mobile.usas.edu.my/umc_v2',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/usas/, '')
      }
    }
  }
});
