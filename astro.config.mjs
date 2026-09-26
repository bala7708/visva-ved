// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    server: {
      fs: {
        // Lets the dev server send files from node_modules on Windows,
        // even when the capital letters in the folder path don't match exactly
        strict: false,
      },
    },
  },
});