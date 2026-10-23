// vite.js — the Vite plugin that serves a site its notifications worker script.
//
// `notificationsWorker()` makes `sw/notifications.js` the site's `/krystal-notifications.js`: served
// by the dev server, and emitted at the build root, for the site's classic `sw.js` to
// `importScripts`. It is Node-only and depends on nothing, vite included.
//
//   // vite.config.js
//   import { notificationsWorker } from "@thekrystalship/krystal/vite";
//   export default defineConfig({ plugins: [react(), notificationsWorker()] });

import { readFileSync } from "node:fs";

const FILE_NAME = "krystal-notifications.js";

/** @returns {import("vite").Plugin} */
function notificationsWorker() {
  const source = () => readFileSync(new URL("./sw/notifications.js", import.meta.url), "utf8");
  return {
    name: "krystal-notifications-worker",
    configureServer(server) {
      server.middlewares.use("/" + FILE_NAME, (_req, res) => {
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(source());
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: FILE_NAME, source: source() });
    },
  };
}

export { notificationsWorker };
export default notificationsWorker;
