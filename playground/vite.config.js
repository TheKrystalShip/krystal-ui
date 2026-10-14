import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const pkg = (path) => fileURLToPath(new URL("../packages/" + path, import.meta.url));

// The playground's dev server; the library builds are packages/*/vite.config.js. Both packages
// resolve to their sources, so the playground runs without a build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@thekrystalship\/krystal\/lib\/(.*)$/, replacement: pkg("krystal/src/lib/$1.js") },
      { find: /^@thekrystalship\/krystal\/(styles.*|fonts.*|assets.*)$/, replacement: pkg("krystal/$1") },
      { find: /^@thekrystalship\/krystal$/, replacement: pkg("krystal/src/index.js") },
      { find: /^@thekrystalship\/krystal-chat\/lib\/(.*)$/, replacement: pkg("krystal-chat/src/lib/$1.js") },
      { find: /^@thekrystalship\/krystal-chat\/(styles.*)$/, replacement: pkg("krystal-chat/$1") },
      { find: /^@thekrystalship\/krystal-chat$/, replacement: pkg("krystal-chat/src/index.js") },
    ],
  },
  server: { host: "127.0.0.1", fs: { allow: [".."] } },
});
