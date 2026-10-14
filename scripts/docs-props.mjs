// docs-props.mjs — reads the public API of both packages through the TypeScript compiler and writes
// playground/generated/api.json, the data behind every props table in the playground documentation.
//
// Every export of each package's index.js is described from the JSDoc beside its source: a
// component's props (name, type, default, description), a hook's or function's arguments and result,
// and the header comment of the file it is declared in. A component's props are its own `@property`
// entries; the native element's attributes it intersects are summarised as the element's name and
// never listed. A default is the initializer the component's parameter destructuring gives the prop.
//
//   npm run docs:data
//   node scripts/docs-props.mjs --missing    lists the props that have no description
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = fileURLToPath(new URL("../playground/generated/api.json", import.meta.url));
const PACKAGES = {
  "@thekrystalship/krystal": "packages/krystal/src/index.js",
  "@thekrystalship/krystal-chat": "packages/krystal-chat/src/index.js",
};

const options = {
  allowJs: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  noEmit: true,
  skipLibCheck: true,
  strict: false,
  types: [],
  baseUrl: ROOT,
  paths: {
    "@thekrystalship/krystal": ["packages/krystal/src/index.js"],
    "@thekrystalship/krystal/lib/*": ["packages/krystal/src/lib/*.js"],
  },
};

const program = ts.createProgram(Object.values(PACKAGES).map((p) => ROOT + p), options);
const checker = program.getTypeChecker();
const FORMAT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const text = (parts) => ts.displayPartsToString(parts).replace(/\s*\n\s*/g, " ").trim();
const isNative = (symbol) => (symbol.declarations ?? []).every((d) => d.getSourceFile().fileName.includes("/node_modules/"));

/**
 * The header comment a file keeps for an export: of the file's `//` blocks of three lines or more, the
 * one that names the export most often, the earliest on a tie, without the slashes.
 */
function headerOf(source, name) {
  const lines = source.getFullText().split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("//") || (i > 0 && lines[i - 1].startsWith("//"))) continue;
    let j = i;
    while (j < lines.length && lines[j].startsWith("//")) j++;
    if (j - i >= 3 && !/^\/\/ (@ts|eslint)/.test(lines[i])) blocks.push(lines.slice(i, j).map((l) => l.replace(/^\/\/ ?/, "")).join("\n").trim());
  }
  const mentions = (block) => (block.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length;
  let best = blocks[0] ?? "";
  for (const block of blocks) if (mentions(block) > mentions(best)) best = block;
  return best;
}

/** The initializers of a component's destructured first parameter, by prop name. */
function defaultsOf(declaration) {
  const found = new Map();
  let fn;
  const find = (node) => {
    if (fn) return;
    if (ts.isFunctionLike(node) && node.parameters) { fn = node; return; }
    ts.forEachChild(node, find);
  };
  if (declaration) find(ts.isFunctionDeclaration(declaration) ? declaration : declaration.initializer ?? declaration);
  const pattern = fn?.parameters[0]?.name;
  if (pattern && ts.isObjectBindingPattern(pattern)) {
    for (const el of pattern.elements) {
      if (!el.initializer) continue;
      const name = (el.propertyName ?? el.name).getText();
      found.set(name, el.initializer.getText().replace(/\s+/g, " "));
    }
  }
  return found;
}

/** The element a props type intersects the attributes of, read from its typedef: "button", "div", … */
function nativeElementOf(type) {
  const parts = type.isIntersection() ? type.types : [type];
  for (const t of [type, ...parts]) {
    for (const d of t.aliasSymbol?.declarations ?? []) {
      const m = /ComponentPropsWithoutRef<"(\w+)">/.exec(d.parent?.getText() ?? d.getText());
      if (m) return m[1];
    }
  }
  return null;
}

/** A property's type as its JSDoc wrote it (union members in the order declared), else as the checker prints it. */
function typeText(prop, node) {
  const written = (prop.declarations ?? []).find((d) => d.typeExpression)?.typeExpression.type.getText();
  const raw = written ?? checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, node), node, FORMAT);
  return raw.replace(/import\("react"\)\./g, "React.").replace(/\s+/g, " ").replace(/\{ /g, "{ ").trim();
}

function propsOf(type, defaults, node) {
  const own = [];
  let native = 0;
  for (const prop of checker.getPropertiesOfType(type)) {
    if (isNative(prop)) { native++; continue; }
    const decl = prop.valueDeclaration ?? prop.declarations?.[0];
    own.push({
      pos: decl?.pos ?? 0,
      name: prop.getName(),
      type: typeText(prop, node),
      required: !(prop.flags & ts.SymbolFlags.Optional),
      default: defaults.get(prop.getName()) ?? null,
      description: text(prop.getDocumentationComment(checker)),
    });
  }
  own.sort((a, b) => a.pos - b.pos);
  return { own: own.map(({ pos, ...p }) => p), native };
}

const kindOf = (name, signature) => (!signature ? "value" : /^use[A-Z]/.test(name) ? "hook" : /^[A-Z]/.test(name) ? "component" : "function");

const api = {};
for (const [pkg, entry] of Object.entries(PACKAGES)) {
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(ROOT + entry));
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const name = exported.getName();
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration) continue;
    const source = declaration.getSourceFile();
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signature = type.getCallSignatures()[0];
    const kind = symbol.flags & (ts.SymbolFlags.ValueModule | ts.SymbolFlags.NamespaceModule) ? "namespace" : kindOf(name, signature);
    const entryOut = {
      package: pkg,
      kind,
      file: relative(ROOT, source.fileName),
      summary: text(symbol.getDocumentationComment(checker)),
    };
    if (signature) {
      const defaults = defaultsOf(declaration);
      const params = signature.getParameters();
      const first = params[0];
      const firstType = first && checker.getTypeOfSymbolAtLocation(first, declaration);
      const objectFirst = firstType && checker.getPropertiesOfType(firstType).length > 0 && !firstType.isUnion()
        && (kind === "component" || params.length === 1);
      if (objectFirst) {
        const { own, native } = propsOf(firstType, defaults, declaration);
        entryOut.props = own;
        entryOut.native = native ? nativeElementOf(firstType) ?? "element" : null;
        entryOut.ref = firstType.isIntersection() && firstType.types.some((t) => t.aliasSymbol?.getName() === "RefAttributes");
      } else {
        entryOut.params = params.map((p) => ({
          name: p.getName(),
          type: checker.typeToString(checker.getTypeOfSymbolAtLocation(p, declaration), declaration, FORMAT),
          required: !(p.flags & ts.SymbolFlags.Optional) && !(p.valueDeclaration && (p.valueDeclaration.questionToken || p.valueDeclaration.initializer)),
          description: text(p.getDocumentationComment(checker)),
        }));
      }
      if (kind !== "component") entryOut.returns = checker.typeToString(signature.getReturnType(), declaration, FORMAT);
    } else {
      entryOut.type = kind === "namespace"
        ? checker.getExportsOfModule(symbol).map((m) => m.getName()).join(", ")
        : checker.typeToString(type, declaration, FORMAT).slice(0, 400);
    }
    entryOut.header = headerOf(source, name);
    api[name] = entryOut;
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(api, null, 1) + "\n");
const withProps = Object.values(api).filter((e) => e.props);
console.log(`✓ ${Object.keys(api).length} exports described, ${withProps.length} with props → ${relative(ROOT, OUT)}`);

if (process.argv.includes("--missing")) {
  for (const [name, e] of Object.entries(api)) {
    const bare = (e.props ?? []).filter((p) => !p.description).map((p) => p.name);
    if (bare.length) console.log(`${name} (${e.file}): ${bare.join(", ")}`);
  }
}
