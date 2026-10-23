// vite.js — the Vite plugins a site builds with: its notifications worker script, and its identity.
// Node-only; neither depends on vite.
//
// `notificationsWorker()` makes `sw/notifications.js` the site's `/krystal-notifications.js`: served
// by the dev server, and emitted at the build root, for the site's classic `sw.js` to
// `importScripts`.
//
// `siteIdentity({ mark, palettes })` keeps the site's mark in its theme from the first frame:
// `krystal-boot.js`, the first element of every page's head, puts the theme on <html> and keeps the
// tab's icon, the browser's colour and the splash in that palette (`tools/identity.js`);
// `krystal-splash.css` and the splash's markup, the first thing in the body, draw the splash until the
// site lets it go (`lib/splash.js`); and the head links the fixed artwork the `krystal-icons` bin
// writes (`icons/`, `splash/`), so a page names none of it. Everything is addressed under the site's
// `base`. The theme configuration is read when the build starts, so the site's vite config imports
// the module that registers and configures its palettes first.
//
//   // vite.config.js
//   import { notificationsWorker, siteIdentity } from "@thekrystalship/krystal/vite";
//   import identity from "./identity.js";
//   export default defineConfig({ plugins: [react(), notificationsWorker(), siteIdentity(identity)] });

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { themeConfig } from "./dist/lib/theme.js";
import { artworkLinks, identityBootScript, paletteColours, splashMarkup } from "./tools/identity.js";

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

const BOOT = "krystal-boot.js";
const SPLASH = "krystal-splash.css";

/**
 * @param {object} options
 * @param {import("./tools/identity.js").MarkPath[]} options.mark The glyph's paths, in Lucide's 24-unit viewBox.
 * @param {string[]} [options.palettes] The site's own palette sheets, relative to the Vite root.
 * @param {boolean} [options.splash] Whether the pages carry the splash; they do unless this is false.
 * @returns {import("vite").Plugin}
 */
function siteIdentity({ mark, palettes = [], splash = true }) {
  if (!Array.isArray(mark) || !mark.length) throw new TypeError("siteIdentity: mark needs the glyph's paths");
  let base = "/";
  let files = null;
  const build = (root) => {
    const { colours, skipped } = paletteColours(palettes.map((p) => resolve(root, p)));
    const config = themeConfig();
    const missing = config.ids.filter((id) => !colours[id]);
    if (missing.length) {
      throw new Error(`siteIdentity: no mark colours for ${missing.join(", ")}${skipped.length ? ` (${skipped.join("; ")})` : ""}`);
    }
    return {
      [BOOT]: identityBootScript({ ...config, mark, colours }),
      [SPLASH]: readFileSync(new URL("./styles/splash.css", import.meta.url), "utf8"),
    };
  };
  return {
    name: "krystal-site-identity",
    configResolved(config) {
      base = config.base;
      files = build(config.root);
    },
    configureServer(server) {
      for (const [name, source] of Object.entries(files)) {
        server.middlewares.use(base + name, (_req, res) => {
          res.setHeader("Content-Type", name.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          res.end(source);
        });
      }
    },
    // After every other transform, so the boot script is still the head's first element and the
    // splash the body's first child.
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const tags = [{ tag: "script", attrs: { src: base + BOOT }, injectTo: "head-prepend" }];
        if (splash) tags.push({ tag: "link", attrs: { rel: "stylesheet", href: base + SPLASH }, injectTo: "head-prepend" });
        for (const attrs of artworkLinks(base)) tags.push({ tag: "link", attrs, injectTo: "head" });
        if (!splash) return tags;
        return { html: html.replace(/<body([^>]*)>/i, (m) => m + splashMarkup(mark)), tags };
      },
    },
    generateBundle() {
      for (const [name, source] of Object.entries(files)) this.emitFile({ type: "asset", fileName: name, source });
    },
  };
}

export { notificationsWorker, siteIdentity };
export default notificationsWorker;
