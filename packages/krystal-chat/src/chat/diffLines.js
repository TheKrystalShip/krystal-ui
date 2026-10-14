// A line diff for showing a proposed file change against the file as it stands: the longest common
// subsequence of the two line lists, walked back into kept, removed and added lines.
//
// The common head and tail are matched first and only the middle goes through the table, because a
// config edit touches a few lines of a long file. A middle too large for the table (its cells past
// MAX_CELLS) is shown as removed then added rather than costing the page a frozen second.

const MAX_CELLS = 4_000_000;

function splitLines(text) {
  if (text == null || text === "") return [];
  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

// [{ type: "same" | "del" | "add", text }] in reading order.
/**
 * A line diff in reading order.
 * @param {string | null | undefined} before
 * @param {string | null | undefined} after
 * @returns {import("./types.js").DiffOp[]}
 */
function diffLines(before, after) {
  const a = splitLines(before);
  const b = splitLines(after);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head
    && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;

  /** @type {import("./types.js").DiffOp[]} */
  const out = a.slice(0, head).map(text => ({ type: "same", text }));
  const am = a.slice(head, a.length - tail);
  const bm = b.slice(head, b.length - tail);
  const n = am.length;
  const m = bm.length;

  if (n * m > MAX_CELLS) {
    for (const text of am) out.push({ type: "del", text });
    for (const text of bm) out.push({ type: "add", text });
  } else {
    // lcs[i][j] is the common length of am[i..] and bm[j..], one flat row-major array.
    const w = m + 1;
    const lcs = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * w + j] = am[i] === bm[j]
          ? lcs[(i + 1) * w + j + 1] + 1
          : Math.max(lcs[(i + 1) * w + j], lcs[i * w + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (am[i] === bm[j]) { out.push({ type: "same", text: am[i] }); i++; j++; }
      else if (lcs[(i + 1) * w + j] >= lcs[i * w + j + 1]) out.push({ type: "del", text: am[i++] });
      else out.push({ type: "add", text: bm[j++] });
    }
    while (i < n) out.push({ type: "del", text: am[i++] });
    while (j < m) out.push({ type: "add", text: bm[j++] });
  }

  for (const text of a.slice(a.length - tail)) out.push({ type: "same", text });
  return out;
}

// The diff as it is read: every change with `context` unchanged lines either side, and each longer
// unchanged run between them folded into one `{ type: "skip", count }` row.
/**
 * The diff as it is read: each change with `context` unchanged lines either side, longer unchanged runs folded into a `skip` row.
 * @param {import("./types.js").DiffOp[]} ops
 * @param {number} [context]
 * @returns {import("./types.js").DiffOp[]}
 */
function diffHunks(ops, context = 3) {
  const keep = new Array(ops.length).fill(false);
  ops.forEach((op, i) => {
    if (op.type === "same") return;
    for (let k = Math.max(0, i - context); k <= Math.min(ops.length - 1, i + context); k++) keep[k] = true;
  });
  /** @type {import("./types.js").DiffOp[]} */
  const out = [];
  let skipped = 0;
  ops.forEach((op, i) => {
    if (keep[i]) {
      if (skipped) { out.push({ type: "skip", count: skipped }); skipped = 0; }
      out.push(op);
    } else {
      skipped++;
    }
  });
  if (skipped) out.push({ type: "skip", count: skipped });
  return out;
}

export { diffLines, diffHunks };
