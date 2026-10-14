# Migrating a site to tks-krystal

A site moves from `@thekrystalship/krystal-ui` onto `@thekrystalship/krystal` and
`@thekrystalship/krystal-chat` in one pass. Five things change together: the dependencies, the import
paths, every class name (each carries the `k-` prefix), the cascade (the package's sheets sit in layers)
and the lint configs (the package ships them). The pass is finished when the site builds, searches clean
of the old names, and looks the same in the browser at phone and desktop width.

## 1. Dependencies

Remove `@thekrystalship/krystal-ui`. Add both packages at one exact version, because the chat takes core
as a peer dependency at its own version and the site must hold one copy of core:

```json
{
  "dependencies": {
    "@thekrystalship/krystal": "<version>",
    "@thekrystalship/krystal-chat": "<version>"
  }
}
```

A site with no assistant adds core alone. React, React DOM and `lucide-react` stay the site's own
copies; the packages declare them as peers. The registry scope line in `.npmrc` and the credential in
`~/.npmrc` (or `GITHUB_TOKEN` in CI) are the ones the old package used, so they stay.

## 2. The import split

Everything the chat package's `index.js` exports imports from `@thekrystalship/krystal-chat`: `Chat`,
`ChatCard` and its rows, the chat's parts and conversation functions, `createAssistantClient`,
`useConversationStream`, `MarkdownTextarea`, `renderMarkdown`, the assistant's pages
(`AssistantChatsPage`, `AssistantMemoryPage`, `AssistantSkillsPage`, `AssistantNotifications`,
`AssistantMemory`, `AssistantMemoryEditor`) and the push calls (`assistantPushStatus`,
`assistantPushSubscribe`, `assistantPushUnsubscribe`). Everything else imports from
`@thekrystalship/krystal`.

```js
// before
import { Button, Toasts, Chat, createAssistantClient } from "@thekrystalship/krystal-ui";

// after
import { Button, Toasts } from "@thekrystalship/krystal";
import { Chat, createAssistantClient } from "@thekrystalship/krystal-chat";
```

A module imported by path keeps its name under the package that holds it:
`@thekrystalship/krystal/lib/time`, `@thekrystalship/krystal-chat/lib/assistantClient`. The chat's own
code imports core by package name only, so a site never reaches into either package by relative path.

The stylesheets split the same way. A site imports each package's `styles.css`:

```js
import "@thekrystalship/krystal/styles.css";
import "@thekrystalship/krystal-chat/styles.css";   // only with the chat
```

A site that places sheets one at a time (an entry that needs its own rules between the package's)
imports `@thekrystalship/krystal/styles/<sheet>.css` and `@thekrystalship/krystal-chat/styles/<sheet>.css`,
in the order `styles.css` lists them.

## 3. Class names: the codemod

`scripts/codemod-k-prefix.mjs` rewrites a site's selectors and class bindings to the new names from
`scripts/class-map.json`. It has no dependencies. Run it on a clean working tree, first without
`--write`:

```bash
node tks-krystal/scripts/codemod-k-prefix.mjs src
```

A dry run changes nothing. It prints, per file, how many class tokens it would rewrite, then what it
holds back. It rewrites CSS selectors, `className` and `class` bindings (and any binding named
`*Class`, `*ClassName`, `*Classes` or `*Cls`), the arguments of `classList` calls, the selector
arguments of `querySelector`, `querySelectorAll`, `closest` and `matches`, and `class=""` in HTML. It
never touches declarations, `@keyframes` names, custom properties or `url()`. A second run changes
nothing, because a class that already carries `k-` is never rewritten.

Read the report from the bottom up.

### The ambiguous list

```
mapped classes named by a stylesheet selector: 6; of those, emitted by the site's own markup (ambiguous): 6
ambiguous hits left unchanged: 42  (pass --assume-package <class,...|all> to rewrite)
  .is-on -> .k-is-on  (14)
      components/LeafCard.jsx:156
      styles/kit/hosts.css:84
```

A class is held when the site's CSS has a selector naming it and the site's own markup also emits it.
The package and the site may both own a class of that name, and only the site can say which this is.
Each held class lists every occurrence with its file and line. Decide per class by reading those lines:

- **The site's own class, by coincidence of name.** The selector sits beside a site class
  (`.kc-card.is-on`) and the markup puts the name on a site element. Leave it. This is the case for a
  site's own `.hero`, `.rail` or `.shelf` and for state classes the site styles on its own elements
  (`is-on`, `is-armed`, `is-pending`, `is-active`).
- **The package's class.** The selector sits beside a package block (`.toolbar-btn.is-on`), or the
  markup puts the name on a package component through `className`. Rewrite it.
- **Both.** The site restyles a package block and has its own element with the same state name. Rename
  the site's own element's class first (give it the site's prefix), then run again.

Pass the package's classes by name, or `all` when every held class is the package's:

```bash
node tks-krystal/scripts/codemod-k-prefix.mjs src --write --assume-package tabbar,subtab,app--tabbed
```

Everything held and not assumed stays untouched and stays in the report, so the list shrinks to the
classes that are the site's.

### What the report cannot decide

- **Site modifiers on package blocks.** A site's `rail--posters` or `rail__cell`, where `rail` is a
  block in the map, follows its block to `k-rail--posters` whether or not the map lists it, and the
  report counts these on their own line. When the block is held as ambiguous the modifier is held with
  it.
- **Dynamic class strings.** A fragment that ends a class token before a dynamic part
  (`"rail--" + x`, `` `rail--${x}` ``) is rewritten when every mapped class sharing that prefix agrees
  on the new prefix. The rest are listed as "fragments left to the site": a state prefix such as
  `"is-" + state`, or a fragment whose mapped classes do not agree on one new prefix. Each is fixed by
  hand, to the new name of every value the dynamic part takes.
- **Strings assembled out of sight.** A class built in a helper, a lookup table or a variable that is
  not a class binding is invisible to the codemod. The map renames some blocks outright instead of
  prefixing them (`gbtn` becomes `k-hero-btn`), so a string such as `"gbtn gbtn--" + tone` needs its
  modifier checked by hand. After the run, search the source for every old block name the map renames
  and for every `"<block>--"` and `"<block>__"` fragment, and fix what remains:

  ```bash
  grep -rnE "gbtn|\"[a-z-]+--\"|'[a-z-]+--'|`[a-z-]+--\\$\\{" src
  ```
- **Names written in comments.** `--comments` rewrites `.old` and backticked `old` in comments as well.

A class the site's CSS never names stays out of the ambiguous list and is rewritten without a decision:
the package draws it, and the site only emits it.

## 4. The cascade

Every package sheet declares `@layer krystal.tokens, krystal.base, krystal.components;` and wraps its
rules in one of them. A rule outside any layer beats every layered rule whatever its specificity, so a
site's own unlayered rules win over the package without raised specificity. Two kinds of site rule need
a layer of their own.

A reset belongs before the package's layers, so the package's document rules win over it:

```css
@layer site.reset, krystal.tokens, krystal.base, krystal.components;
```

A site's rules for the bare elements `a`, `button` and `body` belong between `krystal.base` and
`krystal.components`. In a layer before `krystal.base` they lose to the package's base rules (its link
colour, its focus ring), so an anchor-drawn `Button` or a card title turns the package's link colour. In
the unlayered sheet they win over the components too, and an element rule like `a { color: inherit }`
overrides `.k-btn--primary`. Between the two, the package's component classes beat the element rules and
the element rules beat the package's base:

```css
/* layers.css: imported before the package's sheets */
@layer site.reset, krystal.tokens, krystal.base, site.base, krystal.components;

@layer site.reset {
  html, body, #root { height: 100%; }
  body { margin: 0; }
}
@layer site.base {
  body { background: var(--canvas); color: var(--fg-1); font-family: var(--font-ui); }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }
}
```

Import `layers.css` first, then the package's `styles.css`, then the site's own sheets, which stay
unlayered. The first `@layer` statement fixes the order, and the sheets imported after it join it. A site
whose only element rules are a reset, with no `a`, `button` or `body` styling that must beat the base,
keeps the plain three-layer statement with `site.reset` in front.

## 5. The lint configs

Core ships an ESLint config and a Stylelint config. Both report warnings, so they land without blocking
the build, and a site raises them to errors once its sources are clean.

A site whose ESLint config sets its own `no-restricted-syntax` or `no-restricted-imports` merges the
package's entries, so one rule carries one severity of the site's choosing, instead of the later entry
replacing the package's:

```js
import krystal, { restrictedSyntax, restrictedImports } from "@thekrystalship/krystal/eslint";

export default [
  ...krystal.map((entry) => ({ ...entry, files: ["**/*.{js,jsx,mjs}"] })),   // scope it when the site has TypeScript
  {
    files: ["src/**/*.{js,jsx}"],
    rules: {
      "no-restricted-syntax": ["warn", ...mySelectors, ...restrictedSyntax],
      "no-restricted-imports": ["warn", {
        paths: [...myPaths, ...restrictedImports.paths],
        patterns: [...myPatterns, ...restrictedImports.patterns],
      }],
    },
  },
];
```

A site that keeps its own rule at `error` and wants the package's at `warn` runs the package's selectors
as a second instance of the core rule, under a plugin name of its own, so the two severities coexist.

Stylelint reads the package's config, and takes the same `stylelint` major its peer range names:

```js
// stylelint.config.js
export default { extends: ["@thekrystalship/krystal/stylelint"] };
```

```json
{ "scripts": { "lint:css": "stylelint \"src/**/*.css\"" } }
```

The first run reports what the site hand-rolled: raw `<button>`, `<input>` and `<select>` elements, literal
colours in inline styles and sheets, radii that skip `--r-*`, and borders that skip `--edge*`. Each is a
component or a token the package provides.

## 6. Themes

A site that registers palettes of its own keeps them. `registerThemes` and the palette contract
(`theme-contract.json`, checked by `krystal-check-theme`) are part of the package; the palette's tokens
and structure are the ones in the token reference.

## 7. Checking the result

1. The dry run of the codemod prints nothing it would rewrite, and what it still holds is the site's.
2. The old names are gone: no `krystal-ui` in `package.json`, imports or comments, and the search for
   renamed blocks above comes back empty.
3. The site builds, and `eslint` and `stylelint` run with the package's configs.
4. Every page looks the same at 390 and 1440 pixels wide as it did before, in a dark and a light theme.
   A page that differs shows a rule that lost or won in the wrong layer (section 4) or a class that kept
   an old name (section 3).
