import { defineConfig } from "@playwright/test";
import { PORT, ORIGIN } from "./playground.js";

// The browser suites: axe over every playground section (test/a11y) and the committed screenshots of
// them (test/visual). Both drive the playground's own dev server, which this starts and stops.
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.js/,
  outputDir: "../node_modules/.cache/playwright-results",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 300_000,
  // One baseline set, kept beside the specs and named <palette>-<width>-<section>.png. The pixels are
  // this machine's, so the set is refreshed with \`npm run test:visual -- --update\` and is not run in CI.
  snapshotPathTemplate: "{testDir}/visual/__screenshots__/{arg}{ext}",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css", maxDiffPixelRatio: 0.001 } },
  use: { baseURL: ORIGIN, browserName: "chromium", reducedMotion: "reduce", colorScheme: "dark" },
  webServer: {
    command: "npx vite playground --port " + PORT + " --strictPort",
    cwd: "..",
    url: ORIGIN,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
