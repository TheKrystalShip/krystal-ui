// The visual regression run: playwright's, with `--update` as the way to rewrite the baselines.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2).map((a) => (a === "--update" ? "--update-snapshots" : a));
const run = spawnSync("npx", ["playwright", "test", "--config", "test/playwright.config.js", "test/visual", ...args], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
