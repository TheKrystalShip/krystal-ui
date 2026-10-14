// check-tokens.mjs — the sheets under each package's styles/ keep to the token contract:
//
//   - every var(--x) names a custom property some sheet (or a component, through a style prop)
//     defines. A fallback does not excuse it: it hides a missing token on every theme, which is the
//     failure this check exists to surface. The one exception is a --k-* property, the
//     caller-supplied knob a component documents and defaults through its fallback.
//   - a component sheet holds no literal colour. The palettes live in tokens.css; everywhere else a
//     colour is a var(--*) or a color-mix() over one.
//   - a component sheet holds no literal border-radius. A radius is var(--r-*), 0, 50%, 100% or
//     inherit, so a theme's corner geometry reaches every corner.
//
// Colours the rules above allow, by kind and never by inline marker:
//   - transparent, currentColor and the CSS-wide keywords;
//   - url(...) values, which carry SVG data URIs;
//   - neutral black or white at an alpha inside box-shadow, text-shadow and filter values: a shadow
//     is dark in every theme;
//   - any colour in a mask: only its alpha is read;
//   - black or white as a color-mix() operand: a shade of a token, not a colour of its own.
//
//   npm run check:tokens
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packages = ["packages/krystal", "packages/krystal-chat"];
const sheets = packages.flatMap((pkg) => [
  pkg + "/styles.css",
  ...readdirSync(join(root, pkg, "styles"))
    .filter((f) => f.endsWith(".css"))
    .sort()
    .map((f) => pkg + "/styles/" + f),
]);

// Blank out comments and string/url contents, keeping offsets and newlines so line numbers hold.
function mask(text) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\)/g, blank);
}

// Colours the rules allow, blanked so the colour scan never sees them.
function allowColours(text) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return text
    .replace(/(?<![\w-])(?:box-shadow|text-shadow|(?:-webkit-)?filter|(?:-webkit-)?backdrop-filter)\s*:[^;{}]*/g, (decl) =>
      decl.replace(/rgba\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*,[^)]*\)/g, blank),
    )
    .replace(/(?<![\w-])(?:-webkit-)?mask(?:-image)?\s*:[^;{}]*/g, blank)
    .replace(/color-mix\([^;{}]*/g, (mix) => mix.replace(/(,\s*)(#fff(?:fff)?|#000(?:000)?|black|white)(?![\w-])/gi, (m, comma) => comma + blank(m.slice(comma.length))));
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

const NAMED = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown " +
    "burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid " +
    "darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro " +
    "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
    "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
    "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise " +
    "mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab " +
    "orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru " +
    "pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan " +
    "teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

const files = sheets.map((path) => {
  const raw = readFileSync(join(root, path), "utf8");
  return { path, text: mask(raw) };
});

// Definitions: every `--name:` declaration in a sheet, and every "--name" string the components set
// through a style prop or setProperty.
const defined = new Set();
for (const { text } of files) for (const m of text.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(jsx?|mjs)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}
for (const file of packages.flatMap((pkg) => walk(join(root, pkg, "src")))) {
  for (const m of readFileSync(file, "utf8").matchAll(/["'`](--[\w-]+)["'`]\s*:|setProperty\(\s*["'`](--[\w-]+)/g)) {
    defined.add(m[1] ?? m[2]);
  }
}

const problems = [];
const report = (path, text, index, message) => problems.push(`${path}:${lineOf(text, index)}: ${message}`);

for (const { path, text } of files) {
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
    if (!defined.has(m[1]) && !(m[1].startsWith("--k-") && /^var\(\s*--[\w-]+\s*,/.test(text.slice(m.index, m.index + 80)))) report(path, text, m.index, `var(${m[1]}) names a custom property nothing defines`);
  }
  if (path === "packages/krystal/styles/tokens.css") continue;
  const colourText = allowColours(text);

  for (const m of colourText.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) report(path, text, m.index, `literal colour ${m[0]}`);
  for (const m of colourText.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g)) {
    report(path, text, m.index, `literal colour ${m[0]}…)`);
  }
  // Colour keywords count only where a colour is the value: after a colon or inside a gradient or
  // color-mix argument list, so selectors, class names and animation names never match.
  for (const decl of colourText.matchAll(/([\w-]+)\s*:([^;{}]*)/g)) {
    const [, prop, value] = decl;
    if (/^(?:animation(?:-name)?|font(?:-family)?|content|grid-area|grid-template-areas|will-change|view-transition-name)$/.test(prop)) continue;
    if (prop.startsWith("--") && !/(?:^|-)(?:color|colour|fg|bg|ink|fill)$|^--(?:c|clr)-?/.test(prop)) continue;
    const base = decl.index + decl[0].indexOf(":") + 1;
    for (const w of value.matchAll(/(?<![\w-])([a-zA-Z]+)(?![\w-]|\()/g)) {
      if (NAMED.has(w[1].toLowerCase())) report(path, text, base + w.index, `named colour ${w[1]}`);
    }
  }
  const radiusOk = (part) => part === "0" || part === "50%" || part === "100%" || part === "inherit" || /^var\(\s*--r-[\w-]+\s*\)$/.test(part);
  for (const m of text.matchAll(/(?<![\w-])border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\s*:([^;}]*)/g)) {
    const radius = m[1].replace(/!important/, "").trim();
    if (!radius.split(/[\s/]+/).every(radiusOk)) report(path, text, m.index, `literal border-radius: ${radius}`);
  }
}

if (problems.length) {
  for (const p of problems) console.error("✗ " + p);
  console.error(`\n${problems.length} token violation${problems.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`✓ ${files.length} sheets: every var() resolves, no literal colour or radius outside tokens.css`);
