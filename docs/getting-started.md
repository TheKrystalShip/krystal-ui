# Getting started

Two packages make up the system. `@thekrystalship/krystal` holds the tokens, themes, fonts, components, hooks and
stores; `@thekrystalship/krystal-chat` holds the assistant chat, the assistant's pages and
`createAssistantClient`, and builds on core. A site with no assistant installs core alone.

## Install

The package is published to GitHub Packages. A consuming repo maps the scope in its own `.npmrc`:

```
@thekrystalship:registry=https://npm.pkg.github.com
```

and a workstation holds the credential in `~/.npmrc` (`//npm.pkg.github.com/:_authToken=…`, a token
with `read:packages`; publishing needs `write:packages`). The registry asks for a token even to
install, so CI passes its `GITHUB_TOKEN` with `permissions: packages: read`.

```js
import "@thekrystalship/krystal/styles.css";        // tokens, fonts and every component's styles
import { BriefCard, Icon, Rail, Toasts, toast } from "@thekrystalship/krystal";
```

A site with an assistant chat installs the chat package beside core. It takes core as a peer
dependency at its own version, so the site has one copy of core:

```js
import "@thekrystalship/krystal-chat/styles.css";      // the chat's and the assistant pages' styles
import { Chat, createAssistantClient } from "@thekrystalship/krystal-chat";
```

React (18.3 or 19), React DOM and `lucide-react` are peer dependencies of both packages: the site's own copies are used. Core
depends on `@floating-ui/react-dom`, which places its popovers; a site never imports it.

Each package ships its own type declarations (`dist/**/*.d.ts`, named by the `types` condition of the
`.` and `./lib/*` exports), so an editor completes component names and checks props in plain
JavaScript too: each component's props, each hook's arguments and each store's state type are read from
the JSDoc beside the source.

The modules under core's `lib/` (`store`, `theme`, `toasts`, `time`, `clipboard`, `pushBrowser`, `notificationsClient`, `sse`, `spatialFocus`) are also
addressable one at a time — `@thekrystalship/krystal/lib/time` — for code that runs outside a
browser and must not load React.

## Class names and the cascade

Every class a sheet defines carries the prefix `k-`: `k-btn`, `k-rail__track`, `k-toast--error`. The
chat's carry `k-chat-` (`k-chat-turn`), and a component's state is a `k-is-` class
(`k-toolbar-btn.k-is-on`). A site's own `.hero` or `.rail` never meets the package's, and the names are
the interface a site restyles by, so `.k-rail--catalog .k-rail__track` is how a shelf changes its density.

The sheets sit in three cascade layers, ordered by the statement each sheet opens with:

```css
@layer krystal.tokens, krystal.base, krystal.components;
```

- `krystal.tokens`: the custom properties of every palette, in `tokens.css`.
- `krystal.base`: the rules that style the document and its elements: `html`, `body`, headings, links, the
  focus ring, native control schemes, scrollbars and the keyframes.
- `krystal.components`: every component sheet, the chat's included.

A rule outside any layer beats every layered rule whatever its specificity, so a site restyles a component
with an ordinary rule and never raises specificity to win. That holds for element rules too: a site's
unlayered `a { … }` or `button { … }` beats the package's class rules, so a site keeps its resets in a
layer ordered before the package's and its restyles outside any layer:

```css
@layer site.reset, krystal.tokens, krystal.base, krystal.components;

@import "@thekrystalship/krystal/styles.css";

@layer site.reset {
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
}

/* unlayered: wins over every krystal layer */
.k-toolbar { gap: 4px; }
:root[data-theme="dark"] { --canvas: #0b0d10; }
```

The first `@layer` statement fixes the order, and the package's sheets imported after it join those layers. A
site that places the package's sheets one at a time imports them from
`@thekrystalship/krystal/styles/` (and `@thekrystalship/krystal-chat/styles/`) where its own rules have
to sit; `styles.css` lists them in the order they assume. Each sheet repeats the order statement and
wraps its rules in its layer, so a sheet imported alone is layered too.

## Keeping a site inside the system

Core ships an ESLint config and a Stylelint config. Both are optional peers (`eslint` 9, `stylelint`
16): a site that installs neither pulls nothing in. Findings are warnings by default; a site whose code
is clean raises them to errors.

```js
// eslint.config.js
import krystal, { configs } from "@thekrystalship/krystal/eslint";
export default [
  ...krystal,                       // warnings; ...configs.strict for errors
  // the site's own entries
];
```

The ESLint rules are core's `no-restricted-syntax` and `no-restricted-imports`; a later entry of the
site's own config for either rule replaces these. A site that sets its own restrictions merges the
entries, which the config exports as `restrictedSyntax` (an array of `{ selector, message }`) and
`restrictedImports` (`{ paths, patterns }`), so the rule carries one severity of the site's choosing:

```js
import { restrictedSyntax, restrictedImports } from "@thekrystalship/krystal/eslint";
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...mySelectors, ...restrictedSyntax],
      "no-restricted-imports": ["error", {
        paths: [...myPaths, ...restrictedImports.paths],
        patterns: [...myPatterns, ...restrictedImports.patterns],
      }],
    },
  },
];
```

The entries report:

- a raw `<button>`, `<input>`, `<select>`, `<textarea>` or `<dialog>`, naming the component to use
  (Button or IconButton, with `variant="bare"` for a button the site's own class shapes; Input, Checkbox or Toggle; Select; Textarea; Dialog or Modal);
- a literal colour (hex, `rgb()`, `hsl()` and the other colour functions, a named colour) in the
  `color`, `background`, `backgroundColor`, `borderColor`, `fill` or `stroke` of an inline `style`;
- an import of `@floating-ui/*` or `react-hook-form`, which the package wraps.

```js
// stylelint.config.js
export default { extends: ["@thekrystalship/krystal/stylelint"] };   // defaultSeverity: "error" raises them
```

The Stylelint rules report a hex colour, a colour function or a named colour outside `transparent`,
`currentColor` and the CSS-wide keywords (neutral black and white stay allowed in `box-shadow`,
`text-shadow`, `filter` and masks, and a colour keyword inside a function such as `color-mix()`), a
`border-radius` that is not `var(--r-sm)`, `var(--r-pill)`, `0`, `50%`, `100%` or `inherit`, and a four-sided `border`
that is not `var(--edge*)`, `none`, `0` or transparent. Whether a one-sided hairline is a surface
outline is a judgement the rules cannot make, so `border-top: 1px solid var(--border-subtle)` is left
to review.

A selector that names a `.k-` class is reported too. A site styles its own `className`: it picks a
variant or a prop of the component, sets a token, or puts its own class on the element, and it does not
restyle the package's markup through the package's class names. The package's own sheets are exempt.

The package's own sources are where the raw elements are wrapped, so neither config applies to them.

## Adding a palette

A palette is a sheet with a `[data-theme="<id>"]` block, loaded after the package's `styles.css`. It
defines every colour token `theme-contract.json` lists as `required`, declares `color-scheme: light` or
`color-scheme: dark`, and may re-value the `optional` ink tokens (`--on-*`) and the `structural` set
(corner radius, edge, elevation, focus ring, UI font, motion). It cannot re-value anything else: the
type scale, spacing, layout metrics and sign-in brand colours are the same in every palette.

```css
[data-theme="harbour"] {
  color-scheme: dark;
  --canvas: #0f1720;
  /* … every required token … */
  --r-sm: 2px;                      /* structural, optional */
}
```

The site registers the palette with the theme store, before its first render, with an entry shaped
like those of `THEME_OPTS`:

```js
import { registerThemes } from "@thekrystalship/krystal";
registerThemes([{ id: "harbour", label: "Harbour", mode: "dark" }]);
```

The theme picker lists it, and a stored preference naming it takes effect. `mode` is the palette's own
light or dark character and matches the `color-scheme` its block declares.

A person with no stored preference gets Krystal Blue Dark, and `auto` follows the system between
Krystal Blue Light and Dark. A site names its own default and pair once, after registering the
palettes they name:

```js
import { configureThemes } from "@thekrystalship/krystal";
configureThemes({ default: "harbour", auto: { light: "harbour-day", dark: "harbour" } });
```

The stored theme, or that default, has to be on `<html>` before the first frame, so the page's head
starts with a script that sets it. `themeBootScript()` returns that script's source, written from the
list, the default and the pair as configured; a site writes it into a file at build time, from the
same registration its bundle runs, so the two never disagree.

`krystal-check-theme` reads the `[data-theme]` blocks of the sheets it is given and fails on a missing
required token, a token outside the permitted set, a missing `color-scheme`, and any `--on-*` ink under
4.5:1 on its fill. A token a block does not define resolves against the package's `tokens.css`, as it
does in the page.

```json
{ "scripts": { "check:theme": "krystal-check-theme src/styles/harbour.css" } }
```
