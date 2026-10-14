#!/usr/bin/env node
// codemod-k-prefix.mjs — rewrites class names to the `k-` prefix, from scripts/class-map.json.
//
//   node codemod-k-prefix.mjs <dir> [--write] [--assume-package <class,...|all>] [--map <file>] [--comments]
//
// Without --write nothing changes: the run prints per-file rewrite counts and every ambiguous hit.
//
// What is rewritten (class tokens only, matched whole):
//   - CSS (.css): `.old` in a rule's selector list, inside :is()/:where()/:has()/:not() and in
//     compound selectors. Declarations, at-rule preludes (@keyframes names, @layer, @media),
//     attribute selectors, custom properties and url() are never touched.
//   - JS/TS/JSX (.js .jsx .mjs .cjs .ts .tsx): string literals and the static parts of template
//     literals in a class binding (`className`, `class`, and any name ending in Class, ClassName,
//     Classes or Cls, as a JSX attribute, an object key or an assignment), the arguments of
//     classList.add/remove/toggle/contains/replace, and the selector argument of
//     querySelector, querySelectorAll, closest and matches.
//   - HTML (.html): class="..." attributes.
//   A fragment that ends a class token before a dynamic part ("rail--" + x, `rail--${x}`) is
//   rewritten when every mapped class sharing that prefix agrees on the new prefix.
//
// Ambiguity. A class the site defines for its own element carries the package's name only by
// coincidence. A mapped class is held as ambiguous when the site's CSS has a selector naming it and
// the site's own markup also emits it; every occurrence of a held class is reported and left alone.
// `--assume-package` names the classes (or `all`) that are the package's, and rewrites them.
//
// --comments also rewrites `.old` and backticked `old` inside comments.
// Dependencies: none. Already-prefixed classes are never touched, so a second run changes nothing.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", "coverage", ".vite"]);
const JS_EXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const CLASSISH = /^(?:class|className|cls|classes|classNames)$|(?:Class|ClassName|Cls|Classes)$/;

// ---- CSS -----------------------------------------------------------------------------------

// Spans [start, end) of every selector list in a stylesheet, and of every comment.
export function scanCss(text) {
  const selectors = [];
  const comments = [];
  const n = text.length;
  let i = 0;
  let preludeStart = 0;
  while (i < n) {
    const c = text[i];
    if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      comments.push([i, stop]);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      i = skipString(text, i);
      continue;
    }
    if (c === "u" && text.startsWith("url(", i) && !/[\w-]/.test(text[i - 1] || "")) {
      const close = text.indexOf(")", i);
      i = close === -1 ? n : close + 1;
      continue;
    }
    if (c === "{") {
      const prelude = text.slice(preludeStart, i);
      if (!/^\s*@/.test(stripComments(prelude))) selectors.push([preludeStart, i]);
      preludeStart = i + 1;
    } else if (c === ";" || c === "}") {
      preludeStart = i + 1;
    }
    i++;
  }
  return { selectors, comments };
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
}

function skipString(text, i) {
  const q = text[i];
  let j = i + 1;
  while (j < text.length && text[j] !== q) {
    if (text[j] === "\\") j++;
    if (text[j] === "\n") return i + 1;
    j++;
  }
  return j + 1;
}

// Calls fn(name, absoluteStart, absoluteEnd) for each `.class` in a selector text that begins at
// absolute offset `base`. Attribute selectors, strings and comments are skipped.
function eachSelectorClass(sel, base, fn) {
  const n = sel.length;
  let i = 0;
  while (i < n) {
    const c = sel[i];
    if (c === "/" && sel[i + 1] === "*") {
      const end = sel.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
    } else if (c === '"' || c === "'") {
      i = skipString(sel, i);
    } else if (c === "[") {
      let depth = 0;
      while (i < n) {
        if (sel[i] === '"' || sel[i] === "'") {
          i = skipString(sel, i);
          continue;
        }
        if (sel[i] === "[") depth++;
        if (sel[i] === "]" && --depth === 0) {
          i++;
          break;
        }
        i++;
      }
    } else if (c === "\\") {
      i += 2;
    } else if (c === "." && /[A-Za-z_-]/.test(sel[i + 1] || "")) {
      let j = i + 1;
      while (j < n && /[\w-]/.test(sel[j])) j++;
      fn(sel.slice(i + 1, j), base + i + 1, base + j);
      i = j;
    } else {
      i++;
    }
  }
}

// ---- JS ------------------------------------------------------------------------------------

// A flat token list: strings and templates carry the spans of their content; punctuation and
// identifiers carry the text the context rules read. Template expressions are flattened into the
// list after their template token, balanced, so a range over indices covers them.
export function tokenizeJs(src) {
  const toks = [];
  const comments = [];
  const n = src.length;

  function regexAllowed() {
    const p = toks[toks.length - 1];
    if (!p) return true;
    if (p.t === "p") return "(,=:[!&|?{};+-*%~^".includes(p.c);
    if (p.t === "id") return p.v === "return" || p.v === "typeof" || p.v === "case";
    return false;
  }

  function scan(start, inTemplate) {
    let i = start;
    let depth = 0;
    while (i < n) {
      const c = src[i];
      if (c === "/" && src[i + 1] === "/") {
        let e = src.indexOf("\n", i);
        if (e === -1) e = n;
        comments.push([i, e]);
        i = e;
      } else if (c === "/" && src[i + 1] === "*") {
        let e = src.indexOf("*/", i + 2);
        e = e === -1 ? n : e + 2;
        comments.push([i, e]);
        i = e;
      } else if (c === '"' || c === "'") {
        let j = i + 1;
        let ok = false;
        while (j < n) {
          if (src[j] === "\\") {
            j += 2;
            continue;
          }
          if (src[j] === "\n") break;
          if (src[j] === c) {
            ok = true;
            break;
          }
          j++;
        }
        if (ok) {
          toks.push({ t: "str", s: i + 1, e: j });
          i = j + 1;
        } else {
          toks.push({ t: "p", c, i });
          i++;
        }
      } else if (c === "`") {
        const tok = { t: "tpl", parts: [] };
        toks.push(tok);
        let j = i + 1;
        let partStart = j;
        while (j < n) {
          if (src[j] === "\\") {
            j += 2;
            continue;
          }
          if (src[j] === "`") break;
          if (src[j] === "$" && src[j + 1] === "{") {
            tok.parts.push([partStart, j]);
            j = scan(j + 2, true);
            partStart = j;
            continue;
          }
          j++;
        }
        tok.parts.push([partStart, j]);
        i = j + 1;
      } else if (c === "/" && regexAllowed()) {
        let j = i + 1;
        let inClass = false;
        while (j < n && src[j] !== "\n") {
          if (src[j] === "\\") j++;
          else if (src[j] === "[") inClass = true;
          else if (src[j] === "]") inClass = false;
          else if (src[j] === "/" && !inClass) break;
          j++;
        }
        toks.push({ t: "re" });
        i = j + 1;
      } else if (/[A-Za-z_$]/.test(c)) {
        let j = i + 1;
        while (j < n && /[\w$]/.test(src[j])) j++;
        toks.push({ t: "id", v: src.slice(i, j), i });
        i = j;
      } else if (/\d/.test(c)) {
        let j = i + 1;
        while (j < n && /[\w.]/.test(src[j])) j++;
        toks.push({ t: "num" });
        i = j;
      } else {
        if (c === "{") depth++;
        if (c === "}") {
          if (depth === 0 && inTemplate) return i + 1;
          depth--;
        }
        if (!/\s/.test(c)) toks.push({ t: "p", c, i });
        i++;
      }
    }
    return i;
  }
  scan(0, false);
  return { toks, comments };
}

const isP = (t, c) => t && t.t === "p" && t.c === c;
const isId = (t, v) => t && t.t === "id" && (v === undefined || t.v === v);
const OPEN = { "(": ")", "[": "]", "{": "}" };
const CLOSE = new Set([")", "]", "}"]);

// Index of the token closing the bracket opened at toks[k].
function matching(toks, k) {
  let depth = 0;
  for (let j = k; j < toks.length; j++) {
    const t = toks[j];
    if (t.t !== "p") continue;
    if (OPEN[t.c]) depth++;
    else if (CLOSE.has(t.c) && --depth === 0) return j;
  }
  return toks.length - 1;
}

// Index of the last token of an expression starting at `from`: up to a depth-0 `,` or `;`, or a
// closing bracket that leaves the expression.
function expressionEnd(toks, from, stopAtComma) {
  let depth = 0;
  let j = from;
  for (; j < toks.length; j++) {
    const t = toks[j];
    if (t.t !== "p") continue;
    if (OPEN[t.c]) depth++;
    else if (CLOSE.has(t.c)) {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0 && (t.c === ";" || (stopAtComma && t.c === ","))) break;
  }
  return j - 1;
}

// Segments of JS source holding class tokens: { start, end, kind, partialStart, partialEnd }.
// kind is "list" (whitespace-separated class names) or "selector" (a CSS selector).
export function scanJs(src) {
  const { toks, comments } = tokenizeJs(src);
  const kinds = new Map();
  const mark = (from, to, kind) => {
    for (let j = from; j <= to; j++) if (toks[j].t === "str" || toks[j].t === "tpl") kinds.set(j, kind);
  };

  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== "id") continue;
    const next = toks[k + 1];
    if (CLASSISH.test(t.v)) {
      const prev = toks[k - 1];
      const decl = isId(prev, "const") || isId(prev, "let") || isId(prev, "var");
      const member = isP(prev, ".");
      if (isP(next, "=") && !isP(toks[k + 2], "=") && !isP(toks[k + 2], ">")) {
        const after = toks[k + 2];
        if (decl || member) mark(k + 2, expressionEnd(toks, k + 2, false), "list");
        else if (isP(after, "{")) mark(k + 3, matching(toks, k + 2) - 1, "list");
        else mark(k + 2, k + 2, "list");
      } else if (isP(next, "+") && isP(toks[k + 2], "=")) {
        mark(k + 3, expressionEnd(toks, k + 3, false), "list");
      } else if (isP(next, ":") && (isP(prev, "{") || isP(prev, ","))) {
        mark(k + 2, expressionEnd(toks, k + 2, true), "list");
      }
    } else if (t.v === "classList" && isP(next, ".") && isId(toks[k + 2]) && isP(toks[k + 3], "(")) {
      mark(k + 4, matching(toks, k + 3) - 1, "list");
    } else if (
      (t.v === "querySelector" || t.v === "querySelectorAll" || t.v === "closest" || t.v === "matches") &&
      isP(toks[k - 1], ".") &&
      isP(next, "(")
    ) {
      mark(k + 2, matching(toks, k + 1) - 1, "selector");
    }
  }

  const segments = [];
  const unmarked = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t === "str") {
      const kind = kinds.get(k);
      const seg = { start: t.s, end: t.e, kind, partialStart: false, partialEnd: false };
      if (kind) {
        const prev = toks[k - 1];
        const next = toks[k + 1];
        seg.partialStart = isP(prev, "+") && !/^\s/.test(src.slice(t.s, t.e));
        seg.partialEnd = isP(next, "+") && !/\s$/.test(src.slice(t.s, t.e));
        segments.push(seg);
      } else unmarked.push(seg);
    } else if (t.t === "tpl") {
      const kind = kinds.get(k);
      t.parts.forEach(([s, e], pi) => {
        const text = src.slice(s, e);
        const seg = {
          start: s,
          end: e,
          kind,
          partialStart: pi > 0 && !/^\s/.test(text),
          partialEnd: pi < t.parts.length - 1 && !/\s$/.test(text),
        };
        if (kind) segments.push(seg);
        else unmarked.push(seg);
      });
    }
  }
  return { segments, unmarked, comments };
}

// ---- the rewriting ---------------------------------------------------------------------------

export class ClassMap {
  constructor(map) {
    this.map = map;
    // fragment -> new fragment, for every boundary prefix of a mapped class
    const candidates = new Map();
    for (const [old, neu] of Object.entries(map)) {
      // a modifier or element of a mapped class: `rail--` follows `rail`
      for (const d of ["--", "__"]) candidates.set(old + d, new Set([neu + d]));
      for (const m of old.matchAll(/--|__|-/g)) {
        const frag = old.slice(0, m.index + m[0].length);
        const suffix = old.slice(frag.length);
        if (!neu.endsWith(suffix)) continue;
        const newFrag = neu.slice(0, neu.length - suffix.length);
        const set = candidates.get(frag) || new Set();
        set.add(newFrag);
        candidates.set(frag, set);
      }
    }
    this.fragments = new Map();
    this.conflicts = new Set();
    for (const [frag, set] of candidates) {
      if (set.size === 1) this.fragments.set(frag, [...set][0]);
      else this.conflicts.add(frag);
    }
  }
  has(cls) {
    return Object.prototype.hasOwnProperty.call(this.map, cls);
  }
}

// Rewrites the class tokens of one segment's text. `visit(old, neu, offset, whole)` returns the
// replacement or null to hold it; offset is relative to the segment.
function rewriteList(text, seg, cm, visit) {
  return text.replace(/\S+/g, (tok, off) => {
    const atStart = off === 0;
    const atEnd = off + tok.length === text.length;
    if (atStart && seg.partialStart) return tok;
    if (atEnd && seg.partialEnd) {
      if (cm.has(tok)) return visit(tok, cm.map[tok], off, false) ?? tok;
      if (cm.fragments.has(tok)) return visit(tok, cm.fragments.get(tok), off, true) ?? tok;
      if (cm.conflicts.has(tok)) visit(tok, null, off, true);
      return tok;
    }
    if (cm.has(tok)) return visit(tok, cm.map[tok], off, false) ?? tok;
    return tok;
  });
}

function rewriteSelector(text, base, cm, visit) {
  const edits = [];
  eachSelectorClass(text, 0, (name, s, e) => {
    if (!cm.has(name)) return;
    const r = visit(name, cm.map[name], s, false);
    if (r != null) edits.push([s, e, r]);
  });
  let out = "";
  let last = 0;
  for (const [s, e, r] of edits) {
    out += text.slice(last, s) + r;
    last = e;
  }
  return out + text.slice(last);
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

// Applies the map to one file's text. Returns { text, count, held, cssNames, emitted, conflicts }
// where held lists every occurrence the `hold` predicate refused, cssNames the mapped classes a
// stylesheet selector names and emitted the mapped classes markup emits.
export function transform(text, ext, cm, { hold = () => false, comments = false } = {}) {
  const held = [];
  const conflicts = [];
  const cssNames = new Set();
  const emitted = new Set();
  let count = 0;
  const edits = []; // [start, end, replacement]

  const mk = (absBase) => (old, neu, off, fragment) => {
    const abs = absBase + off;
    if (neu == null) {
      conflicts.push({ old, line: lineOf(text, abs) });
      return null;
    }
    if (!fragment && hold(old)) {
      held.push({ cls: old, line: lineOf(text, abs) });
      return null;
    }
    count++;
    return neu;
  };

  if (ext === ".css") {
    const { selectors, comments: cmts } = scanCss(text);
    for (const [s, e] of selectors) {
      const sel = text.slice(s, e);
      eachSelectorClass(sel, 0, (name) => {
        if (cm.has(name)) cssNames.add(name);
      });
      const out = rewriteSelector(sel, s, cm, mk(s));
      if (out !== sel) edits.push([s, e, out]);
    }
    if (comments) for (const [s, e] of cmts) rewriteComment(text, s, e, cm, edits, () => count++);
  } else if (JS_EXT.has(ext)) {
    const { segments, comments: cmts } = scanJs(text);
    for (const seg of segments) {
      const raw = text.slice(seg.start, seg.end);
      let out;
      if (seg.kind === "selector") {
        eachSelectorClass(raw, 0, (name) => cm.has(name) && emitted.add(name));
        out = rewriteSelector(raw, seg.start, cm, mk(seg.start));
      } else {
        raw.split(/\s+/).forEach((tok) => cm.has(tok) && emitted.add(tok));
        out = rewriteList(raw, seg, cm, mk(seg.start));
      }
      if (out !== raw) edits.push([seg.start, seg.end, out]);
    }
    if (comments) for (const [s, e] of cmts) rewriteComment(text, s, e, cm, edits, () => count++);
  } else if (ext === ".html") {
    for (const m of text.matchAll(/\bclass\s*=\s*"([^"]*)"/g)) {
      const start = m.index + m[0].indexOf('"') + 1;
      const raw = m[1];
      const seg = { partialStart: false, partialEnd: false };
      raw.split(/\s+/).forEach((tok) => cm.has(tok) && emitted.add(tok));
      const out = rewriteList(raw, seg, cm, mk(start));
      if (out !== raw) edits.push([start, start + raw.length, out]);
    }
  }

  edits.sort((a, b) => a[0] - b[0]);
  let out = "";
  let last = 0;
  for (const [s, e, r] of edits) {
    if (s < last) continue;
    out += text.slice(last, s) + r;
    last = e;
  }
  out += text.slice(last);
  return { text: out, count, held, conflicts, cssNames, emitted };
}

// `.old` and backticked `old` inside a comment.
function rewriteComment(text, s, e, cm, edits, bump) {
  const raw = text.slice(s, e);
  const out = raw
    .replace(/(^|[^\w$])((?:body|html|div|span|button|a|li|ul|ol|input|label|section|header|nav|aside|main|h[1-6])?)\.([A-Za-z_][\w-]*)/g, (m, lead, tag, name) =>
      cm.has(name) ? (bump(), lead + tag + "." + cm.map[name]) : m,
    )
    .replace(/`([A-Za-z_][\w-]*)`/g, (m, name) => (cm.has(name) ? (bump(), "`" + cm.map[name] + "`") : m));
  if (out !== raw) edits.push([s, e, out]);
}

// ---- the command -----------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const f of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if ([".css", ".html", ...JS_EXT].includes(extname(f)) && !f.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const opts = { write: false, assume: new Set(), assumeAll: false, comments: false, map: null };
  const dirs = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write") opts.write = true;
    else if (a === "--comments") opts.comments = true;
    else if (a === "--map") opts.map = argv[++i];
    else if (a === "--assume-package") {
      for (const c of (argv[++i] || "").split(",").filter(Boolean)) {
        if (c === "all") opts.assumeAll = true;
        else opts.assume.add(c.replace(/^\./, ""));
      }
    } else if (a.startsWith("-")) {
      console.error("unknown option " + a);
      process.exit(2);
    } else dirs.push(a);
  }
  if (dirs.length !== 1) {
    console.error("usage: node codemod-k-prefix.mjs <dir> [--write] [--assume-package <class,...|all>] [--map <file>] [--comments]");
    process.exit(2);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const cm = new ClassMap(JSON.parse(readFileSync(opts.map || join(here, "class-map.json"), "utf8")));
  const root = resolve(dirs[0]);
  const files = walk(root);

  // Pass 1: which mapped classes a site's CSS names and its own markup emits.
  const cssNames = new Set();
  const emitted = new Set();
  const sources = new Map();
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    sources.set(f, text);
    const r = transform(text, extname(f), cm);
    r.cssNames.forEach((c) => cssNames.add(c));
    r.emitted.forEach((c) => emitted.add(c));
  }
  const ambiguous = new Set([...cssNames].filter((c) => emitted.has(c) && !opts.assumeAll && !opts.assume.has(c)));

  // Pass 2: the rewrite.
  let total = 0;
  const heldAll = [];
  const conflictAll = [];
  const perFile = [];
  for (const f of files) {
    const text = sources.get(f);
    const r = transform(text, extname(f), cm, { hold: (c) => ambiguous.has(c), comments: opts.comments });
    const rel = relative(root, f);
    if (r.count) perFile.push([rel, r.count]);
    total += r.count;
    r.held.forEach((h) => heldAll.push({ file: rel, ...h }));
    r.conflicts.forEach((h) => conflictAll.push({ file: rel, ...h }));
    if (opts.write && r.text !== text) writeFileSync(f, r.text);
  }

  console.log(`${opts.write ? "rewrote" : "would rewrite"} ${total} class tokens in ${perFile.length} of ${files.length} files under ${root}`);
  for (const [rel, n] of perFile) console.log(`  ${String(n).padStart(5)}  ${rel}`);
  if (conflictAll.length) {
    console.log(`\nfragments with no single new prefix (rewrite by hand): ${conflictAll.length}`);
    for (const h of conflictAll) console.log(`  ${h.file}:${h.line}  ${h.old}`);
  }
  const unmatched = cssNames.size;
  console.log(`\nmapped classes named by a stylesheet selector: ${unmatched}; of those, emitted by the site's own markup (ambiguous): ${[...cssNames].filter((c) => emitted.has(c)).length}`);
  if (heldAll.length) {
    console.log(`ambiguous hits left unchanged: ${heldAll.length}  (pass --assume-package <class,...|all> to rewrite)`);
    const byClass = new Map();
    for (const h of heldAll) byClass.set(h.cls, [...(byClass.get(h.cls) || []), h]);
    for (const [cls, hits] of [...byClass].sort()) {
      console.log(`  .${cls} -> .${cm.map[cls]}  (${hits.length})`);
      for (const h of hits) console.log(`      ${h.file}:${h.line}`);
    }
  } else console.log("no ambiguous hits");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
