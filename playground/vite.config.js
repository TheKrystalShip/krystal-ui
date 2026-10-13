import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The playground's dev server; the library build is ../vite.config.js.
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", fs: { allow: [".."] } },
});
