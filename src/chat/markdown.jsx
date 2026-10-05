// The assistant's answers, rendered: paragraphs, headings, lists one level deep, GFM pipe tables,
// blockquotes, fenced code in a card with a copy button, and inline bold, italic, code and links.
//
// Small on purpose and safe by construction: every piece of text reaches the page as a React text node,
// so markup in a reply is shown as the characters it is, never interpreted. A link is drawn only for an
// http or https address; any other scheme keeps its words and loses the link. A fence still open while
// the answer streams renders as code up to the end of what has arrived.

import React from "react";

import { IconButton } from "../components/Button.jsx";
import { copyText } from "../lib/clipboard.js";

const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

// ---------- blocks ----------

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (s[i] === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

function isTableStart(lines, i) {
  return lines[i].includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])
    && lines[i + 1].includes("-");
}

// Starts a block other than a paragraph, so a paragraph ends on the line before it.
function startsBlock(lines, i) {
  const l = lines[i];
  return FENCE.test(l) || HEADING.test(l) || RULE.test(l) || QUOTE.test(l) || ITEM.test(l)
    || isTableStart(lines, i);
}

// A list: its items at the indent of its first marker, and under each the lines indented past it —
// a nested list or the item's continuation.
function parseList(lines, start) {
  const first = ITEM.exec(lines[start]);
  const indent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const m = ITEM.exec(lines[i]);
    if (m && m[1].length <= indent + 1 && /\d/.test(m[2]) === ordered) {
      items.push({ text: [m[3]], children: [] });
      i++;
      continue;
    }
    if (!items.length) break;
    const line = lines[i];
    if (line.trim() === "") {
      // A blank line ends the list unless the next line carries on inside it: another item of this
      // list, or a line indented under the last one.
      const next = lines[i + 1];
      const nm = next !== undefined ? ITEM.exec(next) : null;
      const sameList = nm && nm[1].length <= indent + 1 && /\d/.test(nm[2]) === ordered;
      if (sameList || (next !== undefined && next.search(/\S/) > indent)) { i++; continue; }
      break;
    }
    const lead = line.search(/\S/);
    if (lead > indent) {
      items[items.length - 1].children.push(line);
      i++;
      continue;
    }
    if (m || startsBlock(lines, i)) break;
    // A lazy continuation: an unindented line straight after an item belongs to it.
    items[items.length - 1].text.push(line.trim());
    i++;
  }
  return {
    block: { type: ordered ? "ol" : "ul", start: ordered ? parseInt(first[2], 10) : 1, items },
    next: i,
  };
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    const fence = FENCE.exec(line);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !(lines[i].trim().startsWith(fence[1]) && lines[i].trim().replace(/[`~]/g, "") === "")) {
        body.push(lines[i]);
        i++;
      }
      i++; // the closing fence, or past the end while it is still streaming
      blocks.push({ type: "code", lang: fence[2] || "", value: body.join("\n") });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    if (RULE.test(line)) { blocks.push({ type: "rule" }); i++; continue; }

    if (QUOTE.test(line)) {
      const body = [];
      while (i < lines.length && QUOTE.test(lines[i])) { body.push(QUOTE.exec(lines[i])[1]); i++; }
      blocks.push({ type: "quote", children: parseBlocks(body.join("\n")) });
      continue;
    }

    if (ITEM.test(line)) {
      const { block, next } = parseList(lines, i);
      blocks.push(block);
      i = next;
      continue;
    }

    if (isTableStart(lines, i)) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : null);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", head, align, rows });
      continue;
    }

    const para = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines, i)) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "para", lines: para });
  }
  return blocks;
}

// ---------- inline ----------

// One pass, left to right, over the forms an answer uses: `code`, [words](url), a bare http(s) address,
// **bold** / __bold__, *italic* / _italic_. An underscore marks emphasis only at a word's edge, so a
// snake_case identifier stays one word.
const INLINE = new RegExp([
  "`([^`\\n]+)`",
  "\\[([^\\]\\n]+)\\]\\(\\s*<?((?:[^()\\s<>]|\\([^()\\s]*\\))+)>?(?:\\s+\"[^\"]*\")?\\s*\\)",
  "(https?:\\/\\/[^\\s<>()]*[^\\s<>().,;:!?'\"*_])",
  "\\*\\*(?=\\S)([^\\n]*?\\S)\\*\\*",
  "(?<!\\w)__(?=\\S)([^\\n]*?\\S)__(?!\\w)",
  "\\*(?=[^\\s*])([^\\n*]*?[^\\s*])\\*",
  "(?<!\\w)_(?=[^\\s_])([^\\n_]*?[^\\s_])_(?!\\w)",
].join("|"), "g");

const SAFE_HREF = /^https?:\/\//i;

function renderInline(text, keyBase = "i") {
  const out = [];
  const re = new RegExp(INLINE.source, "g");
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = keyBase + "." + k++;
    if (m[1] != null) {
      out.push(<code key={key} className="chat-md__code">{m[1]}</code>);
    } else if (m[2] != null) {
      out.push(SAFE_HREF.test(m[3])
        ? <a key={key} className="chat-md__link" href={m[3]} target="_blank" rel="noopener noreferrer">{renderInline(m[2], key)}</a>
        : <React.Fragment key={key}>{renderInline(m[2], key)}</React.Fragment>);
    } else if (m[4] != null) {
      out.push(<a key={key} className="chat-md__link" href={m[4]} target="_blank" rel="noopener noreferrer">{m[4]}</a>);
    } else if (m[5] != null || m[6] != null) {
      out.push(<strong key={key}>{renderInline(m[5] ?? m[6], key)}</strong>);
    } else {
      out.push(<em key={key}>{renderInline(m[7] ?? m[8], key)}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLines(lines, keyBase) {
  const out = [];
  lines.forEach((l, i) => {
    if (i > 0) out.push(<br key={keyBase + ".br" + i} />);
    out.push(...renderInline(l, keyBase + "." + i));
  });
  return out;
}

// ---------- drawing ----------

// A fenced block: a card with the language and a copy button above the code.
function CodeBlock({ lang, value }) {
  const [copied, setCopied] = React.useState(null);
  React.useEffect(() => {
    if (copied === null) return undefined;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const label = copied === true ? "Copied" : copied === false ? "Couldn’t copy" : "Copy code";
  return (
    <div className="chat-md__pre">
      <div className="chat-md__pre-bar">
        <span className="chat-md__pre-lang">{lang}</span>
        <IconButton variant="ghost" size="xs" icon={copied === true ? "check" : "copy"} label={label}
          onClick={() => copyText(value).then(setCopied)} />
      </div>
      <pre className="chat-md__pre-body"><code>{value}</code></pre>
    </div>
  );
}

function renderList(block, key) {
  const Tag = block.type;
  return (
    <Tag key={key} className={"chat-md__list chat-md__list--" + block.type}
      start={block.type === "ol" && block.start !== 1 ? block.start : undefined}>
      {block.items.map((item, i) => {
        const nested = item.children.length ? parseBlocks(dedent(item.children)) : [];
        return (
          <li key={i}>
            {renderLines(item.text, key + "." + i)}
            {nested.map((b, j) => renderBlock(b, key + "." + i + "." + j))}
          </li>
        );
      })}
    </Tag>
  );
}

function dedent(lines) {
  const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.search(/\S/)));
  return lines.map((l) => l.slice(Number.isFinite(pad) ? pad : 0)).join("\n");
}

function renderBlock(b, key) {
  switch (b.type) {
    case "code":
      return <CodeBlock key={key} lang={b.lang} value={b.value} />;
    case "heading": {
      const Tag = "h" + Math.min(b.level + 2, 6);
      return <Tag key={key} className="chat-md__h">{renderInline(b.text, key)}</Tag>;
    }
    case "rule":
      return <hr key={key} className="chat-md__rule" />;
    case "quote":
      return <blockquote key={key} className="chat-md__quote">{b.children.map((c, j) => renderBlock(c, key + "." + j))}</blockquote>;
    case "ul":
    case "ol":
      return renderList(b, key);
    case "table":
      return (
        <div key={key} className="chat-md__table-wrap">
          <table className="chat-md__table">
            <thead>
              <tr>{b.head.map((c, j) => <th key={j} style={b.align[j] ? { textAlign: b.align[j] } : undefined}>{renderInline(c, key + ".h" + j)}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri}>
                  {b.head.map((_, j) => (
                    <td key={j} style={b.align[j] ? { textAlign: b.align[j] } : undefined}>{renderInline(r[j] || "", key + "." + ri + "." + j)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return <p key={key} className="chat-md__p">{renderLines(b.lines, key)}</p>;
  }
}

function renderMarkdown(text) {
  if (!text) return null;
  return parseBlocks(String(text)).map((b, i) => renderBlock(b, String(i)));
}

export { renderMarkdown };
