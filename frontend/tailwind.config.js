import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from 'autoprefixer';
// Import the correct package for PostCSS
import tailwindcssPostcss from '@tailwindcss/postcss';

// https://vite.dev/config/
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
        tailwindcssPostcss,  // Use the PostCSS-specific package
        autoprefixer,
      ],
    },
  },
});