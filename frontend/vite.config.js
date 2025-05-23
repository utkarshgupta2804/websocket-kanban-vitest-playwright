import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss'; // Correct package
import autoprefixer from 'autoprefixer';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
    open: true,
  },
  test: {
    mockReset: true,
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    exclude: ["node_modules", "src/tests/e2e"],
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss('./tailwind.config.js'), // Point to your config
        autoprefixer(),
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});