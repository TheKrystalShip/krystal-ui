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
  timeout: 180_000,
  use: { baseURL: ORIGIN, browserName: "chromium", reducedMotion: "reduce", colorScheme: "dark" },
  webServer: {
    command: "npx vite playground --port " + PORT + " --strictPort",
    cwd: "..",
    url: ORIGIN,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
