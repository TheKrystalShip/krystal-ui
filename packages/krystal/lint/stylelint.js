// stylelint.js — the Stylelint config a site extends to keep its sheets inside the system. Built-in
// rules only.
//
//   // stylelint.config.js
//   export default { extends: ["@thekrystalship/krystal/stylelint"] };
//
// Findings are warnings. A site raises them to errors with `defaultSeverity: "error"` in its own
// config, or per rule.
//
// What it reads: no literal colour (hex, rgb(), hsl() and the other colour functions, named colours),
// except transparent, currentColor and the CSS-wide keywords, and neutral black or white in shadows,
// filters and masks; a border-radius that is var(--r-sm), var(--r-pill), 0, 50%, 100% or inherit; a four-sided
// `border` shorthand that is var(--edge*), none, 0 or transparent. A one-sided hairline
// (`border-top: 1px solid var(--border-subtle)`) is legitimate and looks the same as a surface
// outline to a syntactic rule, so which borders are surface outlines is left to review.
//
// A selector that names a `.k-` class is the package's, and a site styles its own `className`: it
// chooses a variant or a prop, sets a token, or puts its own class on the element. The package's own
// sheets, which are made of those classes, are exempt.

const NO_COLOUR_SCOPE = "/^(?!(?:box|text)-shadow$|filter$|(?:-webkit-)?mask)/";
const RADIUS_PART = String.raw`(?:0|50%|100%|inherit|var\(\s*--r-(?:sm|pill)\s*\))`;
const RADIUS_LIST = String.raw`${RADIUS_PART}(?:\s+${RADIUS_PART}){0,3}`;

export default {
  defaultSeverity: "warning",
  overrides: [
    { files: ["**/krystal/styles/**/*.css", "**/krystal-chat/styles/**/*.css"], rules: { "selector-disallowed-list": null } },
  ],
  rules: {
    "selector-disallowed-list": [[String.raw`/\.k-[\w-]/`], { message: "A site styles its own className, and reaches the package through props, variants and tokens, not through its `.k-` classes." }],
    "color-no-hex": true,
    "color-named": ["never", { ignore: ["inside-function"], ignoreProperties: ["/^(?:box|text)-shadow$/", "filter", "/mask/"] }],
    "declaration-property-value-disallowed-list": {
      [NO_COLOUR_SCOPE]: [String.raw`/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i`],
    },
    "declaration-property-value-allowed-list": {
      "/^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/": [
        `/^${RADIUS_LIST}(?:\\s*\\/\\s*${RADIUS_LIST})?$/`,
      ],
      border: [String.raw`/^(?:none|0|var\(\s*--edge[\w-]*\s*\)|.*\btransparent\b.*)$/`],
    },
  },
};
