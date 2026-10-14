// ESLint flat config. Narrow on purpose, as in the sites that consume this package: undeclared
// identifiers and Rules-of-Hooks violations are errors, because the build passes both silently;
// everything else is a warning.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2023 },
    },
    plugins: { "react-hooks": reactHooks, react },
    settings: { react: { version: "18.3" } },
    rules: {
      "react/jsx-uses-vars": "error",
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true, varsIgnorePattern: "^_" }],
      // `catch {}` around storage and audio access is deliberate: a refused read is an empty answer.
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },

  {
    files: ["scripts/**/*.mjs", "packages/krystal/bin/**/*.mjs", "**/vite.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
