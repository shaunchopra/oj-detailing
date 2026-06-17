import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    format: 'file',
  },
  server: {
    port: 8080,
  },
});
