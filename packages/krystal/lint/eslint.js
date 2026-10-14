// eslint.js — the ESLint flat config a site spreads into its own eslint.config.js to stay inside the
// system. Core ESLint rules only, so a site installs no plugin for it.
//
//   import krystal from "@thekrystalship/krystal/eslint";
//   export default [...krystal, /* the site's own entries */];
//
// `configs.recommended` (the default export) reports each finding as a warning; `configs.strict`
// reports errors. The rules are `no-restricted-syntax` and `no-restricted-imports`, which a later
// entry of a site's own config for the same rule replaces rather than extends. A site that has
// restrictions of its own merges the entries themselves, at the severity it chooses:
//
//   import { restrictedSyntax, restrictedImports } from "@thekrystalship/krystal/eslint";
//   rules: {
//     "no-restricted-syntax": ["error", ...mine, ...restrictedSyntax],
//     "no-restricted-imports": ["error", {
//       paths: [...myPaths, ...restrictedImports.paths],
//       patterns: [...myPatterns, ...restrictedImports.patterns],
//     }],
//   }
//
// Not for the package's own sources: they are where the native elements are wrapped.

const COMPONENTS = [
  ["button", "Button or IconButton"],
  ["input", "Input, Checkbox or Toggle"],
  ["select", "Select"],
  ["textarea", "Textarea"],
  ["dialog", "Dialog or Modal"],
];

const COLOUR_PROPS = ["color", "background", "backgroundColor", "borderColor", "fill", "stroke"];

const NAMED_COLOURS =
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
  "teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen";

const LITERAL_COLOUR = `/^\\s*(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(.*|(?:${NAMED_COLOURS.split(" ").join("|")}))\\s*$/i`;
const COLOUR_KEY = `/^(?:${COLOUR_PROPS.join("|")})$/`;

export const restrictedSyntax = [
  ...COMPONENTS.map(([tag, use]) => ({
    selector: `JSXOpeningElement[name.type="JSXIdentifier"][name.name="${tag}"]`,
    message: `A raw <${tag}> where the package has ${use}: use the component so the control takes the theme.`,
  })),
  {
    selector:
      `JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > ` +
      `Property:matches([key.name=${COLOUR_KEY}], [key.value=${COLOUR_KEY}])[value.type="Literal"][value.value=${LITERAL_COLOUR}]`,
    message: "A literal colour in an inline style: use a token, var(--fg-1), var(--krystal-teal) and the rest, so every palette reaches it.",
  },
];

export const restrictedImports = {
  patterns: [
    {
      group: ["@floating-ui/*"],
      message: "The package wraps Floating UI (Popover, Tooltip, Select, Menu): use those instead of positioning by hand.",
    },
  ],
  paths: [
    {
      name: "react-hook-form",
      message: "The package wraps react-hook-form in its form components: use those instead of importing it.",
    },
  ],
};

const build = (severity) => [
  {
    name: "krystal/system",
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      "no-restricted-syntax": [severity, ...restrictedSyntax],
      "no-restricted-imports": [severity, restrictedImports],
    },
  },
];

export const configs = {
  recommended: build("warn"),
  strict: build("error"),
};

export default configs.recommended;
