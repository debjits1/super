import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  build: {
    copyPublicDir: true,
  },
  publicDir: 'resources',
});