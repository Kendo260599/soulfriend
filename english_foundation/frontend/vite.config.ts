import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5179,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
