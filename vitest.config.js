import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const pkg = (path) => fileURLToPath(new URL("./packages/" + path, import.meta.url));

// Behaviour tests for both packages, resolved to their sources as the playground does. Tests live in
// each package's test/ directory, outside the src/ that builds and type-checks.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@thekrystalship\/krystal\/lib\/(.*)$/, replacement: pkg("krystal/src/lib/$1.js") },
      { find: /^@thekrystalship\/krystal\/(styles.*|fonts.*|assets.*)$/, replacement: pkg("krystal/$1") },
      { find: /^@thekrystalship\/krystal$/, replacement: pkg("krystal/src/index.js") },
      { find: /^@thekrystalship\/krystal-chat\/lib\/(.*)$/, replacement: pkg("krystal-chat/src/lib/$1.js") },
      { find: /^@thekrystalship\/krystal-chat$/, replacement: pkg("krystal-chat/src/index.js") },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["packages/*/test/**/*.test.{js,jsx}"],
    setupFiles: ["test/setup.js"],
    css: false,
    execArgv: ["--no-experimental-webstorage"],
  },
});
