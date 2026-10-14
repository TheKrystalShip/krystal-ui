import { readdirSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Every lib/ module is an entry of its own as well as the index: `./lib/*` is exported one module at a
// time, so each must be emitted whether or not the index reaches it.
const libEntries = readdirSync("src/lib").filter((f) => f.endsWith(".js")).map((f) => "src/lib/" + f);

// Library build: one ES module per source file (preserveModules), so a consumer's bundler
// tree-shakes per component and the side-effectful modules named in package.json stay the
// only ones it must keep. React, React DOM and Lucide are the consumer's own copies, and Floating UI is
// a dependency the consumer's bundler resolves.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: ["src/index.js", ...libEntries],
      formats: ["es"],
    },
    rollupOptions: {
      external: (id) => /^(react|react-dom|lucide-react|@floating-ui\/react-dom)(\/|$)/.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
});
