# CLAUDE.md

`krystal-ui` is the design system every TheKrystalShip web surface is built from: React components,
the stores they read, and the stylesheets that draw them, consumed as the versioned package
`@thekrystalship/krystal-ui` and never by relative path. `README.md` covers using it. What it owns and
who consumes it: `../kgsm-docs/components/krystal-ui.md`; the system:
`../kgsm-docs/systems/design-system/README.md` and
`../kgsm-docs/decisions/0046-design-system-is-a-versioned-package.md`.

## What belongs here

A component belongs here when it describes **how something looks and behaves**, and nothing about
what any one site is for. The test is its imports and its words: it may import React, Lucide, Floating UI
(positioning only) and this package, and nothing else; and nothing in it names a server, a node, a film or a fleet.
Anything a site supplies comes in as a prop — a node for a header slot, an opaque `subject` a toast
row hands back through `onOpen`, the label a toolbar counts in.

When a site's component needs to come here and it reaches into that site's data layer, cut the edge
in the site first (take the value as a prop, split the module) and move the half that is only view.

**The chat speaks a contract, and its words are that contract's.** `src/chat/` is a client of the
assistant wire contract (`../kgsm-docs/reference/assistant-wire-contract.md`), so the frame and field names that
contract defines — `proposal`, `question`, `done`, a stepping tool's `progress` — are what it reads. What a product makes of them is the product's: its cards, its verbs and their
verdicts arrive through `profile` and the render slots, never as a branch here.

## Styles

Plain CSS, no preprocessor. `styles/tokens.css` is the source of truth for every token and every
theme; each other sheet in `styles/` belongs to one component family and uses only tokens. The
rules of that file and of colour use (no literal colours, `--on-*` ink on a semantic fill, borders
through `--edge*`, radius through `--r-*`) are the ones `kgsm-web/src/styles/CLAUDE.md` sets out,
because that is where the tokens were first measured.

**A sheet's class names are its public interface**, as much as a component's props: a site restyles
a variant (`.rail--catalog .rail__track`) or places a component in its own layout by them.
Renaming one is a breaking change.

`styles.css` imports every sheet in the order they assume. A site with its own cascade imports
`styles/<sheet>.css` individually at the position its rules need.

## Build and release

```bash
npm install
npm run lint      # no-undef and Rules of Hooks are errors; everything else warns
npm run check:markdown   # the composer's highlighter emits every character exactly once
npm run check:themes     # native controls take the light scheme on exactly the light palettes
npm run build     # vite library build → dist/, one ES module per source file
npm publish       # prepack builds; a published version is permanent (a re-publish is refused)
npm publish --tag dev   # a prerelease — npm refuses one without a tag, so `latest` stays a release
```

React, React DOM and `lucide-react` are externals and peer dependencies; `@floating-ui/react-dom` is an
external and a regular dependency, resolved by the site's bundler. `package.json`'s
`sideEffects` names the modules that do something on load — `lib/theme.js` applies the stored theme
to the document, `lib/toasts.js` reads its history — so a bundler never drops them, and keeps
dropping everything else a site does not use.

## Version tracking

- **Version source:** the `"version"` field in `package.json`.
- Every change a consumer can see bumps it, with a `CHANGELOG.md` entry, in the same commit; the
  commit that bumps it is tagged `v<version>`.
- Iterate with prerelease versions (`-dev.N`). Shipping a change is: bump → publish → bump each
  consumer's pin.
