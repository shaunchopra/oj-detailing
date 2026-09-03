import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  server: {
    port: 8080,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});