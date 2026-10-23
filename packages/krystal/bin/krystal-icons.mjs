#!/usr/bin/env node
// krystal-icons — writes a site's fixed artwork from its identity: the icons a browser and a home
// screen take, the iOS launch images, and the Android app's launcher icon.
//
//   krystal-icons [identity.js]        (needs rsvg-convert; run by hand when the mark or a palette changes)
//
// The identity module (default `./identity.js`) imports the site's theme configuration and exports
// as its default `{ mark, palettes, public?, android?, androidPalettes? }`: the glyph's paths, the
// site's own palette sheets, the directory the web artwork goes to (`public`), the Android app's `res/`
// directory, all relative to the module, and whether the app's launcher icon follows the palette its
// page shows (an icon per palette, which the TKS shell switches between). Everything is drawn in the palette a person with no stored preference
// sees (`fixedPalette`); the page's own icon and splash follow the theme it shows (`siteIdentity`).
// The output is committed, and nothing in a build runs this: a build must not depend on a system
// package that only this task needs.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { themeConfig } from "../dist/lib/theme.js";
import { LAUNCH_SIZES, STROKE, androidPathData, fixedPalette, launchImage, markSvg, paletteColours } from "../tools/identity.js";

const arg = process.argv[2];
if (arg === "-h" || arg === "--help") {
  console.error("usage: krystal-icons [identity.js]");
  process.exit(0);
}
const file = resolve(arg ?? "identity.js");
const here = dirname(file);
const { default: identity } = await import(pathToFileURL(file).href);
const { mark, palettes = [], public: web = "public", android } = identity;
if (!Array.isArray(mark) || !mark.length) throw new Error(`${file} exports no mark`);

const palette = fixedPalette(themeConfig());
const { colours, skipped } = paletteColours(palettes.map((p) => resolve(here, p)));
const c = colours[palette];
if (!c) throw new Error(`no colours for the palette ${palette}${skipped.length ? ` (${skipped.join("; ")})` : ""}`);

const out = resolve(here, web);
const TMP = resolve(out, ".krystal-icons.svg");
function render(svg, w, h, to) {
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(TMP, svg);
  execFileSync("rsvg-convert", ["-w", String(w), "-h", String(h), TMP, "-o", to]);
}
const icon = (name) => resolve(out, "icons", name);
const MARK = markSvg(mark, c);

// The favicon is the vector, and the 32px PNG is for a browser that takes none.
mkdirSync(resolve(out, "icons"), { recursive: true });
writeFileSync(icon("icon.svg"), MARK + "\n");
render(MARK, 32, 32, icon("icon-32.png"));
// `any`, and Safari's home-screen icons.
for (const px of [192, 512]) render(MARK, px, px, icon(`icon-${px}.png`));
for (const px of [152, 167, 180]) render(MARK, px, px, icon(`apple-touch-icon-${px}.png`));
// `maskable`: the tile is a flat fill, so it survives any crop a launcher makes, and the glyph sits well
// inside the 80% safe circle, so the maskable icon is the same drawing.
render(MARK, 512, 512, icon("icon-maskable-512.png"));

// The launch images: the canvas with the tile centred at 90 points, the size the page's splash draws.
const tile = Buffer.from(MARK).toString("base64");
for (const size of LAUNCH_SIZES) {
  const [w, h, s] = [size[0] * size[2], size[1] * size[2], 90 * size[2]];
  render(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<rect width="${w}" height="${h}" fill="${c.canvas}"/>`
    + `<image x="${(w - s) / 2}" y="${(h - s) / 2}" width="${s}" height="${s}" xlink:href="data:image/svg+xml;base64,${tile}"/></svg>`,
    w, h, resolve(out, "splash", launchImage(size)));
}
rmSync(TMP, { force: true });
console.log(`wrote the icons and ${LAUNCH_SIZES.length} launch images to ${out}, in ${palette}`);

if (android) {
  const res = resolve(here, android);
  const argb = (hex) => "#FF" + hex.slice(1);
  // The glyph on an adaptive icon's 108dp layer, 33dp across: near its share of the web's tile, of the
  // 72dp a launcher shows, and well inside the middle two thirds every launcher keeps.
  const scale = 33 / 24;
  const offset = 54 - 12 * scale;
  const write = (rel, text) => {
    mkdirSync(dirname(resolve(res, rel)), { recursive: true });
    writeFileSync(resolve(res, rel), text);
  };
  const foreground = (ink, of) => {
    const paths = mark.map((p) => {
      const d = androidPathData(typeof p === "string" ? p : p.d);
      const fill = typeof p === "object" && p.fill ? ` android:fillColor="${argb(ink)}"` : "";
      return `    <path${fill} android:strokeColor="${argb(ink)}" android:strokeWidth="${STROKE}" android:strokeLineCap="round" android:strokeLineJoin="round"\n        android:pathData="${d}" />`;
    }).join("\n");
    return `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by krystal-icons from the site's identity: its glyph in the accent of ${of}. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <group android:scaleX="${+scale.toFixed(4)}" android:scaleY="${+scale.toFixed(4)}" android:translateX="${+offset.toFixed(4)}" android:translateY="${+offset.toFixed(4)}">
${paths}
  </group>
</vector>
`;
  };
  const adaptive = (suffix) => `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by krystal-icons: a launcher icon, and the splash Android draws from it while the app
     starts; the glyph alone is the themed icon Android draws in the person's colours. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/icon_background${suffix}" />
  <foreground android:drawable="@drawable/icon_foreground${suffix}" />
  <monochrome android:drawable="@drawable/icon_foreground${suffix}" />
</adaptive-icon>
`;
  write("drawable/icon_foreground.xml", foreground(c.ink, palette));
  write("values/colors.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!-- Written by krystal-icons: the accent's tint over the canvas of ${palette}, the ground of the icon,
       of the splash Android draws from it and of the window the site opens into. -->
  <color name="icon_background">${argb(c.ground)}</color>
</resources>
`);
  write("mipmap-anydpi/icon.xml", adaptive(""));

  // With `androidPalettes`, an icon per palette the site offers as well, `icon_<palette>`, which the
  // TKS shell makes a launcher entry each and switches to the palette the page shows; `icon_default`
  // names the one a fresh install shows. Without it, none, and a run removes any an earlier one wrote.
  const entry = (id) => id.replace(/-/g, "_");
  for (const [dir, pattern] of [["mipmap-anydpi", /^icon_[a-z0-9_]+\.xml$/], ["drawable", /^icon_foreground_[a-z0-9_]+\.xml$/], ["values", /^icon_palettes\.xml$/]]) {
    if (!existsSync(resolve(res, dir))) continue;
    for (const f of readdirSync(resolve(res, dir))) if (pattern.test(f)) rmSync(resolve(res, dir, f));
  }
  if (identity.androidPalettes) {
    const ids = themeConfig().ids.filter((id) => colours[id]);
    for (const id of ids) {
      write(`drawable/icon_foreground_${entry(id)}.xml`, foreground(colours[id].ink, id));
      write(`mipmap-anydpi/icon_${entry(id)}.xml`, adaptive("_" + entry(id)));
    }
    write("values/icon_palettes.xml", `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by krystal-icons: each palette's icon ground, and the palette a fresh install's icon is in. -->
<resources>
  <string name="icon_default" translatable="false">${entry(palette)}</string>
${ids.map((id) => `  <color name="icon_background_${entry(id)}">${argb(colours[id].ground)}</color>`).join("\n")}
</resources>
`);
    console.log(`wrote the launcher icon and one for each of ${ids.length} palettes to ${res}`);
  } else {
    console.log(`wrote the launcher icon to ${res}`);
  }
}
