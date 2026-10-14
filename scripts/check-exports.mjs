// check-exports.mjs — after a build, every module a package's exports map promises exists: each
// fixed target is a file, and a wildcard target (`./lib/*`) has a built module and its declaration
// for every source module in the matching src/ directory. Every `@thekrystalship/krystal/...` import
// in the chat's build resolves to a module core ships.
//
//   npm run build && npm run check:exports
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../packages/", import.meta.url).pathname;
const problems = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]);
}

for (const pkg of ["krystal", "krystal-chat"]) {
  const dir = join(root, pkg);
  const { exports } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  for (const [key, target] of Object.entries(exports)) {
    const targets = typeof target === "string" ? [target] : Object.values(target);
    for (const t of targets) {
      if (!t.includes("*")) {
        if (!existsSync(join(dir, t))) problems.push(`${pkg} ${key}: ${t} does not exist`);
        continue;
      }
      // `./dist/lib/*.js` promises one module per source file in src/lib.
      const m = /^\.\/dist\/(.+)\/\*(\.d\.ts|\.js)$/.exec(t);
      if (!m) continue;
      const src = join(dir, "src", m[1]);
      if (!existsSync(src)) continue;
      for (const f of readdirSync(src).filter((f) => f.endsWith(".js"))) {
        const out = join(dir, "dist", m[1], f.replace(/\.js$/, m[2]));
        if (!existsSync(out)) problems.push(`${pkg} ${key}: ${out.slice(root.length)} is missing`);
      }
    }
  }
}

const core = join(root, "krystal");
for (const file of walk(join(root, "krystal-chat", "dist")).filter((f) => f.endsWith(".js"))) {
  for (const [, sub] of readFileSync(file, "utf8").matchAll(/from "@thekrystalship\/krystal\/([^"]+)"/g)) {
    const out = join(core, "dist", sub.endsWith(".js") ? sub : sub + ".js");
    if (!existsSync(out)) problems.push(`${file.slice(root.length)} imports @thekrystalship/krystal/${sub}, which core does not ship`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log("every exported module exists");
