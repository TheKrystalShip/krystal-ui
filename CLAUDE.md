# CLAUDE.md

`tks-krystal` is the design system every TheKrystalShip web surface is built from, as two packages in
one npm workspace: `@thekrystalship/krystal` (`packages/krystal`: tokens, themes, fonts, components,
hooks and stores) and `@thekrystalship/krystal-chat` (`packages/krystal-chat`: the assistant chat, the
assistant's pages and `createAssistantClient`). Sites consume them as versioned packages and never by
relative path. `README.md` covers using them. What the repository owns and who consumes it:
`../kgsm-docs/components/tks-krystal.md`; the system: `../kgsm-docs/systems/design-system/README.md` and
`../kgsm-docs/decisions/0046-design-system-is-a-versioned-package.md`.

## What belongs here

A component belongs in core when it describes **how something looks and behaves**, and nothing about
what any one site is for. The test is its imports and its words: it may import React, Lucide, Floating UI
(positioning only) and this package, and nothing else; and nothing in it names a server, a node, a film or a fleet.
Anything a site supplies comes in as a prop — a node for a header slot, an opaque `subject` a toast
row hands back through `onOpen`, the label a toolbar counts in.

When a site's component needs to come here and it reaches into that site's data layer, cut the edge
in the site first (take the value as a prop, split the module) and move the half that is only view.

**Core never imports the chat.** The chat package imports core through the package name only,
`@thekrystalship/krystal` and `@thekrystalship/krystal/lib/<module>`, never by relative path. What the
chat needs from core is a core export, listed in core's `src/index.js` and in the README's table. A
module belongs in the chat when it exists for the assistant (the chat, the assistant's pages, the
assistant client, the push calls that register with an assistant); a module a site uses without an
assistant stays in core, `AssistantFabIcon` (the dock's launcher mark) and `lib/sse` among them.

**The chat speaks a contract, and its words are that contract's.** `packages/krystal-chat/src/chat/` is a
client of the assistant wire contract (`../kgsm-docs/reference/assistant-wire-contract.md`), so the frame and field names that
contract defines — `proposal`, `question`, `done`, a stepping tool's `progress` — are what it reads. What a product makes of them is the product's: its cards, its verbs and their
verdicts arrive through `profile` and the render slots, never as a branch here.

## Styles

Plain CSS, no preprocessor. `packages/krystal/styles/tokens.css` is the source of truth for every token and every
theme; each other sheet in a package's `styles/` belongs to one component family and uses only tokens. The
rules of that file and of colour use (no literal colours, `--on-*` ink on a semantic fill, borders
through `--edge*`, radius through `--r-*`) are the ones `kgsm-web/src/styles/CLAUDE.md` sets out,
because that is where the tokens were first measured.

**A sheet's class names are its public interface**, as much as a component's props: a site restyles
a variant (`.k-rail--catalog .k-rail__track`) or places a component in its own layout by them.
Renaming one is a breaking change.

Every class carries one prefix, `k-`: a family is `k-<family>` with BEM elements and modifiers
(`k-rail__track`, `k-rail--catalog`), the chat's are `k-chat-*`, and a component's state is a
`k-is-*` class set beside its component class. No bare name (`hero`, `is-on`) is defined or emitted,
because a site's own classes share the document.

**Every sheet sits in a cascade layer.** `tokens.css` holds the palettes in `krystal.tokens` and the
document and element rules in `krystal.base`; the scrollbar and motion sheets are `krystal.base`;
every component sheet, the chat's included, is `krystal.components`. A sheet wraps all its rules in its
`@layer` block and opens with `@layer krystal.tokens, krystal.base, krystal.components;`, so it is
layered however it is imported (`@font-face` rules stay outside, a layer does not affect them). A
site's unlayered rules therefore win over the package without raising specificity.

Each package's `styles.css` imports its sheets in the order they assume. A site with its own cascade
imports `styles/<sheet>.css` individually at the position its rules need. `check:tokens` and
`check:contrast` read the sheets through the layer blocks.

## Lint configs and the theme contract

Core ships `lint/eslint.js` and `lint/stylelint.js` (exported as `./eslint` and `./stylelint`, with
`eslint` and `stylelint` as optional peers), `theme-contract.json` and the `krystal-check-theme` bin
(`bin/`), which shares its palette reading and contrast measurement with `scripts/check-contrast.mjs`
through `tools/theme-css.js`. The contract's lists partition the base tokens of `tokens.css`: a token
added there is placed in one of them, and `check:contract` fails until it is. The lint configs are not
applied to this repository's own sources, where the raw elements are wrapped.

## Build and release

```bash
npm install       # at the root: links both packages into the workspace
npm run lint      # no-undef and Rules of Hooks are errors; everything else warns
npm run check:markdown   # the composer's highlighter emits every character exactly once
npm run check:themes     # native controls take the light scheme on exactly the light palettes
npm run check:tokens     # every var() resolves; no literal colour or radius outside tokens.css
npm run check:contrast   # every --on-* ink reads on its fill at 4.5:1 in every palette
npm run check:contract   # theme-contract.json describes tokens.css and every built-in palette
npm run check:palettes   # krystal-check-theme over the package's own tokens.css
npm run check:types      # builds core, then tsc --checkJs over both packages, no emit
npm run build     # core, then the chat: vite library build → packages/*/dist (one ES module per source file), then tsc emits one .d.ts beside each
npm run play -- --port 5211   # the playground, both packages resolved to their sources
npm publish -w @thekrystalship/krystal   # prepack builds; a published version is permanent (a re-publish is refused)
npm publish -w @thekrystalship/krystal-chat   # after core: its peer names core's version
npm publish -w <package> --tag dev   # a prerelease — npm refuses one without a tag, so `latest` stays a release
```

Sources stay `.jsx` and `.js`. The types are JSDoc: every exported component documents its props as a
`@typedef` (the component's own props, intersected with the native element's attributes when it
spreads `...rest` onto one), every hook and function its arguments and result, and a store its state
through `@template`. Each package's `tsconfig.json` runs with `strict` off; `tsc` emits only
declarations, so the build runs vite first (its `emptyOutDir` would otherwise remove them). The chat's
`tsc` reads core's types from core's built `dist`, which is why core builds first.

React, React DOM and `lucide-react` are externals and peer dependencies of both packages;
`@floating-ui/react-dom` is an external and a regular dependency of core, resolved by the site's
bundler. The chat's externals also include `@thekrystalship/krystal` and its subpaths, and it declares
core as a peer dependency at its own exact version, so a site installs both and holds one copy of core.
Each `package.json`'s `sideEffects` names the modules that do something on load — core's `lib/theme.js`
applies the stored theme to the document, `lib/toasts.js` reads its history — so a bundler never drops
them, and keeps dropping everything else a site does not use.

## Version tracking

- **Version source:** the `"version"` field in both `packages/*/package.json`, always equal; the chat's
  peer on core carries the same version.
- Every change a consumer can see bumps it, with a `CHANGELOG.md` entry, in the same commit; the
  commit that bumps it is tagged `v<version>`. One `CHANGELOG.md` at the root covers both packages.
- Iterate with prerelease versions (`-dev.N`). Shipping a change is: bump → publish → bump each
  consumer's pin.
